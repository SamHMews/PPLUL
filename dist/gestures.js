export function swipeDirection(distance, velocity, width=300) {
  const projected=distance+velocity*.15;
  return Math.abs(distance)>=12&&Math.abs(projected)>=width*.24?(projected<0?1:-1):0;
}

// Persistent physical cards; springs start at the live position and velocity.
export function attachStack(stack,currentId,onNavigate) {
  const cards=[...stack.querySelectorAll('.exercise-card')],events=new AbortController();
  const listen=(name,fn,options={})=>stack.addEventListener(name,fn,{...options,signal:events.signal});
  let index=Math.max(0,cards.findIndex(c=>c.dataset.entry===currentId));
  let x=0,velocity=0,width=stack.clientWidth,frame=0,drag=null,flight=0,pending=false,suppress=false,disposed=false;
  let front,under,rear,direction=1;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');const reduced=()=>motion.matches;
  const wrap=i=>(i+cards.length)%cards.length;
  function layers(dir=1){
    direction=dir;front=cards[index];under=cards.length>1?cards[wrap(index+dir)]:null;rear=cards.length>2?cards[wrap(index+2*dir)]:null;
    for(const c of cards){c.classList.remove('is-front','is-under','is-rear');c.style.transform='';c.style.opacity='';c.inert=c!==front;c.setAttribute('aria-hidden',c===front?'false':'true');c.tabIndex=c===front?0:-1;}
    front.classList.add('is-front');under?.classList.add('is-under');rear?.classList.add('is-rear');front.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight');
  }
  function paint(){
    const progress=Math.min(1,Math.abs(x)/width);
    if(reduced()){
      front.style.transform='';front.style.opacity=String(1-progress*.85);
      if(under){under.style.transform='';under.style.opacity=String(.55+progress*.45);}
    }else{
      front.style.transform=`translate3d(${x}px,0,0) rotate(${Math.max(-9,Math.min(9,x/width*8))}deg)`;
      if(under)under.style.transform=`translate3d(0,${12*(1-progress)}px,0) scale(${.96+.04*progress})`;
      if(rear)rear.style.transform=`translate3d(0,${24-12*progress}px,0) scale(${.92+.04*progress})`;
    }
  }
  async function arrive(){
    if(pending||disposed)return;pending=true;const next=wrap(index+flight);
    try{await onNavigate(cards[next].dataset.entry);if(disposed)return;index=next;x=velocity=flight=0;layers();paint();}
    catch{if(!disposed){flight=0;spring(0);}}
    finally{pending=false;}
  }
  function spring(target){
    cancelAnimationFrame(frame);let last=performance.now();
    function tick(now){
      if(disposed||!stack.isConnected)return;
      const dt=Math.min((now-last)/1000,.032);last=now;
      const omega=reduced()?35:21,displacement=x-target,c=velocity+omega*displacement,decay=Math.exp(-omega*dt);
      velocity=(velocity-omega*c*dt)*decay;x=target+(displacement+c*dt)*decay;paint();
      if(flight&&Math.abs(x)>=width+48){arrive();return;}
      if(Math.abs(x-target)>.25||Math.abs(velocity)>2)frame=requestAnimationFrame(tick);
      else{x=target;velocity=0;paint();}
    }frame=requestAnimationFrame(tick);
  }
  listen('pointerdown',ev=>{
    if(pending||cards.length<2||!ev.isPrimary||ev.button!==0||ev.target.closest('input,select,textarea,.spotify-next'))return;
    cancelAnimationFrame(frame);flight=0;suppress=false;width=stack.clientWidth;
    drag={id:ev.pointerId,startX:ev.clientX,startY:ev.clientY,offset:x,axis:null,samples:[{x:ev.clientX,t:ev.timeStamp}]};
  });
  listen('pointermove',ev=>{
    if(!drag||drag.id!==ev.pointerId)return;
    const dx=ev.clientX-drag.startX,dy=ev.clientY-drag.startY;
    if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=6){drag.axis=Math.abs(dx)>=Math.abs(dy)*.7?'x':'y';if(drag.axis==='x'){front.setPointerCapture(ev.pointerId);suppress=true;}}
    if(drag.axis!=='x')return;
    ev.preventDefault();x=drag.offset+dx;
    const dir=x<0?1:-1;if(direction!==dir)layers(dir);paint();
    drag.samples.push({x:ev.clientX,t:ev.timeStamp});drag.samples=drag.samples.filter(s=>ev.timeStamp-s.t<=100);
  },{passive:false});
  function finish(ev,cancelled=false){
    if(!drag||drag.id!==ev.pointerId)return;const lastDrag=drag;drag=null;
    const sample=lastDrag.samples[0],dt=ev.timeStamp-sample.t;
    velocity=dt>0&&dt<150?(ev.clientX-sample.x)/dt*1000:0;
    if(front.hasPointerCapture(ev.pointerId))front.releasePointerCapture(ev.pointerId);
    flight=!cancelled&&lastDrag.axis==='x'?swipeDirection(x,velocity,width):0;
    if(flight&&direction!==flight)layers(flight);
    spring(flight?-flight*(width+80):0);
  }
  listen('pointerup',ev=>finish(ev));listen('pointercancel',ev=>finish(ev,true));
  listen('lostpointercapture',ev=>{if(drag&&ev.target===front)finish(ev,true);});
  listen('click',ev=>{if(suppress){ev.preventDefault();ev.stopImmediatePropagation();suppress=false;}},{capture:true});
  listen('keydown',ev=>{
    if(ev.target!==front||pending||!['ArrowLeft','ArrowRight'].includes(ev.key)||cards.length<2)return;
    ev.preventDefault();flight=ev.key==='ArrowRight'?1:-1;width=stack.clientWidth;layers(flight);spring(-flight*(width+80));
  });
  layers();paint();
  motion.addEventListener('change',paint,{signal:events.signal});
  const dispose=()=>{disposed=true;cancelAnimationFrame(frame);events.abort();};
  dispose.advanceTo=id=>{
    if(disposed||pending)return;
    const target=cards.findIndex(c=>c.dataset.entry===id);
    if(target<0||target===index)return;
    cancelAnimationFrame(frame);drag=null;x=velocity=0;width=stack.clientWidth;
    flight=(target-index+cards.length)%cards.length;layers(flight);spring(-(width+80));
  };
  return dispose;
}
