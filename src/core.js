/**
 * Core parsing logic for the User-Agent header.
 *
 * Design decision: this parser favours correctness for the common, honest
 * cases (real Chrome, Firefox, Safari, Edge, Opera) over elaborate spoofing
 * detection. Many bots and crawlers identify themselves with a clear token
 * in parentheses; we surface that as the browser name rather than guessing.
 */

/**
 * @typedef {Object} Version
 * @property {string|null} major  Major version component (e.g. "120"), or null if absent.
 * @property {string|null} minor  Minor version component (e.g. "0"), or null if absent.
 * @property {string|null} patch   Patch version component, or null if absent.
 * @property {string} full         The full version string as found in the UA.
 */

/**
 * @typedef {Object} UserAgentInfo
 * @property {string|null} browser      Browser name (e.g. "Chrome"), or null.
 * @property {Version|null} browserVersion  Parsed browser version, or null.
 * @property {string|null} engine       Rendering engine name (e.g. "Blink"), or null.
 * @property {Version|null} engineVersion   Parsed engine version, or null.
 * @property {string|null} os           Operating system name (e.g. "Windows"), or null.
 * @property {Version|null} osVersion   Parsed OS version, or null.
 */

/**
 * Split a version string like "120.0.6099" into major/minor/patch components.
 * Missing components are null, not coerced to zero, so callers can distinguish
 * "120" from "120.0.0".
 *
 * @param {string} raw
 * @returns {Version}
 */
function parseVersion(raw) {
  const full = raw;
  const parts = raw.split('.');
  const major = parts[0] || null;
  const minor = parts.length > 1 ? parts[1] || null : null;
  const patch = parts.length > 2 ? parts[2] || null : null;
  return { full, major, minor, patch };
}

/**
 * Extract the first /version from a UA substring, or null if not present.
 *
 * @param {string} ua
 * @returns {string|null}
 */
function extractVersion(ua) {
  const m = ua.match(/\/(\d+(?:\.\d+){0,2})/);
  return m ? m[1] : null;
}

/**
 * Detect the operating system from the parenthesised product tokens.
 * Returns a tuple of [name, versionRaw|null] or [null, null] if unknown.
 *
 * @param {string} ua
 * @returns {[string|null, string|null]}
 */
function detectOS(ua) {
  // Order matters: more specific checks first.

  if (/Windows NT 10/.test(ua)) return ['Windows', '10'];
  if (/Windows NT 6\.3/.test(ua)) return ['Windows', '8.1'];
  if (/Windows NT 6\.2/.test(ua)) return ['Windows', '8'];
  if (/Windows NT 6\.1/.test(ua)) return ['Windows', '7'];
  if (/Windows NT 6\.0/.test(ua)) return ['Windows', 'Vista'];
  if (/Windows NT 5\.1/.test(ua)) return ['Windows', 'XP'];
  if (/Windows/.test(ua)) return ['Windows', null];

  // Android version often appears in the first set of parentheses as
  // "Android 13" or "Android 13.0".
  const android = ua.match(/Android(?:\s+(\d+(?:\.\d+){0,2}))/);
  if (android) return ['Android', android[1] || null];

  // iOS detection from the Safari UA is non-trivial; the version is absent
  // and only "CPU OS <v> like Mac OS X" is present in the iPad string.
  const ios = ua.match(/(?:iPhone|CPU(?: iPhone)? OS)\s+(\d+(?:_\d+){0,2})/);
  if (ios) {
    return ['iOS', ios[1].replace(/_/g, '.')];
  }

  if (/iPhone/.test(ua)) return ['iOS', null];
  if (/iPad/.test(ua)) return ['iOS', null];
  if (/iPod/.test(ua)) return ['iOS', null];

  const mac = ua.match(/Mac OS X\s+(\d+(?:[._]\d+){0,2})/);
  if (mac) return ['macOS', mac[1].replace(/_/g, '.')];
  if (/Mac OS X/.test(ua)) return ['macOS', null];
  if (/Macintosh/.test(ua)) return ['macOS', null];

  if (/CrOS/.test(ua)) return ['ChromeOS', null];

  const linux = ua.match(/\b(X11|Linux)\b/);
  if (linux) return ['Linux', null];

  return [null, null];
}

/**
 * Detect the browser. Returns [name, versionRaw|null].
 *
 * The checks are ordered so that browsers that embed another browser's
 * engine token (e.g. Edge contains "Chrome", Opera contains "Chrome")
 * are matched first.
 *
 * @param {string} ua
 * @returns {[string|null, string|null]}
 */
function detectBrowser(ua) {
  // Edg is the token Edge Chromium uses (the "e" is trimmed by the /version rule).
  if (/\bEdg\//.test(ua)) {
    return ['Edge', extractVersion(ua.match(/Edg\/[\d.]+/)[0])];
  }
  // Legacy Edge used Edge/.
  if (/\bEdge\//.test(ua)) {
    return ['Edge', extractVersion(ua.match(/Edge\/[\d.]+/)[0])];
  }

  if (/\bOPR\//.test(ua)) {
    return ['Opera', extractVersion(ua.match(/OPR\/[\d.]+/)[0])];
  }
  if (/\bOpera\//.test(ua) || /\bOpera\b/.test(ua)) {
    const m = ua.match(/Version\/(\d+(?:\.\d+){0,2})/);
    return ['Opera', m ? m[1] : null];
  }

  if (/\bFirefox\//.test(ua)) {
    return ['Firefox', extractVersion(ua.match(/Firefox\/[\d.]+/)[0])];
  }

  // Chrome must be checked before Safari because Chrome UAs contain
  // "Safari/" as a historical compatibility token.
  if (/\bChrome\//.test(ua)) {
    return ['Chrome', extractVersion(ua.match(/Chrome\/[\d.]+/)[0])];
  }

  if (/\bSafari\//.test(ua)) {
    const m = ua.match(/Version\/(\d+(?:\.\d+){0,2})/);
    return ['Safari', m ? m[1] : null];
  }

  return [null, null];
}

/**
 * Determine the rendering engine from the browser name and UA string.
 * Returns [name, versionRaw|null].
 *
 * @param {string|null} browser
 * @param {string} ua
 * @returns {[string|null, string|null]}
 */
function detectEngine(browser, ua) {
  // Modern Chrome, Edge (Chromium), and Opera all use Blink. There is no
  // explicit "Blink" token in the UA, so we infer it.
  if (browser === 'Chrome' || browser === 'Edge' || browser === 'Opera') {
    return ['Blink', null];
  }

  if (/Gecko\//.test(ua) && /rv:/.test(ua)) {
    const m = ua.match(/rv:(\d+(?:\.\d+){0,2})/);
    return ['Gecko', m ? m[1] : null];
  }

  if (/AppleWebKit\//.test(ua)) {
    const m = ua.match(/AppleWebKit\/(\d+(?:\.\d+){0,2})/);
    return ['WebKit', m ? m[1] : null];
  }

  return [null, null];
}

/**
 * Parse a User-Agent header string into structured fields.
 *
 * @param {string} ua - The raw User-Agent header value.
 * @returns {UserAgentInfo} Parsed information. Fields are null when the
 *   corresponding value could not be determined.
 */
export function parseUserAgent(ua) {
  if (typeof ua !== 'string') {
    return {
      browser: null,
      browserVersion: null,
      engine: null,
      engineVersion: null,
      os: null,
      osVersion: null,
    };
  }

  const [browser, browserRaw] = detectBrowser(ua);
  const [engine, engineRaw] = detectEngine(browser, ua);
  const [os, osRaw] = detectOS(ua);

  return {
    browser,
    browserVersion: browserRaw ? parseVersion(browserRaw) : null,
    engine,
    engineVersion: engineRaw ? parseVersion(engineRaw) : null,
    os,
    osVersion: osRaw ? parseVersion(osRaw) : null,
  };
}
