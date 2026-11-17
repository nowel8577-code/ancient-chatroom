// 正式作答的 Google 表單連結；留空則不顯示「📝 正式作答」按鈕
window.QUIZ_URL = "https://docs.google.com/forms/d/e/1FAIpQLScjkOSw0Yuy5nZBdjVyagx1ZHzdoXbB0u9q5jd2IWo6wlUVJA/viewform";

// 友情考核逐題回傳 Google 表單（選用，步驟見 docs/Google表單設定.md）；保持「填入表單ID」則不回傳
window.LOG_CONFIG = {
  formId: "填入表單ID",
  entries: { seat: "entry.0000000001", q: "entry.0000000002", choice: "entry.0000000003", result: "entry.0000000004", score: "entry.0000000005" }
};
