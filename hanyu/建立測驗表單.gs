// 韓愈古人聊天室・友情考核：到 script.google.com 新增專案，貼上全部內容，執行 createForm
const QUIZ = [
 {
  "q": "韓愈與下列何人共同倡導古文運動？",
  "options": [
   "A. 柳宗元",
   "B. 白居易",
   "C. 李白",
   "D. 杜甫"
  ],
  "answer": 0,
  "right": "正確！韓柳並稱，同為古文運動的旗手。",
  "wrong": "不對喔！與老夫並肩倡導古文的是柳宗元，世稱『韓柳』。"
 },
 {
  "q": "〈師說〉說「師者，所以傳道受業解惑也」。下列何者「不是」老師的任務？",
  "options": [
   "A. 傳授道理",
   "B. 教授學業",
   "C. 解答疑惑",
   "D. 幫學生排名次"
  ],
  "answer": 3,
  "right": "答對了！老師要做的是傳道、受業、解惑。",
  "wrong": "再想想！『傳道、受業、解惑』三件事，並不包括排名次。"
 },
 {
  "q": "「世有伯樂，然後有千里馬」主要在感嘆什麼？",
  "options": [
   "A. 養馬很重要",
   "B. 人才需要有人賞識",
   "C. 馬跑得很快",
   "D. 要多騎馬"
  ],
  "answer": 1,
  "right": "小友明白了！以馬喻人，可惜人才常被埋沒。",
  "wrong": "可惜！這是借馬喻人，感嘆人才需要伯樂賞識。"
 },
 {
  "q": "「業精於勤，荒於嬉；行成於思，毀於隨」出自哪一篇？",
  "options": [
   "A. 師說",
   "B. 進學解",
   "C. 原道",
   "D. 送孟東野序"
  ],
  "answer": 1,
  "right": "正確！〈進學解〉，勉勵學生勤奮。",
  "wrong": "不對！這是老夫在國子監勉勵學生所寫的〈進學解〉。"
 },
 {
  "q": "韓愈被貶潮州，是因為上了哪一篇文章？",
  "options": [
   "A. 師說",
   "B. 進學解",
   "C. 諫迎佛骨表",
   "D. 雜說四"
  ],
  "answer": 2,
  "right": "沒錯！直言反對迎佛骨，觸怒了皇帝，老夫無悔。",
  "wrong": "錯了！老夫是因為〈諫迎佛骨表〉而被貶往潮州。"
 },
 {
  "q": "傳說「推敲」的典故中，韓愈建議賈島用哪一個字？",
  "options": [
   "A. 推",
   "B. 敲",
   "C. 叩",
   "D. 拍"
  ],
  "answer": 1,
  "right": "正是『敲』字！（不過這是軼事傳說，並非確切史實。）",
  "wrong": "傳說中老夫說的是『敲』字好。（此為軼事，真假難考。）"
 }
];

function createForm() {
  const form = FormApp.create("韓愈古人聊天室・友情考核");
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
  const ss = SpreadsheetApp.create("韓愈友情考核回覆");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Logger.log("學生作答連結：" + form.getPublishedUrl());
  Logger.log("編輯連結：" + form.getEditUrl());
  Logger.log("回覆試算表：" + ss.getUrl());
}
