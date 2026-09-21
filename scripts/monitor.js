import { spawn } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteFor } from '../src/sites/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(ROOT, 'monitor.config.json');
const PROFILE = join(process.env.LOCALAPPDATA ?? ROOT, 'thai-pdpa-guard-monitor');
const LOG = join(ROOT, 'monitor.log');
const PORT = 9300 + Math.floor(Math.random() * 600);
const PAGE_TIMEOUT_MS = 40000;
const CDP_TIMEOUT_MS = 20000;
const RUN_TIMEOUT_MS = 4 * 60 * 1000;

const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
].find((p) => p && existsSync(p));

const SITES = [
  { name: 'ChatGPT', host: 'chatgpt.com', url: 'https://chatgpt.com/' },
  { name: 'Claude', host: 'claude.ai', url: 'https://claude.ai/new' },
  { name: 'Gemini', host: 'gemini.google.com', url: 'https://gemini.google.com/app' }
];

function log(line) {
  const s = `${new Date().toISOString()} ${line}`;
  console.log(s);
  appendFileSync(LOG, s + '\n');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = () => reject(new Error('ws failed'));
      setTimeout(() => reject(new Error('ws connect timed out')), CDP_TIMEOUT_MS);
    });
    return new CDP(ws);
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`${method} timed out`));
      }, CDP_TIMEOUT_MS);
    });
  }
}

async function launchChrome(headed) {
  mkdirSync(PROFILE, { recursive: true });
  const args = [
    `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${PORT}`, '--no-first-run', '--no-default-browser-check',
    '--window-size=1400,900', 'about:blank'
  ];
  if (!headed) args.push('--window-position=-32000,-32000');
  const proc = spawn(CHROME, args, { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    await sleep(200);
    try {
      const v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      return { proc, wsUrl: v.webSocketDebuggerUrl };
    } catch { /* not up yet */ }
  }
  proc.kill();
  throw new Error('Chrome did not start');
}

async function checkSite(cdp, site) {
  const sel = siteFor(site.host);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Page.navigate', { url: site.url }, sessionId);
  const expr = `JSON.stringify({
    ready: document.readyState,
    title: document.title,
    href: location.href,
    editor: !!document.querySelector(${JSON.stringify(sel.editor)}),
    send: !!document.querySelector(${JSON.stringify(sel.send)})
  })`;
  const started = Date.now();
  let last = {};
  let typed = false;
  try {
    while (Date.now() - started < PAGE_TIMEOUT_MS) {
      await sleep(1500);
      try {
        const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId);
        last = JSON.parse(r.result.value);
        if (last.editor && last.send) return { site: site.name, status: 'ok' };
        if (last.editor && !typed) {
          typed = true;
          await cdp.send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(sel.editor)}).focus()` }, sessionId);
          await cdp.send('Input.insertText', { text: 'ทดสอบ' }, sessionId);
        }
      } catch { /* page navigating */ }
    }
  } finally {
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {});
  }
  if (/just a moment/i.test(last.title ?? '')) return { site: site.name, status: 'blocked', detail: 'Cloudflare กันการเข้าอัตโนมัติ' };
  if (/login|signin|auth/i.test(last.href ?? '')) return { site: site.name, status: 'login', detail: 'ต้องล็อกอินใหม่ (node scripts/monitor.js --login)' };
  const missing = [!last.editor && 'กล่องข้อความ', !last.send && 'ปุ่มส่ง'].filter(Boolean).join('และ');
  log(`${site.name} last state: ${JSON.stringify(last)}`);
  return { site: site.name, status: 'broken', detail: `ไม่พบ${missing} — selector อาจเปลี่ยน` };
}

async function sendLine(text, cfg) {
  if (!cfg.lineChannelAccessToken || !cfg.lineUserId) { log('LINE not configured; skipping push'); return; }
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.lineChannelAccessToken}` },
    body: JSON.stringify({ to: cfg.lineUserId, messages: [{ type: 'text', text }] })
  });
  if (!res.ok) log(`LINE push failed: ${res.status} ${await res.text()}`);
}

async function main() {
  if (!CHROME) { console.error('Chrome not found'); process.exit(1); }
  if (process.argv.includes('--login')) {
    mkdirSync(PROFILE, { recursive: true });
    console.log('เปิด Chrome โปรไฟล์ monitor — ล็อกอิน ChatGPT, Claude, Gemini ให้ครบ แล้วปิดหน้าต่าง');
    spawn(CHROME, [`--user-data-dir=${PROFILE}`, '--no-first-run', 'https://chatgpt.com/', 'https://claude.ai/login', 'https://gemini.google.com/app'], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  const cfg = existsSync(CONFIG_PATH) ? JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) : {};
  const { proc, wsUrl } = await launchChrome(process.argv.includes('--show'));
  const watchdog = setTimeout(async () => {
    log('monitor watchdog: run exceeded time limit');
    proc.kill();
    await sendLine('❌ Thai PDPA Guard monitor ค้าง (เกินเวลา) — ตรวจ monitor.log', cfg);
    process.exit(1);
  }, RUN_TIMEOUT_MS);
  const results = [];
  try {
    const cdp = await CDP.connect(wsUrl);
    for (const site of SITES) {
      results.push(await checkSite(cdp, site).catch((e) => ({ site: site.name, status: 'error', detail: e.message })));
    }
    await cdp.send('Browser.close').catch(() => {});
  } finally {
    await Promise.race([new Promise((r) => proc.once('exit', r)), sleep(5000)]);
    if (proc.exitCode === null) proc.kill();
    clearTimeout(watchdog);
  }
  const icon = { ok: '✅', broken: '🚨', login: '⚠️', blocked: '⚠️', error: '❌' };
  const allOk = results.every((r) => r.status === 'ok');
  const stamp = new Date().toLocaleString('th-TH', { hour12: false });
  const text = `${allOk ? '✅ Thai PDPA Guard ปกติ' : '🚨 Thai PDPA Guard มีปัญหา'}\n${stamp}\n${results.map((r) => `${icon[r.status]} ${r.site}${r.detail ? ` — ${r.detail}` : ''}`).join('\n')}`;
  log(text.replace(/\n/g, ' | '));
  await sendLine(text, cfg);
  process.exit(allOk ? 0 : 2);
}

main().catch((e) => { log(`monitor crashed: ${e.message}`); process.exit(1); });
