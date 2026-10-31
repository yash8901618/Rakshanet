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
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Switch to Citizen
  console.log('Switching to Citizen role...');
  await page.evaluate(() => {
    // Select via role switcher or card
    const citizenCard = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Citizen'));
    if (citizenCard) {
      citizenCard.click();
    } else {
      window.__CRISIS_STORE__?.getState()?.setActiveRole('citizen');
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Verify store activeRole is citizen
  const activeRole = await page.evaluate(() => window.__CRISIS_STORE__?.getState()?.activeRole);
  console.log('Active role is:', activeRole);

  // 2. Press Broadcast Emergency SOS
  console.log('Pressing Broadcast Emergency SOS...');
  await page.evaluate(() => {
    const sosBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Transmits via BLE Mesh') || b.textContent.includes('BROADCAST EMERGENCY SOS')
    );
    if (sosBtn) {
      sosBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 1500));

  // 3. Take screenshot of result
  console.log('Capturing citizen_sos_result.png...');
  await page.screenshot({
    path: path.join(artifactDir, 'citizen_sos_result.png'),
    fullPage: false
  });

  // Also test in Authority/Responder mode to verify "ACKNOWLEDGE & TAKE COMMAND" is kept unchanged
  console.log('Dismissing citizen modal and testing Authority/Responder...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('I understand, moving to safety')
    );
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Switch to Authority
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    window.__CRISIS_STORE__?.getState()?.setActiveRole('authority');
    window.__CRISIS_STORE__?.getState()?.triggerCrisisEvent({
      incidentId: 'AUTH-TEST-2',
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
  await new Promise(r => setTimeout(r, 1200));

  console.log('Capturing authority_sos_result.png...');
  await page.screenshot({
    path: path.join(artifactDir, 'authority_sos_result.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Captured citizen and authority screenshots successfully!');
}

run().catch(console.error);
