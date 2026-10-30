# http-user-agent-header-parse

Parses the HTTP User-Agent header string into structured browser, version, engine, and operating system fields. Zero dependencies, ESM only.

```js
import { parseUserAgent } from 'http-user-agent-header-parse';

const info = parseUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
);

// info.browser === 'Chrome'
// info.browserVersion.major === '120'
// info.engine === 'Blink'
// info.os === 'Windows'
// info.osVersion.major === '10'
```

## Why

Every server log is full of User-Agent strings, and reading them by eye is tedious. This library turns a single header value into a small object with `browser`, `browserVersion`, `engine`, `engineVersion`, `os`, and `osVersion` fields. It exists because most existing parsers either pull in a large data file or try to be clever about spoofing — this one does neither. It handles the common, honest UAs (Chrome, Firefox, Safari, Edge, Opera on Windows, macOS, Linux, Android, iOS) and returns `null` for anything it cannot recognise rather than guessing.

The trade-off: the User-Agent header is adversarial. Browsers lie about their identity for compatibility (Chrome says it is Safari), and bots omit standard tokens entirely. This parser does not attempt to detect lies beyond the well-known historical compatibility tokens. If a UA string contains no recognisable browser token, `browser` is `null` even if the OS is detectable from the parenthesised product tokens.

## Edge cases you will hit

- **Missing version components.** `parseVersion('120')` yields `{ full: '120', major: '120', minor: null, patch: null }` — minor and patch are `null`, not `'0'`, so you can distinguish "120" from "120.0.0".
- **Browsers embedded in other browsers.** Edge and Opera UAs contain the `Chrome/` token. The parser checks for `Edg/` and `OPR/` first so it reports Edge and Opera, not Chrome.
- **iOS version format.** iPhone UAs express the OS version with underscores (`17_1`); the parser normalises these to dots (`17.1`).
- **Engine inference.** There is no `Blink` token in any UA string. The parser infers Blink from the browser being Chrome, Edge, or Opera. If you pass a custom Chromium-based browser that this parser does not recognise, `engine` will be `null`.
