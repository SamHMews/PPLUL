const plate=new Image();plate.src=new URL('./weight-plate.png',import.meta.url).href;
// The visible plate reaches the floor on the same frame as the UI jolt/haptic.
export async function celebrateDay(app){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const layer=document.createElement('div');layer.className='plate-celebration';layer.setAttribute('aria-hidden','true');
 const img=plate.cloneNode();img.alt='';img.className='celebration-plate';layer.append(img);document.body.append(layer);
 const wasInert=app.inert;app.inert=true;
 const previousTransform=app.style.transform;let frame,finished=false;
 try{
  await new Promise(resolve=>{
   const start=performance.now();let impacted=false,impactTime=0;
   const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hidden);resolve();};
   const hidden=()=>{if(document.hidden)finish();};document.addEventListener('visibilitychange',hidden);
   function tick(now){
    const elapsed=now-start,v=window.visualViewport;
    const height=v?.height||innerHeight,top=v?.offsetTop||0,width=Math.min((v?.width||innerWidth)*.5,320);
    layer.style.top=top+'px';layer.style.height=height+'px';img.style.width=width+'px';
    const floor=height-width;
    if(reduced){img.style.transform='translate3d(-50%,'+floor+'px,0)';img.style.opacity=elapsed<220?'0':String(Math.min(1,(elapsed-220)/120));if(elapsed>=720){finish();return;}}
    else{
     const t=elapsed-220,fall=620;
     if(t<0){img.style.transform='translate3d(-50%,'+(-width-4)+'px,0)';}
     else if(t<fall){const y=-width-4+(height+4)*(t/fall)**2;img.style.transform='translate3d(-50%,'+y+'px,0)';}
     else{
      const firstImpact=!impacted;if(firstImpact){impacted=true;impactTime=now;}
      const since=now-impactTime,rebound=since<180?7*Math.sin(Math.PI*since/180)*Math.exp(-since/220):0;
      img.style.transform='translate3d(-50%,'+(floor-rebound)+'px,0)';
      const jolt=since<300?7*Math.exp(-since/65)*Math.cos(since/24):0;
      app.style.transform='translate3d(0,'+jolt+'px,0)';
      if(firstImpact){layer.dataset.impact='true';try{navigator.vibrate?.(40);}catch{}}
      if(since>280)img.style.opacity=String(Math.max(0,1-(since-280)/160));
      if(since>=440){finish();return;}
     }
    }
    frame=requestAnimationFrame(tick);
   }
   frame=requestAnimationFrame(tick);
  });
 }finally{app.inert=wasInert;app.style.transform=previousTransform;layer.remove();}
}
