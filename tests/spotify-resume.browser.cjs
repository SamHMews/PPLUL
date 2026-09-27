const {chromium}=require(process.env.PLAYWRIGHT_MODULE),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge'});try{
const page=await browser.newPage({serviceWorkers:'block'});await page.goto(process.env.APP_URL||'http://127.0.0.1:5173/');
let state=null,devices=[],status=204,calls=[];
await page.route('https://api.spotify.com/v1/me/player**',async route=>{const req=route.request(),url=new URL(req.url());if(req.method()==='GET'){if(url.pathname.endsWith('/devices'))return route.fulfill({json:{devices}});return state?route.fulfill({json:state}):route.fulfill({status:204,body:''});}calls.push({path:url.pathname,device:url.searchParams.get('device_id'),method:req.method()});return route.fulfill({status,body:''});});
await page.evaluate(async()=>{localStorage.setItem('pplul-spotify-auth',JSON.stringify({access_token:'fake',refresh_token:'fake',expires_at:Date.now()+3600000}));window.testSpotify=(await import('./spotify.js')).createSpotify();});
const toggle=()=>page.evaluate(()=>testSpotify.toggle().catch(e=>({error:e.message})));
devices=[{id:'phone',type:'Smartphone'},{id:'speaker',type:'Speaker'}];assert.equal(await toggle(),'play');assert.equal(calls.at(-1).device,'phone');
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pplul-spotify-auth')).last_device_id),'phone');
devices=[{id:'phone',type:'Smartphone'},{id:'other-phone',type:'Smartphone'}];assert.equal(await toggle(),'play');assert.equal(calls.at(-1).device,'phone');
state={is_playing:true,device:{id:'phone'}};assert.equal(await toggle(),'pause');state={is_playing:false,device:{id:'phone'}};assert.equal(await toggle(),'play');
state=null;devices=[];assert.equal(await toggle(),'play');assert.equal(calls.at(-1).device,null);
status=404;let count=calls.length;assert.match((await toggle()).error,/not available to remote controls/);assert.equal(calls.length,count+1);
status=500;count=calls.length;assert.match((await toggle()).error,/could not confirm/);assert.equal(calls.length,count+1);
status=204;devices=[{id:'unfamiliar-a'},{id:'unfamiliar-b'}];count=calls.length;assert.match((await toggle()).error,/Several Spotify devices/);assert.equal(calls.length,count);
state={is_playing:false,device:{id:'locked',is_restricted:true}};assert.match((await toggle()).error,/does not allow/);assert.equal(calls.length,count);
console.log('PASS: no-playback device discovery, remembered device, pause/resume, default play, unavailable/ambiguous/restricted device handling, no command retries');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
