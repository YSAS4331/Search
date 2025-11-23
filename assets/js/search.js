(() => {

  // =======================
  // レーベンシュタイン距離
  // =======================
  function levenshtein(a, b) {
    a = String(a);
    b = String(b);
    const la = a.length, lb = b.length;
    if (la === 0) return lb;
    if (lb === 0) return la;

    const prev = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) prev[j] = j;

    for (let i = 1; i <= la; i++) {
      let cur = i;
      for (let j = 1; j <= lb; j++) {
        const insert = prev[j] + 1;
        const del = cur + 1;
        const rep = prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
        const next = Math.min(insert, del, rep);
        prev[j - 1] = cur;
        cur = next;
      }
      prev[lb] = cur;
    }
    return prev[lb];
  }

  // 正規化
  const normalizeText = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const tokenize = (s) => normalizeText(s).split(" ").filter(Boolean);
  const safeLen = (s) => Math.max(1, String(s).length);

  // ======================
  // スコア計算
  // ======================
  function scoreItem(item, queryTokens) {
    const weights = { title: 0.5, tags: 0.25, description: 0.2, url: 0.05 };

    const fieldTokens = {
      title: tokenize(item.title || ""),
      description: tokenize(item.description || ""),
      url: tokenize(item.url || ""),
      tags: tokenize((item.tags || []).join(" "))
    };

    function bestSim(fieldArr) {
      if (!fieldArr.length) return 0;
      let sum = 0;
      for (const q of queryTokens) {
        let best = 0;
        for (const f of fieldArr) {
          const d = levenshtein(q, f);
          const sim = 1 - d / Math.max(safeLen(q), safeLen(f));
          if (sim > best) best = sim;
          if (best === 1) break;
        }
        sum += best;
      }
      return sum / queryTokens.length;
    }

    const sims = {
      title: bestSim(fieldTokens.title),
      tags: bestSim(fieldTokens.tags),
      description: bestSim(fieldTokens.description),
      url: bestSim(fieldTokens.url)
    };

    let weighted = 0;
    for (const k in sims) weighted += sims[k] * weights[k];

    // ボーナス
    const qJoined = queryTokens.join(" ");
    let boost = 0;
    if (normalizeText(item.title).includes(qJoined)) boost += 0.08;
    if (normalizeText(item.description).includes(qJoined)) boost += 0.04;
    if (normalizeText((item.tags || []).join(" ")).includes(qJoined)) boost += 0.12;

    const score = Math.min(1, weighted + boost);
    return score;
  }

  // ======================
  // 検索メイン
  // ======================
  async function search(key) {
    const res = await fetch('https://ysas4331.github.io/search/Index.json');
    const data = await res.json();

    const tokens = tokenize(key);
    if (!tokens.length) return [];

    const results = data
      .map(item => ({ ...item, score: scoreItem(item, tokens) }))
      .filter(v => v.score >= 0.4) // 閾値
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return results;
  }

  // 外部から呼べるようにする
  window.search = async (key) => {
    if (!key) return [];
    return await search(key);
  };

})();
