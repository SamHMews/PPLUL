require('node:fs').mkdirSync('test-artifacts',{recursive:true});
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:process.env.BROWSER_CHANNEL||undefined,headless:true});try{
const c=await b.newContext({viewport:{width:390,height:664},isMobile:true,hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>{throw e});await p.goto(process.env.APP_URL||'http://127.0.0.1:5173');await p.locator('[data-day=Push]').click();await p.locator('.is-front').waitFor();
const title=()=>p.locator('.is-front h2').innerText();
console.log('layout',await p.evaluate(()=>({h:innerHeight,s:document.documentElement.scrollHeight})));
assert.equal(await p.locator('[data-action=options],.deck-footer').count(),0);
assert.equal(await p.locator('.exercise-card').count(),8);
await p.evaluate(()=>{window.originalCard=document.querySelector('.is-front');});
const cdp=await c.newCDPSession(p);let origin;
async function start(selector='.is-front h2'){const box=await p.locator(selector).boundingBox();origin={x:box.x+box.width/2,y:box.y+box.height/2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[origin]});}
async function move(dx,dy=0){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:origin.x+dx,y:origin.y+dy}]});}
async function end(){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function swipe(dx,selector){await start(selector);for(let i=1;i<=8;i++){await move(dx*i/8,20*i/8);await p.waitForTimeout(18);}await end();await p.waitForTimeout(600);}
await start();await move(-55,14);await p.waitForTimeout(160);
assert.equal(await title(),'Bench Press');assert.equal(await p.locator('.is-under h2').innerText(),'Incline Dumbbell Press');
assert(Math.abs(await p.locator('.is-front').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41)+55)<2);
await p.screenshot({path:'test-artifacts/stack-drag.png'});await end();await p.waitForTimeout(600);assert.equal(await title(),'Bench Press');
assert.equal(await p.evaluate(()=>window.originalCard===document.querySelector('.is-front')),true);
console.log('Partial drag reveals a separate physical card and returns original DOM');
await swipe(-170);assert.equal(await title(),'Incline Dumbbell Press');
assert.equal(await p.evaluate(()=>window.originalCard.isConnected),true);
await swipe(170);assert.equal(await title(),'Bench Press');
console.log('Bidirectional swipe moves physical cards');
await p.getByRole('button',{name:'Done',exact:true}).click();await p.waitForTimeout(200);assert.equal(await title(),'Bench Press');assert.equal(await p.locator('.is-front.is-complete').count(),1);assert.equal(await p.locator('#remaining-count').innerText(),'7 of 8 remaining');
await swipe(-170);await swipe(170);assert.equal(await p.locator('.is-front.is-complete').count(),1);
await p.reload();await p.locator('.is-front').waitFor();assert.equal(await title(),'Bench Press');assert.equal(await p.locator('.is-front.is-complete').count(),1);
await p.getByRole('button',{name:'Undo completion',exact:true}).click();await p.waitForTimeout(100);assert.equal(await p.locator('#remaining-count').innerText(),'8 of 8 remaining');
for(let i=0;i<8;i++)await swipe(-170);assert.equal(await title(),'Bench Press');
for(let i=0;i<8;i++)await swipe(170);assert.equal(await title(),'Bench Press');
console.log('Infinite wraps include completed cards, saved completion and Undo');
await swipe(-150,'.is-front [data-action=plus]');assert.equal(await title(),'Incline Dumbbell Press');assert.equal(await p.locator('dialog[open]').count(),0);
await swipe(150,'.is-front input[type=range]');assert.equal(await title(),'Incline Dumbbell Press');
await p.emulateMedia({reducedMotion:'reduce'});await swipe(-170);assert.notEqual(await title(),'Incline Dumbbell Press');
console.log('Button-origin swipes, independent reps, reduced motion pass');
await p.emulateMedia({reducedMotion:'no-preference'});await p.screenshot({path:'test-artifacts/stack-rest.png'});
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
