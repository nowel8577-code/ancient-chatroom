// 水墨山水場景產生器：聊天室背景、視訊聊天、奇蹟美照共用
// 用法：ACPScene.svg("lake", { seed: 3 }) 回傳 SVG 字串
// 場景種類：mountain 山、river 江、lake 湖、moon 月夜、snow 雪、spring 春雨、blossom 花、sea 海、home 家園
(() => {
  const SKIES = {
    day:   ["#f6efe0", "#efe2c6"],
    dusk:  ["#f3d9b8", "#e9c7a0"],
    night: ["#2c3a4f", "#55627a"],
    snow:  ["#e7e9ec", "#cfd4da"],
    spring:["#eef3e6", "#dfe9d2"]
  };
  const KIND = {
    mountain: { sky: "day",    orb: "sun",  water: false, extra: ["pagoda", "birds"] },
    river:    { sky: "dusk",   orb: "sun",  water: true,  extra: ["boat", "birds"] },
    lake:     { sky: "day",    orb: "sun",  water: true,  extra: ["bridge", "willow", "pagoda"] },
    moon:     { sky: "night",  orb: "moon", water: true,  extra: ["bamboo"] },
    snow:     { sky: "snow",   orb: "none", water: false, extra: ["snow", "rider"] },
    spring:   { sky: "spring", orb: "none", water: false, extra: ["rain", "grass", "willow"] },
    blossom:  { sky: "spring", orb: "sun",  water: false, extra: ["blossom", "birds"] },
    sea:      { sky: "day",    orb: "sun",  water: true,  extra: ["palm", "boat"] },
    home:     { sky: "day",    orb: "sun",  water: true,  extra: ["house", "willow"] }
  };

  function rng(seed) {
    let s = (seed * 9301 + 49297) % 233280 || 1;
    return () => (s = (s * 9301 + 49297) % 233280) / 233280;
  }

  function ridge(r, base, amp, w, h) {
    const a1 = r() * 6, a2 = r() * 6, f1 = 1.5 + r() * 2, f2 = 4 + r() * 4;
    let d = `M0 ${h} L0 ${base}`;
    for (let x = 0; x <= w; x += 8) {
      const t = x / w;
      const y = base - amp * (0.6 * Math.sin(t * Math.PI * f1 + a1) + 0.4 * Math.sin(t * Math.PI * f2 + a2)) - amp * 0.4;
      d += ` L${x} ${y.toFixed(1)}`;
    }
    return d + ` L${w} ${h} Z`;
  }

  function svg(kind, opt = {}) {
    const k = KIND[kind] || KIND.mountain;
    const r = rng(opt.seed || kind.length * 7 + 3);
    const W = 400, H = 260, id = "s" + Math.floor(r() * 1e6);
    const night = k.sky === "night";
    const [s1, s2] = SKIES[k.sky];
    const ink = night ? ["#1c2533", "#2a3647", "#3b4a5f"] : k.sky === "snow" ? ["#6d7782", "#8e98a2", "#b3bbc3"] : ["#4b5a55", "#7a8a80", "#a9b5a6"];
    let g = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>
      <filter id="${id}b"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
      <rect width="${W}" height="${H}" fill="url(#${id})"/>`;
    if (k.orb === "sun") g += `<circle cx="${290 + r() * 60}" cy="${50 + r() * 20}" r="22" fill="#e9a07a" opacity=".75"/>`;
    if (k.orb === "moon") g += `<circle cx="300" cy="58" r="26" fill="#f7f1d8"/><circle cx="300" cy="58" r="40" fill="#f7f1d8" opacity=".15"/>`;
    const waterTop = k.water ? 190 : 260;
    g += `<path d="${ridge(r, 120, 50, W, waterTop)}" fill="${ink[2]}" opacity=".55" filter="url(#${id}b)"/>`;
    g += `<path d="${ridge(r, 155, 38, W, waterTop)}" fill="${ink[1]}" opacity=".7"/>`;
    g += `<path d="${ridge(r, 185, 22, W, waterTop)}" fill="${ink[0]}" opacity=".8"/>`;
    if (k.water) {
      g += `<rect y="${waterTop}" width="${W}" height="${H - waterTop}" fill="${night ? "#34435a" : "#c9d6d2"}"/>`;
      for (let i = 0; i < 9; i++) {
        const y = waterTop + 8 + i * 7, x = r() * 300;
        g += `<line x1="${x}" y1="${y}" x2="${x + 40 + r() * 60}" y2="${y}" stroke="${night ? "#f7f1d8" : "#ffffff"}" stroke-width="1.2" opacity=".5"/>`;
      }
    } else {
      g += `<rect y="230" width="${W}" height="30" fill="${k.sky === "snow" ? "#f4f5f7" : "#c8c9a8"}" opacity=".7"/>`;
    }
    const ex = k.extra;
    if (ex.includes("pagoda")) {
      const x = 60 + r() * 40, y = 150;
      for (let i = 0; i < 4; i++) {
        const w = 26 - i * 5, yy = y - i * 13;
        g += `<rect x="${x - w / 2 + 2}" y="${yy - 9}" width="${w - 4}" height="9" fill="#8b3a2e" opacity=".85"/>`;
        g += `<path d="M${x - w / 2 - 4} ${yy - 9} Q${x} ${yy - 15} ${x + w / 2 + 4} ${yy - 9} Z" fill="#3b3b3b"/>`;
      }
    }
    if (ex.includes("boat")) {
      const x = 120 + r() * 120, y = waterTop + 22;
      g += `<path d="M${x - 26} ${y} Q${x} ${y + 12} ${x + 26} ${y} Z" fill="#3a2f28"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 26}" stroke="#3a2f28" stroke-width="2"/><path d="M${x} ${y - 24} L${x + 16} ${y - 4} L${x} ${y - 4} Z" fill="#efe4cc" stroke="#3a2f28" stroke-width=".8"/>`;
    }
    if (ex.includes("bridge")) {
      g += `<path d="M150 ${waterTop + 4} Q200 ${waterTop - 30} 250 ${waterTop + 4}" stroke="#a5452f" stroke-width="5" fill="none"/>`;
      for (let x = 160; x <= 240; x += 10) g += `<line x1="${x}" y1="${waterTop - 4 - 18 * Math.sin(((x - 150) / 100) * Math.PI)}" x2="${x}" y2="${waterTop - 14 - 18 * Math.sin(((x - 150) / 100) * Math.PI)}" stroke="#a5452f" stroke-width="2"/>`;
    }
    if (ex.includes("willow")) {
      const x = 330 + r() * 30, y = waterTop;
      g += `<path d="M${x} ${y} L${x + 2} ${y - 60}" stroke="#4e3d30" stroke-width="4"/>`;
      for (let i = 0; i < 14; i++) {
        const sx = x - 24 + i * 4;
        g += `<path d="M${sx} ${y - 62} Q${sx - 6} ${y - 30} ${sx - 3} ${y - 8 - r() * 14}" stroke="#7d9a62" stroke-width="1.6" fill="none" opacity=".85"/>`;
      }
    }
    if (ex.includes("bamboo")) {
      for (let i = 0; i < 4; i++) {
        const x = 30 + i * 14;
        g += `<line x1="${x}" y1="${H}" x2="${x + 4}" y2="${90 + r() * 30}" stroke="#1e2a24" stroke-width="3"/>`;
        for (let j = 0; j < 4; j++) g += `<path d="M${x + 3} ${120 + j * 28} q14 -4 22 4 q-12 2 -22 -4" fill="#1e2a24"/>`;
      }
    }
    if (ex.includes("snow")) for (let i = 0; i < 70; i++) g += `<circle cx="${r() * W}" cy="${r() * H}" r="${0.8 + r() * 1.8}" fill="#fff" opacity=".9"/>`;
    if (ex.includes("rider")) {
      const x = 210, y = 228;
      g += `<path d="M${x - 16} ${y} l4 -14 h22 l4 14 M${x - 12} ${y - 14} q-6 -4 -4 -10 M${x + 10} ${y - 14} l6 -10" stroke="#2b2b2b" stroke-width="2.4" fill="none"/><circle cx="${x + 2}" cy="${y - 26}" r="5" fill="#2b2b2b"/><path d="M${x - 4} ${y - 22} h12 l-2 9 h-8 Z" fill="#8b3a2e"/>`;
    }
    if (ex.includes("rain")) for (let i = 0; i < 60; i++) { const x = r() * W, y = r() * H; g += `<line x1="${x}" y1="${y}" x2="${x - 3}" y2="${y + 10}" stroke="#7d8f8a" stroke-width=".8" opacity=".6"/>`; }
    if (ex.includes("grass")) for (let i = 0; i < 80; i++) { const x = r() * W, y = 232 + r() * 26; g += `<line x1="${x}" y1="${y}" x2="${x + 2 - r() * 4}" y2="${y - 6 - r() * 6}" stroke="#8fb36a" stroke-width="1.2" opacity="${0.3 + r() * 0.5}"/>`; }
    if (ex.includes("blossom")) {
      g += `<path d="M0 60 Q80 70 140 40 M60 64 Q90 90 120 96" stroke="#4e3d30" stroke-width="3" fill="none"/>`;
      for (let i = 0; i < 40; i++) g += `<circle cx="${r() * 150}" cy="${30 + r() * 80}" r="${2 + r() * 3}" fill="#e79aa8" opacity=".85"/>`;
    }
    if (ex.includes("palm")) g += `<path d="M330 ${waterTop} q6 -40 0 -80" stroke="#4e3d30" stroke-width="4" fill="none"/><path d="M330 ${waterTop - 80} q-30 -6 -44 14 M330 ${waterTop - 80} q30 -6 44 14 M330 ${waterTop - 80} q-14 -20 -36 -16 M330 ${waterTop - 80} q16 -20 36 -14" stroke="#4f6b45" stroke-width="5" fill="none"/>`;
    if (ex.includes("house")) g += `<rect x="70" y="${waterTop - 26}" width="44" height="26" fill="#efe4cc" stroke="#4e3d30"/><path d="M62 ${waterTop - 24} L92 ${waterTop - 44} L122 ${waterTop - 24} Z" fill="#4e3d30"/>`;
    if (ex.includes("birds")) for (let i = 0; i < 4; i++) { const x = 150 + r() * 120, y = 40 + r() * 40; g += `<path d="M${x} ${y} q5 -5 10 0 q5 -5 10 0" stroke="#3b3b3b" stroke-width="1.4" fill="none"/>`; }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${g}</svg>`;
  }

  function dataUrl(kind, opt) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg(kind, opt));
  }

  window.ACPScene = { svg, dataUrl, kinds: Object.keys(KIND) };
})();
