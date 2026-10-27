// Google 表單回傳設定（教師需自行填寫，步驟見 README.md）
// 若 formId 保持「填入表單ID」，網頁照常使用，只是不會回傳答題紀錄。
// 正式作答的 Google 測驗表單連結（執行「建立測驗表單.gs」後得到的「學生作答連結」）；留空則不顯示按鈕
window.QUIZ_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe9GQE6liXGq91x4uMVphZKDwUiwbbh77V5iZ-tuZLknl3L4g/viewform";

window.LOG_CONFIG = {
  formId: "填入表單ID",              // 例：1FAIpQLSd.....（viewform 網址 /d/e/ 與 /viewform 之間那串）
  entries: {
    seat:   "entry.0000000001",      // 班級座號
    q:      "entry.0000000002",      // 題號與題目
    choice: "entry.0000000003",      // 學生選項
    result: "entry.0000000004",      // 對／錯
    score:  "entry.0000000005"       // 本輪累計答對題數
  }
};
