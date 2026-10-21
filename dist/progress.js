import {ROUTINES,loadUnit} from './model.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colours=['#c1a2df','#71c6ba','#e2b778','#83b7ec','#df92ae','#b7c67c','#c6b6a7','#a5a4f3','#e69b79','#7ec2d7','#d5a9bd','#a3c6a8'];
const keyOf=e=>JSON.stringify([e.id,e.variant||'']);
const valueText=p=>(p.precision==='estimated'?'≈ ':'')+p.weight;

// Read-only projection. No inferred weeks, interpolated values, suggested weights or draft results.
export function progressData(state,day){
 const weeks=[...state.archives,state.active].sort((a,b)=>a.number-b.number);
 const series=new Map(),unassigned=[];
 function ensure(e){
  const key=keyOf(e);
  if(!series.has(key))series.set(key,{key,id:e.id,name:e.variant||e.name||ROUTINES[day].find(x=>x.id===e.id)?.name||e.id,colour:colours[series.size]||`hsl(${(series.size*137.508)%360} 44% 70%)`,points:[],current:false});
  return series.get(key);
 }
 for(const e of state.active.days[day].entries){const s=ensure(e);s.current=true;}
 for(const w of weeks)for(const e of w.days[day]?.entries??[]){
  const s=ensure(e);
  if(e.completed&&typeof e.weight==='number'&&Number.isFinite(e.weight))s.points.push({...e,week:w.number,weekId:w.id,loadUnit:loadUnit(e)});
 }
 for(const e of state.seed){
  if(e.day!==day)continue;const s=ensure(e);
  if(e.completed===false||typeof e.weight!=='number'||!Number.isFinite(e.weight))continue;
  // Migrations retain the actual week ID in sourceId. A calendar date alone does not identify a training week.
  const w=weeks.find(w=>e.sourceId?.startsWith('retired:'+w.id+':')||e.sourceId?.startsWith('replaced:'+w.id+':'));
  const p={...e,loadUnit:loadUnit(e),key:s.key,name:s.name};
  if(w){if(!s.points.some(p=>p.weekId===w.id))s.points.push({...p,week:w.number,weekId:w.id});}
  else unassigned.push(p);
 }
 for(const s of series.values())s.points.sort((a,b)=>a.week-b.week);
 return {weeks:weeks.map(w=>w.number),series:[...series.values()],unassigned};
}

export function progressMarkup(){
 return '<header class="screen-heading"><div><p class="eyebrow">Your training</p><h1>Progress</h1></div></header><div id="progress-report"></div>';
}
export function mountProgress(root,state,view){
 view.day??='Push';view.cardIndices??={};view.windows??={};view.points??={};view.units??={};view.configuredUnits??={};
 const days=['Push','Pull','Legs','Upper','Lower'];let disposeDeck=()=>{};
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const unitLabel=unit=>unit==='unknown'?'':unit;
 const result=p=>valueText(p)+(unitLabel(p.loadUnit)?' '+unitLabel(p.loadUnit):'');
 root.innerHTML='<div class="workout-selector" role="group" aria-label="Workout">'+days.map(d=>`<button type="button" data-report-day="${d}" aria-pressed="${d===view.day}">${d}</button>`).join('')+'</div><div class="graph-deck" role="region" aria-roledescription="carousel" aria-label="Exercise progress graphs" tabindex="0"></div><div class="graph-pager"><button type="button" data-graph-direction="-1" aria-label="Previous exercise graph"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><span class="graph-position" aria-live="polite"></span><button type="button" data-graph-direction="1" aria-label="Next exercise graph"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></div>';
 const deck=root.querySelector('.graph-deck');
 function drawDay(){
  disposeDeck();const day=view.day,data=progressData(state,day);let scrollFrame=0;const graphObservers=[];let index=Math.min(view.cardIndices[day]||0,Math.max(0,data.series.length-1));
  deck.innerHTML=data.series.map((s,n)=>`<article class="graph-card report-surface" data-graph-index="${n}" aria-roledescription="slide" aria-label="${esc(s.name)}, ${n+1} of ${data.series.length}"><div class="graph-heading"><div><p class="eyebrow">${s.current?'Working weight':'Previous exercise'}</p><h2>${esc(s.name)}</h2></div><span class="graph-unit"></span></div><div class="chart-window"><button type="button" data-window="-1" aria-label="Earlier training weeks">‹</button><span></span><button type="button" data-window="1" aria-label="Later training weeks">›</button></div><div class="chart-axis-row"><div class="chart-axis-title chart-weight-title"></div><div class="graph-unit-options"></div></div><div class="chart-stage"></div><div class="chart-axis-title chart-week-title">Training week</div><div class="point-detail" aria-live="polite"></div><div class="earlier-records"></div></article>`).join('');
  const cards=[...deck.querySelectorAll('.graph-card')];
  cards.forEach((card,n)=>{
   const series=data.series[n],key=day+':'+series.key,configured=state.active.days[day].entries.find(e=>keyOf(e)===series.key);
   const preferred=loadUnit(configured||series.points.at(-1)||data.unassigned.find(p=>p.key===series.key)||{});
   const units=[...new Set([preferred,...series.points.map(p=>p.loadUnit),...data.unassigned.filter(p=>p.key===series.key).map(p=>p.loadUnit)])];
   if(view.configuredUnits[key]!==preferred){view.configuredUnits[key]=preferred;view.units[key]=preferred;}
   let unit=units.includes(view.units[key])?view.units[key]:preferred;
   function drawGraph(){
    view.units[key]=unit;const start=Math.min(view.windows[key]??Math.max(0,data.weeks.length-12),Math.max(0,data.weeks.length-1));view.windows[key]=start;
    const weeks=data.weeks.slice(start,start+12),points=series.points.filter(p=>p.loadUnit===unit&&weeks.includes(p.week));
    card.querySelector('.graph-unit').textContent=unitLabel(unit);
    card.querySelector('.chart-weight-title').textContent='Weight'+(unitLabel(unit)?' ('+unitLabel(unit)+')':'');
    card.querySelector('.chart-window span').textContent=weeks.length>1?`Weeks ${weeks[0]}–${weeks.at(-1)}`:`Week ${weeks[0]}`;
    card.querySelector('[data-window="-1"]').disabled=start===0;card.querySelector('[data-window="1"]').disabled=start+12>=data.weeks.length;
    // An equipment unit change never relabels or converts older recorded values.
    card.querySelector('.graph-unit-options').innerHTML=units.length>1?`<label>Recorded unit<select aria-label="Recorded unit for ${esc(series.name)}">${units.map(u=>`<option value="${u}" ${u===unit?'selected':''}>${u==='unknown'?'Unknown':u}${u===preferred?' · Current':''}</option>`).join('')}</select></label>`:'';
    const select=card.querySelector('select');if(select)select.onchange=()=>{unit=select.value;drawGraph();};
    const maximum=Math.max(1,...points.map(p=>p.weight)),step=Math.max(10,Math.ceil(maximum/1000)*10),max=Math.ceil(maximum/step)*step;
    const typeScale=Math.max(1,parseFloat(getComputedStyle(root).fontSize)/16);
    const stage=card.querySelector('.chart-stage'),size=stage.getBoundingClientRect();
    const W=344,scale=W/Math.max(1,size.width),H=Math.max(110,size.height*scale),font=11*scale*typeScale;
    const left=Math.min(110,39*typeScale),right=330,top=font,bottom=H-font*2.2,plot=right-left;
    // Keep the plot inside the card. Fine 10-unit gridlines remain; only crowded
    // numeric labels are thinned, never actual values or recorded points.
    const labelEvery=Math.max(1,Math.ceil((max/step)*font*1.45/Math.max(1,bottom-top)));
    const x=w=>weeks.length===1?(left+right)/2:left+weeks.indexOf(w)*plot/(weeks.length-1),y=v=>bottom-v/max*(bottom-top);
    let axes='',line='',prior=null,markers='';
    for(let value=0;value<=max;value+=step){const yy=y(value);axes+=`<path class="chart-grid" d="M${left} ${yy}H${right}"/>`;if(value===0||value===max||(value/step)%labelEvery===0&&max-value>=step*labelEvery*.7)axes+=`<text class="axis-value" style="font-size:${font}px" x="${left-7}" y="${yy+font*.3}" text-anchor="end">${value}</text>`;}
    points.forEach((p,i)=>{const xx=x(p.week),yy=y(p.weight);line+=(prior&&p.week===prior.week+1&&p.unit===prior.unit?'L':'M')+xx+' '+yy+' ';prior=p;
     markers+=`<g class="chart-point" role="button" aria-pressed="false" tabindex="0" data-point="${i}" style="--point-delay:${Math.round((xx-left)/plot*520)}ms" aria-label="${esc(series.name)}, Week ${p.week}, ${esc(result(p))}${p.reps==null?'':', '+p.reps+' reps'}"><circle class="point-hit" cx="${xx}" cy="${yy}" r="24"/><circle class="point-dot" cx="${xx}" cy="${yy}" r="3"/></g>`;});
    const ticks=weeks.filter((w,i)=>weeks.length<=6||i===0||i===weeks.length-1||i%Math.ceil(weeks.length/5)===0);
    axes+=ticks.map(w=>`<text class="axis-value" style="font-size:${font}px" x="${x(w)}" y="${H-font*.4}" text-anchor="middle">${w}</text>`).join('');
    card.querySelector('.chart-stage').innerHTML=`<svg class="weight-chart" viewBox="0 0 ${W} ${H}" aria-label="${esc(series.name)} working weight by training week${unitLabel(unit)?', '+unitLabel(unit):''}"><defs><clipPath id="graph-reveal-${n}"><rect class="chart-reveal" x="${left-5}" y="0" width="${plot+10}" height="${H}"/></clipPath></defs>${axes}<g class="chart-series" style="--series:#c1a2df"><g clip-path="url(#graph-reveal-${n})"><path class="chart-line" d="${line}"/></g>${markers}</g></svg>${points.length?'':'<div class="chart-empty">No recorded weights in these weeks</div>'}`;
    function showPoint(point){
     const detail=card.querySelector('.point-detail'),opacity=detail.getAnimations().length?Number(getComputedStyle(detail).opacity):.65;detail.getAnimations().forEach(a=>a.cancel());
     detail.innerHTML=point?`<span class="detail-week">Week ${point.week}</span><strong>${esc(series.name)}</strong><span class="detail-value">${esc(result(point))}${point.reps==null?'':'<small>× '+point.reps+' reps</small>'}</span>`:'<span class="detail-placeholder">Tap a point to see your recorded result</span>';
     card.querySelectorAll('[data-point]').forEach(el=>{const selected=points[Number(el.dataset.point)]===point;el.classList.toggle('is-selected',selected);el.setAttribute('aria-pressed',String(selected));});
     if(point&&!reduced())detail.animate([{opacity},{opacity:1}],{duration:220});
    }
    card.querySelectorAll('[data-point]').forEach(el=>{const choose=()=>{const point=points[Number(el.dataset.point)];view.points[key]=point.weekId;showPoint(point);};el.onclick=choose;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};});
    showPoint(points.find(p=>p.weekId===view.points[key]));
    const earlier=data.unassigned.filter(p=>p.key===series.key&&p.loadUnit===unit);
    const legacy=card.querySelector('.earlier-records');
    legacy.innerHTML=earlier.length?'<button type="button" class="earlier-result">Earlier records · '+earlier.length+'</button>':'';
    let earlierIndex=0;const earlierButton=legacy.querySelector('button');
    if(earlierButton)earlierButton.onclick=()=>{const point=earlier[earlierIndex];
     const detail=card.querySelector('.point-detail');detail.innerHTML=`<span class="detail-week">Earlier record · Week not recorded${point.date?' · '+esc(point.date.slice(0,10)):''}</span><strong>${esc(series.name)}</strong><span class="detail-value">${esc(result(point))}${point.reps==null?'':'<small>× '+point.reps+' reps</small>'}</span>`;
     card.querySelectorAll('[data-point]').forEach(el=>{el.classList.remove('is-selected');el.setAttribute('aria-pressed','false');});
     earlierButton.textContent=`Earlier record ${earlierIndex+1} of ${earlier.length} · Next`;earlierIndex=(earlierIndex+1)%earlier.length;
    };

   }
   card.querySelectorAll('[data-window]').forEach(b=>b.onclick=()=>{view.windows[key]=Math.max(0,(view.windows[key]??0)+Number(b.dataset.window)*12);drawGraph();});
   drawGraph();
   let previousSize='';const graphObserver=new ResizeObserver(()=>{
    const box=card.querySelector('.chart-stage').getBoundingClientRect(),size=Math.round(box.width)+':'+Math.round(box.height);
    if(size===previousSize)return;previousSize=size;drawGraph();
   });graphObserver.observe(card.querySelector('.chart-stage'));graphObservers.push(graphObserver);
  });
  const positions=()=>cards.map(c=>c.offsetLeft-cards[0].offsetLeft);
  function update(){
   view.cardIndices[day]=index;cards.forEach((card,i)=>{card.classList.toggle('is-current',i===index);card.inert=i!==index;card.setAttribute('aria-hidden',String(i!==index));});
   root.querySelector('.graph-position').textContent=cards.length?`${index+1} of ${cards.length}`:'No exercises';
   root.querySelector('[data-graph-direction="-1"]').disabled=index===0;root.querySelector('[data-graph-direction="1"]').disabled=index>=cards.length-1;
  }
  function move(direction){index=Math.max(0,Math.min(cards.length-1,index+direction));update();deck.scrollTo({left:positions()[index]||0,behavior:reduced()?'instant':'smooth'});}
  deck.onscroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;const offsets=positions();let nearest=0;offsets.forEach((x,i)=>{if(Math.abs(x-deck.scrollLeft)<Math.abs(offsets[nearest]-deck.scrollLeft))nearest=i;});if(nearest!==index){index=nearest;update();}});};
  deck.onkeydown=e=>{if(e.target===deck&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}};
  root.querySelectorAll('[data-graph-direction]').forEach(b=>b.onclick=()=>move(Number(b.dataset.graphDirection)));
  update();deck.scrollTo({left:positions()[index]||0,behavior:'instant'});
  const resize=new ResizeObserver(()=>deck.scrollTo({left:positions()[index]||0,behavior:'instant'}));resize.observe(deck);
  disposeDeck=()=>{resize.disconnect();graphObservers.forEach(o=>o.disconnect());cancelAnimationFrame(scrollFrame);deck.onscroll=null;deck.onkeydown=null;};
 }
 root.querySelectorAll('[data-report-day]').forEach(b=>b.onclick=()=>{if(view.day===b.dataset.reportDay)return;view.day=b.dataset.reportDay;root.querySelectorAll('[data-report-day]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));drawDay();});
 drawDay();return()=>disposeDeck();
}
