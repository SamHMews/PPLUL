// Direct manipulation with an interruptible, critically damped return spring.
export function swipeDirection(distance, velocity) {
  const projected = distance + velocity * .099;
  return Math.abs(distance) >= 12 && Math.abs(projected) >= 48 ? (projected < 0 ? 1 : -1) : 0;
}
export function attachSwipe(card, move) {
  let drag=null, x=0, velocity=0, frame=0, suppressClick=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paint=()=>{card.style.transform=reduced()?'':`translateX(${x}px)`;};
  const settle=()=>{
    cancelAnimationFrame(frame);
    if(reduced()){x=velocity=0;paint();return;}
    let last=performance.now();
    const tick=now=>{
      if(!card.isConnected)return;
      const dt=Math.min((now-last)/1000,.032);last=now;
      // Exact critically damped spring step: no overshoot or frame-rate dependence.
      const omega=22, c=velocity+omega*x, decay=Math.exp(-omega*dt);
      velocity=(velocity-omega*c*dt)*decay;x=(x+c*dt)*decay;paint();
      if(Math.abs(x)>.2||Math.abs(velocity)>2)frame=requestAnimationFrame(tick);
      else{x=velocity=0;paint();}
    };frame=requestAnimationFrame(tick);
  };
  card.addEventListener('pointerdown',ev=>{
    if(!ev.isPrimary||ev.button!==0||ev.target.closest('input,select,a,label'))return;
    cancelAnimationFrame(frame);suppressClick=false;
    drag={id:ev.pointerId,startX:ev.clientX,startY:ev.clientY,offset:x,axis:null,samples:[{x:ev.clientX,t:ev.timeStamp}]};
  });
  card.addEventListener('pointermove',ev=>{
    if(!drag||ev.pointerId!==drag.id)return;
    const dx=ev.clientX-drag.startX,dy=ev.clientY-drag.startY;
    if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=8){
      drag.axis=Math.abs(dx)>Math.abs(dy)*1.1?'x':'y';
      if(drag.axis==='x'){card.setPointerCapture(ev.pointerId);suppressClick=true;}
    }
    if(drag.axis!=='x')return;
    ev.preventDefault();x=drag.offset+dx;paint();
    drag.samples.push({x:ev.clientX,t:ev.timeStamp});
    drag.samples=drag.samples.filter(p=>ev.timeStamp-p.t<=100);
  });
  const finish=(ev,cancelled=false)=>{
    if(!drag||ev.pointerId!==drag.id)return;
    const current=drag;drag=null;
    const sample=current.samples[0],dt=ev.timeStamp-sample.t;
    velocity=dt>0&&dt<150?(ev.clientX-sample.x)/dt*1000:0;
    const direction=!cancelled&&current.axis==='x'?swipeDirection(ev.clientX-current.startX,velocity):0;
    if(card.hasPointerCapture(ev.pointerId))card.releasePointerCapture(ev.pointerId);
    if(direction){Promise.resolve(move(direction)).finally(()=>{if(card.isConnected)settle();});}
    else settle();
  };
  card.addEventListener('pointerup',ev=>finish(ev));
  card.addEventListener('pointercancel',ev=>finish(ev,true));
  card.addEventListener('lostpointercapture',ev=>{if(drag&&ev.target===card)finish(ev,true);});
  // A swipe starting on a button must not also activate that button.
  card.addEventListener('click',ev=>{if(suppressClick){ev.preventDefault();ev.stopImmediatePropagation();suppressClick=false;}},true);
}
