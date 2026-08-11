const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
  });
  page.on('pageerror', error => console.log('PAGE EXCEPTION:', error.message));
  
  try {
    console.log("Navigating to resume-builder...");
    await page.goto('http://localhost:3000/resume-builder', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Check if there is an error boundary element
    const errorText = await page.evaluate(() => document.body.innerText);
    if (errorText.includes("This page couldn't load")) {
      console.log("Found error boundary!");
    }
  } catch (err) {
    console.error("Script error:", err.message);
  }
  
  await browser.close();
})();
