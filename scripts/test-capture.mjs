import { chromium } from 'playwright';

async function check() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3005/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'bct123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');
  await page.waitForTimeout(1000);

  // Attach a capture scroll listener and test
  const testListener = await page.evaluate(() => {
    let capturedTops = [];
    document.addEventListener('scroll', (e) => {
      const top = (e.target && e.target.scrollTop) || window.scrollY || 0;
      capturedTops.push(top);
    }, { capture: true });
    
    // Now trigger wheel
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(capturedTops);
      }, 500);
    });
  });

  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(600);

  const captured = await page.evaluate(() => {
    return window.__testScrolls || 'none';
  });

  console.log('Done testing listener');
  await browser.close();
}

check().catch(console.error);
