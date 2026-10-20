const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=fs.existsSync('dist/spotify.js')?'dist':'.';
 const source=fs.readFileSync(path.join(root,'spotify.js'),'utf8'),authKey=/const AUTH_KEY='([^']+)'/.exec(source)[1];
 const {createSpotify}=await import(require('node:url').pathToFileURL(path.resolve(root,'spotify.js')));
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
 const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 const response=(status=200,data={})=>new Response(status===204?null:JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Retry-After':'1'}});
 const state=(id='phone',item='A',playing=true)=>({device:{id,is_active:true},item:{uri:item},is_playing:playing,progress_ms:10000});
 let scenarios=0;
 async function test(name,handler,check,extra={}){
  memory.clear();memory.set(authKey,JSON.stringify({access_token:'test-access',refresh_token:'test-refresh',expires_at:Date.now()+3600000,...extra}));
  const calls=[];globalThis.fetch=async(url,options)=>{const call={path:new URL(url).pathname,device:new URL(url).searchParams.get('device_id'),...options};calls.push(call);return handler(call,calls);};
  const service=createSpotify();await check(service,calls);scenarios++;console.log('PASS '+name);
 }
 const writes=c=>c.filter(x=>x.method!=='GET'&&!x.path.includes('/api/token'));
 await test('active playback wins without consulting an inconsistent device list',c=>{assert(!c.path.endsWith('/devices'));return c.method==='GET'?response(200,state()):response(204);},async(s,c)=>{assert.equal(await s.next(),'next');assert.equal(writes(c)[0].device,'phone');});
 await test('multiple inactive devices do not block a successful default-player skip',c=>c.path.endsWith('/devices')?response(200,{devices:[{id:'x',type:'Computer'},{id:'y',type:'Speaker'}]}):c.method==='GET'?response(204):response(204),async(s,c)=>{assert.equal(await s.next(),'next');assert.equal(writes(c).length,1);assert.equal(writes(c)[0].device,null);});
 await test('cached device must exist in fresh list',c=>c.path.endsWith('/devices')?response(200,{devices:[{id:'new-phone',type:'Smartphone'},{id:'desk',type:'Computer'}]}):c.method==='GET'?response(204):response(204),async(s,c)=>{await s.next();assert.equal(writes(c)[0].device,'new-phone');},{last_device_id:'stale-phone'});
 let reads=0;
 await test('404 refreshes changed device once',c=>c.method==='GET'?response(200,state(++reads===1?'old':'new')):c.device==='old'?response(404):response(204),async(s,c)=>{await s.next();assert.deepEqual(writes(c).map(x=>x.device),['old','new']);});
 for(const status of [404,500,'network']){
  let applied=false;
  await test('applied skip with '+status+' response verifies without duplicate',c=>{if(c.method==='GET')return response(200,state('phone',applied?'B':'A'));applied=true;if(status==='network')throw new TypeError('network failure');return response(status);},async(s,c)=>{assert.equal(await s.next(),'next');assert.equal(writes(c).length,1);});
 }
 await test('ambiguous failure with unchanged track is never retried',c=>c.method==='GET'?response(200,state()):response(503),async(s,c)=>{await assert.rejects(s.next(),/could not confirm/);assert.equal(writes(c).length,1);});
 let refreshed=false;
 await test('401 refreshes once before resending a rejected command',c=>{if(c.path.includes('/api/token')){refreshed=true;return response(200,{access_token:'new-test',expires_in:3600});}if(c.method==='GET')return response(200,state());return response(refreshed?204:401);},async(s,c)=>{await s.next();assert.equal(c.filter(x=>x.path.includes('/api/token')).length,1);assert.equal(writes(c).length,2);});
 await test('rate limits remain visible and prevent another request',c=>c.method==='GET'?response(200,state()):response(429),async(s,c)=>{await assert.rejects(s.next(),/busy/);const n=c.length;await assert.rejects(s.next(),/needs a moment/);assert.equal(c.length,n);});
 await test('simultaneous gestures do not queue commands',async c=>{await new Promise(r=>setTimeout(r,10));return c.method==='GET'?response(200,state()):response(204);},async(s,c)=>{await Promise.all([s.next(),s.next(),s.toggle()]);assert.equal(writes(c).length,1);});
 let playing=true;
 await test('pause and resume use the actual playback state',c=>{if(c.method==='GET')return response(200,state('phone','A',playing));playing=c.path.endsWith('/play');return response(204);},async(s,c)=>{assert.equal(await s.toggle(),'pause');assert.equal(await s.toggle(),'play');assert(writes(c).every(x=>x.method==='PUT'));});
 let previousApplied=false;
 await test('previous track shares verification and uses POST',c=>{if(c.method==='GET')return response(200,{...state(),progress_ms:previousApplied?0:10000});previousApplied=true;return response(500);},async(s,c)=>{assert.equal(await s.previous(),'previous');assert.equal(writes(c).length,1);assert.equal(writes(c)[0].method,'POST');});
 await test('restricted device produces a genuine error without writes',c=>response(200,{...state(),device:{id:'restricted',is_restricted:true}}),async(s,c)=>{await assert.rejects(s.next(),/does not allow/);assert.equal(writes(c).length,0);});
 await test('204 is final even if a response body cannot be read',c=>c.method==='GET'?response(200,state()):{ok:true,status:204,headers:new Headers(),text:()=>{throw Error('must not read 204 body');}},async(s,c)=>{assert.equal(await s.next(),'next');assert.equal(c.length,2);});
 console.log(`PASS ${scenarios} Spotify response/routing scenarios; no live playback or credentials used`);
})().catch(e=>{console.error(e);process.exitCode=1;});
