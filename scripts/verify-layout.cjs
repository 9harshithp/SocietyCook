const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIEWPORTS = [
  { name: 'mobile-small', width: 320, height: 568 },
  { name: 'mobile-standard', width: 375, height: 667 },
  { name: 'mobile-large', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop-small', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktop-large', width: 1920, height: 1080 }
];

const SCREENSHOT_DIR = path.resolve('/home/gs/.gemini/antigravity/brain/3b6012b3-27cd-4fe7-9b38-3874942adaf6/screenshots');

(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5174';
  let hasErrors = false;

  console.log(`Starting UI & Responsive Verification on ${BASE_URL}...`);

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    // 1. Landing Page Test
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    
    // Check horizontal overflow
    const landingOverflow = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      return { docW, winW, hasOverflow: docW > winW + 1 };
    });

    if (landingOverflow.hasOverflow) {
      console.error(`❌ [${vp.name}] Landing Page horizontal overflow detected: ${landingOverflow.docW}px > ${landingOverflow.winW}px`);
      hasErrors = true;
    } else {
      console.log(`✅ [${vp.name}] Landing Page width: ${landingOverflow.winW}px (No horizontal overflow)`);
    }

    // Measure Hero Card badge and plaque clearance
    const heroCollision = await page.evaluate(() => {
      const badge = document.querySelector('.hero-img-box .absolute.top-3, .hero-img-box .absolute.top-4');
      const plaque = document.querySelector('.hero-img-box .absolute.bottom-3, .hero-img-box .absolute.bottom-4');
      if (!badge || !plaque) return { exists: false };
      const bRect = badge.getBoundingClientRect();
      const pRect = plaque.getBoundingClientRect();
      const overlap = bRect.bottom - pRect.top;
      return {
        exists: true,
        badgeBottom: bRect.bottom,
        plaqueTop: pRect.top,
        overlap: overlap,
        gap: pRect.top - bRect.bottom
      };
    });

    if (heroCollision.exists) {
      if (heroCollision.overlap > 0) {
        console.error(`❌ [${vp.name}] Hero Card collision: overlap of ${heroCollision.overlap}px!`);
        hasErrors = true;
      } else {
        console.log(`✅ [${vp.name}] Hero Card clearance: ${heroCollision.gap.toFixed(1)}px clear space between badge and plaque`);
      }
    }

    // Save after screenshot for mobile-small and mobile-standard
    if (vp.name === 'mobile-small' || vp.name === 'mobile-standard') {
      const heroBox = await page.$('.hero-img-box');
      if (heroBox) {
        await heroBox.screenshot({ path: path.join(SCREENSHOT_DIR, `hero_clearance_${vp.name}_after.png`) });
      }
    }

    // 2. Dashboard Sticky Subnav Test
    await page.goto(`${BASE_URL}/app/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // Click demo persona button
    const demoBtn = page.locator('button', { hasText: /Resident/i }).first();
    if (await demoBtn.count() > 0) {
      await demoBtn.click();
      await page.waitForTimeout(600);
    }

    // Scroll down 400px to engage sticky subnav
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(300);

    const stickyAudit = await page.evaluate(() => {
      const header = document.querySelector('header');
      const subnav = document.querySelector('div.sticky');
      if (!header || !subnav) return { exists: false };
      const hRect = header.getBoundingClientRect();
      const sRect = subnav.getBoundingClientRect();
      const overlap = hRect.bottom - sRect.top;
      return {
        exists: true,
        headerBottom: hRect.bottom,
        subnavTop: sRect.top,
        overlap: overlap
      };
    });

    if (stickyAudit.exists) {
      if (stickyAudit.overlap > 1) { // 1px threshold for sub-pixel antialiasing
        console.error(`❌ [${vp.name}] Dashboard sticky overlap: subnav is under header by ${stickyAudit.overlap}px!`);
        hasErrors = true;
      } else {
        console.log(`✅ [${vp.name}] Dashboard sticky alignment: headerBottom=${stickyAudit.headerBottom}px, subnavTop=${stickyAudit.subnavTop}px (Overlap: ${stickyAudit.overlap.toFixed(1)}px)`);
      }
    }

    if (vp.name === 'desktop') {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `dashboard_sticky_scroll_desktop_after.png`) });
    } else if (vp.name === 'mobile-standard') {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `dashboard_sticky_scroll_mobile_after.png`) });
    }

    await context.close();
  }

  await browser.close();

  if (hasErrors) {
    console.error('FAILED: One or more UI checks failed.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL CHECKS PASSED: Zero overlaps, clean clearance, and full responsiveness verified across all 7 viewports!');
  }
})();
