/**
 * Browser Stealth Module
 * Makes Puppeteer-controlled browsers appear as real users
 *
 * Based on advanced stealth techniques for legitimate web scraping
 * (price monitoring, market research, etc.)
 */

/**
 * Apply JavaScript overrides to hide automation signals
 * This must run BEFORE any page JavaScript executes
 */
async function applyStealthScripts(page) {
  await page.evaluateOnNewDocument(() => {
    // 1. CRITICAL: Remove webdriver property (most important!)
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // 2. Add realistic Chrome plugins (headless browsers have empty array)
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          0: {type: "application/x-google-chrome-pdf", suffixes: "pdf"},
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chrome PDF Plugin"
        },
        {
          0: {type: "application/pdf", suffixes: "pdf"},
          description: "",
          filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
          length: 1,
          name: "Chrome PDF Viewer"
        }
      ],
    });

    // 3. Add window.chrome object (real Chrome has this)
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };

    // 4. Override permissions API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );

    // 5. Realistic language preferences (UK English)
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-GB', 'en-US', 'en'],
    });

    // 6. Set realistic platform
    Object.defineProperty(navigator, 'platform', {
      get: () => 'MacIntel', // Mac platform
    });

    // 7. Hardware concurrency (CPU cores)
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });

    // 8. Device memory (GB)
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
    });

    // 9. Browser vendor
    Object.defineProperty(navigator, 'vendor', {
      get: () => 'Google Inc.',
    });

    // 10. Network connection info
    Object.defineProperty(navigator, 'connection', {
      get: () => ({
        effectiveType: '4g',
        rtt: 50,
        downlink: 10,
        saveData: false,
      }),
    });

    // 11. Battery API (laptops/mobile devices have this)
    if (!navigator.getBattery) {
      navigator.getBattery = () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1,
      });
    }

    // 12. WebGL Vendor Info (used for fingerprinting)
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      // UNMASKED_VENDOR_WEBGL
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      // UNMASKED_RENDERER_WEBGL
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter.apply(this, [parameter]);
    };

    // 13. Media devices (camera/microphone)
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
      navigator.mediaDevices.enumerateDevices = () => Promise.resolve([
        {
          deviceId: "default",
          kind: "audioinput",
          label: "",
          groupId: "default"
        },
        {
          deviceId: "default",
          kind: "videoinput",
          label: "",
          groupId: "default"
        }
      ]);
    }

    // 14. Override Notification permission
    Object.defineProperty(Notification, 'permission', {
      get: () => 'default',
    });

    // 15. Fix Chrome runtime and app version
    Object.defineProperty(navigator, 'appVersion', {
      get: () => '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // 16. Fix user agent
    Object.defineProperty(navigator, 'userAgent', {
      get: () => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
  });
}

/**
 * Simulate human-like mouse and scroll behavior
 */
async function simulateHumanBehavior(page) {
  try {
    // Random mouse movement (smooth)
    await page.mouse.move(
      100 + Math.random() * 300,
      100 + Math.random() * 300,
      { steps: 10 }
    );

    // Random scroll down
    await page.evaluate(() => {
      window.scrollBy({
        top: 100 + Math.random() * 400,
        left: 0,
        behavior: 'smooth'
      });
    });

    // Random delay (simulates reading)
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));

    // Scroll back up slightly (natural behavior)
    await page.evaluate(() => {
      window.scrollBy({
        top: -(50 + Math.random() * 150),
        left: 0,
        behavior: 'smooth'
      });
    });

    // Another short delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 800));

  } catch (error) {
    // Ignore errors during simulation (page might not support mouse/scroll)
  }
}

/**
 * Set enhanced HTTP headers with modern Chrome headers
 */
async function setEnhancedHeaders(page, referer = null) {
  const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
  };

  if (referer) {
    headers['Referer'] = referer;
  }

  await page.setExtraHTTPHeaders(headers);
}

/**
 * Check if page is blocked by anti-bot systems
 */
async function isPageBlocked(page) {
  try {
    const content = await page.content();
    const title = await page.title();

    // Check for Cloudflare
    if (content.includes('Cloudflare') && content.includes('ray ID')) {
      return { blocked: true, reason: 'cloudflare' };
    }

    // Check for access denied
    if (title.includes('Access Denied') || title.includes('403') || title.includes('Forbidden')) {
      return { blocked: true, reason: 'access_denied' };
    }

    // Check for CAPTCHA
    if (content.includes('CAPTCHA') || content.includes('verify you are human') || content.includes('robot')) {
      return { blocked: true, reason: 'captcha' };
    }

    // Check for rate limiting
    if (title.includes('Too Many Requests') || content.includes('429')) {
      return { blocked: true, reason: 'rate_limited' };
    }

    return { blocked: false };

  } catch (error) {
    return { blocked: false }; // If we can't check, assume not blocked
  }
}

/**
 * Complete stealth setup for a page
 *
 * @param {Page} page - Puppeteer page object
 * @param {Object} options - Configuration options
 * @returns {Function} Callback to run after page loads
 */
async function setupPageStealth(page, options = {}) {
  const {
    searchReferer = true,
    searchQuery = 'online shopping uk',
    simulateHuman = true,
    blockResources = false
  } = options;

  // Apply JavaScript stealth overrides
  await applyStealthScripts(page);

  // Set enhanced HTTP headers
  const referer = searchReferer
    ? `https://www.google.co.uk/search?q=${encodeURIComponent(searchQuery)}`
    : null;

  await setEnhancedHeaders(page, referer);

  // Note: Request interception disabled to avoid conflicts with puppeteer-extra-plugin-stealth
  // If you need resource blocking, use it without the StealthPlugin

  // Return callback to run AFTER page loads
  return async () => {
    if (simulateHuman) {
      await simulateHumanBehavior(page);
    }

    // Check if we got blocked
    const blockStatus = await isPageBlocked(page);
    if (blockStatus.blocked) {
      console.warn(`⚠️  Page may be blocked: ${blockStatus.reason}`);
    }

    return blockStatus;
  };
}

/**
 * Get stealth browser launch arguments
 */
function getStealthLaunchArgs() {
  return [
    // MOST IMPORTANT: Remove automation flag
    '--disable-blink-features=AutomationControlled',

    // Disable automation features
    '--disable-features=IsolateOrigins,site-per-process',

    // Sandbox flags (may be needed depending on environment)
    '--no-sandbox',
    '--disable-setuid-sandbox',

    // Performance optimizations
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',

    // Make browser appear normal
    '--no-first-run',
    '--no-zygote',
    '--hide-scrollbars',
    '--mute-audio',

    // Disable features that leak automation
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',

    // Network flags
    '--enable-features=NetworkService,NetworkServiceInProcess',

    // Display flags
    '--force-color-profile=srgb',
    '--window-size=1920,1080',

    // Disable unnecessary features
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-component-extensions-with-background-pages',
    '--disable-sync',
    '--metrics-recording-only',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-background-networking',
    '--disable-breakpad',
    '--disable-component-update',
    '--disable-domain-reliability',
    '--disable-client-side-phishing-detection',
  ];
}

module.exports = {
  applyStealthScripts,
  simulateHumanBehavior,
  setEnhancedHeaders,
  isPageBlocked,
  setupPageStealth,
  getStealthLaunchArgs
};
