// 學習單產生器：worksheet.html?p=<作者id>&v=student|teacher
// 內容來自 people/<id>.js 的 worksheet 欄位，自動排成 A4 頁面。
(async () => {
  const qs = new URLSearchParams(location.search);
  const id = qs.get("p") || (window.ACP_LIST || [])[0];
  const teacher = qs.get("v") === "teacher";
  const CN = "一二三四五六七八九十";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  await new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "people/" + encodeURIComponent(id) + ".js";
    s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  });
  const P = window.ACP_PEOPLE[id];
  const W = P.worksheet;
  const ver = teacher ? "教用版" : "學用版";
  document.title = `${P.name}學習單（${ver}）`;
  document.body.classList.add(teacher ? "teacher" : "student");
  document.getElementById("barName").textContent = `${P.name}・${ver}`;
  const swap = document.getElementById("swap");
  swap.textContent = teacher ? "看學用版" : "看教用版";
  swap.href = `?p=${id}&v=${teacher ? "student" : "teacher"}`;

  // [[答案]] → 空格；[[?4]] → 兩版都空白的作答格
  const blanks = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, (_, a) => {
    const open = /^\?(\d+)$/.exec(a);
    const w = open ? +open[1] : Math.max(3, [...a].length * 1.25 + 1.6);
    return `<span class="bl" style="min-width:${w}em"><span class="a">${open ? "&nbsp;" : a}</span></span>`;
  });

  // 組出區塊（每個區塊不可跨頁；大標與第一題綁在一起避免孤立）
  const blocks = [];
  const head = `<h1><span class="ic">💬</span>AI 古人聊天室學習單 ${W.no} - ${esc(P.name)} (${ver})</h1>
    <div class="meta"><span>班級</span><span>座號</span><span class="n">姓名</span></div>`;
  W.sections.forEach((sec, si) => {
    const t = window.ACP_TOPICS.find((x) => x.key === sec.topic);
    const h = `<div class="sec">${t.icon} ${CN[si]}、${t.label} (${t.en})</div>`;
    sec.items.forEach((it, ii) => {
      let tx = "";
      if (it.label) tx += `<span class="label">${esc(it.label)}</span>`;
      if (it.text) tx += blanks(it.text);
      if (it.poem) tx += `<span class="poem">${blanks(it.poem)}</span>`;
      if (it.note) tx += `<div class="note">${blanks(it.note)}</div>`;
      const item = `<div class="item"><span class="no">${ii + 1}.</span><div class="tx">${tx}</div></div>`;
      blocks.push(ii === 0 ? h + item : item);
    });
  });
  blocks.push(`<div class="ext"><b>課堂延伸</b>　${esc(P.extension)}
    <div class="ln"></div><div class="ln"></div>
    <div class="tip">開放作答：能引用聊天室或課文內容說明即可。</div></div>`);

  await document.fonts.ready;
  const root = document.getElementById("pages");
  let body;
  const newPage = () => {
    const pg = document.createElement("section");
    pg.className = "page";
    pg.innerHTML = '<div class="body"></div><div class="foot"></div>';
    root.appendChild(pg);
    body = pg.querySelector(".body");
  };
  newPage();
  body.innerHTML = head;
  for (const b of blocks) {
    const wrap = document.createElement("div");
    wrap.innerHTML = b;
    body.appendChild(wrap);
    if (body.scrollHeight > body.clientHeight + 1) {
      wrap.remove();
      newPage();
      body.appendChild(wrap);
    }
  }
  const pages = root.querySelectorAll(".page");
  pages.forEach((pg, i) => (pg.querySelector(".foot").textContent = `- ${i + 1} / ${pages.length} -`));
  document.body.dataset.pages = pages.length;
  document.body.dataset.ready = "1";
})();
