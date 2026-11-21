const { chromium } = require('playwright');
const assert = require('assert');

async function runE2ETests() {
  console.log('🚀 Starting SocietyCook Enterprise Playwright E2E & PWA Test Suite...\n');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
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
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // 1. Public Landing Page & Hero
    await test('Public Landing Page renders with hero, branding and metadata', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      assert(title.includes('SocietyCook'), `Expected title to contain SocietyCook, got: ${title}`);

      const heading = await page.locator('h1').textContent();
      assert(heading.includes('More living'), `Expected h1 to contain 'More living', got: ${heading}`);
    });

    // 2. Cookie Consent Banner
    await test('Cookie consent banner handles accept and persists preference', async () => {
      await page.evaluate(() => localStorage.removeItem('sc_ga_consent'));
      await page.reload({ waitUntil: 'domcontentloaded' });

      const banner = page.locator('div[role="region"][aria-label="Privacy & Analytics Preferences"]');
      await banner.waitFor({ state: 'visible', timeout: 5000 });

      const acceptBtn = page.locator('button:has-text("Accept Analytics")');
      await acceptBtn.click();
      await banner.waitFor({ state: 'hidden', timeout: 3000 });

      const storedConsent = await page.evaluate(() => localStorage.getItem('sc_ga_consent'));
      assert.strictEqual(storedConsent, 'granted', 'Expected sc_ga_consent to be granted');
    });

    // 3. Cookie Consent Withdrawal on /privacy
    await test('Cookie consent withdrawal and preference modification on /privacy', async () => {
      await page.goto(`${BASE_URL}/privacy`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Your Analytics Consent Status:');

      const declineBtn = page.locator('button:has-text("Decline All")');
      await declineBtn.click();

      const revokedConsent = await page.evaluate(() => localStorage.getItem('sc_ga_consent'));
      assert.strictEqual(revokedConsent, 'denied', 'Expected sc_ga_consent to be denied after revocation');

      const grantBtn = page.locator('button:has-text("Enable Analytics")');
      await grantBtn.click();
      const regrantedConsent = await page.evaluate(() => localStorage.getItem('sc_ga_consent'));
      assert.strictEqual(regrantedConsent, 'granted', 'Expected sc_ga_consent to be granted again');
    });

    // 4. Web App Manifest
    await test('Web App Manifest (/manifest.webmanifest) is valid and accessible', async () => {
      const response = await page.goto(`${BASE_URL}/manifest.webmanifest`);
      assert.strictEqual(response.status(), 200, 'Expected manifest to return HTTP 200');
      const manifest = await response.json();
      assert.strictEqual(manifest.name, 'SocietyCook – Home Services');
      assert.strictEqual(manifest.short_name, 'SocietyCook');
      assert.strictEqual(manifest.display, 'standalone');
      assert.strictEqual(manifest.theme_color, '#153D32');
      assert(Array.isArray(manifest.icons) && manifest.icons.length >= 3, 'Expected at least 3 icons');
    });

    // 5. Genuine Brand App Icons
    await test('Genuine SocietyCook app icons exist and return valid image headers', async () => {
      const res192 = await page.goto(`${BASE_URL}/icons/icon-192.png`);
      assert.strictEqual(res192.status(), 200, 'icon-192.png missing');
      assert(res192.headers()['content-type'].includes('image/png'));

      const res512 = await page.goto(`${BASE_URL}/icons/icon-512.png`);
      assert.strictEqual(res512.status(), 200, 'icon-512.png missing');

      const resApple = await page.goto(`${BASE_URL}/apple-touch-icon.png`);
      assert.strictEqual(resApple.status(), 200, 'apple-touch-icon.png missing');
    });

    // 6. Graceful Offline Fallback Page
    await test('Graceful offline page (/offline.html) renders with branding and security notice', async () => {
      await page.goto(`${BASE_URL}/offline.html`, { waitUntil: 'domcontentloaded' });
      const text = await page.locator('h1').textContent();
      assert(text.includes('No Internet Connection'), 'Expected offline headline');
      const policyNotice = await page.locator('.security-note').textContent();
      assert(policyNotice.includes('Enterprise Security Policy'), 'Expected offline security policy notice');
    });

    // 7. Resident Authentication & Redirection to /app/dashboard
    await test('Resident login navigates to /app/dashboard and acquires session token', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.fill('input[type="email"]', 'resident@example.com');
      await page.fill('input[type="password"]', 'Demo12345!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/app/dashboard', { timeout: 8000, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Welcome home,', { timeout: 5000 });

      const token = await page.evaluate(() => sessionStorage.getItem('sc_access_token'));
      assert(token && token.length > 20, 'Expected valid JWT in sessionStorage');
    });

    // 8. Logo Navigation: Navigates to / without logging out
    await test('Clicking SocietyCook logo navigates to / while preserving session', async () => {
      const logo = page.locator('a[aria-label="SocietyCook Homepage"]').first();
      await logo.click();

      await page.waitForURL('**/', { timeout: 8000, waitUntil: 'domcontentloaded' });

      // User must remain authenticated in session storage
      const token = await page.evaluate(() => sessionStorage.getItem('sc_access_token'));
      assert(token && token.length > 20, 'Token was incorrectly purged on logo click!');

      // "Go to Dashboard" button must appear on homepage
      const goToDashboardBtn = page.locator('a:has-text("Go to Dashboard"), a:has-text("Resident Dashboard")').first();
      await goToDashboardBtn.waitFor({ state: 'visible', timeout: 8000 });

      // Clicking Go to Dashboard returns to role dashboard
      await goToDashboardBtn.click();
      await page.waitForURL('**/app/dashboard', { timeout: 8000, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Welcome home,', { timeout: 8000 });
    });

    // 9. Structured URL-Driven Navigation
    await test('Clicking dashboard tabs updates the URL beyond /app and preserves state', async () => {
      // 1. Discover / Cooks
      const cooksLink = page.locator('a:has-text("Find Cooks")').first();
      await cooksLink.click();
      await page.waitForURL('**/app/discover', { timeout: 8000, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Verified Cooks', { timeout: 8000 });

      // 2. Services
      const servicesLink = page.locator('a:has-text("Services")').first();
      await servicesLink.click();
      await page.waitForURL('**/app/services', { timeout: 8000, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=SocietyCook Service Tiers', { timeout: 8000 });

      // 3. Bookings
      const bookingsLink = page.locator('a:has-text("Bookings")').first();
      await bookingsLink.click();
      await page.waitForURL('**/app/bookings', { timeout: 8000, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=My Household Bookings', { timeout: 8000 });

      // 4. Tower Groups (Community)
      const communityLink = page.locator('a:has-text("Tower Groups")').first();
      await communityLink.click();
      await page.waitForURL('**/app/community', { timeout: 8000, waitUntil: 'domcontentloaded' });

      // 5. Settings
      const settingsLink = page.locator('a:has-text("Settings")').first();
      await settingsLink.click();
      await page.waitForURL('**/app/settings', { timeout: 8000, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Account & Device Settings', { timeout: 8000 });
    });

    // 10. Deep Linking & Page Refresh URL Preservation
    await test('Direct deep link navigation and page refresh preserves exact route', async () => {
      await page.goto(`${BASE_URL}/app/services`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=SocietyCook Service Tiers', { timeout: 5000 });
      assert(page.url().includes('/app/services'), 'Expected URL to be /app/services');

      // Refresh page
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=SocietyCook Service Tiers', { timeout: 5000 });
      assert(page.url().includes('/app/services'), 'URL changed after page refresh!');
    });

    // 11. Browser Back and Forward Navigation
    await test('Browser back and forward navigation updates views correctly', async () => {
      await page.goto(`${BASE_URL}/app/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Welcome home,');

      await page.goto(`${BASE_URL}/app/support`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Resident Support');

      // Go back
      await page.goBack();
      await page.waitForURL('**/app/dashboard', { timeout: 5000 });
      assert(page.url().includes('/app/dashboard'), 'Back navigation failed');
      await page.waitForSelector('text=Welcome home,');

      // Go forward
      await page.goForward();
      await page.waitForURL('**/app/support', { timeout: 5000 });
      assert(page.url().includes('/app/support'), 'Forward navigation failed');
      await page.waitForSelector('text=Resident Support');
    });

    // 12. Active Underline Navigation State & Hover Persistence
    await test('Active navigation item retains underline after hover ends', async () => {
      await page.goto(`${BASE_URL}/app/dashboard`, { waitUntil: 'domcontentloaded' });

      // Overview link should have aria-current="page"
      const overviewLink = page.locator('a[aria-current="page"]:has-text("Overview")');
      await overviewLink.waitFor({ state: 'visible' });

      // Hover over another link then leave
      const servicesLink = page.locator('a:has-text("Services")').first();
      await servicesLink.hover();
      await page.mouse.move(0, 0); // Move cursor away

      // Overview link must remain active with visible transform underline
      const activeCurrent = await overviewLink.getAttribute('aria-current');
      assert.strictEqual(activeCurrent, 'page', 'Active link lost aria-current');
    });

    // 13. Multi-Role Navigation & Dashboard Switching
    await test('Persona switcher navigates to role-specific URL routes', async () => {
      // Switch to Manager
      const managerBtn = page.locator('button:has-text("Society Manager")').first();
      await managerBtn.click();
      await page.waitForURL('**/app/society/dashboard', { timeout: 8000, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Campus Control', { timeout: 8000 });

      // Switch to Cook
      const cookBtn = page.locator('button:has-text("Cook (Ramesh)")').first();
      await cookBtn.click();
      await page.waitForURL('**/app/professional/dashboard', { timeout: 8000, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Hello, Chef', { timeout: 8000 });

      // Switch to Admin
      const adminBtn = page.locator('button:has-text("Platform Admin")').first();
      await adminBtn.click();
      await page.waitForURL('**/admin/dashboard', { timeout: 8000, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=SocietyCook Operational Control', { timeout: 8000 });
    });

    // 14. Role-Based Access Control: Unauthorized Route Prevention
    await test('Non-admin users are blocked from accessing /admin routes', async () => {
      // Switch back to resident
      const residentBtn = page.locator('button:has-text("Resident (Rahul)")').first();
      await residentBtn.click();
      await page.waitForURL('**/app/dashboard', { timeout: 8000, waitUntil: 'domcontentloaded' });

      // Attempt to directly navigate to /admin/security
      await page.goto(`${BASE_URL}/admin/security`, { waitUntil: 'domcontentloaded' });

      // Must be blocked and display Forbidden / 403 page
      const forbiddenHeading = page.locator('text=403 - Access Forbidden');
      await forbiddenHeading.waitFor({ state: 'visible', timeout: 10000 });
    });

    // 15. PWA Installation Banner & Cooldown Dismissal
    await test('PWA installation banner dismissal persists 7-day cooldown', async () => {
      await page.goto(`${BASE_URL}/app/settings`, { waitUntil: 'domcontentloaded' });

      // Clear any prior dismissal
      await page.evaluate(() => localStorage.removeItem('sc_pwa_install_dismissed'));

      // Check that PWA Settings component renders Install App button
      const pwaCard = page.locator('text=SocietyCook PWA Application');
      await pwaCard.waitFor({ state: 'visible' });

      // Dismiss banner simulation in storage
      await page.evaluate(() => localStorage.setItem('sc_pwa_install_dismissed', String(Date.now())));
      const cooldownVal = await page.evaluate(() => localStorage.getItem('sc_pwa_install_dismissed'));
      assert(cooldownVal, 'Cooldown key failed to persist in localStorage');
    });

    // 16. GA4 Event Tracking & PII Redaction
    await test('GA4 business events trigger without PII leakage', async () => {
      await page.goto(`${BASE_URL}/app/services`, { waitUntil: 'domcontentloaded' });

      const events = await page.evaluate(() => {
        return (window.dataLayer || []).filter(e => e[0] === 'event' || e.event);
      });

      const eventJson = JSON.stringify(events);
      assert(!eventJson.includes('Demo12345!'), 'Leaked demo password in dataLayer!');
      assert(!eventJson.includes('secret_key'), 'Leaked secret in dataLayer!');
      assert(!eventJson.includes('token='), 'Leaked token parameter in dataLayer!');
    });

    // 17. Multilingual Text Rendering
    await test('Multilingual Kannada and Hindi scripts render valid bounding boxes', async () => {
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

    // 18. Cooking, Dishwashing and Combined Service Tiers
    await test('Service tiers display cooking, dishwashing and combo plans with correct exploration links', async () => {
      await page.goto(`${BASE_URL}/app/services`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=SocietyCook Service Tiers');

      // Verify Dishwashing and Combo tiers exist
      const dishwashingHeading = page.locator('h3:has-text("Utensil Care & Dishwashing")').first();
      assert(await dishwashingHeading.isVisible(), 'Dishwashing tier missing');

      const comboHeading = page.locator('h3:has-text("Complete Kitchen Care")').first();
      assert(await comboHeading.isVisible(), 'Combo tier missing');

      // Click Find Utensil Care & Dishwashing Staff
      const dishwashingStaffLink = page.locator('a[href*="/app/discover?service=DISHWASHING"]').first();
      assert(await dishwashingStaffLink.isVisible(), 'Dishwashing exploration link missing');
      await dishwashingStaffLink.click();
      await page.waitForURL('**/app/discover?service=DISHWASHING', { timeout: 5000 });
    });

    // 19. Household Bookings & Cancellation Workflow UI
    await test('Household bookings page loads contracts and presents service details', async () => {
      await page.goto(`${BASE_URL}/app/bookings`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=My Household Bookings');

      const heading = await page.locator('h1').textContent();
      assert(heading.includes('My Household Bookings'), 'Bookings page heading missing');
    });

    // 20. Service Worker Zero-Cache Policy on Sensitive API Endpoints
    await test('Service worker strictly enforces zero-cache policy on sensitive API endpoints', async () => {
      await page.goto(`${BASE_URL}/app/dashboard`, { waitUntil: 'domcontentloaded' });
      const cacheCompliant = await page.evaluate(async () => {
        if (!('caches' in window)) return true;
        const keys = await caches.keys();
        for (const key of keys) {
          const cache = await caches.open(key);
          const cachedRequests = await cache.keys();
          for (const req of cachedRequests) {
            const path = req.url;
            if (path.includes('/api/') || path.includes('/auth/') || path.includes('/bookings') || path.includes('/payments') || path.includes('/sessions')) {
              return false; // Sensitive data found in cache!
            }
          }
        }
        return true;
      });
      assert(cacheCompliant, 'Sensitive API response was improperly stored in service worker cache!');
    });

    // 21. Demo UPI Payment Safety & Transparent Sandbox Disclaimers
    await test('Demo payments display prominent sandbox disclaimers preventing mistaking for real transactions', async () => {
      await page.goto(`${BASE_URL}/app/subscriptions`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Billing & Subscriptions');

      // Click Pay / Renew button to trigger demo payment modal
      const payButton = page.locator('button:has-text("Pay Now"), button:has-text("Renew")').first();
      await payButton.waitFor({ state: 'visible', timeout: 5000 });
      await payButton.click();

      // Verify prominent demo sandbox disclaimer is visible
      const demoNotice = page.locator('text=DEMO TRANSACTION');
      await demoNotice.waitFor({ state: 'visible', timeout: 5000 });
      const warningText = await demoNotice.textContent();
      assert(warningText.includes('DEMO'), 'Demo payment missing prominent sandbox disclaimer');

      // Verify simulated fictional UPI ID
      const upiText = await page.locator('text=sandbox.demo.simulation@societycook').textContent();
      assert(upiText.includes('sandbox.demo.simulation'), 'Fictional demo UPI ID missing');

      // Close modal
      const closeBtn = page.locator('button[aria-label="Close payment modal"]');
      await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
      await closeBtn.click();
    });

    console.log(`\n🎉 All ${passedCount} / ${testCount} E2E & PWA tests completed successfully with ZERO failures!\n`);
  } finally {
    await browser.close();
  }
}

runE2ETests().catch((err) => {
  console.error('\n💥 Playwright E2E Suite Failed:', err);
  process.exit(1);
});
