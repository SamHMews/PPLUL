// Presentation-only paging; existing forms, actions and saved records remain intact.
export function mountCompactPages(app,view){
 const page=app.dataset.page;if(!['history','backup'].includes(page))return()=>{};
 const panels=[...app.querySelectorAll(':scope > .panel')];if(!panels.length)return()=>{};
 const controls=document.createElement('div');controls.className='section-controls';
 const week=app.querySelector('#history-week');if(week)controls.append(week);
 const select=document.createElement('select');select.className='section-select';select.setAttribute('aria-label',page==='history'?'History workout':'Settings section');
 panels.forEach((panel,i)=>{const option=document.createElement('option');option.value=i;option.textContent=panel.querySelector('summary,h2')?.textContent||'Section '+(i+1);select.append(option);if(panel.tagName==='DETAILS'){panel.open=true;panel.querySelector('summary').hidden=true;}});
 controls.append(select);panels[0].before(controls);
 const pager=document.createElement('div');pager.className='record-pager';pager.innerHTML='<button type="button" aria-label="Previous results">‹</button><span aria-live="polite"></span><button type="button" aria-label="Next results">›</button>';app.append(pager);
 let chosen=Math.min(view[page]||0,panels.length-1),start=0,count=0,previous=[],frame=0;
 const buttons=pager.querySelectorAll('button');
 function fit(){
  frame=0;const panel=panels[chosen],rows=[...panel.querySelectorAll(':scope > .row')];pager.hidden=!rows.length;
  if(!rows.length)return;
  rows.forEach(row=>row.hidden=false);
  const style=getComputedStyle(panel),room=panel.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
  let used=0;count=0;
  for(let i=start;i<rows.length;i++){const height=rows[i].getBoundingClientRect().height;if(count&&used+height>room+1)break;used+=height;count++;}
  rows.forEach((row,i)=>row.hidden=i<start||i>=start+count);
  buttons[0].disabled=start===0;buttons[1].disabled=start+count>=rows.length;
  pager.querySelector('span').textContent=`${start+1}–${Math.min(rows.length,start+count)} of ${rows.length}`;
 }
 function show(){view[page]=chosen;select.value=chosen;panels.forEach((panel,i)=>panel.hidden=i!==chosen);start=0;previous=[];fit();}
 select.onchange=()=>{chosen=Number(select.value);show();};
 buttons[0].onclick=()=>{start=previous.pop()??0;fit();};buttons[1].onclick=()=>{previous.push(start);start+=count;fit();};
 show();const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);});panels.forEach(p=>observer.observe(p));
 return()=>{cancelAnimationFrame(frame);observer.disconnect();};
}
