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
  await page.setViewport({ width: 420, height: 950, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Citizen Role & Modal with Button and Exit Guidance
  console.log('Triggering Level 5 modal for Citizen...');
  await page.evaluate(() => {
    window.__CRISIS_STORE__?.getState()?.setActiveRole('citizen');
    window.__CRISIS_STORE__?.getState()?.triggerCrisisEvent({
      incidentId: 'CITIZEN-TEST-1',
      severity: 5,
      floorNumber: 3,
      roomNumber: 'Room 304',
      hazard: 'Floor 3 pe Room 304 ke paas electrical wiring mein aag lag gayi hai aur heavy smoke hai! Hum 1 log andar trapped hain, please jaldi rescue team bhejo!',
      hazardType: 'FIRE',
      trapped: 1, // singular
      forcePriority: true,
      timestamp: Date.now()
    });
  });
  await new Promise(r => setTimeout(r, 1000));

  // Scroll to bottom of modal
  await page.evaluate(() => {
    const modalContent = document.querySelector('.max-h-\\[92vh\\]');
    if (modalContent) {
      modalContent.scrollTop = modalContent.scrollHeight;
    }
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Capturing citizen_level5_screen_lock_bottom.png...');
  await page.screenshot({
    path: path.join(artifactDir, 'citizen_level5_screen_lock_bottom.png'),
    fullPage: false
  });

  // 2. Click the citizen button to dismiss: "I understand / मैं सुरक्षित स्थान पर जा रहा हूँ"
  console.log('Clicking "I understand / मैं सुरक्षित स्थान पर जा रहा हूँ"...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('सुरक्षित स्थान')
    );
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 3. Now click the main SOS button in Citizen View
  console.log('Clicking main Citizen SOS button...');
  await page.evaluate(() => {
    const sosBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Transmits via BLE Mesh')
    );
    if (sosBtn) sosBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // If SOS opens the Level 5 modal again, dismiss it so the inline Citizen view is visible
  console.log('Dismissing modal to show inline citizen view...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('सुरक्षित स्थान')
    );
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // 4. Capture Citizen View with Hinglish transcript, AI chips, and inline MeshVisualizer
  console.log('Capturing mobile_citizen_after_sos.png...');
  await page.screenshot({
    path: path.join(artifactDir, 'mobile_citizen_after_sos.png'),
    fullPage: true
  });

  await browser.close();
  console.log('Done capturing citizen details!');
}

run().catch(console.error);
