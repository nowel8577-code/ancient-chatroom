// 一鍵產生：各作者聊天室頁面、學習單 PDF（學用版／教用版）、首頁縮圖。
// 用法：在專案根目錄執行  node tools/build.mjs
// 需要 Node.js 與 Playwright（npm i -D playwright && npx playwright install chromium）
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const list = JSON.parse(/ACP_LIST\s*=\s*(\[[^\]]*\])/.exec(fs.readFileSync(path.join(ROOT, "people/list.js"), "utf8"))[1]);
const template = fs.readFileSync(path.join(ROOT, "tools/chat-template.html"), "utf8");
const DEFAULT_CONFIG = `// 正式作答的 Google 表單連結；留空則不顯示「📝 正式作答」按鈕
window.QUIZ_URL = "";

// 友情考核逐題回傳 Google 表單（選用，步驟見 docs/Google表單設定.md）；保持「填入表單ID」則不回傳
window.LOG_CONFIG = {
  formId: "填入表單ID",
  entries: { seat: "entry.0000000001", q: "entry.0000000002", choice: "entry.0000000003", result: "entry.0000000004", score: "entry.0000000005" }
};
`;

// 1. 聊天室頁面
for (const id of list) {
  const dir = path.join(ROOT, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), template.replaceAll("{{id}}", id));
  const cfg = path.join(dir, "config.js");
  if (!fs.existsSync(cfg)) fs.writeFileSync(cfg, DEFAULT_CONFIG);
}

// 2. 本機伺服器
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": (TYPES[path.extname(f)] || "application/octet-stream") + "; charset=utf-8" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

// 3. 學習單 PDF 與縮圖
fs.mkdirSync(path.join(ROOT, "worksheets"), { recursive: true });
fs.mkdirSync(path.join(ROOT, "images"), { recursive: true });
const browser = await chromium.launch();
const manifest = {};
for (const id of list) {
  manifest[id] = {};
  for (const v of ["student", "teacher"]) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 2 });
    await page.goto(`${base}/worksheet.html?p=${id}&v=${v}`, { waitUntil: "networkidle" });
    await page.waitForSelector("body[data-ready]", { timeout: 30000 });
    const pages = +(await page.getAttribute("body", "data-pages"));
    manifest[id][v] = pages;
    await page.pdf({ path: path.join(ROOT, `worksheets/${id}-${v}.pdf`), preferCSSPageSize: true, printBackground: true });
    if (v === "student") {
      const first = page.locator(".page").first();
      await first.screenshot({ path: path.join(ROOT, `images/${id}.jpg`), type: "jpeg", quality: 82 });
    }
    console.log(`${id} ${v}: ${pages} 頁${pages > 2 ? "（超過 2 頁，請刪減內容）" : ""}`);
    await page.close();
  }
}
fs.writeFileSync(path.join(ROOT, "worksheets/manifest.json"), JSON.stringify(manifest, null, 2));
await browser.close();
server.close();
console.log("完成：聊天室頁面、worksheets/*.pdf、images/*.jpg 已更新");
