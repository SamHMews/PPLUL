require('node:fs').mkdirSync('test-artifacts',{recursive:true});
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:process.env.BROWSER_CHANNEL||undefined,headless:true});try{const c=await b.newContext({viewport:{width:375,height:667},hasTouch:true,isMobile:true});const p=await c.newPage();await p.goto(process.env.APP_URL||'http://127.0.0.1:5173');await p.locator('[data-day=Push]').waitFor();
for(const day of ['Push','Pull','Legs','Upper','Lower']){
 await p.locator('[data-day='+day+']').click();await p.locator('.is-front').waitFor();
 for(const size of [{width:375,height:667},{width:390,height:664},{width:390,height:844}]){await p.setViewportSize(size);assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight),size.height,day+' overflow');}
 await p.locator('.back').click();}
console.log('All 34 mounted cards fit three phone viewport sizes');
await p.setViewportSize({width:390,height:664});await p.locator('[data-day=Push]').click();await p.locator('.is-front').waitFor();
const d=await c.newCDPSession(p);const event=(type,x=190,y=140)=>d.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y}]});
await event('touchStart');await event('touchMove',150,150);await p.waitForTimeout(180);await event('touchEnd');await p.waitForTimeout(25);
const before=await p.locator('.is-front').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41);
await event('touchStart',180,145);await event('touchMove',210,145);await p.waitForTimeout(140);
const after=await p.locator('.is-front').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41);assert(Math.abs(after-before-30)<15,'regrab must retain live transform');
await event('touchCancel');await p.waitForTimeout(600);assert.equal(await p.locator('.is-front h2').innerText(),'Bench Press');assert(Math.abs(await p.locator('.is-front').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41))<1);
console.log('Interrupted return can be re-grabbed and pointer cancellation returns safely');
await p.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...a){const r=put.apply(this,a);this.transaction.abort();IDBObjectStore.prototype.put=put;return r;};});
await p.getByRole('button',{name:'Done',exact:true}).click();await p.getByRole('button',{name:'Retry',exact:true}).waitFor();assert.equal(await p.locator('.is-front.is-complete').count(),0);await p.getByRole('button',{name:'Retry',exact:true}).click();await p.locator('.is-front.is-complete').waitFor();assert.equal(await p.locator('#remaining-count').innerText(),'7 of 8 remaining');
for(let i=1;i<8;i++){await p.locator('.is-front').focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(600);await p.getByRole('button',{name:'Done',exact:true}).click();await p.waitForTimeout(100);}
assert.equal(await p.locator('#remaining-count').innerText(),'0 of 8 remaining');assert.equal(await p.locator('.exercise-card.is-complete').count(),8);await p.locator('[data-day=Push].complete').waitFor();await p.locator('[data-day=Push]').click();await p.locator('.is-front').waitFor();await p.reload();await p.locator('.is-front').waitFor();assert.equal(await p.locator('#remaining-count').innerText(),'0 of 8 remaining');await p.locator('.is-front').focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(600);assert.equal(await p.locator('.is-front h2').innerText(),'Bench Press');await p.getByRole('button',{name:'Undo completion',exact:true}).click();await p.waitForTimeout(100);assert.equal(await p.locator('#remaining-count').innerText(),'1 of 8 remaining');
console.log('Save failure, Retry, all-completed browsing, reload and Undo pass');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
