import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Yash Mishra\\.gemini\antigravity\\brain\\32da6db1-33c4-48e6-bfd2-61987a173750';

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('Launching browser via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // 1. Desktop 1440px Landing Screen (Overview)
  console.log('1. Capturing Desktop 1440px Overview...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(artifactDir, 'desktop_1440px_overview.png'),
    fullPage: false
  });

  // 2. Mobile 360px Citizen Emergency SOS View
  console.log('2. Capturing Mobile 360px Citizen Emergency SOS View...');
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  // Click Citizen role card
  await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Citizen (360px Mobile SOS)'));
    if (card) {
      card.click();
    } else {
      // Find role switcher
      const btns = Array.from(document.querySelectorAll('button'));
      const citizenBtn = btns.find(b => b.textContent.includes('Citizen'));
      if (citizenBtn) citizenBtn.click();
    }
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(artifactDir, 'mobile_360px_citizen.png'),
    fullPage: false
  });

  // 3. Desktop 1440px Authority Command Center
  console.log('3. Capturing Desktop 1440px Authority Command Center...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    // Open role switcher or set authority
    const roleBtn = document.querySelector('button[aria-haspopup="listbox"]');
    if (roleBtn) roleBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const authOpt = Array.from(document.querySelectorAll('[role="option"]')).find(o => o.textContent.includes('Authority') || o.textContent.includes('प्राधिकरण'));
    if (authOpt) authOpt.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(artifactDir, 'desktop_1440px_authority.png'),
    fullPage: false
  });

  // 4. Desktop 1440px Responder 3D Twin & Tactical Floor Matrix
  console.log('4. Capturing Desktop 1440px Responder View...');
  await page.evaluate(() => {
    const roleBtn = document.querySelector('button[aria-haspopup="listbox"]');
    if (roleBtn) roleBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const respOpt = Array.from(document.querySelectorAll('[role="option"]')).find(o => o.textContent.includes('Responder') || o.textContent.includes('प्रतिक्रिया'));
    if (respOpt) respOpt.click();
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(artifactDir, 'desktop_1440px_responder.png'),
    fullPage: false
  });

  // 5. Desktop 1440px Hospital ER/ICU Telemetry
  console.log('5. Capturing Desktop 1440px Hospital Telemetry...');
  await page.evaluate(() => {
    const roleBtn = document.querySelector('button[aria-haspopup="listbox"]');
    if (roleBtn) roleBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const hospOpt = Array.from(document.querySelectorAll('[role="option"]')).find(o => o.textContent.includes('Hospital') || o.textContent.includes('अस्पताल'));
    if (hospOpt) hospOpt.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(artifactDir, 'desktop_1440px_hospital.png'),
    fullPage: false
  });

  // 6. Desktop 1440px Light Theme Toggle
  console.log('6. Capturing Light Theme...');
  await page.evaluate(() => {
    const themeBtn = document.querySelector('button[title*="Theme"], button[title*="Light"]');
    if (themeBtn) themeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(artifactDir, 'desktop_1440px_light_theme.png'),
    fullPage: false
  });

  // Toggle back to Dark
  await page.evaluate(() => {
    const themeBtn = document.querySelector('button[title*="Theme"], button[title*="Command"]');
    if (themeBtn) themeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 7. Desktop 1440px Hindi Mode
  console.log('7. Capturing Hindi Localization...');
  await page.evaluate(() => {
    const langBtn = document.querySelector('button[title*="Language"]');
    if (langBtn) langBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(artifactDir, 'desktop_1440px_hindi.png'),
    fullPage: false
  });

  // Toggle back to English
  await page.evaluate(() => {
    const langBtn = document.querySelector('button[title*="Language"]');
    if (langBtn) langBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 8. Run Live Demo Scenario
  console.log('8. Capturing Run Live Demo Scenario...');
  await page.evaluate(() => {
    const demoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Run Live Demo') || b.textContent.includes('लाइव डेमो'));
    if (demoBtn) demoBtn.click();
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(artifactDir, 'desktop_1440px_live_demo.png'),
    fullPage: false
  });

  await browser.close();
  console.log('All 8 screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Screenshot execution error:', err);
  process.exit(1);
});
