// Native range semantics under a custom, touch-sized visual track.
// Only the visual thumb springs; input and haptic feedback update immediately.
export function attachRepSlider(input, save) {
  const control=input.closest('.rep-control'), output=document.querySelector('#rep-value');
  const min=Number(input.min), max=Number(input.max);
  let value=Number(input.value), position=(value-min)/(max-min)*100, velocity=0, frame=0;
  const render=()=>{control.style.setProperty('--rep-position',position+'%');control.style.setProperty('--rep-progress',position/100);};render();
  const retarget=()=>{
    cancelAnimationFrame(frame);
    const target=(Number(input.value)-min)/(max-min)*100;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){position=target;velocity=0;render();return;}
    let last=performance.now();
    const tick=now=>{
      if(!control.isConnected)return;
      const dt=Math.min((now-last)/1000,.032);last=now;
      const omega=40, displacement=position-target, c=velocity+omega*displacement, decay=Math.exp(-omega*dt);
      velocity=(velocity-omega*c*dt)*decay;position=target+(displacement+c*dt)*decay;render();
      if(Math.abs(position-target)>.05||Math.abs(velocity)>.5)frame=requestAnimationFrame(tick);
      else{position=target;velocity=0;render();}
    };frame=requestAnimationFrame(tick);
  };
  input.addEventListener('input',()=>{
    const next=Number(input.value);output.textContent=next;retarget();
    if(next!==value){try{navigator.vibrate?.(8);}catch{/* Optional device capability. */}value=next;save(next);}
  });
  // Choosing the displayed initial stop is an explicit log, too.
  input.addEventListener('pointerup',()=>save(Number(input.value)));
}
