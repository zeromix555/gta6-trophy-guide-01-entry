// shots.mjs — takes the 4 entry screenshots with headless Chrome over CDP.
// Usage: node shots.mjs  (expects `node serve.ts --port 8080` already running)
// Chrome binary: /opt/meta-chromium/chrome
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CHROME = '/opt/meta-chromium/chrome';
const APP_DIR = '/home/hatch/workspace/makefun/gta6-trophy-guide-01-entry/app';
const BASE = `file://${APP_DIR}/index.html`;
const W = 1280, H = 800;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch { /* not up yet */ }
    await sleep(500);
  }
  throw new Error('no CDP target');
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) {
        const { res, rej } = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) rej(new Error(m.error.message));
        else res(m.result);
      }
    };
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }
  async shot(file) {
    const r = await this.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    writeFileSync(file, Buffer.from(r.data, 'base64'));
    console.log('wrote', file);
  }
}

const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--allow-file-access-from-files',
  `--window-size=${W},${H}`, '--remote-debugging-port=9222',
  '--user-data-dir=/tmp/chrome-prof-shots',
  '--hatch-webgl-allowed-domains-file=/tmp/pol5.txt',
  '--hatch-webgl-allowed-domains-sha256=c5c85869591ff8b3491450f49cfd62912c6dd41e5cecada4e831191d3185035e',
  'about:blank',
], { stdio: 'ignore' });

try {
  const target = await getTarget(9222);
  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

  const nav = async (url) => {
    await cdp.send('Page.navigate', { url });
    await sleep(1500);
    const cards = await cdp.eval(`document.querySelectorAll('.trophy-card').length`);
    console.log('cards rendered:', cards, 'for', url);
    if (!cards) throw new Error('app did not render for ' + url);
  };
  const errs = async () => cdp.eval(`window.__errs ? window.__errs.join(' | ') : 'none'`);

  // 1 — cover: checklist, sample progress on, missable trophy's guide open beside it.
  await nav(`${BASE}#trophy=positive-mental-attitude`);
  await cdp.eval(`window.addEventListener('error', e => { (window.__errs = window.__errs || []).push(e.message); }); document.getElementById('sample-btn').click();`);
  await sleep(600);
  console.log('errors after shot 1:', await errs());
  await cdp.shot('screenshots/1-checklist.jpg');

  // 2 — roadmap to the platinum (click the tab: a hash-only navigation
  // does not reload the page, so readHash() would never re-run).
  await cdp.eval(`document.querySelector('[data-view="roadmap"]').click();`);
  await sleep(600);
  await cdp.shot('screenshots/2-roadmap.jpg');

  // 3 — missables, dark theme, spoiler on: the missable flag at work.
  await cdp.eval(`document.querySelector('[data-view="missables"]').click(); document.getElementById('theme-toggle').click(); document.getElementById('spoiler-toggle').click();`);
  await sleep(600);
  await cdp.shot('screenshots/3-missables.jpg');

  // 4 — Next-up planner, light theme again, spoiler off so names show.
  await cdp.eval(`document.querySelector('[data-view="nextup"]').click(); document.getElementById('theme-toggle').click(); document.getElementById('spoiler-toggle').click();`);
  await sleep(600);
  await cdp.shot('screenshots/4-nextup.jpg');

  console.log('done');
} finally {
  chrome.kill('SIGKILL');
}
