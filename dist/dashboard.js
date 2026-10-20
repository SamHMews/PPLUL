const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const days=['Push','Pull','Legs','Upper','Lower'];
const svg=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
export function dashboard(state,dayIcon){
 const complete=d=>state.active.days[d].entries.length>0&&state.active.days[d].entries.every(e=>e.completed);
 const count=days.filter(complete).length,started=days.some(d=>state.active.days[d].entries.some(e=>e.completed));
 return `<header class="screen-heading"><div><p class="eyebrow">Training · Week ${state.active.number}</p><h1>Week Overview</h1></div><span class="week-status ${count===5?'complete':''}"><i></i>${count===5?'Complete':started?'In progress':'Ready'}</span></header><section class="week-completion" aria-label="${count} of 5 main workouts complete"><div><span>Main sessions</span><strong>${count}<small> / 5</small></strong></div><div class="week-segments">${days.map(d=>`<span class="${complete(d)?'complete':''}" title="${d}"></span>`).join('')}</div></section><div class="home-grid">${days.map((d,i)=>{const session=state.active.days[d],done=session.entries.filter(e=>e.completed).length;return `<button class="tile ${complete(d)?'complete':''}" data-action="day" data-day="${d}" style="--tile-order:${i}" aria-label="${d}, ${done} of ${session.entries.length} done"><span>${dayIcon(complete(d)?'Complete':d)}</span><div class="tile-bottom"><h2>${d}</h2><small>${done}/${session.entries.length}</small></div></button>`;}).join('')}<button class="tile optional-tile ${state.active.cardio?.completed?'complete':''}" data-action="cardio" style="--tile-order:5" aria-label="Cardio, optional${state.active.cardio?.completed?', completed':''}"><span>${dayIcon(state.active.cardio?.completed?'Complete':'Cardio')}</span><div class="tile-bottom"><h2>Cardio</h2><small>Optional</small></div></button></div><button class="new-week-action" data-action="new-week">${svg('<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/>')}<span>Start New Week</span></button>`;
}
export function dayOverview(state){
 const day=state.view.day,session=state.active.days[day];
 return `<header class="overview-heading"><button class="overview-back" data-action="home" aria-label="Back to Week Overview">${svg('<path d="m14 5-7 7 7 7"/>')}</button><div><p class="eyebrow">Week ${state.active.number}</p><h1>${day} Day</h1></div><button id="overview-toggle" class="overview-close" data-action="overview" aria-label="Close overview">${svg('<path d="m6 6 12 12M6 18 18 6"/>')}</button></header><div class="day-exercise-list" role="region" aria-label="All exercises">${session.entries.map((e,i)=>`<button class="overview-row ${e.completed?'is-complete':''}" data-action="select-exercise" data-id="${esc(e.id)}" aria-label="${esc(e.variant||e.name)}, ${e.completed?'completed':'not completed'}"><span class="exercise-number">${String(i+1).padStart(2,'0')}</span><span class="overview-name">${esc(e.variant||e.name)}</span>${svg(e.completed?'<path d="m5 12 4 4L19 6"/>':'<path d="m9 6 6 6-6 6"/>')}</button>`).join('')}</div><button class="continue-workout" data-action="continue-workout">Continue Workout ${svg('<path d="M5 12h14m-5-5 5 5-5 5"/>')}</button>`;
}
const icons={
 home:'<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
 progress:'<path d="M4 4v16h16M7 15l4-5 4 2 5-7"/>',
 history:'<path d="M3 4v5h5M3 9a9 9 0 1 1 1 9M12 7v5l3 2"/>',
 backup:'<circle cx="12" cy="12" r="3"/><path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 2 3h4l1-3 3-1 2-3-2-2 1-3-3-2-2-3Z"/>'
};
export function footer(page){
 return `<nav class="app-footer" aria-label="Main navigation">${[['home','Home'],['progress','Progress'],['history','History'],['backup','Settings']].map(([route,label])=>`<button type="button" data-route="${route}" ${route===page?'aria-current="page"':''}>${svg(icons[route])}<span>${label}</span></button>`).join('')}</nav>`;
}
