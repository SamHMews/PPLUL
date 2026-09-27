const {chromium}=require(process.env.PLAYWRIGHT_MODULE),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge'});try{
const c=await b.newContext({viewport:{width:375,height:667},serviceWorkers:'block'});
await c.addInitScript(()=>{navigator.serviceWorker.register=()=>new Promise(()=>{});localStorage.setItem('pplul-spotify-auth',JSON.stringify({access_token:'test',refresh_token:'test',expires_at:Date.now()+3600000}));});
const p=await c.newPage();let playing=true,hang=false,deny=false;const calls=[];
await p.route('https://api.spotify.com/v1/me/player**',async r=>{const req=r.request(),path=new URL(req.url()).pathname.split('/').pop();if(hang){hang=false;return;}if(req.method()==='GET'){await r.fulfill({status:deny?403:200,json:{is_playing:playing,device:{id:'phone',is_restricted:false}}});return;}calls.push(path);if(path==='pause')playing=false;if(path==='play')playing=true;await r.fulfill({status:204,body:''});});
await p.goto(process.env.APP_URL||'http://127.0.0.1:5173/');await p.locator('[data-day=Pull]').click();await p.locator('[data-progress=wide-db-row]').click();await p.locator('.is-front[data-entry=wide-db-row]').waitFor();let control=p.locator('.is-front .music-switch');
async function drag(dx,release=true,dy=0){await control.evaluate(e=>{if(e.disabled)throw Error("Control disabled before gesture");document.querySelector("#notice").replaceChildren();});const r=await control.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.mouse.move(r.x+r.width/2+dy,r.y+r.height/2+dx,{steps:5});if(release)await p.mouse.up();}
async function notice(text){if(['Music paused','Music playing','Skipped'].includes(text)){await p.waitForFunction(()=>!document.querySelector('.is-front .music-switch, .cardio-card .music-switch').disabled);assert(!/Music paused|Music playing|Skipped/.test(await p.locator('#notice').textContent()));}else await p.waitForFunction(t=>document.querySelector('#notice').textContent.includes(t),text);}
await control.click();await drag(5);await drag(0,true,-60);await drag(0,true,100);assert.equal(calls.length,0);assert.equal(await p.locator('.is-front').getAttribute('data-entry'),'wide-db-row');
const session=await c.newCDPSession(p),bounds=await control.boundingBox();const tx=bounds.x+bounds.width/2,ty=bounds.y+bounds.height/2;
await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx-100,y:ty}]});assert.equal(await p.locator('.is-front').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41),0);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(calls.length,0);
await drag(-20,false);assert.equal(calls.length,0);await p.mouse.up();await notice('Music paused');assert.deepEqual(calls,['pause']);
await drag(-20);await notice('Music playing');assert.deepEqual(calls,['pause','play']);
playing=false;await drag(-20);await notice('Music playing');assert.deepEqual(calls,['pause','play','play']);
await drag(20);await notice('Skipped');assert.equal(calls.at(-1),'next');
const n=calls.length;await drag(20,false);await control.dispatchEvent('pointercancel',{pointerId:1});await p.mouse.up();assert.equal(calls.length,n);
await drag(20,false);const r=await control.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.up();assert.equal(calls.length,n);
hang=true;await drag(20);await p.waitForFunction(()=>document.querySelector('.is-front .music-switch').disabled);await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await p.waitForFunction(()=>!document.querySelector('.is-front .music-switch').disabled);await drag(20);await notice('Skipped');assert.equal(calls.length,n+1);
deny=true;await drag(-20);await notice('Reconnect Spotify once');assert.equal(await p.locator('#notice button').textContent(),'Reconnect Spotify');deny=false;
await control.focus();await p.keyboard.down('ArrowUp');const before=calls.length;await p.keyboard.up('ArrowUp');await notice('Music paused');assert.equal(calls.length,before+1);
assert.equal(await p.locator('.is-front').getAttribute('data-entry'),'wide-db-row');assert(await p.locator('.is-front').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight+1));
require('fs').mkdirSync('test-artifacts',{recursive:true});await p.screenshot({path:'test-artifacts/music-switch.png'});
await p.locator('[data-action=home]').click();await p.locator('[data-action=cardio]').click();control=p.locator('.music-switch');await drag(20);await notice('Skipped');
console.log('PASS: pause/resume, external playback changes, background interruption recovery, reconnect, release-only/cancel/recenter/horizontal safety, keyboard, Cardio, 375px layout');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
