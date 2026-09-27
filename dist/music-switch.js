// Momentary control: only a deliberate release commits a playback command.
export function attachMusicSwitch(button,execute){
 let drag=null,key=null,x=0,velocity=0,frame=0,last=0;
 const paint=value=>{x=value;button.style.setProperty('--music-y',x+'px');};
 const settle=()=>{cancelAnimationFrame(frame);if(matchMedia('(prefers-reduced-motion: reduce)').matches){paint(0);return;}last=performance.now();const tick=now=>{const dt=Math.min((now-last)/1000,.032);last=now;velocity+=(-500*x-44*velocity)*dt;paint(x+velocity*dt);if(Math.abs(x)>.05||Math.abs(velocity)>.1)frame=requestAnimationFrame(tick);else paint(0);};frame=requestAnimationFrame(tick);};
 const reset=()=>{drag=null;key=null;button.classList.remove('dragging');settle();};
 const run=action=>{reset();button.dataset.action=action==='pause'?'spotify-pause':'spotify-next';execute(button);};
 button.addEventListener('pointerdown',e=>{e.stopPropagation();if(button.disabled||!e.isPrimary||e.button!==0)return;e.preventDefault();cancelAnimationFrame(frame);drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:x,axis:null};velocity=0;button.setPointerCapture(e.pointerId);button.classList.add('dragging');});
 button.addEventListener('pointermove',e=>{e.stopPropagation();if(drag?.id!==e.pointerId)return;e.preventDefault();const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=8)drag.axis=Math.abs(dy)>=Math.abs(dx)?'y':'x';if(drag.axis==='y')paint(Math.max(-20,Math.min(20,drag.start+dy)));});
 button.addEventListener('pointerup',e=>{e.stopPropagation();if(drag?.id!==e.pointerId)return;e.preventDefault();const dx=e.clientX-drag.x,dy=e.clientY-drag.y,action=Math.abs(dy)>=14&&(drag.axis==='y'||(!drag.axis&&Math.abs(dy)>Math.abs(dx)*1.2))&&Math.abs(dx)<48?(dy<0?'pause':'next'):null;reset();if(button.hasPointerCapture(e.pointerId))button.releasePointerCapture(e.pointerId);if(action)run(action);});
 for(const event of ['pointercancel','lostpointercapture','blur'])button.addEventListener(event,reset);
 button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
 button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(e.key==='ArrowLeft'||e.key==='ArrowRight'){reset();return;}if(e.key==='Escape'){reset();return;}if(!e.repeat&&!button.disabled){key=e.key;cancelAnimationFrame(frame);paint(key==='ArrowUp'?-20:20);}});
 button.addEventListener('keyup',e=>{if(e.key!==key)return;e.preventDefault();e.stopPropagation();run(key==='ArrowUp'?'pause':'next');});
}
