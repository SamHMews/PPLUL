// Native range semantics under a custom, touch-sized visual track.
// Only the visual thumb springs; input and haptic feedback update immediately.
export function attachRepSlider(input, save) {
  const control=input.closest('.rep-control'), output=input.closest('.exercise-card').querySelector('output');
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
  // Own the full strip's pointer gesture rather than relying on the browser's
  // invisible native thumb geometry. Keyboard range semantics remain native.
  let pointer=null;
  const choose=ev=>{
    const rail=control.querySelector('.rep-rail').getBoundingClientRect();
    const fraction=Math.max(0,Math.min(1,(ev.clientX-rail.left)/rail.width));
    const next=min+Math.round(fraction*(max-min));
    if(next!==Number(input.value)){input.value=next;input.dispatchEvent(new Event('input',{bubbles:true}));}
  };
  input.addEventListener('pointerdown',ev=>{
    if(input.disabled||!ev.isPrimary||ev.button!==0)return;
    ev.preventDefault();ev.stopPropagation();pointer=ev.pointerId;
    input.focus({preventScroll:true});input.setPointerCapture(pointer);choose(ev);
  });
  input.addEventListener('pointermove',ev=>{
    if(ev.pointerId!==pointer)return;ev.preventDefault();ev.stopPropagation();choose(ev);
  });
  input.addEventListener('pointerup',ev=>{
    if(ev.pointerId!==pointer)return;ev.preventDefault();ev.stopPropagation();choose(ev);
    pointer=null;if(input.hasPointerCapture(ev.pointerId))input.releasePointerCapture(ev.pointerId);
    save(Number(input.value));
  });
  input.addEventListener('pointercancel',()=>{pointer=null;});
  input.addEventListener('lostpointercapture',()=>{pointer=null;});
  input.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();});
}
