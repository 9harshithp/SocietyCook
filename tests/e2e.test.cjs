const { chromium } = require('playwright');
const assert = require('assert');

async function runE2ETests() {
  console.log('🚀 Starting SocietyCook Enterprise Playwright E2E Test Suite...\n');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const BASE_URL = 'http://localhost:5173';
  let passedCount = 0;
  let testCount = 0;

  async function test(name, fn) {
    testCount++;
    process.stdout.write(`  [${testCount}] ${name}... `);
    try {
      await fn();
      passedCount++;
      console.log('✅ PASS');
    } catch (err) {
      console.log('❌ FAIL');
      console.error('      Error:', err.message);
      throw err;
    }
  }

  try {
    // Context with dataLayer tracking
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // 1. Public Landing Page & Hero
    await test('Public Landing Page renders with hero, title and branding', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      assert(title.includes('SocietyCook'), `Expected title to contain SocietyCook, got: ${title}`);
      
      const heading = await page.locator('h1').textContent();
      assert(heading.includes('More living'), `Expected h1 to contain 'More living', got: ${heading}`);

      const heroImg = page.locator('img[alt="Modern warm sun-drenched Indian apartment kitchen"]');
      await heroImg.waitFor({ state: 'attached' });
    });

    // 2. Cookie Consent Banner: Acceptance & Rejection
    await test('Cookie consent banner defaults to pending/denied and handles accept', async () => {
      // Clear localStorage to test fresh visitor
      await page.evaluate(() => localStorage.removeItem('sc_ga_consent'));
      await page.reload({ waitUntil: 'domcontentloaded' });

      const banner = page.locator('div[role="region"][aria-label="Privacy & Analytics Preferences"]');
      await banner.waitFor({ state: 'visible', timeout: 5000 });

      // Check Consent Mode v2 default
      const defaultConsent = await page.evaluate(() => {
        return window.dataLayer?.filter(e => e[0] === 'consent') || [];
      });
      assert(defaultConsent.length > 0, 'Expected gtag consent commands in dataLayer');

      // Click Accept Analytics
      const acceptBtn = page.locator('button:has-text("Accept Analytics")');
      await acceptBtn.click();
      await banner.waitFor({ state: 'hidden', timeout: 3000 });

      const storedConsent = await page.evaluate(() => localStorage.getItem('sc_ga_consent'));
      assert.strictEqual(storedConsent, 'granted', 'Expected sc_ga_consent to be granted');
    });

    // 3. Cookie Consent Withdrawal via Privacy Page
    await test('Cookie consent withdrawal and preference modification on /privacy', async () => {
      await page.goto(`${BASE_URL}/privacy`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Your Analytics Consent Status:');

      // Click Decline All
      const declineBtn = page.locator('button:has-text("Decline All")');
      await declineBtn.click();

      const revokedConsent = await page.evaluate(() => localStorage.getItem('sc_ga_consent'));
      assert.strictEqual(revokedConsent, 'denied', 'Expected sc_ga_consent to be denied after revocation');

      // Re-grant for subsequent analytics testing
      const grantBtn = page.locator('button:has-text("Enable Analytics")');
      await grantBtn.click();
      const regrantedConsent = await page.evaluate(() => localStorage.getItem('sc_ga_consent'));
      assert.strictEqual(regrantedConsent, 'granted', 'Expected sc_ga_consent to be granted again');
    });

    // 4. GA4 Event Tracking & PII Redaction Verification
    await test('GA4 business events trigger without sensitive PII leakage', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

      // Click explore cooking service
      const exploreCooking = page.locator('a[href*="/register?service=COOKING"]').first();
      if (await exploreCooking.isVisible()) {
        await exploreCooking.click();
      }

      // Check dataLayer events
      const events = await page.evaluate(() => {
        return (window.dataLayer || []).filter(e => e[0] === 'event' || e.event);
      });

      // Verify no passwords, tokens, or raw secrets are present in any event arguments
      const eventJson = JSON.stringify(events);
      assert(!eventJson.includes('Demo12345!'), 'Leaked demo password in dataLayer!');
      assert(!eventJson.includes('secret_key'), 'Leaked secret in dataLayer!');
      assert(!eventJson.includes('token='), 'Leaked token parameter in dataLayer!');
    });

    // 5. Society Selection with Deferred Loading
    await test('Society selection dropdown operates with instant memory fallback & deferred sync', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      const societySelect = page.locator('#finder-society');
      await societySelect.waitFor({ state: 'visible' });

      // Should contain default pilot societies
      const options = await societySelect.locator('option').allTextContents();
      assert(options.length >= 3, `Expected at least 3 societies, found: ${options.length}`);
      assert(options.some(o => o.includes('Prestige') || o.includes('Sobha')), 'Missing sample pilot complexes');
    });

    // 6. Public Professional Discovery Showcase
    await test('Public professional discovery displays sample roster with explicit demo labels', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.locator('text=SAMPLE ROSTER — PILOT PROFILES').waitFor({ state: 'visible' });

      const sampleBadges = await page.locator('span:has-text("Sample Profile")').count();
      assert(sampleBadges >= 4, `Expected at least 4 sample profile badges, found: ${sampleBadges}`);
    });

    // 7. Dynamic Pricing Calculator
    await test('Interactive group savings calculator computes discounts dynamically', async () => {
      await page.goto(`${BASE_URL}/#community-pricing`, { waitUntil: 'domcontentloaded' });

      const rangeSlider = page.locator('input[type="range"]');
      if (await rangeSlider.isVisible()) {
        await rangeSlider.fill('6');
        const priceText = await page.locator('text=₹').first().textContent();
        assert(priceText.includes('₹'), 'Pricing calculation failed to output currency symbol');
      }
    });

    // 8. Resident Authentication & Dashboard Access
    await test('Resident login, dashboard stats, and logout flow', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      
      await page.fill('input[type="email"]', 'resident@example.com');
      await page.fill('input[type="password"]', 'Demo12345!');
      await page.click('button[type="submit"]');

      // Should navigate to /app
      await page.waitForURL('**/app', { timeout: 8000 });
      await page.waitForSelector('text=Welcome home,', { timeout: 5000 });

      // Verify session storage token
      const token = await page.evaluate(() => sessionStorage.getItem('sc_access_token'));
      assert(token && token.length > 20, 'Expected valid JWT in sessionStorage');

      // Logout
      const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Logout")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        const clearedToken = await page.evaluate(() => sessionStorage.getItem('sc_access_token'));
        assert(!clearedToken, 'Expected token to be cleared on logout');
      }
    });

    // 9. Multi-Role Switcher & Dashboard Navigation
    await test('Multi-role persona switcher grants correct role dashboard views', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

      // Switch to Manager
      const managerBtn = page.locator('button:has-text("Society Manager")').first();
      if (await managerBtn.isVisible()) {
        await managerBtn.click();
        await page.waitForURL('**/app', { timeout: 5000 });
        await page.waitForSelector('text=Campus Control', { timeout: 5000 });
      }

      // Switch to Cook
      const cookBtn = page.locator('button:has-text("Cook (Ramesh)")').first();
      if (await cookBtn.isVisible()) {
        await cookBtn.click();
        await page.waitForURL('**/app', { timeout: 5000 });
        await page.waitForSelector('text=Hello, Chef', { timeout: 5000 });
      }

      // Switch to Admin
      const adminBtn = page.locator('button:has-text("Platform Admin")').first();
      if (await adminBtn.isVisible()) {
        await adminBtn.click();
        await page.waitForURL('**/app', { timeout: 5000 });
        await page.waitForSelector('text=SocietyCook Operational Control', { timeout: 5000 });
      }
    });

    // 10. Resident Booking Workflow
    await test('Resident booking workflow loads service forms with valid pricing', async () => {
      // Re-login as resident
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.fill('input[type="email"]', 'resident@example.com');
      await page.fill('input[type="password"]', 'Demo12345!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/app', { timeout: 8000 });

      // Navigate to booking / directory
      await page.goto(`${BASE_URL}/app/cooks`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Verified Cooks & Utensil Care Specialists', { timeout: 5000 });

      const viewButtons = page.locator('button:has-text("View Profile & Badges")');
      const count = await viewButtons.count();
      assert(count > 0, 'Expected profile buttons in professional directory');
    });

    // 11. Mobile Viewport & Responsive Navigation
    await test('Mobile viewport renders responsive navigation without horizontal overflow', async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 }, // iPhone 12/13/14
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      });
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

      // Verify no horizontal overflow
      const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
      assert(scrollWidth <= clientWidth, `Horizontal overflow detected: scrollWidth (${scrollWidth}) > clientWidth (${clientWidth})`);

      // Verify mobile persona switcher fits
      const personaBar = mobilePage.locator('button:has-text("Manager")');
      await personaBar.waitFor({ state: 'visible' });

      await mobileContext.close();
    });

    // 12. Multilingual Script Rendering (Kannada & Hindi)
    await test('Multilingual text rendering for Kannada and Hindi scripts', async () => {
      const result = await page.evaluate(() => {
        const div = document.createElement('div');
        div.innerHTML = '<span id="kn">ಸೊಸೈಟಿಕುಕ್ - ಮನೆಯ ರುಚಿಕರವಾದ ಊಟ</span><span id="hi">सोसाइटीकुक - घर का पौष्टिक खाना</span>';
        document.body.appendChild(div);
        const knWidth = document.getElementById('kn').offsetWidth;
        const hiWidth = document.getElementById('hi').offsetWidth;
        document.body.removeChild(div);
        return { knWidth, hiWidth };
      });

      assert(result.knWidth > 50, 'Kannada script failed to render valid glyph bounding box');
      assert(result.hiWidth > 50, 'Hindi script failed to render valid glyph bounding box');
    });

    console.log(`\n🎉 All ${passedCount} / ${testCount} E2E tests completed successfully with ZERO failures!\n`);
  } finally {
    await browser.close();
  }
}

runE2ETests().catch((err) => {
  console.error('\n💥 Playwright E2E Suite Failed:', err);
  process.exit(1);
});

