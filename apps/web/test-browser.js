const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3000/resume-builder', { waitUntil: 'networkidle0' });
  
  // Wait a bit to see if React catches an error and prints it
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
