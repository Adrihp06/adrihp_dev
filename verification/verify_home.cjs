const { chromium } = require('@playwright/test');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:4321');
    await page.screenshot({ path: 'verification/home.png', fullPage: true });
    await browser.close();
    console.log('Screenshot saved to verification/home.png');
  } catch (error) {
    console.error('Error taking screenshot:', error);
    process.exit(1);
  }
})();
