const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const BASE=process.env.APP_URL||'http://127.0.0.1:5173/';
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge'});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();
  await context.addInitScript(()=>{if(navigator.serviceWorker)navigator.serviceWorker.register=()=>new Promise(()=>{});});
  let authorization,verifier,tokenCalls=0,skips=0,status=204,refreshes=0;
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://accounts.spotify.com/authorize?*',async route=>{authorization=new URL(route.request().url());await route.fulfill({contentType:'text/html',body:'Mock Spotify sign-in'});});
  await page.route('https://accounts.spotify.com/api/token',async route=>{
   tokenCalls++;const body=new URLSearchParams(route.request().postData());
   assert.equal(body.get('client_id'),'abea48f03d904d628583c15cbc27a7a9');assert(!body.has('client_secret'));
   if(body.get('grant_type')==='authorization_code'){
    verifier=body.get('code_verifier');assert.equal(crypto.createHash('sha256').update(verifier).digest('base64url'),authorization.searchParams.get('code_challenge'));
    assert.equal(body.get('redirect_uri'),'https://samhmews.github.io/PPLUL/');
   }else {refreshes++;assert.equal(body.get('refresh_token'),'fake-refresh');}
   await route.fulfill({json:{access_token:'fake-access',refresh_token:'fake-refresh',expires_in:3600,scope:'user-modify-playback-state'}});
  });
  await page.route('https://api.spotify.com/v1/me/player/next',async route=>{skips++;assert.equal(route.request().method(),'POST');assert.equal(route.request().headers().authorization,'Bearer fake-access');await route.fulfill({status,headers:status===429?{'Retry-After':'2','Access-Control-Expose-Headers':'Retry-After'}:{},body:''});});
  await page.goto(BASE);await page.locator('[data-day=Lower]').click();await page.getByRole('button',{name:'Next song on Spotify'}).first().click();
  await page.locator('#connect-spotify').click();await page.waitForURL('https://accounts.spotify.com/authorize?*');
  assert.equal(authorization.searchParams.get('scope'),'user-modify-playback-state');
  await page.goto(BASE+'?code=fake-code&state='+authorization.searchParams.get('state'));
  await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('pplul-spotify-auth'))?.refresh_token);
  assert(!page.url().includes('code='));assert.equal(tokenCalls,1);
  const next=()=>page.locator('.is-front .spotify-next');
  await next().click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Skipped'));assert.equal(skips,1);
  await page.evaluate(()=>{const a=JSON.parse(localStorage.getItem('pplul-spotify-auth'));a.expires_at=0;localStorage.setItem('pplul-spotify-auth',JSON.stringify(a));});
  await page.reload();await next().click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Skipped'));assert.equal(refreshes,1);assert.equal(skips,2);
  await page.getByRole('button',{name:'Done',exact:true}).click();await page.locator('.is-front[data-entry=bulgarian]').waitFor();
  await page.locator('[data-progress=deadlift]').click();assert.equal(await next().isEnabled(),true);await next().click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Skipped'));assert.equal(skips,3);
  status=404;await next().click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Start music'));assert.equal(skips,4);
  status=401;await next().click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('reconnect'));assert.equal(skips,6);assert.equal(refreshes,2);
  await page.evaluate(()=>localStorage.setItem('pplul-spotify-auth',JSON.stringify({access_token:'fake-access',refresh_token:'fake-refresh',expires_at:Date.now()+3600000})));
  status=429;await next().click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Spotify is busy'));const count=skips;await next().click();assert.equal(skips,count);
  await page.waitForTimeout(2100);await context.setOffline(true);await page.waitForTimeout(100);await next().click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Go online'));assert.equal(skips,count);await context.setOffline(false);
  await page.locator('[data-action=home]').click();await page.locator('[data-action=backup]').click();await page.locator('[data-action=spotify-disconnect]').click();assert.equal(await page.evaluate(()=>localStorage.getItem('pplul-spotify-auth')),null);
  await page.goto(BASE+'?code=untrusted&state=wrong');await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('sign-in expired'));assert.equal(tokenCalls,3);
  assert.deepEqual(errors,[]);
  await page.goto(BASE);await page.locator('[data-action=home]').click();await page.locator('[data-day=Pull]').click();
  for(const size of [{width:390,height:844},{width:375,height:667},{width:430,height:932}]){
   await page.setViewportSize(size);const ids=await page.locator('.progress button').evaluateAll(es=>es.map(e=>e.dataset.id));
   for(const id of ids){await page.locator('[data-progress="'+id+'"]').click();await page.locator('.is-front[data-entry="'+id+'"]').waitFor();const bounds=await next().boundingBox();assert(bounds.width>=44&&bounds.height>=44);const fits=await next().evaluate(el=>{const title=el.closest('article').querySelector('h2').getBoundingClientRect();return title.right<=el.getBoundingClientRect().left;});assert(fits);}
  }
  require('fs').mkdirSync('test-artifacts',{recursive:true});await page.screenshot({path:'test-artifacts/spotify-card.png'});
  await context.close();console.log('PASS: PKCE, state rejection, refresh/reload, skip, completed cards, 401/404/429/offline, disconnect and phone layouts');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
