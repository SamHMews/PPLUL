export const DAYS=['Push','Pull','Legs','Upper','Lower'];
const ex=(id,name,sets,target,unit='total weight',increment=null)=>({id,name,sets,target,unit,increment,variants:null,loadUnit:['leg-extension','calf'].includes(id)?'unknown':'kg'});
export const ROUTINES={
Push:[ex('bench','Bench Press',2,'4–5'),ex('incline-db','Incline Dumbbell Press',2,'7–9','per dumbbell',2.5),ex('fly','Cable Flyes',2,'7–9','machine weight'),ex('dips','Dips',2,'7–9','choose weight type',null),ex('shoulder-db','Dumbbell Shoulder Press',2,'7–9','per dumbbell',2.5),ex('lateral','Lateral Raises',2,'8–12','choose weight type'),ex('skull','Skullcrushers',2,'7–9','choose weight type'),ex('pushdown','Tricep Pushdown',2,'10–12','machine weight')],
Pull:[ex('mag-pulldown','MAG Grip Lat Pulldowns',2,'7–9','machine weight'),ex('smith-row','Smith Machine Row',3,'5–7'),ex('wide-db-row','Chest-Supported Dumbbell Rows (Wide Pull, 45°)',3,'7–9','per dumbbell',2.5),ex('face-pull','Face Pulls (Two Ropes)',2,'7–9','machine weight'),ex('incline-curl','Incline Curls',2,'7–9','per dumbbell',2.5),ex('preacher','Preacher Curls',2,'5–7','choose weight type'),ex('hammer-cable','Hammer Cable Curls',2,'5–7','machine weight'),ex('reverse-ez','Reverse EZ Bar Curls',4,'8–12')],
Legs:[ex('squat','Squats',3,'4–6'),ex('ham-curl','Hamstring Curls',2,'8–10','machine weight'),ex('leg-extension','Leg Extensions',2,'10–12','machine weight'),ex('abductor','Hip Abductors',2,'12–15','machine weight'),ex('calf','Calf Raises',2,'12–15','choose weight type')],
Upper:[ex('lat-upper','Lat Pulldown',2,'5–7','machine weight'),ex('incline-db','Incline Dumbbell Press',2,'7–9','per dumbbell',2.5),ex('upper-row','Barbell or Chest-Supported Row',2,'5–7','choose weight type',null),ex('upper-press','Overhead Barbell or Dumbbell Press',2,'4–6','choose weight type',null),ex('lateral','Lateral Raises',2,'10–12','choose weight type'),ex('upper-curl','Barbell or Cable Curl',2,'8–10','choose weight type',null),ex('pushdown','Tricep Pushdown',2,'8–10','machine weight')],
Lower:[ex('deadlift','Deadlift (Barbell or Trap Bar)',2,'3–5','total weight',null),ex('bulgarian','Bulgarian Split Squats',2,'6–8 per leg','choose weight type'),ex('ham-curl','Hamstring Curls',2,'8–10','machine weight'),ex('leg-extension','Leg Extensions',2,'10–12','machine weight'),ex('calf','Calf Raises',2,'12–15','choose weight type'),ex('abs','Hanging Leg Raises or Cable Crunches',2,'12–15','choose weight type',null)]};
export const SEED=[['Push','bench',80,8,2,'reported','exact','total weight'],['Push','incline-db',30,12,2,'routine_inferred','exact','per dumbbell'],['Push','shoulder-db',25,11,2,'reported','exact','per dumbbell'],['Pull','mag-pulldown',20.5,8,2,'reported','exact','machine weight'],['Pull','smith-row',90,6,3,'reported','estimated','total weight'],['Pull','face-pull',23.7,9,2,'reported','exact','machine weight']].map(([day,id,weight,reps,sets,sets_source,precision,unit])=>({day,id,weight,reps,sets,sets_source,precision,unit,date:null,source:'user_reported',variant:null,effort:null}));
export function createWeek(number,settings={}){return {id:crypto.randomUUID(),number,startedAt:new Date().toISOString(),archivedAt:null,bonus:false,days:Object.fromEntries(DAYS.map(day=>[day,{current:ROUTINES[day][0].id,entries:ROUTINES[day].map(e=>({...structuredClone(e),...settings[day+':'+e.id],completed:false,completedAt:null,weight:null,reps:null,effort:null,precision:'exact',variant:null}))}]))};}
export function initialState(){return {schema:1,programmeVersion:2,revision:0,active:createWeek(1),archives:[],seed:structuredClone([...SEED,...SEPTEMBER_RESULTS]),settings:{},view:{page:'home',day:null}};}
export const remaining=(session)=>session.entries.filter(e=>!e.completed);
export function currentEntry(session){return session.entries.find(e=>e.id===session.current)||session.entries[0];}
export function navigate(session,delta){const r=session.entries;if(!r.length)return;const i=r.findIndex(e=>e.id===session.current);session.current=r[(Math.max(0,i)+delta+r.length)%r.length].id;}
export function completeEntry(session,id){const entry=session.entries.find(e=>e.id===id);if(!entry||entry.completed)return false;entry.completed=true;entry.completedAt=new Date().toISOString();return true;}
export function archiveWeek(state){state.active.archivedAt=new Date().toISOString();state.archives.push(state.active);state.active=createWeek(state.active.number+1,state.settings);state.view={page:'home',day:null};}

export const SEPTEMBER_RESULTS=[
 ['squat','Barbell Squat',130,4,3,'4–6','kg','total weight','reported'],
 ['ham-curl','Hamstring Curl',45,9,2,'8–10','kg','machine weight','reported'],
 ['leg-extension','Leg Extension',175,10,2,'10–12','unknown','machine weight','reported'],
 ['calf','Calf Raises',22,10,2,'12–15','unknown','choose weight type','routine_inferred']
].map(([id,name,weight,reps,sets,target,loadUnit,unit,sets_source])=>({id,name,weight,reps,sets,target,loadUnit,unit,sets_source,day:'Legs',date:'2026-09-23',source:'user_reported',sourceId:'2026-09-23:'+id,precision:'exact',variant:null,effort:null}));
export const loadUnit=e=>e.loadUnit??'kg';
export const unitSuffix=e=>loadUnit(e)==='unknown'?'':loadUnit(e);
export function weightText(e){return e.weight===null?'Weight not logged':(e.precision==='estimated'?'≈ ':'')+e.weight+(unitSuffix(e)?' '+unitSuffix(e):'');}
export function repRange(e){const match=/^(\d+)\s*[–-]\s*(\d+)/.exec(e.target);if(!match)throw new Error('Exercise prescription is missing a rep range.');const min=Number(match[1]),max=Number(match[2]);if(max<min||max-min>100)throw new Error('Invalid exercise rep range.');return {min,max,values:Array.from({length:max-min+1},(_,i)=>min+i)};}
export function repInputValue(e){const {min,max}=repRange(e);return e.reps!==null&&e.reps>=min&&e.reps<=max?e.reps:min;}
export function previousResult(state,day,entry){
 const matches=e=>e.id===entry.id&&(e.weight!==null||e.reps!==null)&&(e.variant??null)===(entry.variant??null)&&loadUnit(e)===loadUnit(entry)&&(e.unit===entry.unit||entry.unit==='choose weight type'||e.unit==='choose weight type');
 const results=[];
 for(const w of [...state.archives,state.active])for(const d of [day,...DAYS.filter(x=>x!==day)])for(const e of w.days[d].entries)if(e.completed&&matches(e))results.push({...e,day:d,date:e.completedAt,week:w.number});
 results.push(...state.seed.filter(matches));
 return results.sort((a,b)=>(b.date??'').localeCompare(a.date??'')||(b.week??0)-(a.week??0))[0]??null;
}
// Validate snapshots independently of today's templates: history is immutable.
export function validateState(s){
 const fail=()=>{throw new Error('This file is not a compatible Training backup. Nothing was changed.');};
 const str=(x,n=250)=>typeof x==='string'&&x.length<=n;
 const number=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=10000;
 const reps=x=>x===null||Number.isInteger(x)&&x>=0&&x<=1000;
 const measure=e=>e.loadUnit===undefined||['kg','lb','unknown'].includes(e.loadUnit);
 if(!s||s.schema!==1||!Number.isInteger(s.revision)||s.revision<0||!Array.isArray(s.archives)||s.archives.length>5000||!Array.isArray(s.seed)||s.seed.length>1000||!s.settings||typeof s.settings!=='object'||Array.isArray(s.settings))fail();
 const ids=new Set();
 for(const w of [...s.archives,s.active]){
  if(!w||!str(w.id)||ids.has(w.id)||!Number.isInteger(w.number)||w.number<1||typeof w.bonus!=='boolean'||!w.days)fail();ids.add(w.id);
  for(const d of DAYS){const ses=w.days[d];if(!ses||!Array.isArray(ses.entries)||ses.entries.length>100)fail();const seen=new Set();
   for(const e of ses.entries){if(!e||!str(e.id)||seen.has(e.id)||!str(e.name)||!(e.variants===null||Array.isArray(e.variants)&&e.variants.length<=20&&e.variants.every(v=>str(v)))||!(e.completedAt===null||str(e.completedAt))||!str(e.target)||!str(e.unit)||typeof e.completed!=='boolean'||!number(e.sets)||!(e.weight===null||number(e.weight))||!reps(e.reps)||!measure(e)||![null,'more','right','hard'].includes(e.effort)||!(e.increment===null||number(e.increment)&&e.increment>0)||!(e.variant===null||str(e.variant))||!['exact','estimated'].includes(e.precision))fail();seen.add(e.id);}
   if(!(ses.current===null||seen.has(ses.current)))fail();
  }
 }
 for(const e of s.seed)if(!e||!DAYS.includes(e.day)||!str(e.id)||!(e.weight===null||number(e.weight))||!reps(e.reps)||!str(e.unit)||!measure(e)||!['exact','estimated'].includes(e.precision)||!(e.date==null||str(e.date)))fail();
 for(const [key,v] of Object.entries(s.settings))if(!str(key)||!DAYS.some(d=>key.startsWith(d+':'))||!v||!str(v.unit)||!number(v.increment)||v.increment<=0||!measure(v)||Object.keys(v).some(k=>!['unit','increment','loadUnit'].includes(k)))fail();
 if(!s.view||!['home','day','history','backup','review'].includes(s.view.page)||!(s.view.day===null||DAYS.includes(s.view.day)))fail();
 return s;
}
export function migrateState(input){
 const s=structuredClone(validateState(input));
 const removed=e=>e.id==='hip-thrust'||/hip[ -]?thrust/i.test(e.name);
 for(const day of DAYS){const session=s.active.days[day];
  for(const e of session.entries.filter(removed)){
   // Completed active results become historical records; no result is discarded.
   if(e.completed){const sourceId='retired:'+s.active.id+':'+day+':'+e.id;if(!s.seed.some(x=>x.sourceId===sourceId))s.seed.push({...structuredClone(e),day,date:e.completedAt,source:'programme_migration',sourceId,sets_source:'routine'});}
   delete s.settings[day+':'+e.id];
  }
  session.entries=session.entries.filter(e=>!removed(e));
  for(const e of session.entries){e.variants=null;if(e.loadUnit===undefined)e.loadUnit=e.weight===null&&!e.completed?ROUTINES[day].find(x=>x.id===e.id)?.loadUnit??'kg':'kg';}
  if(!session.entries.some(e=>e.id===session.current))session.current=session.entries[0]?.id??null;
 }
 for(const key of Object.keys(s.settings))if(key.endsWith(':hip-thrust'))delete s.settings[key];
 for(const result of SEPTEMBER_RESULTS)if(!s.seed.some(x=>x.sourceId===result.sourceId||x.date===result.date&&x.id===result.id&&x.day===result.day&&x.weight===result.weight&&x.reps===result.reps&&loadUnit(x)===loadUnit(result)))s.seed.push(structuredClone(result));
 for(const setting of Object.values(s.settings))if(setting.loadUnit===undefined)setting.loadUnit='kg';
 s.programmeVersion=2;
 return validateState(s);
}
export function toCSV(s){
 const rows=[['Week','Day','Exercise','Variant','Sets','Target reps','Completed','Weight','Measurement unit','Weight type','Weight precision','Reps','Effort','Date','Source','Sets source']];
 for(const w of [...s.archives,s.active])for(const d of DAYS)for(const e of w.days[d].entries)rows.push([w.number,d,e.name,e.variant,e.sets,e.target,e.completed,e.weight,loadUnit(e),e.unit,e.precision,e.reps,e.effort,e.completedAt,'app','routine']);
 for(const e of s.seed)rows.push(['Historical',e.day,e.name??e.id,e.variant,e.sets,e.target??'',true,e.weight,loadUnit(e),e.unit,e.precision,e.reps,e.effort,e.date,e.source,e.sets_source]);
 return rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
}
