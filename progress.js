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
 view.day??='Push';view.hidden??={};view.windows??={};view.selected??={};
 let data,hidden,chart,detail,selected,focus=null,disposed=false,hasDrawn=false;
 const days=['Push','Pull','Legs','Upper','Lower'];
 root.innerHTML='<div class="workout-selector" role="group" aria-label="Workout">'+days.map(d=>`<button type="button" data-report-day="${d}" aria-pressed="${d===view.day}">${d}</button>`).join('')+'</div><section class="report-surface"><div class="report-heading"><h2>Working weight</h2><span id="chart-period"></span></div><div class="chart-window"><button type="button" data-window="-1" aria-label="Earlier training weeks">‹</button><span>Training week</span><button type="button" data-window="1" aria-label="Later training weeks">›</button></div><div class="chart-stage"></div><div class="point-detail" aria-live="polite"></div></section><div class="filter-heading"><h2>Exercises</h2><div><button type="button" data-filter-all="true">Select All</button><button type="button" data-filter-all="false">Deselect All</button></div></div><div class="exercise-filters"></div><p class="report-note">Completed exercises · Gaps mean no recorded weight. Dumbbells use the recorded per-dumbbell weight.</p><div class="earlier-records"></div>';
 chart=root.querySelector('.chart-stage');detail=root.querySelector('.point-detail');
 function draw(){
  const duration=hasDrawn?280:620;hasDrawn=true;chart.style.setProperty('--draw-duration',duration+'ms');
  data=progressData(state,view.day);hidden=new Set(view.hidden[view.day]||[]);selected=view.selected[view.day]||null;
  if(selected){const series=data.series.find(s=>s.key===selected.key),point=series?.points.find(p=>p.weekId===selected.weekId);selected=point?{...point,key:series.key,seriesName:series.name,colour:series.colour}:null;view.selected[view.day]=selected;}
  focus=selected?.key??null;
  const total=data.weeks.length,start=Math.min(view.windows[view.day]??Math.max(0,total-12),Math.max(0,total-1));
  const weeks=data.weeks.slice(start,start+12);view.windows[view.day]=start;
  root.querySelector('[data-window="-1"]').disabled=start===0;
  root.querySelector('[data-window="1"]').disabled=start+12>=total;
  root.querySelector('#chart-period').textContent=weeks.length>1?`Weeks ${weeks[0]}–${weeks.at(-1)}`:`Week ${weeks[0]}`;
  // One numeric scale; stored units and recorded amounts are never converted or changed.
  const W=344,H=218,left=39,right=330,plot=right-left,top=14,bottom=H-30;
  const x=w=>weeks.length===1?(left+right)/2:left+weeks.indexOf(w)*plot/(weeks.length-1);
  const values=data.series.flatMap(s=>s.points.filter(p=>weeks.includes(p.week)).map(p=>p.weight));
  const maximum=Math.max(1,...values),step=Math.pow(10,Math.floor(Math.log10(maximum)))/2,max=Math.ceil(maximum/step)*step;
  const y=value=>bottom-value/max*(bottom-top);
  let axes='',groups='',points=[];
  for(const value of [0,max/2,max]){const yy=y(value);axes+=`<path class="chart-grid" d="M${left} ${yy}H${right}"/><text class="axis-value" x="${left-7}" y="${yy+3}" text-anchor="end">${Number(value.toFixed(2))}</text>`;}
  for(const s of data.series){
   let path='',prior=null,markers='';
   for(const p of s.points.filter(p=>weeks.includes(p.week))){
    const xx=x(p.week),yy=y(p.weight);
    // Missing weeks and equipment/unit changes break the line rather than implying progression.
    path+=(prior&&p.week===prior.week+1&&p.unit===prior.unit&&p.loadUnit===prior.loadUnit?'L':'M')+xx+' '+yy+' ';
    const point={...p,key:s.key,seriesName:s.name,colour:s.colour};const n=points.push(point)-1;
    markers+=`<g class="chart-point" role="button" tabindex="0" data-point="${n}" style="--point-delay:${Math.round((xx-left)/plot*duration)}ms" aria-label="${esc(s.name)}, Week ${p.week}, ${esc(valueText(p))}${p.reps==null?'':', '+p.reps+' reps'}"><circle class="point-hit" cx="${xx}" cy="${yy}" r="12"/><circle class="point-dot" cx="${xx}" cy="${yy}" r="3"/></g>`;
    prior=p;
   }
   groups+=`<g class="chart-series" data-series="${esc(s.key)}" style="--series:${s.colour}"><g clip-path="url(#reveal-0)"><path class="chart-line" d="${path}"/></g>${markers}</g>`;
  }
  const ticks=weeks.filter((w,i)=>weeks.length<=6||i===0||i===weeks.length-1||i%Math.ceil(weeks.length/5)===0);
  axes+=ticks.map(w=>`<text class="axis-value" x="${x(w)}" y="${H-7}" text-anchor="middle">${w}</text>`).join('');
  chart.innerHTML=`<svg class="weight-chart" viewBox="0 0 ${W} ${H}" aria-label="Working weight by training week. Tap a point for the recorded result."><defs><clipPath id="reveal-0"><rect class="chart-reveal" x="${left-5}" y="0" width="${plot+10}" height="${H}"/></clipPath></defs>${axes}${groups}</svg>${!points.length?'<div class="chart-empty">No recorded weights in these weeks</div>':''}`;
  root.querySelector('.exercise-filters').innerHTML=data.series.map(s=>`<div class="exercise-filter"><button type="button" data-series-toggle="${esc(s.key)}" aria-pressed="${!hidden.has(s.key)}"><i style="--series:${s.colour}"></i><span>${esc(s.name)}${s.current?'':'<small>Previous exercise</small>'}</span><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m4 10 4 4 8-8"/></svg></button><button type="button" class="only-exercise" data-series-only="${esc(s.key)}" aria-label="Show only ${esc(s.name)}">Only</button></div>`).join('');
  root.querySelector('.earlier-records').innerHTML=data.unassigned.length?`<details><summary>Earlier records · Week not recorded (${data.unassigned.length})</summary><p>Kept separately because no training week was saved.</p>${data.unassigned.map(p=>`<div class="earlier-row"><strong>${esc(p.name)}</strong><span>${esc(valueText(p))}${p.reps==null?'':' · '+p.reps+' reps'}${p.date?' · '+esc(p.date.slice(0,10)):''}</span></div>`).join('')}</details>`:'';
  chart.querySelectorAll('[data-point]').forEach(el=>{
   const choose=()=>{selected=points[Number(el.dataset.point)];view.selected[view.day]=selected;focus=selected.key;update();};
   el.onclick=choose;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};
  });
  root.querySelectorAll('[data-series-toggle]').forEach(b=>b.onclick=()=>{hidden.has(b.dataset.seriesToggle)?hidden.delete(b.dataset.seriesToggle):hidden.add(b.dataset.seriesToggle);update();});
  root.querySelectorAll('[data-series-only]').forEach(b=>b.onclick=()=>{hidden=new Set(data.series.filter(s=>s.key!==b.dataset.seriesOnly).map(s=>s.key));focus=b.dataset.seriesOnly;update();});
  update();
 }
 function update(){
  if(disposed)return;view.hidden[view.day]=[...hidden];
  chart.querySelectorAll('[data-series]').forEach(g=>{
   const hide=hidden.has(g.dataset.series);g.classList.toggle('is-hidden',hide);g.classList.toggle('is-muted',Boolean(!hide&&focus&&focus!==g.dataset.series&&!hidden.has(focus)));g.classList.toggle('is-focused',focus===g.dataset.series);
   g.querySelectorAll('[data-point]').forEach(p=>{p.setAttribute('tabindex',hide?'-1':'0');p.setAttribute('aria-hidden',String(hide));p.classList.remove('is-selected');});
  });
  root.querySelectorAll('[data-series-toggle]').forEach(b=>b.setAttribute('aria-pressed',String(!hidden.has(b.dataset.seriesToggle))));
  const label=selected?`<span class="detail-week">Week ${selected.week}</span><strong>${esc(selected.seriesName)}</strong><span class="detail-value">${esc(valueText(selected))}${selected.reps==null?'':' <small>× '+selected.reps+' reps</small>'}</span>`:'<span class="detail-placeholder">Tap a point to see your recorded result</span>';
  if(detail.innerHTML!==label){detail.innerHTML=label;detail.getAnimations?.().forEach(a=>a.cancel());if(!matchMedia('(prefers-reduced-motion: reduce)').matches)detail.animate([{opacity:.4},{opacity:1}],{duration:220});}
  if(selected){const g=[...chart.querySelectorAll('[data-series]')].find(g=>g.dataset.series===selected.key&&g.querySelector(`[aria-label*="Week ${selected.week},"]`));g?.querySelector(`[aria-label*="Week ${selected.week},"]`)?.classList.add('is-selected');}
 }
 root.querySelectorAll('[data-report-day]').forEach(b=>b.onclick=()=>{if(view.day===b.dataset.reportDay)return;view.day=b.dataset.reportDay;root.querySelectorAll('[data-report-day]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));draw();});
 root.querySelectorAll('[data-filter-all]').forEach(b=>b.onclick=()=>{hidden=b.dataset.filterAll==='true'?new Set():new Set(data.series.map(s=>s.key));focus=null;update();});
 root.querySelectorAll('[data-window]').forEach(b=>b.onclick=()=>{view.windows[view.day]=Math.max(0,(view.windows[view.day]??0)+Number(b.dataset.window)*12);draw();});
 draw();
 return ()=>{disposed=true;};
}
