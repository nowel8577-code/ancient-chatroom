// 吳敬梓古人聊天室・友情考核：到 script.google.com 新增專案，貼上全部內容，執行 createForm
const QUIZ = [
 {
  "q": "吳敬梓寫成的長篇諷刺小說是哪一部？",
  "options": [
   "A. 紅樓夢",
   "B. 儒林外史",
   "C. 官場現形記",
   "D. 老殘遊記"
  ],
  "answer": 1,
  "right": "正是《儒林外史》！在南京寫了十幾年呢。",
  "wrong": "不對喔！《紅樓夢》是曹雪芹寫的，《官場現形記》《老殘遊記》是晚清譴責小說。在下寫的是《儒林外史》。"
 },
 {
  "q": "范進看到中舉報帖後，說的話是哪一句？",
  "options": [
   "A. 天上的文曲星",
   "B. 我自倒運",
   "C. 噫！好了！我中了！",
   "D. 岳父見教的是"
  ],
  "answer": 2,
  "right": "沒錯！六個字，道盡幾十年的心酸。",
  "wrong": "再想想！范進拍手笑道：『噫！好了！我中了！』然後就跌倒瘋了。"
 },
 {
  "q": "范進中舉前，胡屠戶罵他「癩蝦蟆想吃起天鵝肉」，表現胡屠戶什麼性格？",
  "options": [
   "A. 勢利粗鄙",
   "B. 溫和謙虛",
   "C. 公正無私",
   "D. 膽小怕事"
  ],
  "answer": 0,
  "right": "答對！中舉前看不起，中舉後巴結，就是勢利。",
  "wrong": "可惜！這種尖酸刻薄、看人下菜碟的嘴臉，是勢利粗鄙。"
 },
 {
  "q": "《儒林外史》全書以什麼為「骨」？",
  "options": [
   "A. 兒女情長",
   "B. 功名富貴",
   "C. 江湖義氣",
   "D. 神魔鬥法"
  ],
  "answer": 1,
  "right": "知我者小友也！功名富貴無憑據。",
  "wrong": "不對！在下這部書以『功名富貴』為骨，寫讀書人為它丟了什麼。"
 },
 {
  "q": "魯迅用哪句話稱讚《儒林外史》的諷刺手法？",
  "options": [
   "A. 辭氣浮躁，筆無藏鋒",
   "B. 文起八代之衰",
   "C. 慼而能諧，婉而多諷",
   "D. 老嫗能解"
  ],
  "answer": 2,
  "right": "正確！含蓄委婉，又令人發笑。",
  "wrong": "錯了！『辭氣浮躁，筆無藏鋒』是魯迅批評譴責小說的話。他說在下的書『慼而能諧，婉而多諷』。"
 },
 {
  "q": "吳敬梓三十三歲離開故鄉全椒，移居到哪裡？",
  "options": [
   "A. 北京",
   "B. 揚州",
   "C. 杭州",
   "D. 南京"
  ],
  "answer": 3,
  "right": "沒錯！秦淮河畔，所以我自稱秦淮寓客。",
  "wrong": "不對！我移居南京，住在秦淮河畔。揚州是我去世的地方。"
 }
];

function createForm() {
  const form = FormApp.create("吳敬梓古人聊天室・友情考核");
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
  const ss = SpreadsheetApp.create("吳敬梓友情考核回覆");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Logger.log("學生作答連結：" + form.getPublishedUrl());
  Logger.log("編輯連結：" + form.getEditUrl());
  Logger.log("回覆試算表：" + ss.getUrl());
}
