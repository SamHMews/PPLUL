const plate=new Image();plate.src=new URL('./weight-plate.png',import.meta.url).href;
// A textured face and layered rim form a shallow 3D plate, rather than a flat slide.
export async function celebrateDay(app){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const layer=document.createElement('div');layer.className='plate-celebration';layer.setAttribute('aria-hidden','true');
 const rotor=document.createElement('div');rotor.className='celebration-plate';
 for(let i=6;i>=0;i--){const face=plate.cloneNode();face.alt='';face.className='plate-face';face.dataset.depth=i;rotor.append(face);}
 layer.append(rotor);document.body.append(layer);
 const wasInert=app.inert;app.inert=true;const previousTransform=app.style.transform;let frame,finished=false;
 try{await new Promise(resolve=>{
  const start=performance.now();let impactTime=null;
  const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hidden);resolve();};
  const hidden=()=>{if(document.hidden)finish();};document.addEventListener('visibilitychange',hidden);
  function tick(now){
   const elapsed=now-start,v=window.visualViewport,height=v?.height||innerHeight,width=Math.min((v?.width||innerWidth)*.54,340),depth=width*.045;
   layer.style.top=(v?.offsetTop||0)+'px';layer.style.height=height+'px';rotor.style.width=width+'px';
   for(const face of rotor.children){const i=Number(face.dataset.depth);face.style.transform='translateZ('+(-i*depth/6)+'px)';face.style.filter=i?'brightness('+(0.42+i*.035)+')':'none';}
   if(reduced){rotor.style.transform='translate3d(-50%,'+(height-width)+'px,0)';rotor.style.opacity=elapsed<220?'0':String(Math.min(1,(elapsed-220)/120));if(elapsed>=820){finish();return;}}
   else{
    const fall=1450,t=elapsed-220,p=Math.max(0,Math.min(1,t/fall));
    const firstImpact=t>=fall&&impactTime===null;if(firstImpact)impactTime=now;
    const s=impactTime===null?0:now-impactTime;
    let rx=56+18*Math.sin(p*Math.PI*3.5),ry=24*Math.sin(p*Math.PI*2),rz=12*Math.sin(p*Math.PI*3);
    if(impactTime!==null){rx=38+40*(1-Math.exp(-s/260))+12*Math.sin(s/52)*Math.exp(-s/230);ry=14*Math.sin(s/68)*Math.exp(-s/200);rz=-9*Math.sin(s/72)*Math.exp(-s/240);}
    const matrix=new DOMMatrix().rotate(rx,ry,rz);
    // Circular projected edge, including the solid rim, contacts the viewport floor.
    const edge=width*.5*Math.hypot(matrix.m12,matrix.m22)+Math.max(0,-depth*matrix.m32);
    let bounce=0;if(s>0&&s<440)bounce=28*4*(s/440)*(1-s/440);else if(s>=440&&s<680)bounce=6*4*((s-440)/240)*(1-(s-440)/240);
    const center=impactTime===null?(-width+(height-edge+width)*p*p):height-edge-bounce;
    const drift=impactTime===null?14*Math.sin(p*Math.PI*2):0;
    rotor.style.transform='translate3d(calc(-50% + '+drift+'px),'+(center-width/2)+'px,0) '+matrix.toString();
    if(impactTime!==null){const jolt=s<380?12*Math.exp(-s/90)*Math.cos(s/29):0;app.style.transform='translate3d(0,'+jolt+'px,0)';if(firstImpact){layer.dataset.impact='true';layer.dataset.contact=String(center+edge);try{navigator.vibrate?.(40);}catch{}}if(s>780)rotor.style.opacity=String(Math.max(0,1-(s-780)/180));if(s>=960){finish();return;}}
   }
   frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
 });}finally{app.inert=wasInert;app.style.transform=previousTransform;layer.remove();}
}
