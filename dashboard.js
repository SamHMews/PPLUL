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
 backup:'<path d="M4 7h3m4 0h9M4 17h9m4 0h3"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>'
};
export function footer(page){
 return `<nav class="app-footer" aria-label="Main navigation">${[['home','Home'],['progress','Progress'],['history','History'],['backup','Settings']].map(([route,label])=>`<button type="button" data-route="${route}" ${route===page?'aria-current="page"':''}>${svg(icons[route])}<span>${label}</span></button>`).join('')}</nav>`;
}

// Correct only the known full-screen iPhone signature: the reported viewport
// loses exactly the top safe inset. Opaque/native-inset installations have a
// zero top inset and must not be extended beyond their drawable content area.
export function dashboardViewportHeight({standalone,iphone,width,height,screenWidth,screenHeight,safeTop,visibleHeight}){
 const gap=screenHeight-height;
 if(standalone&&iphone&&safeTop>0&&Math.abs(screenWidth-width)<2&&gap>0&&Math.abs(gap-safeTop)<3)return screenHeight;
 return standalone?height:Math.min(height,visibleHeight||height);
}
export function installDashboardViewport(){
 const standalone=matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
 const iphone=/iPhone|iPod/.test(navigator.userAgent);
 document.documentElement.dataset.standalone=String(standalone);
 // A small opaque fixed surface is recognized by WebKit's scroll-edge sampler.
 // A full-screen fixed body is not equivalent; meta tags alone are insufficient.
 const status=document.createElement('div');status.className='status-surface';status.setAttribute('aria-hidden','true');document.body.append(status);
 const probe=document.createElement('div');probe.style.cssText='position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;width:1em;height:1em;padding-top:var(--shell-safe-top,env(safe-area-inset-top));';document.body.append(probe);
 let frame=0;
 const sync=()=>{
  frame=0;document.documentElement.dataset.largeType=String(parseFloat(getComputedStyle(document.documentElement).fontSize)>20);const viewport=window.visualViewport;
  if(viewport&&Math.abs(viewport.scale-1)>.01)return;
  const safeTop=parseFloat(getComputedStyle(probe).paddingTop)||0;
  const height=dashboardViewportHeight({standalone,iphone,width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height,safeTop,visibleHeight:viewport?.height});
  document.documentElement.style.setProperty('--shell-viewport-height',height+'px');
  document.documentElement.style.setProperty('--shell-viewport-top',(standalone?0:viewport?.offsetTop||0)+'px');
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(sync);};
 new ResizeObserver(schedule).observe(probe);sync();window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);window.addEventListener('pageshow',schedule);
 window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
}
