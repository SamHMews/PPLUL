// Momentary control: only a deliberate release commits a playback command.
export function attachMusicSwitch(button,execute){
 let drag=null,key=null;
 const paint=x=>{button.style.setProperty('--switch-x',x+'px');button.dataset.direction=Math.abs(x)>=23?(x<0?'pause':'next'):'';};
 const reset=()=>{drag=null;key=null;button.classList.remove('dragging');paint(0);};
 const run=action=>{reset();button.dataset.action=action==='pause'?'spotify-pause':'spotify-next';execute(button);};
 button.addEventListener('pointerdown',e=>{e.stopPropagation();if(button.disabled||!e.isPrimary||e.button!==0)return;e.preventDefault();drag={id:e.pointerId,x:e.clientX,y:e.clientY};button.setPointerCapture(e.pointerId);button.classList.add('dragging');});
 button.addEventListener('pointermove',e=>{e.stopPropagation();if(drag?.id!==e.pointerId)return;e.preventDefault();paint(Math.max(-30,Math.min(30,e.clientX-drag.x)));});
 button.addEventListener('pointerup',e=>{e.stopPropagation();if(drag?.id!==e.pointerId)return;e.preventDefault();const dx=e.clientX-drag.x,dy=e.clientY-drag.y,action=Math.abs(dx)>=23&&Math.abs(dy)<40?(dx<0?'pause':'next'):null;reset();if(button.hasPointerCapture(e.pointerId))button.releasePointerCapture(e.pointerId);if(action)run(action);});
 for(const event of ['pointercancel','lostpointercapture','blur'])button.addEventListener(event,reset);
 button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
 button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Escape'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(e.key==='Escape'){reset();return;}if(!e.repeat&&!button.disabled){key=e.key;paint(key==='ArrowLeft'?-30:30);}});
 button.addEventListener('keyup',e=>{if(e.key!==key)return;e.preventDefault();e.stopPropagation();run(key==='ArrowLeft'?'pause':'next');});
}
