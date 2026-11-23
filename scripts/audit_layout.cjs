const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/home/gs/.gemini/antigravity/brain/3b6012b3-27cd-4fe7-9b38-3874942adaf6/screenshots';
const VIEWPORTS = [
  { name: 'mobile-small', width: 320, height: 600 },
  { name: 'mobile-standard', width: 375, height: 667 },
  { name: 'mobile-large', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop-small', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktop-large', width: 1920, height: 1080 }
];

async function runAudit() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const BASE_URL = 'http://127.0.0.1:5174';
  const findings = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();

    console.log(`\n🔍 Auditing Viewport: ${vp.name} (${vp.width}x${vp.height})...`);

    // 1. Landing Page
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const landingOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientW = doc.clientWidth;
      return {
        hasOverflow: scrollW > clientW + 1,
        scrollWidth: scrollW,
        clientWidth: clientW,
        diff: scrollW - clientW
      };
    });

    if (landingOverflow.hasOverflow) {
      findings.push({
        page: 'Landing Page',
        viewport: vp.name,
        width: vp.width,
        issue: `Horizontal overflow detected: scrollWidth (${landingOverflow.scrollWidth}px) > clientWidth (${landingOverflow.clientWidth}px) by ${landingOverflow.diff}px`
      });
      console.log(`  ❌ Landing Page overflow at ${vp.width}px: +${landingOverflow.diff}px`);
    } else {
      console.log(`  ✅ Landing Page no overflow (${vp.width}px)`);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `landing_${vp.name}.png`),
      fullPage: false
    });

    // 2. Login Page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const loginOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 1;
    });
    if (loginOverflow) {
      findings.push({ page: 'Login Page', viewport: vp.name, width: vp.width, issue: 'Horizontal overflow' });
    }

    // 3. Login as Resident to check In-App views
    await page.fill('input[type="email"]', 'resident@example.com');
    await page.fill('input[type="password"]', 'Demo12345!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard', { timeout: 8000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Check App Dashboard
    const dashboardOverlap = await page.evaluate(() => {
      const header = document.querySelector('header');
      const subnav = document.querySelector('nav[aria-label*="Navigation"]')?.closest('.sticky');
      const headerRect = header ? header.getBoundingClientRect() : null;
      const subnavRect = subnav ? subnav.getBoundingClientRect() : null;

      // Scroll down
      window.scrollBy(0, 200);

      const headerAfter = header ? header.getBoundingClientRect() : null;
      const subnavAfter = subnav ? subnav.getBoundingClientRect() : null;

      const overlapOnScroll =
        headerAfter && subnavAfter ? headerAfter.bottom - subnavAfter.top : 0;

      return {
        headerHeight: headerRect ? headerRect.height : 0,
        subnavHeight: subnavRect ? subnavRect.height : 0,
        subnavStyleTop: subnav ? window.getComputedStyle(subnav).top : null,
        overlapOnScroll
      };
    });

    console.log(`  📊 App Header: ${Math.round(dashboardOverlap.headerHeight)}px, Subnav style top: ${dashboardOverlap.subnavStyleTop}, Overlap on scroll: ${Math.round(dashboardOverlap.overlapOnScroll)}px`);

    if (dashboardOverlap.overlapOnScroll > 2) {
      findings.push({
        page: 'Dashboard Layout',
        viewport: vp.name,
        width: vp.width,
        issue: `Sticky Subnav overlaps with Header on scroll by ${Math.round(dashboardOverlap.overlapOnScroll)}px (Header: ${Math.round(dashboardOverlap.headerHeight)}px vs Subnav top: ${dashboardOverlap.subnavStyleTop})`
      });
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `dashboard_${vp.name}.png`),
      fullPage: false
    });

    // Check Resident Services
    await page.goto(`${BASE_URL}/app/services`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // Check Discover / Cooks Directory
    await page.goto(`${BASE_URL}/app/discover`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // Check Subscriptions / Billing
    await page.goto(`${BASE_URL}/app/subscriptions`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // Check Tower Groups / Community
    await page.goto(`${BASE_URL}/app/community`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    await context.close();
  }

  await browser.close();

  console.log('\n========================================');
  console.log(`Audit Complete. Found ${findings.length} issue(s):`);
  findings.forEach((f, i) => {
    console.log(`  [${i + 1}] [${f.viewport} - ${f.width}px] ${f.page}: ${f.issue}`);
  });
  console.log('========================================\n');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

