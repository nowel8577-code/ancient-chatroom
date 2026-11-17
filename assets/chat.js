// 古人聊天室引擎：所有作者共用。作者資料在 people/<id>.js，頁面以 <body data-person="<id>"> 指定。
(() => {
  const id = document.body.dataset.person;
  const P = window.ACP_PEOPLE[id];
  const TOPICS = window.ACP_TOPICS;
  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const SEAT_KEY = id + "_seat", FS_KEY = "acp_fs";
  const chat = $("#chat");
  const cursor = {};
  let busy = false, seat = "", started = false;

  // ===== 頁面外觀 =====
  document.title = P.name + "・AI古人聊天室";
  document.documentElement.style.setProperty("--accent", P.color || "#b3342a");
  $("#who").textContent = P.name;
  document.querySelectorAll(".seal").forEach((el) => (el.textContent = P.seal));
  $("#stage").style.backgroundImage = `url("${ACPScene.dataUrl(P.scene || "mountain", { seed: 11 })}")`;
  $("#dock").innerHTML = TOPICS.map((t) => `<button data-topic="${t.key}">${t.icon} ${t.label}</button>`).join("");
  $("#text").placeholder = "對" + P.short + "說點什麼…";

  // 字體大小
  const fs = $("#fs");
  try { fs.value = localStorage.getItem(FS_KEY) || fs.value; } catch (e) {}
  const applyFs = () => { document.documentElement.style.setProperty("--fs", fs.value + "px"); try { localStorage.setItem(FS_KEY, fs.value); } catch (e) {} };
  fs.oninput = applyFs; applyFs();
  // 全螢幕
  $("#full").onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  };

  // ===== Google 表單回傳（未設定時靜默略過） =====
  function logRow(q, choice, result, score) {
    const C = window.LOG_CONFIG;
    if (!C || !C.formId || C.formId.startsWith("填入")) return;
    const fd = new URLSearchParams();
    fd.append(C.entries.seat, seat);
    fd.append(C.entries.q, q);
    fd.append(C.entries.choice, choice);
    fd.append(C.entries.result, result);
    fd.append(C.entries.score, String(score));
    fetch("https://docs.google.com/forms/d/e/" + C.formId + "/formResponse", { method: "POST", mode: "no-cors", body: fd }).catch(() => {});
  }

  // ===== 訊息 =====
  const scroll = () => (chat.scrollTop = chat.scrollHeight);
  function addMsg(who, html, cls = "") {
    const el = document.createElement("div");
    el.className = "msg " + who;
    el.innerHTML = (who === "them" ? `<div class="ava seal">${P.seal}</div>` : "") + `<div class="bubble ${cls}">${html}</div>`;
    chat.appendChild(el); scroll();
    return el;
  }
  const addText = (who, t) => addMsg(who, esc(t));
  function addSys(t) {
    const el = document.createElement("div");
    el.className = "sys"; el.textContent = t;
    chat.appendChild(el); scroll();
  }
  async function typing(ms) {
    const el = addMsg("them", "<i></i><i></i><i></i>", "dots");
    await sleep(ms);
    el.remove();
  }
  async function say(lines) {
    for (const l of lines) { await typing(Math.min(350 + l.length * 22, 1300)); addText("them", l); }
  }
  // 依序輪播，點完一輪再從頭，確保學生看得到全部內容
  function next(key, list) {
    const i = cursor[key] = cursor[key] === undefined ? 0 : (cursor[key] + 1) % list.length;
    return { item: list[i], i, n: list.length };
  }
  const more = (i, n) => n > 1 && addSys(`第 ${i + 1}／${n} 則，再點一次看下一則`);

  // ===== 八個主題 =====
  const handlers = {
    async intro() { const { item, i, n } = next("intro", P.topics.intro); await say(item); more(i, n); },
    async works() { const { item, i, n } = next("works", P.topics.works); await say(item); more(i, n); },
    async gossip() { const { item, i, n } = next("gossip", P.topics.gossip); await say(item); more(i, n); },

    async map() {
      const M = P.topics.map;
      await say([M.intro]);
      await typing(800);
      addMsg("them", `<div class="maptitle">🗺️ ${esc(P.name)}生平地圖</div><ol class="route">` +
        M.stops.map((s) => `<li><span class="ic">${s.icon}</span><div><b>${esc(s.year)}・${esc(s.place)}</b><p>${esc(s.note)}</p></div></li>`).join("") +
        "</ol>", "card");
      if (M.outro) await say([M.outro]);
    },

    async songs() {
      const { item: S, i, n } = next("songs", P.topics.songs);
      if (S.intro) await say([S.intro]);
      await typing(700);
      const secs = Math.max(6, Math.round(S.lines.join("").length / 3.2));
      const bars = Array.from({ length: 22 }, (_, k) => `<i style="height:${6 + ((k * 37) % 17)}px"></i>`).join("");
      const el = addMsg("them", `<button class="play" aria-label="播放">▶</button><div class="wave">${bars}</div><span class="dur">0:${String(secs).padStart(2, "0")}</span>
        <div class="vtitle">🎤〈${esc(S.title)}〉</div><div class="lyric">${S.lines.map(esc).join("<br>")}</div>`, "voice");
      el.querySelector(".play").onclick = (e) => speak(S, e.currentTarget, el.querySelector(".bubble"));
      if (S.comment) await say([S.comment]);
      more(i, n);
    },

    async video() {
      const { item: V, i, n } = next("video", P.topics.video);
      await videoCall(V);
      more(i, n);
    },

    async photos() {
      const { item: F, i, n } = next("photos", P.topics.photos);
      if (F.intro) await say([F.intro]);
      await typing(900);
      addMsg("them", `<img alt="${esc(F.title)}" src="${ACPScene.dataUrl(F.scene, { seed: F.seed || i + 5 })}"><div class="cap">📷 ${esc(F.title)}</div>`, "photo");
      if (F.lines) await say(F.lines);
      more(i, n);
    },

    quiz: () => startQuiz()
  };

  // 老歌新唱：用瀏覽器語音朗讀
  function speak(S, btn, bubble) {
    const synth = window.speechSynthesis;
    if (!synth) { bubble.classList.add("open"); return; }
    if (synth.speaking) { synth.cancel(); return; }
    const u = new SpeechSynthesisUtterance(S.lines.join("，"));
    u.lang = "zh-TW"; u.rate = 0.8;
    const v = synth.getVoices().find((x) => /zh[-_](TW|HK|CN)/i.test(x.lang));
    if (v) u.voice = v;
    btn.textContent = "■"; bubble.classList.add("playing");
    u.onend = u.onerror = () => { btn.textContent = "▶"; bubble.classList.remove("playing"); };
    synth.speak(u);
  }

  // 視訊聊天：全畫面通話，結束後留下逐字稿
  async function videoCall(V) {
    const ov = $("#call");
    ov.querySelector(".scene").style.backgroundImage = `url("${ACPScene.dataUrl(V.scene, { seed: 21 })}")`;
    ov.querySelector(".ctitle").textContent = V.title;
    const cap = ov.querySelector(".caption"), clock = ov.querySelector(".clock");
    cap.textContent = "連線中…";
    ov.hidden = false;
    let hang = false, t0 = Date.now();
    const tick = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); clock.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }, 500);
    ov.querySelector(".hang").onclick = () => (hang = true);
    await sleep(900);
    for (const l of V.lines) {
      if (hang) break;
      cap.textContent = l;
      for (let w = 0; w < Math.min(1200 + l.length * 90, 4200) && !hang; w += 100) await sleep(100);
    }
    clearInterval(tick);
    ov.hidden = true;
    addSys(`📹 視訊通話結束 ${clock.textContent}`);
    addMsg("them", `<div class="maptitle">📹 通話逐字稿：${esc(V.title)}</div>` + V.lines.map((l) => `<p>${esc(l)}</p>`).join(""), "card");
  }

  async function playTopic(key) {
    if (busy) return;
    busy = true;
    const t = TOPICS.find((x) => x.key === key);
    addText("me", t.icon + " " + t.label);
    try { await handlers[key](); } finally { if (key !== "quiz") busy = false; }
  }

  // ===== 友情考核 =====
  let qOrder = [], qIdx = 0, score = 0;
  async function startQuiz() {
    qOrder = P.quiz.map((_, i) => i).sort(() => Math.random() - 0.5);
    qIdx = 0; score = 0;
    await say([P.quizStart || `哦？小友要考驗老夫與你的交情？好！共 ${qOrder.length} 題，來吧！📜`]);
    await askQ();
  }
  async function askQ() {
    const q = P.quiz[qOrder[qIdx]];
    await typing(600);
    const m = addMsg("them", `第 ${qIdx + 1} 題：${esc(q.q)}<div class="opts"></div>`);
    const opts = m.querySelector(".opts");
    q.options.forEach((o, i) => {
      const b = document.createElement("button");
      b.textContent = o;
      b.onclick = () => answer(q, i, opts);
      opts.appendChild(b);
    });
    scroll();
  }
  async function answer(q, i, opts) {
    const btns = [...opts.children];
    if (btns[0].disabled) return;
    btns.forEach((b) => (b.disabled = true));
    btns[q.answer].classList.add("ok");
    const correct = i === q.answer;
    if (correct) score++; else btns[i].classList.add("bad");
    logRow("第" + (P.quiz.indexOf(q) + 1) + "題：" + q.q, q.options[i], correct ? "對" : "錯", score);
    addText("me", q.options[i]);
    await typing(600);
    addText("them", (correct ? "✅ " : "❌ ") + (correct ? q.right : q.wrong));
    qIdx++;
    if (qIdx < qOrder.length) { await sleep(400); await askQ(); return; }
    const n = qOrder.length;
    logRow("總成績", "-", "完成", score);
    const E = P.quizEnd;
    await say([`考核結束，你答對 ${score}/${n} 題。`, score === n ? E.perfect : score >= n - 2 ? E.good : E.retry]);
    busy = false;
  }

  // ===== 自由輸入（離線關鍵字回覆） =====
  function offlineReply(t) {
    for (const k of P.keywords) if (k.k.some((w) => t.includes(w))) return k.r;
    return pick(P.fallback);
  }
  $("#form").onsubmit = async (e) => {
    e.preventDefault();
    const t = $("#text").value.trim();
    if (!t || busy) return;
    $("#text").value = "";
    addText("me", t);
    busy = true;
    await typing(800);
    addText("them", offlineReply(t));
    busy = false;
  };

  $("#dock").onclick = (e) => { const b = e.target.closest("[data-topic]"); if (b) playTopic(b.dataset.topic); };

  // 對話結束：清空畫面重新開始
  $("#endBtn").onclick = () => {
    if (busy) return;
    chat.innerHTML = "";
    for (const k in cursor) delete cursor[k];
    window.speechSynthesis && speechSynthesis.cancel();
    start();
  };
  if (window.QUIZ_URL) {
    $("#formBtn").hidden = false;
    $("#formBtn").onclick = () => window.open(window.QUIZ_URL, "_blank", "noopener");
  }

  // ===== 座號登入 =====
  try { seat = localStorage.getItem(SEAT_KEY) || ""; } catch (e) {}
  const urlSeat = new URLSearchParams(location.search).get("seat");
  if (urlSeat) seat = urlSeat;
  const dlg = $("#seatDlg");
  $("#dlgTitle").textContent = `歡迎來到${P.name}聊天室`;
  function setSeat(v) {
    seat = v;
    try { localStorage.setItem(SEAT_KEY, v); } catch (e) {}
    $("#seatLabel").textContent = v;
  }
  $("#seatForm").onsubmit = (e) => {
    const v = $("#seatInput").value.trim();
    if (!v) { e.preventDefault(); return; }
    setSeat(v);
    if (!started) start();
  };
  dlg.addEventListener("cancel", (e) => { if (!seat) e.preventDefault(); });
  $("#seatBtn").onclick = () => { $("#seatInput").value = seat; dlg.showModal(); };

  async function start() {
    started = true;
    busy = true;
    addSys(P.name + " 已加入聊天室");
    await say([P.hello, pick(P.greet), "點下方主題按鈕，邊聊邊找學習單的線索吧！"]);
    busy = false;
  }

  if (seat) { $("#seatLabel").textContent = seat; start(); }
  else dlg.showModal();
})();
