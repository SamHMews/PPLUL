import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {openDB,readState,persist} from '../dist/storage.js';
import {initialState,archiveWeek,validateState} from '../dist/model.js';
await openDB();
test('atomic persistence, rollback, stale writes and full backup restore',async()=>{
 const s=initialState();s.revision=1;await persist(s,0);
 const draft=structuredClone(s);draft.active.days.Push.entries[0].weight=82.5;draft.revision=2;await persist(draft,1);
 const next=structuredClone(draft);archiveWeek(next);next.revision=3;
 const original=IDBObjectStore.prototype.put;
 IDBObjectStore.prototype.put=function(...args){const request=original.apply(this,args);queueMicrotask(()=>this.transaction.abort());return request;};
 await assert.rejects(persist(next,2),/Could not save/);
 IDBObjectStore.prototype.put=original;
 assert.deepEqual(await readState(),draft);
 await persist(next,2);assert.equal((await readState()).archives[0].days.Push.entries[0].weight,82.5);
 await assert.rejects(persist(draft,2),/another tab/);assert.deepEqual(await readState(),next);
 const restored=validateState(JSON.parse(JSON.stringify(draft)));restored.revision=4;await persist(restored,3);assert.deepEqual(await readState(),restored);
});
