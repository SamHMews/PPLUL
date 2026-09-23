const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:process.env.BROWSER_CHANNEL||undefined,headless:true});try{
const c=await b.newContext({viewport:{width:375,height:667},hasTouch:true,isMobile:true});const p=await c.newPage();await p.addInitScript(()=>{window.ticks=[];navigator.vibrate=n=>{window.ticks.push(n);return true;};});
await p.goto(process.env.APP_URL||'http://127.0.0.1:5173');await p.locator('[data-day=Legs]').click();await p.locator('.is-front').waitFor();
const d=await c.newCDPSession(p),input=p.locator('.is-front input[type=range]'),box=await input.boundingBox();
// Start well below the circle, inside the enlarged strip, then drag beyond it.
const y=box.y+box.height-3;
await d.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y}]});
await d.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width+8,y:y+16}]});
await d.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);
assert.equal(await input.inputValue(),'6');assert.equal(await p.locator('.is-front output').innerText(),'6');assert.equal(await p.locator('.is-front h2').innerText(),'Squats');assert.deepEqual(await p.evaluate(()=>window.ticks),[8,8]);
await input.focus();await p.keyboard.press('ArrowLeft');assert.equal(await input.inputValue(),'5');
await p.getByRole('button',{name:'Weight Set-up',exact:true}).click();const labels=await p.locator('#unit option').allTextContents();assert(labels.includes('Total Weight'));assert(labels.includes('Machine Weight'));assert.equal(await p.locator('#increment option[value=custom]').innerText(),'Other Increment');await p.locator('#increment').selectOption('custom');assert((await p.locator('#custom-label').innerText()).includes('Custom Increment'));await p.locator('#custom-increment').fill('5');await p.getByRole('button',{name:'Use Settings'}).click();
const before=await p.evaluate(()=>window.ticks.length);await p.getByRole('button',{name:'Increase working weight'}).click();await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>window.ticks.length),before+1);
await p.evaluate(()=>{navigator.vibrate=undefined;});await p.getByRole('button',{name:'Increase working weight'}).click();await p.waitForTimeout(100);assert.equal(await p.locator('.is-front .weight-value span').innerText(),'135');
await p.reload();await p.locator('.is-front').waitFor();assert.equal(await p.locator('.is-front output').innerText(),'5');assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight),667);
console.log('PASS: full-strip touch drag with capture, slider isolation, keyboard, haptic calls/fallback, capitalization, persistence and layout');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
