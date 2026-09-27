const {chromium}=require(process.env.PLAYWRIGHT_MODULE),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge'});try{
const page=await browser.newPage({serviceWorkers:'block'});await page.goto(process.env.APP_URL||'http://127.0.0.1:5173/');let reads=[],writes=[],readFailures=[],writeFailures=[],target='old';
await page.route('https://api.spotify.com/v1/me/player**',async route=>{const req=route.request(),u=new URL(req.url());if(req.method()==='GET'){if(u.pathname.endsWith('/devices'))return route.fulfill({json:{devices:[{id:target,type:'Smartphone'}]}});reads.push(u.pathname);const fail=readFailures.shift();if(fail==='network')return route.abort('failed');if(fail)return route.fulfill({status:fail,body:''});return route.fulfill({json:{is_playing:false,device:{id:'old'}}});}writes.push({path:u.pathname,device:u.searchParams.get('device_id')});const fail=writeFailures.shift();if(fail==='network')return route.abort('failed');return route.fulfill({status:fail||204,body:''});});
await page.evaluate(async()=>{localStorage.setItem('pplul-spotify-auth',JSON.stringify({access_token:'fake',refresh_token:'fake',expires_at:Date.now()+3600000}));window.service=(await import('./spotify.js')).createSpotify();});
const command=(action='toggle')=>page.evaluate(action=>service[action]().catch(e=>({error:e.message})),action);
readFailures=[503];assert.equal(await command(),'play');assert.equal(reads.length,2);assert.equal(writes.length,1);
reads=[];writes=[];readFailures=['network'];assert.equal(await command(),'play');assert.equal(reads.length,2);assert.equal(writes.length,1);
reads=[];writes=[];readFailures=[503,503];assert((await command()).error);assert.equal(reads.length,2);assert.equal(writes.length,0);
readFailures=[];writes=[];writeFailures=[404];target='new';assert.equal(await command(),'play');assert.deepEqual(writes.map(x=>x.device),['old','new']);assert(writes.every(x=>x.path.endsWith('/play')));
writes=[];writeFailures=[404];target='new';assert.equal(await command('next'),'next');assert.deepEqual(writes.map(x=>x.device),[null,'new']);
writes=[];writeFailures=[500];assert((await command('next')).error);assert.equal(writes.length,1);
writes=[];writeFailures=['network'];assert((await command('next')).error);assert.equal(writes.length,1);
writes=[];writeFailures=[404];target='old';assert((await command()).error);assert.equal(writes.length,1);
console.log('PASS: bounded read retries, refreshed device after explicit rejection, preserved command intent, no duplicate commands on network/5xx/unchanged device');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
