const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:process.env.BROWSER_CHANNEL||undefined,headless:true});try{
const p=await b.newPage({viewport:{width:390,height:664},isMobile:true,hasTouch:true});await p.goto(process.env.APP_URL||'http://127.0.0.1:5173');await p.locator('[data-day=Push]').click();
assert.equal(await p.locator('.is-front .unit').innerText(),'Total weight');
await p.getByRole('button',{name:'Could do more',exact:true}).click();await p.getByRole('button',{name:'Done',exact:true}).click();await p.locator('.is-front.is-complete').waitFor();
assert.equal(await p.locator('.is-front input.range').evaluate(e=>getComputedStyle(e).opacity),'0');
assert.equal(await p.locator('.is-front .rep-thumb').evaluate(e=>getComputedStyle(e,'::before').opacity),'1');
const colors=await p.locator('.is-front').evaluate(card=>{
const color=(selector,property='backgroundColor',pseudo=null)=>getComputedStyle(card.querySelector(selector),pseudo)[property];
return {step:color('.step'),effort:color('.effort button[aria-pressed=true]'),rail:color('.rep-rail'),fill:color('.rep-fill'),thumb:color('.rep-thumb','backgroundColor','::before'),thumbBorder:color('.rep-thumb','borderTopColor','::before'),unit:color('.unit','color')};});
for(const [part,rgb] of Object.entries(colors)){const [r,g,bl]=rgb.match(/\d+/g).map(Number);assert(g>r&&g>bl,part+' must be green, got '+rgb);}
await p.getByRole('button',{name:'Undo completion',exact:true}).click();await p.waitForTimeout(200);assert.equal(await p.locator('.is-front .step').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(57, 42, 73)');
console.log('PASS: complete card controls, selected effort, slider and thumb are green; Undo restores purple; visible weight type is capitalized');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
