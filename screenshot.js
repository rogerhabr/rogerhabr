const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/shot-overview.png' });
  console.log('Overview captured');

  await page.click('text=Hardware Installed Base');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/shot-hardware.png' });
  console.log('Hardware captured');

  await page.click('text=ROIC Calculator');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/shot-roic.png' });
  console.log('ROIC captured');

  await page.click('text=Token Pricing Trends');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/shot-pricing.png' });
  console.log('Pricing captured');

  await page.click('text=Lab Financials');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/shot-labs.png' });
  console.log('Labs captured');

  await browser.close();
  console.log('All done');
})();
