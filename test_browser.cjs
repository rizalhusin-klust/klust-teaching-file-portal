const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto('http://localhost:5173');
  
  // Try to set fake token and reload
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token');
  });

  console.log("Reloading with fake token...");
  await page.reload();

  // Wait 3 seconds to see if error occurs
  await page.waitForTimeout(3000);
  await browser.close();
})();
