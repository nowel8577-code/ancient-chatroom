(() => {
  const D = window.SU;
  const $ = (s) => document.querySelector(s);
  const chat = $("#chat"), form = $("#form"), text = $("#text");
  const aiBtn = $("#aiBtn"), modeLabel = $("#modeLabel");
  const KEY_STORE = "su_gemini_key";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  let aiOn = false, apiKey = "", model = "", busy = false;
  const history = [];
  const last = {}; // 各主題上次輪替索引

  try { apiKey = localStorage.getItem(KEY_STORE) || ""; } catch (e) {}
  const urlKey = new URLSearchParams(location.search).get("key");
  if (urlKey) apiKey = urlKey;

  function scroll() { chat.scrollTop = chat.scrollHeight; }

  function addMsg(who, content) {
    const el = document.createElement("div");
    el.className = "msg " + who;
    if (who === "them") el.innerHTML = '<div class="ava">坡</div>';
    const b = document.createElement("div");
    b.className = "bubble";
    b.textContent = content;
    el.appendChild(b);
    chat.appendChild(el);
    scroll();
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
    el.innerHTML = '<div class="ava">坡</div><div class="bubble"><i></i><i></i><i></i></div>';
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
    const label = { intro: "自我介紹", works: "得意作品", gossip: "八卦趣聞", friends: "文人朋友圈" }[key];
    addMsg("me", label);
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
    await say(["哦？小友要考驗老夫與你的交情？好！共 " + qOrder.length + " 題，答得好，老夫請你吃東坡肉！🍖"]);
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
    addMsg("me", q.options[i]);
    await typing(700);
    addMsg("them", (correct ? "✅ " : "❌ ") + (correct ? q.right : q.wrong));
    qIdx++;
    if (qIdx < qOrder.length) { await sleep(500); await askQ(); }
    else {
      const n = qOrder.length;
      const comment = score === n ? "全對！你是老夫的知音，快來喝一杯！🍶"
        : score >= n - 2 ? "不錯不錯，交情頗深，改日再來切磋。"
        : "尚須多讀蘇詞，小友莫灰心，老夫再為你講講舊事。";
      await say(["考核結束，你答對 " + score + "/" + n + " 題。", comment]);
      busy = false;
    }
  }

  // ===== 離線自由回覆 =====
  function offlineReply(t) {
    for (const k of D.keywords) if (k.k.some((w) => t.includes(w))) return k.r;
    return pick(D.fallback);
  }

  // ===== AI 對話 =====
  const SYSTEM = `你現在扮演北宋文豪蘇軾（字子瞻，號東坡居士，1037–1101），與一位學生用手機通訊軟體聊天。
${D.card}
【規則】
1. 全程維持蘇軾身分，自稱「老夫」，稱對方「小友」，語氣豁達、幽默、帶點自嘲，愛引用自己的詩詞，並用白話解釋給學生。
2. 絕對不可出戲，不可承認自己是 AI 或語言模型。若對方提到手機、網路、AI 等現代事物，以古人視角視為「西洋奇巧之物」或「傳信靈符」，好奇請教。
3. 每次回覆 150～250 字內，可適度使用少量表情符號。
4. 只講有史料依據的內容；傳說或野史要註明「傳說」。不確定時承認「老夫記不清了」，不可捏造。
5. 可隨機抽考學生一句蘇軾名句的意思或出處，並親自評分。
6. 若學生分享心事，用「定風波」「水調歌頭」等作品中的人生智慧回應。`;

  async function discoverModel() {
    if (model) return model;
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey);
      const j = await r.json();
      const names = (j.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m) => m.name.replace("models/", ""))
        .filter((n) => /flash/.test(n) && !/(image|tts|live|thinking|exp|lite)/.test(n));
      model = names.sort().reverse()[0] || "gemini-2.0-flash";
    } catch (e) { model = "gemini-2.0-flash"; }
    return model;
  }

  async function aiReply(t) {
    history.push({ role: "user", parts: [{ text: t }] });
    const m = await discoverModel();
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + m + ":generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: history.slice(-16),
          generationConfig: { maxOutputTokens: 600, temperature: 0.9 }
        })
      }
    );
    const j = await r.json();
    if (!r.ok) throw new Error(j.error && j.error.message || r.status);
    const out = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text).join("").trim();
    if (!out) throw new Error("empty");
    history.push({ role: "model", parts: [{ text: out }] });
    return out;
  }

  function setAI(on) {
    aiOn = on;
    aiBtn.classList.toggle("on", on);
    aiBtn.textContent = on ? "📜 離線模式" : "✨ AI 對話";
    modeLabel.textContent = on ? "AI 即時對話" : "離線劇本模式";
    addSys(on ? "已開啟 AI 即時對話" : "已回到離線劇本模式");
  }

  aiBtn.onclick = () => {
    if (aiOn) return setAI(false);
    if (apiKey) return setAI(true);
    $("#keyDlg").showModal();
  };
  $("#keyCancel").onclick = () => $("#keyDlg").close();
  $("#keyForm").onsubmit = (e) => {
    const v = $("#keyInput").value.trim();
    if (!v) { e.preventDefault(); return; }
    apiKey = v; model = "";
    try { localStorage.setItem(KEY_STORE, v); } catch (er) {}
    setAI(true);
  };
  if (urlKey) setAI(true);

  document.querySelectorAll("[data-topic]").forEach((b) => (b.onclick = () => playTopic(b.dataset.topic)));
  $("#quizBtn").onclick = startQuiz;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const t = text.value.trim();
    if (!t || busy) return;
    text.value = "";
    addMsg("me", t);
    busy = true;
    try {
      if (aiOn) {
        const el = document.createElement("div");
        el.className = "msg them typing";
        el.innerHTML = '<div class="ava">坡</div><div class="bubble"><i></i><i></i><i></i></div>';
        chat.appendChild(el); scroll();
        try {
          const out = await aiReply(t);
          el.remove();
          addMsg("them", out);
        } catch (err) {
          el.remove();
          history.pop();
          addMsg("them", "老夫一時詞窮（連線失敗：" + err.message + "）。先用離線劇本與你聊——" + offlineReply(t));
        }
      } else {
        await typing(900);
        addMsg("them", offlineReply(t));
      }
    } finally { busy = false; }
  };

  // 開場
  (async () => {
    busy = true;
    addSys("蘇軾已加入聊天室");
    await say(["小友來啦！老夫蘇軾，號東坡居士。🍵", pick(D.topics.greet), "點下方主題，或直接打字與我聊天。"]);
    busy = false;
  })();
})();
