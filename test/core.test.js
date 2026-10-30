import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUserAgent } from '../src/core.js';

const chrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const firefox = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';
const safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15';
const edge = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
const opera = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0';
const android = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';

test('Chrome on Windows', () => {
  const r = parseUserAgent(chrome);
  assert.equal(r.browser, 'Chrome');
  assert.equal(r.browserVersion.major, '120');
  assert.equal(r.browserVersion.minor, '0');
  assert.equal(r.browserVersion.patch, '0');
  assert.equal(r.engine, 'Blink');
  assert.equal(r.os, 'Windows');
  assert.equal(r.osVersion.major, '10');
});

test('Firefox on Windows uses Gecko with rv version', () => {
  const r = parseUserAgent(firefox);
  assert.equal(r.browser, 'Firefox');
  assert.equal(r.browserVersion.major, '121');
  assert.equal(r.engine, 'Gecko');
  assert.equal(r.engineVersion.major, '121');
  assert.equal(r.os, 'Windows');
});

test('Safari on macOS', () => {
  const r = parseUserAgent(safari);
  assert.equal(r.browser, 'Safari');
  assert.equal(r.browserVersion.major, '17');
  assert.equal(r.engine, 'WebKit');
  assert.equal(r.os, 'macOS');
  assert.equal(r.osVersion.major, '10');
});

test('Edge (Chromium) is not reported as Chrome', () => {
  const r = parseUserAgent(edge);
  assert.equal(r.browser, 'Edge');
  assert.notEqual(r.browser, 'Chrome');
  assert.equal(r.engine, 'Blink');
});

test('Opera is not reported as Chrome', () => {
  const r = parseUserAgent(opera);
  assert.equal(r.browser, 'Opera');
  assert.notEqual(r.browser, 'Chrome');
});

test('Chrome on Android', () => {
  const r = parseUserAgent(android);
  assert.equal(r.browser, 'Chrome');
  assert.equal(r.os, 'Android');
  assert.equal(r.osVersion.major, '13');
});

test('Safari on iPhone with iOS version', () => {
  const r = parseUserAgent(iphone);
  assert.equal(r.browser, 'Safari');
  assert.equal(r.os, 'iOS');
  assert.equal(r.osVersion.major, '17');
  assert.equal(r.osVersion.minor, '1');
});

test('empty string returns all nulls', () => {
  const r = parseUserAgent('');
  assert.equal(r.browser, null);
  assert.equal(r.browserVersion, null);
  assert.equal(r.engine, null);
  assert.equal(r.engineVersion, null);
  assert.equal(r.os, null);
  assert.equal(r.osVersion, null);
});

test('non-string input returns all nulls', () => {
  const r = parseUserAgent(null);
  assert.equal(r.browser, null);
  assert.equal(r.os, null);
});

test('unknown browser string has null browser but may still detect OS', () => {
  const r = parseUserAgent('SomethingCustom/1.0 (Windows NT 10.0)');
  assert.equal(r.browser, null);
  assert.equal(r.os, 'Windows');
});

test('browserVersion.full matches the raw version string', () => {
  const r = parseUserAgent(chrome);
  assert.equal(r.browserVersion.full, '120.0.0');
});

test('Chrome on Linux is detected as Linux OS', () => {
  const r = parseUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  assert.equal(r.browser, 'Chrome');
  assert.equal(r.os, 'Linux');
});
