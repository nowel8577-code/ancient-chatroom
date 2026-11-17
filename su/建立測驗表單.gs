// 蘇軾古人聊天室・友情考核：到 script.google.com 新增專案，貼上全部內容，執行 createForm
const QUIZ = [
 {
  "q": "蘇軾貶官黃州時，開墾城東的坡地，因此自號什麼？",
  "options": [
   "A. 六一居士",
   "B. 東坡居士",
   "C. 香山居士",
   "D. 易安居士"
  ],
  "answer": 1,
  "right": "正是！東坡居士，記得這片坡地的辛勞，哈哈！",
  "wrong": "非也！六一居士是歐陽脩，香山居士是白居易，易安居士是李清照。我是東坡居士。"
 },
 {
  "q": "「莫聽穿林打葉聲，何妨吟嘯且徐行」出自哪首詞？",
  "options": [
   "A. 水調歌頭",
   "B. 念奴嬌・赤壁懷古",
   "C. 定風波",
   "D. 江城子"
  ],
  "answer": 2,
  "right": "答對了！一蓑煙雨任平生，這份心境你學到了。",
  "wrong": "可惜！那是〈定風波〉。沙湖道中遇雨，我卻覺得從容。"
 },
 {
  "q": "「但願人長久，千里共嬋娟」是蘇軾在中秋懷念誰所作？",
  "options": [
   "A. 父親蘇洵",
   "B. 弟弟蘇轍",
   "C. 好友佛印",
   "D. 學生秦觀"
  ],
  "answer": 1,
  "right": "沒錯！子由，我的弟弟，最懂我，也最常勸我少說話。",
  "wrong": "不對喔！是舍弟蘇轍，字子由。兄弟情深，千里共看一輪明月。"
 },
 {
  "q": "「不識廬山真面目，只緣身在此山中」告訴我們什麼道理？",
  "options": [
   "A. 廬山太高爬不上去",
   "B. 看事情要跳出局限、多方觀察",
   "C. 山中容易迷路",
   "D. 要多爬山"
  ],
  "answer": 1,
  "right": "聰明！當局者迷，換個角度看，真相就出來了。",
  "wrong": "再想想！詩人是借景說理，提醒人莫被自己的位置局限。"
 },
 {
  "q": "蘇軾在惠州寫下「日啖荔枝三百顆，不辭長作嶺南人」，表現出他怎樣的態度？",
  "options": [
   "A. 抱怨被貶",
   "B. 樂觀曠達、隨遇而安",
   "C. 想念家鄉",
   "D. 勸人少吃荔枝"
  ],
  "answer": 1,
  "right": "知我者小友也！身處逆境，仍找得到好滋味。",
  "wrong": "唉，錯了！我雖被貶，卻吃荔枝吃得開心，這是樂觀曠達。"
 },
 {
  "q": "杭州西湖的「蘇堤」是怎麼來的？",
  "options": [
   "A. 蘇軾疏浚西湖，用淤泥築成",
   "B. 蘇軾遊湖時隨手堆的",
   "C. 秦始皇所建",
   "D. 唐朝就有"
  ],
  "answer": 0,
  "right": "正確！為官一任，造福一方，這才是我最驕傲的事。",
  "wrong": "不對喔！老夫疏浚西湖，將淤泥築成長堤，後人才稱『蘇堤』。"
 }
];

function createForm() {
  const form = FormApp.create("蘇軾古人聊天室・友情考核");
  form.setIsQuiz(true)
    .setDescription("請先填班級座號（例：70105），再作答 6 題。")
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setShowLinkToRespondAgain(false);
  form.addTextItem().setTitle("班級座號").setRequired(true);
  QUIZ.forEach((x, i) => {
    const item = form.addMultipleChoiceItem();
    item.setTitle((i + 1) + ". " + x.q)
      .setChoices(x.options.map((o, k) => item.createChoice(o, k === x.answer)))
      .setPoints(1)
      .setRequired(true)
      .setFeedbackForCorrect(FormApp.createFeedback().setText(x.right).build())
      .setFeedbackForIncorrect(FormApp.createFeedback().setText(x.wrong).build());
  });
  const ss = SpreadsheetApp.create("蘇軾友情考核回覆");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Logger.log("學生作答連結：" + form.getPublishedUrl());
  Logger.log("編輯連結：" + form.getEditUrl());
  Logger.log("回覆試算表：" + ss.getUrl());
}
