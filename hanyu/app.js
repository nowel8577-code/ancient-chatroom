(() => {
  const D = window.HY;
  const $ = (s) => document.querySelector(s);
  const chat = $("#chat"), form = $("#form"), text = $("#text");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const SEAT_KEY = "hy_seat";
  const last = {};
  let busy = false, seat = "";

  try { seat = localStorage.getItem(SEAT_KEY) || ""; } catch (e) {}
  const urlSeat = new URLSearchParams(location.search).get("seat");
  if (urlSeat) seat = urlSeat;

  // ===== 回傳到 Google 表單（未設定時靜默略過） =====
  function logRow(q, choice, result, score) {
    const C = window.LOG_CONFIG;
    if (!C || !C.formId || C.formId.startsWith("填入")) return;
    const fd = new URLSearchParams();
    fd.append(C.entries.seat, seat);
    fd.append(C.entries.q, q);
    fd.append(C.entries.choice, choice);
    fd.append(C.entries.result, result);
    fd.append(C.entries.score, String(score));
    fetch("https://docs.google.com/forms/d/e/" + C.formId + "/formResponse", {
      method: "POST", mode: "no-cors", body: fd
    }).catch(() => {});
  }

  function scroll() { chat.scrollTop = chat.scrollHeight; }
  function addMsg(who, content) {
    const el = document.createElement("div");
    el.className = "msg " + who;
    if (who === "them") el.innerHTML = '<div class="ava">愈</div>';
    const b = document.createElement("div");
    b.className = "bubble";
    b.textContent = content;
    el.appendChild(b);
    chat.appendChild(el); scroll();
    return el;
  }
  function addSys(t) {
    const el = document.createElement("div");
    el.className = "sys"; el.textContent = t;
    chat.appendChild(el); scroll();
  }
  async function typing(ms) {
    const el = document.createElement("div");
    el.className = "msg them typing";
    el.innerHTML = '<div class="ava">愈</div><div class="bubble"><i></i><i></i><i></i></div>';
    chat.appendChild(el); scroll();
    await sleep(ms);
    el.remove();
  }
  async function say(lines) {
    for (const l of lines) {
      await typing(Math.min(400 + l.length * 25, 1400));
      addMsg("them", l);
    }
  }

  async function playTopic(key) {
    if (busy) return;
    busy = true;
    addMsg("me", { intro: "自我介紹", works: "得意作品", gossip: "八卦趣聞", friends: "文人朋友圈" }[key]);
    const pool = D.topics[key];
    let i;
    do { i = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && i === last[key]);
    last[key] = i;
    await say(pool[i]);
    busy = false;
  }

  // ===== 友情考核 =====
  let qOrder = [], qIdx = 0, score = 0;
  async function startQuiz() {
    if (busy) return;
    busy = true;
    addMsg("me", "友情考核");
    qOrder = D.quiz.map((_, i) => i).sort(() => Math.random() - 0.5);
    qIdx = 0; score = 0;
    await say(["哦？小友要考驗老夫與你的交情？好！共 " + qOrder.length + " 題，來吧！📜"]);
    await askQ();
  }
  async function askQ() {
    const q = D.quiz[qOrder[qIdx]];
    await typing(700);
    const m = addMsg("them", "第 " + (qIdx + 1) + " 題：" + q.q);
    const opts = document.createElement("div");
    opts.className = "opts";
    q.options.forEach((o, i) => {
      const b = document.createElement("button");
      b.textContent = o;
      b.onclick = () => answer(q, i, opts);
      opts.appendChild(b);
    });
    m.querySelector(".bubble").appendChild(opts);
    scroll();
  }
  async function answer(q, i, opts) {
    const btns = [...opts.children];
    btns.forEach((b) => (b.disabled = true));
    btns[q.answer].classList.add("ok");
    const correct = i === q.answer;
    if (correct) score++; else btns[i].classList.add("bad");
    logRow("第" + (D.quiz.indexOf(q) + 1) + "題：" + q.q, q.options[i], correct ? "對" : "錯", score);
    addMsg("me", q.options[i]);
    await typing(700);
    addMsg("them", (correct ? "✅ " : "❌ ") + (correct ? q.right : q.wrong));
    qIdx++;
    if (qIdx < qOrder.length) { await sleep(500); await askQ(); }
    else {
      const n = qOrder.length;
      logRow("總成績", "-", "完成", score);
      const comment = score === n ? "全對！小友學問紮實，老夫佩服！🍶"
        : score >= n - 2 ? "不錯不錯，再讀讀〈師說〉與〈進學解〉，更上一層樓。"
        : "尚須用功，小友莫灰心。多聽老夫講講舊事，再來挑戰。";
      await say(["考核結束，你答對 " + score + "/" + n + " 題。", comment]);
      busy = false;
    }
  }

  function offlineReply(t) {
    for (const k of D.keywords) if (k.k.some((w) => t.includes(w))) return k.r;
    return pick(D.fallback);
  }

  document.querySelectorAll("[data-topic]").forEach((b) => (b.onclick = () => playTopic(b.dataset.topic)));
  $("#quizBtn").onclick = startQuiz;
  if (window.QUIZ_URL) {
    const fb = $("#formBtn");
    fb.hidden = false;
    fb.onclick = () => window.open(window.QUIZ_URL, "_blank", "noopener");
  }
  form.onsubmit = async (e) => {
    e.preventDefault();
    const t = text.value.trim();
    if (!t || busy) return;
    text.value = "";
    addMsg("me", t);
    busy = true;
    await typing(900);
    addMsg("them", offlineReply(t));
    busy = false;
  };

  // ===== 座號登入 =====
  const dlg = $("#seatDlg");
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

  let started = false;
  async function start() {
    started = true;
    busy = true;
    addSys("韓愈已加入聊天室");
    await say(["小友來啦！老夫韓愈，字退之。", pick(D.topics.greet), "點下方主題，或直接打字與我聊天。"]);
    busy = false;
  }

  if (seat) { $("#seatLabel").textContent = seat; start(); }
  else dlg.showModal();
})();
