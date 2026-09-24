import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,migrateState,validateState,archiveWeek,previousResult,repRange,repInputValue,weightText,toCSV,remaining,completeEntry} from '../dist/model.js';
const hip=()=>({id:'hip-thrust',name:'Hip Thrusts',sets:2,target:'6–8',unit:'total weight',increment:5,variants:null,completed:true,completedAt:'2026-09-22T12:00:00Z',weight:60,reps:8,effort:'right',precision:'exact',variant:null});
test('programme migration removes Hip Thrusts on both days, preserving archives and completed results',()=>{
 const old=initialState();delete old.programmeVersion;old.seed=old.seed.filter(e=>!e.sourceId);
 for(const d of ['Legs','Lower']){old.active.days[d].entries.push(hip());old.active.days[d].current='hip-thrust';old.settings[d+':hip-thrust']={unit:'total weight',increment:5};}
 for(const ses of Object.values(old.active.days))for(const e of ses.entries)delete e.loadUnit;
 const archived=structuredClone(old.active);archived.id='old-week';old.archives.push(archived);
 const before=JSON.stringify(old.archives), next=migrateState(old);
 assert.equal(JSON.stringify(next.archives),before);
 assert.deepEqual(['Legs','Lower'].map(d=>next.active.days[d].entries.length),[4,6]);
 assert.equal(next.seed.filter(e=>e.source==='programme_migration').length,2);
 assert(!Object.keys(next.settings).some(k=>k.endsWith(':hip-thrust')));
 assert.deepEqual(migrateState(next),next);
 archiveWeek(next);assert(!JSON.stringify(next.active).includes('Hip Thrusts'));
});
test('historical reps survive changed prescriptions and JSON export/import',()=>{
 const s=initialState(),calf=s.seed.find(e=>e.sourceId==='2026-09-23:calf');assert.equal(calf.reps,10);
 assert.deepEqual(repRange(s.active.days.Legs.entries.find(e=>e.id==='calf')).values,[12,13,14,15]);
 const current=s.active.days.Legs.entries.find(e=>e.id==='calf');current.reps=10;current.completed=true;current.completedAt='2026-09-23T18:00:00Z';
 archiveWeek(s);s.active.days.Legs.entries.find(e=>e.id==='calf').target='15–20';
 const restored=migrateState(validateState(JSON.parse(JSON.stringify(s))));
 assert.equal(restored.archives[0].days.Legs.entries.find(e=>e.id==='calf').reps,10);
 assert.equal(restored.seed.find(e=>e.sourceId===calf.sourceId).reps,10);
});
test('all supplied historical results are dated and Unknown weights have no suffix',()=>{
 const s=initialState(),reported=s.seed.filter(e=>e.date==='2026-09-23');
 assert.deepEqual(reported.map(e=>[e.weight,e.reps]),[[130,4],[45,9],[175,10],[22,10]]);
 const leg=s.active.days.Legs.entries.find(e=>e.id==='leg-extension');
 assert.equal(weightText(previousResult(s,'Legs',leg)),'175');
 assert.equal(previousResult(s,'Lower',s.active.days.Lower.entries.find(e=>e.id==='leg-extension')).weight,175);
 assert.equal(weightText({weight:25,loadUnit:'lb'}),'25 lb');
 leg.loadUnit='lb';assert.equal(previousResult(s,'Legs',leg),null);
 assert(toCSV(s).includes('"175","unknown"'));assert(!toCSV(s).includes('Weight kg'));
});
test('rep inputs follow prescriptions without mutating stored out-of-range actuals',()=>{
 const s=initialState();for(const [id,expected] of [['squat',[4,5,6]],['ham-curl',[8,9,10]],['leg-extension',[10,11,12]],['calf',[12,13,14,15]]]){
 const e=s.active.days.Legs.entries.find(e=>e.id===id);assert.deepEqual(repRange(e).values,expected);e.reps=99;assert.equal(repInputValue(e),expected[0]);assert.equal(e.reps,99);}
});
test('lb and Unknown set-up persist into the next week and counters derive from active entries',()=>{
 const s=initialState();s.settings['Lower:leg-extension']={unit:'machine weight',increment:5,loadUnit:'unknown'};
 s.settings['Push:bench']={unit:'total weight',increment:5,loadUnit:'lb'};archiveWeek(s);
 assert.equal(s.active.days.Push.entries[0].loadUnit,'lb');
 assert.equal(s.active.days.Lower.entries.find(e=>e.id==='leg-extension').loadUnit,'unknown');
 completeEntry(s.active.days.Lower,'deadlift');assert.equal(remaining(s.active.days.Lower).length,5);
 assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))),s);
});
