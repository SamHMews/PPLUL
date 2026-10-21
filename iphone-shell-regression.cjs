const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=process.env.APP_ROOT||(fs.existsSync('dist/index.html')?'dist':'.');
const {webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;fs.readFile(path.join(root,name==='/'?'index.html':name),(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(data);});});
(async()=>{
 const {dashboardViewportHeight:height}=await import(require('node:url').pathToFileURL(path.resolve(root,'dashboard.js')));
 const iphone={standalone:true,iphone:true,width:390,height:797,screenWidth:390,screenHeight:844,safeTop:47,visibleHeight:797};
 assert.equal(height(iphone),844,'Correct the exact lost status-inset signature');
 assert.equal(height({...iphone,safeTop:0}),797,'Do not extend an opaque native-inset installation');
 assert.equal(height({...iphone,standalone:false}),797,'Do not extend Safari tabs');
 assert.equal(height({...iphone,height:500,visibleHeight:500}),500,'Do not mistake keyboard resizing for a status inset');
 assert.equal(height({...iphone,screenWidth:844}),797,'Do not compensate mismatched orientation/screen dimensions');
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await webkit.launch();const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1',isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  await context.addInitScript(()=>{navigator.serviceWorker.register=()=>new Promise(()=>{});const match=window.matchMedia.bind(window);window.matchMedia=q=>q==='(display-mode: standalone)'?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:match(q);});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.locator('.app-footer').waitFor();
  await p.addStyleTag({content:':root{--shell-safe-top:47px;--shell-safe-bottom:34px}'});
  assert.equal(await p.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content'),'black','Status bar must be opaque');
  assert(await p.locator('.app-footer button').evaluateAll(buttons=>buttons.every(button=>{
   const panel=button.closest('.app-footer').getBoundingClientRect(),b=button.getBoundingClientRect(),icon=button.querySelector('svg').getBoundingClientRect(),label=button.querySelector('span').getBoundingClientRect();
   return Math.abs(b.y+b.height/2-panel.y-panel.height/2)<1&&panel.bottom-label.bottom>=20&&Math.abs(icon.x+icon.width/2-b.x-b.width/2)<1&&Math.abs(label.x+label.width/2-b.x-b.width/2)<1&&Math.abs((icon.top+label.bottom)/2-b.y-b.height/2)<1;
  })),'Footer icon and label groups are centered inside all four equal targets');
  assert.equal(await p.locator('.screen-heading .eyebrow').evaluate(e=>getComputedStyle(e).color),'rgb(193, 185, 203)','Week context uses readable solid colour');

  const fits=()=>p.evaluate(()=>{const main=document.querySelector('#app'),footer=document.querySelector('.app-footer').getBoundingClientRect();return main.getBoundingClientRect().top>=47&&main.scrollHeight<=main.clientHeight+1&&Math.abs(footer.bottom-innerHeight)<1;});
  assert(await fits(),'WebKit Home Screen dashboard fits below status area and above bottom navigation');
  assert(await p.locator('.status-surface').evaluate(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return b.top===0&&b.width===innerWidth&&b.height>=8&&s.position==='fixed'&&s.backgroundColor==='rgb(17, 17, 22)'&&s.pointerEvents==='none';}),'Dedicated opaque top surface meets the WebKit edge-sampling geometry');
  await p.setViewportSize({width:390,height:797});
  await p.waitForFunction(()=>Math.abs(document.querySelector('.app-footer').getBoundingClientRect().bottom-844)<1);
  assert(await p.locator('#app').evaluate(e=>e.scrollHeight<=e.clientHeight+1),'Corrected screen keeps Home content visible');
  await p.setViewportSize({width:390,height:844});

  await p.locator('[data-day=Pull]').click();await p.locator('.is-front').waitFor();assert.equal(await p.locator('.app-footer').count(),0,'No navigation chrome on logging cards');
  await p.locator('#overview-toggle').click();assert.equal(await p.locator('.overview-row').count(),8);assert(await fits(),'All eight rows fit in WebKit');
  await p.locator('[data-route=progress]').click();await p.locator('.weight-chart').first().waitFor();
  assert(await p.locator('#app').evaluate(e=>e.scrollHeight<=e.clientHeight+1),'Progress fits between real safe areas without vertical scrolling');
  assert(await p.locator('.graph-card').evaluateAll(cards=>{const box=cards[0].getBoundingClientRect();return cards.every(c=>Math.abs(c.getBoundingClientRect().height-box.height)<1&&c.scrollHeight<=c.clientHeight+1);}), 'All graph cards have identical visible height in WebKit');
  await p.evaluate(()=>{document.querySelector('#app').scrollTop=200;});
  assert(await p.locator('#app').evaluate(e=>e.getBoundingClientRect().top===47),'Scrolling cannot enter the status-bar region');
  await p.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:724});visualViewport.dispatchEvent(new Event('resize'));});
  await p.waitForTimeout(80);
  assert(await p.locator('.app-footer').evaluate(e=>Math.abs(e.getBoundingClientRect().bottom-844)<1),'A shortened iOS visualViewport must not create a bottom strip in standalone mode');
  await p.setViewportSize({width:390,height:724});
  await p.waitForFunction(()=>Math.abs(document.querySelector('.app-footer').getBoundingClientRect().bottom-724)<1);
  await p.setViewportSize({width:390,height:844});
  await p.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
  await p.locator('[data-route=home]').click();await p.locator('.home-grid').waitFor();await p.addStyleTag({content:'html{font-size:200%}'});
  assert(await p.locator('#app').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Large type has no horizontal overflow');
  await p.locator('[data-day=Pull]').click();await p.locator('#overview-toggle').click();
  assert(await p.locator('.overview-name').evaluateAll(es=>es.every(e=>e.scrollHeight<=e.clientHeight+1)),'Large names remain unclipped');
  await p.locator('.overview-row').last().scrollIntoViewIfNeeded();assert(await p.locator('.overview-row').last().isVisible());
  assert.deepEqual(errors,[]);console.log('PASS WebKit iPhone 13 normal and lost-status-inset viewport signatures, opaque edge surface, fixed-size charts, eight rows and 200% type');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
