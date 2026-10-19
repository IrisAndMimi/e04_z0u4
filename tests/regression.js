// 回歸測試：用真的瀏覽器打開 ../index.html（或單檔整合版），模擬打字，檢查翻譯結果和標籤。
//
// 用法（第一次要先 npm install）：
//   cd tests
//   npm install
//   npx playwright install chromium     # 已經有 Chromium 的話改設 CHROMIUM_PATH 指過去
//   node regression.js                   # 全部通過會印 ALL PASS，失敗會列出差異並以 exit code 1 結束
//   node regression.js --record          # 只印出目前的實際結果（改了行為、要更新期望值時用）
//   node regression.js --single          # 改測單檔整合版（../e04_z0u4(single).html）
//
// 每個情境都開新分頁，避免上一個情境的計時器（自動偵測有 350ms 延遲）干擾。
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const FILE = process.argv.includes('--single') ? 'e04_z0u4(single).html' : 'index.html';
const PAGE = pathToFileURL(path.resolve(__dirname, '..', FILE)).href;   // Windows、中文路徑都正確
const RECORD = process.argv.includes('--record');
const WAIT = 700;                                  // 打完字等自動偵測跑完

// 讀畫面狀態（依賴頁面裡的 window.__zy）
const state = p => p.evaluate(() => {
  const $ = id => document.getElementById(id);
  const t = el => el.textContent.replace(/\s+/g, ' ').trim();
  const S = window.__zy.S;
  const tab = [...document.querySelectorAll(S.mode === 'dec' ? '#targets [aria-selected="true"]' : '#gtargets [aria-selected="true"]')]
    .map(b => b.textContent.trim()).join();
  return {
    mode: S.mode,
    lbl: S.mode === 'dec' ? t($('imeLbl')) : t($('zhStatic')),
    out: S.mode === 'dec' ? $('out').innerText.replace(/\s*\n\s*/g, ' ').trim() : $('gout').innerText.replace(/\s*\n\s*/g, ' ').trim(),
    alts: $('alts').hidden ? '' : t($('alts')),
    src: $('src').value,
    tab: S.mode + ':' + tab,
  };
});

async function typeInto(p, sel, text) {
  await p.click(sel);                             // 第一次點進去會清掉開場範例
  await p.type(sel, text, { delay: 20 });
  await p.waitForTimeout(WAIT);
}

// 每個情境：做一些操作，回傳要比對的欄位
const pick = (o, keys) => Object.fromEntries(keys.map(k => [k, o[k]]));
const SCENARIOS = {
  '大千 e04': async p => { await typeInto(p, '#src', 'e04'); return pick(await state(p), ['out', 'lbl', 'alts']); },
  '大千 句子': async p => { await typeInto(p, '#src', 'su3cl3'); return pick(await state(p), ['out', 'lbl']); },
  '注音順序校正 ij3': async p => { await typeInto(p, '#src', 'ij3'); return pick(await state(p), ['out']); },
  '倉頡 jjomj': async p => { await typeInto(p, '#src', 'jjomj '); return pick(await state(p), ['out', 'lbl']); },
  '太短有歧義 jg': async p => { await typeInto(p, '#src', 'jg '); return pick(await state(p), ['out', 'lbl', 'alts']); },
  '注音符號': async p => { await typeInto(p, '#src', 'ㄍㄢˋ'); return pick(await state(p), ['out', 'lbl']); },
  '倉頡字根': async p => { await typeInto(p, '#src', '十十人一十 人弓火'); return pick(await state(p), ['out', 'lbl']); },
  '貼中文自動對調': async p => { await typeInto(p, '#src', '你今天吃飯了嗎'); return pick(await state(p), ['mode', 'out', 'lbl']); },
  '數字加單位不轉': async p => { await typeInto(p, '#src', 'e04 104元'); return pick(await state(p), ['out']); },
  '亂打': async p => { await typeInto(p, '#src', 'qqqqqqqq'); return pick(await state(p), ['lbl']); },
  '清空回自動偵測': async p => {
    await typeInto(p, '#src', 'jjomj ');
    await p.click('#clearSrc'); await p.waitForTimeout(WAIT);
    return pick(await state(p), ['lbl']);
  },
  '開場範例點一下就清空': async p => { await p.click('#src'); return pick(await state(p), ['src']); },
  '⇄ 不換分頁': async p => {
    const r = [];
    await p.click('[data-target="sym"]'); r.push((await state(p)).tab);
    await p.click('#swap');               r.push((await state(p)).tab);
    await p.click('[data-gtarget="keys"]'); r.push((await state(p)).tab);
    await p.click('#swap');               r.push((await state(p)).tab);
    await p.click('#swap');               r.push((await state(p)).tab);
    return { tabs: r };
  },
};

// 期望值（用 --record 產生後人工確認過）
const EXPECTED = {
  "大千 e04": {
    "out": "幹",
    "lbl": "偵測到·注音文大千",
    "alts": "也可能是：倚天「樣」"
  },
  "大千 句子": {
    "out": "你好",
    "lbl": "偵測到·注音文大千"
  },
  "注音順序校正 ij3": {
    "out": "我"
  },
  "倉頡 jjomj": {
    "out": "幹",
    "lbl": "偵測到·倉頡碼"
  },
  "太短有歧義 jg": {
    "out": "書",
    "lbl": "偵測到·注音文大千",
    "alts": "也可能是：無蝦米「幹」"
  },
  "注音符號": {
    "out": "幹",
    "lbl": "偵測到·注音符號"
  },
  "倉頡字根": {
    "out": "幹你",
    "lbl": "偵測到·倉頡字根"
  },
  "貼中文自動對調": {
    "mode": "gen",
    "out": "su3rup wu0 t z04xk7a87",
    "lbl": "偵測到·中文"
  },
  "數字加單位不轉": {
    "out": "幹 104元"
  },
  "亂打": {
    "lbl": "無法辨識"
  },
  "清空回自動偵測": {
    "lbl": "自動偵測"
  },
  "開場範例點一下就清空": {
    "src": ""
  },
  "⇄ 不換分頁": {
    "tabs": [
      "dec:注音",
      "gen:注音",
      "gen:按鍵",
      "dec:中文",
      "gen:按鍵"
    ]
  }
};

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const actual = {}, errors = [];
  for (const [name, run] of Object.entries(SCENARIOS)) {
    const p = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    p.on('pageerror', e => errors.push(`${name}: ${e.message}`));
    try {
      await p.goto(PAGE, { waitUntil: 'load', timeout: 60000 });
      await p.waitForTimeout(300);
      actual[name] = await run(p);
    } catch (e) {
      actual[name] = { error: e.message.split('\n')[0] };   // 一個情境壞掉不影響其他情境
    }
    await p.close();
  }
  await browser.close();

  if (RECORD) { console.log(JSON.stringify(actual, null, 2)); console.log('page errors:', errors); return; }

  let fail = 0;
  for (const name of Object.keys(SCENARIOS)) {
    const a = JSON.stringify(actual[name]), e = JSON.stringify(EXPECTED[name]);
    if (a !== e) { fail++; console.log(`✗ ${name}\n    期望 ${e}\n    實際 ${a}`); }
    else console.log(`✓ ${name}`);
  }
  if (errors.length) { fail++; console.log('✗ 頁面錯誤：', errors); }
  console.log(`[${FILE}] ` + (fail ? `${fail} FAILED` : 'ALL PASS'));
  process.exit(fail ? 1 : 0);
})();
