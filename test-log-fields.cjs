// Use the public logging controls so completion fixtures satisfy the same requirements as a workout.
exports.logRequiredFields=async page=>{
 await page.locator('.is-front [data-action=minus]').click();
 if(await page.locator('dialog[open]').count()){
  if(await page.locator('#unit').inputValue()==='')await page.locator('#unit').selectOption('total weight');
  await page.locator('#increment').selectOption('5');await page.locator('#save-equipment').click();await page.locator('dialog').waitFor({state:'hidden'});
 }
 await page.waitForFunction(()=>document.querySelector('.is-front .weight-value span')?.textContent.trim()!=='—');
 const range=page.locator('.is-front input[type=range]');await range.focus();await page.keyboard.press('Home');
 await page.locator('.is-front [data-action=effort][data-effort=right]').click();
};
