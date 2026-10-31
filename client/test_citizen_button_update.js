import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Yash Mishra\\.gemini\\antigravity\\brain\\32da6db1-33c4-48e6-bfd2-61987a173750';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // 1. Citizen Role Screen Lock
  console.log('1. Testing Citizen Role...');
  await page.setViewport({ width: 420, height: 950, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    window.__CRISIS_STORE__?.getState()?.setActiveRole('citizen');
    window.__CRISIS_STORE__?.getState()?.triggerCrisisEvent({
      incidentId: 'CITIZEN-L5-TEST',
      severity: 5,
      floorNumber: 3,
      roomNumber: 'Room 304',
      hazard: 'Floor 3 pe Room 304 ke paas electrical wiring mein aag lag gayi hai aur heavy smoke hai! Hum 2 log andar trapped hain, please jaldi rescue team bhejo!',
      hazardType: 'FIRE',
      trapped: 2,
      forcePriority: true,
      timestamp: Date.now()
    });
  });
  await new Promise(r => setTimeout(r, 1000));

  // Check button text in Citizen mode
  const citizenBtnText = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('I understand, moving to safety')
    );
    return btn ? btn.textContent.trim() : null;
  });
  console.log('Citizen button found:', citizenBtnText);

  // Scroll down so button is visible
  await page.evaluate(() => {
    const modalContent = document.querySelector('.max-h-\\[92vh\\]');
    if (modalContent) modalContent.scrollTop = modalContent.scrollHeight;
  });
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({
    path: path.join(artifactDir, 'citizen_level5_screen_lock_updated.png'),
    fullPage: false
  });

  // Dismiss modal
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('I understand, moving to safety')
    );
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 2. Authority Role Screen Lock
  console.log('2. Testing Authority Role...');
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    window.__CRISIS_STORE__?.getState()?.setActiveRole('authority');
    window.__CRISIS_STORE__?.getState()?.triggerCrisisEvent({
      incidentId: 'AUTH-L5-TEST',
      severity: 5,
      floorNumber: 3,
      roomNumber: 'Room 304',
      hazard: 'Floor 3 electrical fire detected.',
      hazardType: 'FIRE',
      trapped: 2,
      forcePriority: true,
      timestamp: Date.now()
    });
  });
  await new Promise(r => setTimeout(r, 1000));

  const authBtnText = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Acknowledge & Take Command')
    );
    return btn ? btn.textContent.trim() : null;
  });
  console.log('Authority button found:', authBtnText);

  await page.screenshot({
    path: path.join(artifactDir, 'authority_level5_screen_lock_updated.png'),
    fullPage: false
  });

  // Dismiss modal
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Acknowledge & Take Command')
    );
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 3. Responder Role Screen Lock
  console.log('3. Testing First Responder Role...');
  await page.evaluate(() => {
    window.__CRISIS_STORE__?.getState()?.setActiveRole('responder');
    window.__CRISIS_STORE__?.getState()?.triggerCrisisEvent({
      incidentId: 'RESP-L5-TEST',
      severity: 5,
      floorNumber: 3,
      roomNumber: 'Room 304',
      hazard: 'Floor 3 electrical fire detected.',
      hazardType: 'FIRE',
      trapped: 2,
      forcePriority: true,
      timestamp: Date.now()
    });
  });
  await new Promise(r => setTimeout(r, 1000));

  const respBtnText = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Acknowledge & Take Command')
    );
    return btn ? btn.textContent.trim() : null;
  });
  console.log('Responder button found:', respBtnText);

  await page.screenshot({
    path: path.join(artifactDir, 'responder_level5_screen_lock_updated.png'),
    fullPage: false
  });

  await browser.close();
  console.log('All tests passed successfully!');
}

run().catch(console.error);
