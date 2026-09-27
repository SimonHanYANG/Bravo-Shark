/* =====================================================================
   院校版（2026-09-27 新增）
   ---------------------------------------------------------------------
   要解决的问题：这个产品是给学生用的单文件离线工具。要把它卖给高校，
   现有的形态里缺一个落点 —— 就业办拿到的是什么、怎么验收、第二年
   凭什么续约，产品里都没有对应的地方。这一页就是那个落点。

   ★ 四条纪律（以后改动不要松）
     ① **不做假的 B 端。** 没有服务器、没有账号，拿不到全体学生的数据。
        这件事必须写在界面上，不许含糊：覆盖率完全取决于学生自愿提交。
     ② **算不出来的指标不许编。** 投递通过率、录用率、学生满意度、节省工时
        —— 这四项本地产品**拿不到**（需要企业侧反馈或问卷）。报告里只列名目、
        不给数字，也不给「估算值」。
     ③ **试点成果字段一律待填。** 试点还没跑完，报告里那些格子写「待填」，
        不写占位数字。与 pay.js 的价格纪律是同一条。
     ④ **学生导出的文件只含计数，不含任何内容原文。**
        简历正文、吐槽文字、面试回答、劳议场景输入 —— 一个字节都不进这个文件。
        build.py 有断言守着这一点。

   ★ 为什么入口放在侧栏底部而不是导航里：
     导航（navpin.js 的 TRACKS）是按**学生动线**排的，院校版不属于任何一条
     学生动线，塞进去会破坏动线语义，且要同步改 icons.js / TRACKS / 两条通道。
     它和「设置 / 说明 / 隐私与数据」是同一类东西：关于这个产品本身的入口。

   ★ 状态键 S.campus（必须同时在 app.js 的初始 S 里声明，否则刷新就丢）。
     · sid   本机匿名串（随机生成，不含任何个人信息，换设备会变）
     · packs 已导入的学生数据包（只存计数摘要）
     · fill  报告里那几个待填字段
     · plan  三档的价格与说明（价格不预设）
   ===================================================================== */

var CAMPUS_CSS_ID = "campusCss";
var CAMPUS_KIND = "campus-usage";

/* 学生包里的栏目键 → 人话。★ 只列学生真正会用的九个栏目，
   不含 me / campus 这两个非栏目视图。 */
var CAMPUS_VIEWN = [
  ["job",       "职场画像"],
  ["interview", "面试模拟"],
  ["rival",     "你的竞品"],
  ["school",    "小鱼课堂"],
  ["dispute",   "劳议鲨手"],
  ["status",    "工作状态"],
  ["grow",      "进化雷达"],
  ["chatter",   "吐槽蛐蛐"],
  ["tool",      "鱼群密语"],
  ["pay",       "付费服务"]
];

/* 行为项 → 人话。左边是数据包字段，右边是报告里显示的名字。 */
var CAMPUS_ACTN = [
  ["resumeParsed", "解析过简历"],
  ["matchRun",     "做过岗位匹配"],
  ["mockStarted",  "开过一次面试模拟"],
  ["mockDone",     "走完过一整场模拟"],
  ["disputeRun",   "用过劳议鲨手"],
  ["phraseRun",    "查过鱼群密语"],
  ["bookCount",    "错题集里有记录"],
  ["todoCount",    "建过待办事项"],
  ["fishCount",    "放过自己的鱼"],
  ["docCount",     "用过文档夹"],
  ["workCount",    "记过作品与经历"]
];

/* ---------------------------------------------------------------------
   状态
   --------------------------------------------------------------------- */
function campusState(){
  if(!S.campus || typeof S.campus !== "object") S.campus = {};
  if(typeof S.campus.sid !== "string") S.campus.sid = "";
  if(!Array.isArray(S.campus.packs)) S.campus.packs = [];
  if(!S.campus.fill || typeof S.campus.fill !== "object") S.campus.fill = {};
  if(!S.campus.plan || typeof S.campus.plan !== "object") S.campus.plan = {};
  return S.campus;
}
function campusSid(){
  var st = campusState();
  /* 匿名串：6 位随机大写串。★ 不是学号、不是手机号、不是设备指纹，
     换浏览器/清缓存就变一个 —— 它唯一的用途是「这份文件和那份文件是不是同一个人」。 */
  if(!st.sid){ st.sid = String(uid() || "").toUpperCase().slice(0, 6) || "S00000"; save(); }
  return st.sid;
}
function campusFill(k){
  var st = campusState();
  return typeof st.fill[k] === "string" ? st.fill[k] : "";
}
function campusSetFill(k, v){
  var st = campusState();
  st.fill[k] = String(v == null ? "" : v);
  campusLazySave();
}
function campusPlanVal(k){
  var st = campusState();
  return typeof st.plan[k] === "string" ? st.plan[k] : "";
}

/* ---------------------------------------------------------------------
   样式：随模块注入，不写进 style.html
   （子集化样式表按保留类名过滤，新类名写进去会被切走、界面静默变白。
     颜色一律带兜底 var(--x,#hex)，取不到令牌也不会失效。）
   ★ 新类名全部带 cp- 前缀，且限定在 #campusOut 下 —— 不与既有类名撞名。
     注意：报告导出用的是另一套独立内联样式（campusReportHTML），不在这里。
   --------------------------------------------------------------------- */
function injectCampusCSS(){
  if(document.getElementById(CAMPUS_CSS_ID)) return;
  var css = [
  "#campusOut{max-width:920px}",

  ".cp-intro{border:1px solid var(--line,#E7DFD4);background:var(--bg2,#FFFFFF);border-radius:14px;",
    "padding:16px 18px;margin:4px 0 16px}",
  ".cp-intro h2{font-size:15.5px;margin:0 0 8px;color:var(--txt,#2B2620)}",
  ".cp-intro p{font-size:13.5px;line-height:1.78;color:var(--dim,#58514A);margin:0 0 9px}",
  ".cp-intro p:last-child{margin-bottom:0}",
  ".cp-intro b{color:var(--gold,#1E3A5F)}",
  ".cp-warn{border-left:3px solid var(--red,#C9553D);background:var(--bg3,#F7F1E8);",
    "border-radius:0 10px 10px 0;padding:10px 13px;margin:10px 0 0;font-size:13px;",
    "line-height:1.75;color:var(--dim,#58514A)}",
  ".cp-warn b{color:var(--red,#C9553D)}",

  ".cp-sec{margin:0 0 22px}",
  ".cp-sec-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;margin:0 0 10px;",
    "padding-left:13px;position:relative}",
  ".cp-sec-h::before{content:'';position:absolute;left:0;top:.5em;width:8px;height:2px;",
    "border-radius:2px;background:var(--gold,#1E3A5F)}",
  ".cp-sec-h h2{font-size:16px;margin:0;color:var(--txt,#2B2620);letter-spacing:-.2px}",
  ".cp-sec-h span{font-size:12.5px;color:var(--dim2,#8A8175)}",

  ".cp-steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(204px,1fr));gap:10px}",
  ".cp-step{border:1px solid var(--line,#E7DFD4);background:var(--bg2,#FFFFFF);",
    "border-radius:13px;padding:13px 15px;position:relative}",
  ".cp-step i{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;",
    "border-radius:50%;background:var(--gold,#1E3A5F);color:#fff;font-size:11.5px;font-style:normal;",
    "font-weight:700;margin-bottom:7px}",
  ".cp-step h3{font-size:13.5px;margin:0 0 5px;color:var(--txt,#2B2620);line-height:1.5}",
  ".cp-step p{font-size:12.5px;line-height:1.7;color:var(--dim,#58514A);margin:0}",
  ".cp-step .cp-stepn{font-size:11.5px;color:var(--dim2,#8A8175);display:block;margin-top:6px}",

  ".cp-note{font-size:12.5px;line-height:1.78;color:var(--dim2,#8A8175);margin:10px 0 0}",
  ".cp-note b{color:var(--dim,#58514A)}",
  ".cp-quote{border:1px dashed var(--line2,#D6C9B4);background:var(--bg3,#F7F1E8);",
    "border-radius:12px;padding:13px 15px;font-size:13px;line-height:1.85;",
    "color:var(--dim,#58514A);white-space:pre-wrap;margin:0 0 12px}",

  ".cp-acts{display:flex;flex-wrap:wrap;gap:9px;align-items:center}",
  ".cp-acts button{font-size:12.5px;padding:7px 15px;border-radius:999px}",
  ".cp-acts .cpn{font-size:12px;color:var(--dim2,#8A8175)}",

  ".cp-drop{border:1.5px dashed var(--line2,#D6C9B4);border-radius:13px;padding:20px 18px;",
    "text-align:center;background:var(--bg2,#FFFFFF);margin:0 0 12px}",
  ".cp-drop b{display:block;font-size:13.5px;color:var(--txt,#2B2620);margin-bottom:6px}",
  ".cp-drop span{font-size:12.5px;color:var(--dim2,#8A8175);line-height:1.7}",

  ".cp-stat{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:9px;margin:0 0 12px}",
  ".cp-kpi{border:1px solid var(--line,#E7DFD4);background:var(--bg2,#FFFFFF);",
    "border-radius:12px;padding:11px 13px}",
  ".cp-kpi b{display:block;font-size:19px;color:var(--gold,#1E3A5F);line-height:1.25}",
  ".cp-kpi span{font-size:11.5px;color:var(--dim2,#8A8175);display:block;margin-top:3px}",

  ".cp-tbl{width:100%;border-collapse:collapse;font-size:12.5px;margin:0 0 12px}",
  ".cp-tbl th,.cp-tbl td{border-bottom:1px solid var(--line,#E7DFD4);padding:7px 8px;text-align:left}",
  ".cp-tbl th{font-size:11.5px;color:var(--dim2,#8A8175);font-weight:700}",
  ".cp-tbl td b{color:var(--txt,#2B2620)}",
  ".cp-tbl .cpbar{height:5px;border-radius:3px;background:var(--gold,#1E3A5F);opacity:.5;min-width:2px}",

  ".cp-can{list-style:none;margin:0;padding:0}",
  ".cp-can li{font-size:12.5px;line-height:1.78;color:var(--dim,#58514A);",
    "padding-left:17px;position:relative}",
  ".cp-can li::before{content:'✕';position:absolute;left:0;top:0;color:var(--red,#C9553D);",
    "font-size:11.5px;line-height:1.9}",
  ".cp-can li b{color:var(--txt,#2B2620)}",

  ".cp-fill{display:grid;grid-template-columns:1fr;gap:10px;margin:0 0 12px}",
  ".cp-fill label{display:block}",
  ".cp-fill .cpfn{font-size:12.5px;font-weight:700;color:var(--txt,#2B2620);",
    "display:block;margin-bottom:5px;line-height:1.55}",
  ".cp-fill .cpfh{font-size:11.5px;color:var(--dim2,#8A8175);font-weight:400}",
  ".cp-fill input,.cp-fill textarea{width:100%;font-size:13px;line-height:1.7;",
    "border:1px solid var(--line,#E7DFD4);border-radius:10px;padding:8px 10px;",
    "background:var(--bg2,#FFFFFF);color:var(--txt,#2B2620);font-family:inherit}",
  ".cp-fill textarea{min-height:66px;resize:vertical}",

  ".cp-plan{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}",
  ".cp-plancard{border:1px solid var(--line,#E7DFD4);background:var(--bg2,#FFFFFF);",
    "border-radius:13px;padding:14px 16px;display:flex;flex-direction:column;gap:7px}",
  ".cp-plancard h3{font-size:14.5px;margin:0;color:var(--txt,#2B2620)}",
  ".cp-plancard .cppd{font-size:12.5px;line-height:1.7;color:var(--dim,#58514A);margin:0}",
  ".cp-plancard .cppget{font-size:12.5px;line-height:1.72;color:var(--dim2,#8A8175);margin:0;",
    "padding-top:7px;border-top:1px dashed var(--line,#E7DFD4)}",
  ".cp-price{font-size:13px;font-weight:700;color:var(--txt,#2B2620)}",
  ".cp-price.cpptodo{font-weight:400;color:var(--dim2,#8A8175);border:1px dashed var(--line2,#D6C9B4);",
    "border-radius:999px;padding:1px 9px;font-size:11.5px}",
  ".cp-plancard input{font-size:12.5px;border:1px solid var(--line,#E7DFD4);border-radius:8px;",
    "padding:6px 9px;background:var(--bg,#FCFAF7);color:var(--txt,#2B2620);font-family:inherit}",

  ".cp-empty{font-size:13px;color:var(--dim2,#8A8175);border:1px dashed var(--line2,#D6C9B4);",
    "border-radius:12px;padding:15px 17px}",
  "@media(max-width:560px){.cp-steps,.cp-plan{grid-template-columns:1fr}}"
  ].join("\n");
  var s = document.createElement("style");
  s.id = CAMPUS_CSS_ID;
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
}

/* ---------------------------------------------------------------------
   学生端：生成数据包
   ★ 纪律 ④ 就落在这个函数里 —— 下面每一个字段要么是计数、要么是布尔，
     没有任何一个字段来自 resume.raw / chatter 正文 / sess.msgs / dis.ans。
   --------------------------------------------------------------------- */
function campusPack(){
  var t = Array.isArray(S.track) ? S.track : [];
  var dayCount = {}, views = {};
  t.forEach(function(x){
    try{
      if(!x) return;
      if(x.at){
        var d = new Date(x.at);
        if(!isNaN(d.getTime())){
          var k = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2)
                + "-" + ("0" + d.getDate()).slice(-2);
          dayCount[k] = (dayCount[k] || 0) + 1;
        }
      }
      if(x.e === "view" && x.m && x.m.v) views[x.m.v] = (views[x.m.v] || 0) + 1;
    }catch(e){}
  });
  var dayList = Object.keys(dayCount).sort();
  var act = {
    resumeParsed: (S.resume && S.resume.facts) ? 1 : 0,
    matchRun:     S.match ? 1 : 0,
    mockStarted:  S.sess ? 1 : 0,
    mockTurns:    (S.sess && Array.isArray(S.sess.turns)) ? S.sess.turns.length : 0,
    mockDone:     (S.sess && S.sess.done) ? 1 : 0,
    disputeRun:   (S.dis && S.dis.type) ? 1 : 0,
    phraseRun:    S.bbxLast ? 1 : 0,
    bookCount:    (S.book  || []).length,
    todoCount:    (S.todo  || []).length,
    fishCount:    (S.fish  || []).length,
    docCount:     (S.docs  || []).length,
    workCount:    (S.works || []).length
  };
  return {
    _meta:{
      product:"offer鲨 · 职场鱼塘",
      kind:CAMPUS_KIND, v:1,
      exportAt:new Date().toLocaleString(),
      note:"本机行为计数。不含简历正文、不含吐槽与面试回答内容、不含姓名与学号。"
    },
    sid:campusSid(),
    days:dayList.length,
    firstDay:dayList[0] || "",
    lastDay:dayList[dayList.length - 1] || "",
    dayCount:dayCount,
    views:views,
    act:act
  };
}
function campusToday(){
  var d = new Date();
  return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
}
function campusViewTotal(p){
  var n = 0;
  for(var k in p.views) n += p.views[k];
  return n;
}
function campusExportStudent(){
  var p = campusPack();
  if(!campusViewTotal(p)){ toast("还没有使用记录：先用几个栏目，再回来导出"); return; }
  downloadText("职场鱼塘_使用数据_" + campusToday() + ".json", JSON.stringify(p, null, 1), "application/json");
  trackPush("campus_export", { days:p.days, sid:p.sid });
  toast("已导出：用了 " + p.days + " 天 · 把这个文件交给就业办");
}

/* ---------------------------------------------------------------------
   院校端：导入 + 合并
   --------------------------------------------------------------------- */
function campusParsePack(txt){
  var o;
  try{ o = JSON.parse(String(txt || "")); }catch(e){ return null; }
  if(!o || typeof o !== "object") return null;
  if(!o._meta || o._meta.kind !== CAMPUS_KIND) return null;
  /* 归一：外部文件不能信，缺字段一律补零，不能让报告算出 NaN */
  if(typeof o.sid !== "string") o.sid = "";
  if(!o.views || typeof o.views !== "object") o.views = {};
  if(!o.act   || typeof o.act   !== "object") o.act = {};
  if(!o.dayCount || typeof o.dayCount !== "object") o.dayCount = {};
  var d = Object.keys(o.dayCount).sort();
  if(typeof o.days !== "number") o.days = d.length;
  if(typeof o.firstDay !== "string") o.firstDay = d[0] || "";
  if(typeof o.lastDay  !== "string") o.lastDay  = d[d.length - 1] || "";
  Object.keys(o.act).forEach(function(k){ if(typeof o.act[k] !== "number") o.act[k] = Number(o.act[k]) || 0; });
  return o;
}
function campusReadFiles(files, cb){
  var list = Array.prototype.slice.call(files || []);
  if(!list.length){ cb([]); return; }
  var out = [], left = list.length;
  function fin(){ if(--left === 0) cb(out); }
  list.forEach(function(f){
    try{
      var r = new FileReader();
      r.onload = function(){
        var p = campusParsePack(r.result);
        out.push({ name:f.name, pack:p });
        fin();
      };
      r.onerror = function(){ out.push({ name:f.name, pack:null }); fin(); };
      r.readAsText(f);
    }catch(e){ out.push({ name:f.name, pack:null }); fin(); }
  });
}
function campusMerge(){
  var st = campusState(), packs = st.packs;
  var m = { n:packs.length, views:{}, act:{}, daySet:{}, firstD:"", lastD:"", daySum:0 };
  packs.forEach(function(p){
    var k;
    for(k in p.views) if(p.views[k]) m.views[k] = (m.views[k] || 0) + 1;   /* 触达人数，不是次数 */
    for(k in p.act){
      if(!m.act[k]) m.act[k] = 0;
      if(p.act[k]) m.act[k] += 1;                                        /* 布尔项求和 = 触达人数 */
    }
    for(k in p.dayCount) m.daySet[k] = 1;
    /* ★ 平均使用天数要按「每人自己的天数之和」算。
       用「覆盖天数 ÷ 人数」是错的 ： 那是并集，会低估（多人同一天用只算一天）。 */
    m.daySum += (typeof p.days === "number" ? p.days : 0);
    if(p.firstDay && (!m.firstD || p.firstDay < m.firstD)) m.firstD = p.firstDay;
    if(p.lastDay  && (!m.lastD  || p.lastDay  > m.lastD )) m.lastD  = p.lastDay;
  });
  m.days = Object.keys(m.daySet).length;
  m.sumAct = {};
  packs.forEach(function(p){
    for(var k in p.act){ if(!m.sumAct[k]) m.sumAct[k] = 0; m.sumAct[k] += (p.act[k] || 0); }
  });
  return m;
}
function campusImport(files){
  campusReadFiles(files, function(res){
    var st = campusState(), ok = 0, bad = [];
    var seen = {};
    st.packs.forEach(function(p){ if(p.sid) seen[p.sid] = 1; });
    res.forEach(function(r){
      if(!r.pack){ bad.push(r.name); return; }
      /* 同一个人重复提交：按 sid 去重，取后一份（学生后来又用了一段时间） */
      if(r.pack.sid && seen[r.pack.sid]){
        st.packs = st.packs.filter(function(p){ return p.sid !== r.pack.sid; });
      }
      if(r.pack.sid) seen[r.pack.sid] = 1;
      st.packs.push(r.pack); ok++;
    });
    save();
    trackPush("campus_import", { ok:ok, bad:bad.length });
    if(!ok && bad.length) toast("这 " + bad.length + " 个文件不是院校版导出的数据包");
    else if(bad.length)   toast("导入 " + ok + " 份 · " + bad.length + " 个文件读不出（格式不对）");
    else                  toast("导入 " + ok + " 份数据");
    renderCampus();
  });
}
function campusClearPacks(){
  var st = campusState();
  st.packs = [];
  save();
  toast("已清空导入的数据");
  renderCampus();
}

/* ---------------------------------------------------------------------
   报告：自动部分（算得出来的）+ 待填部分（试点期人工填）+ 算不了的
   ★ 纪律 ② 落在 CAMPUS_CANT 上：四项写清「为什么算不出来」，不给估算值。
   --------------------------------------------------------------------- */
var CAMPUS_FILL = [
  { k:"people", n:"实际参与人数", h:"以学院的名单为准，不是提交文件的人数", multi:false,
    ph:"例：某专业 2026 届 · 62 人" },
  { k:"span",   n:"试点范围与周期", h:"哪个学院 / 哪几个专业 / 从哪天到哪天", multi:false,
    ph:"例：信息工程学院 · 软件技术 1—2 班 · 4 周" },
  { k:"voice",  n:"学生反馈摘录", h:"匿名引用原话，2—3 条即可。★ 这里填的是你收集到的反馈，不是本产品生成的",
    multi:true, ph:"例：\u201c以前不知道简历哪里有问题，现在能看到缺什么。\u201d" },
  { k:"teacher",n:"就业办负责人评价", h:"一段话，可用于工作总结", multi:true,
    ph:"例：\u201c学生自助完成度比往年宣讲会高，老师不用再逐个改简历。\u201d" },
  { k:"satis",  n:"满意度", h:"★ 必须写明口径（几个人答的、怎么问的），否则这个数字没有意义", multi:false,
    ph:"例：回收 41 份问卷 · 认为有用的 38 人 · 口径：试点结束后的 3 题问卷" },
  { k:"base",   n:"对比基线", h:"与上一届 / 上学期的什么比？没有基线就写「无基线，本期为首次」", multi:false,
    ph:"例：无基线，本期为首次试点" }
];
var CAMPUS_CANT = [
  { n:"简历投递通过率", w:"需要企业侧反馈（谁看了简历、有没有进面），本地产品拿不到" },
  { n:"录用率",         w:"同样的原因：结果发生在企业那一端" },
  { n:"学生满意度",     w:"必须由学院自己发问卷回收，产品不会替学生打分" },
  { n:"就业办节省的工时", w:"要就业办自己记录「以前用多久、现在用多久」" }
];
var CAMPUS_PLAN = [
  { id:"major", n:"单个专业", d:"面向一个专业的一届学生，通常 30—80 人，一个学期。",
    get:"学生端全部功能 + 这一页的汇总与报告 + 一次性使用说明" },
  { id:"college", n:"一个学院", d:"面向一个学院的全部专业，通常 200—500 人，一个学年。",
    get:"在单专业基础上增加：按专业的报告拆分 + 每学期一次回访" },
  { id:"school", n:"全校", d:"不限专业，一个学年。就业办自己汇总，我们不接触学生数据。",
    get:"在学院版基础上增加：多学院合并报告 + 就业办内部使用说明" }
];

/* 报告正文（HTML 字符串，自带内联样式，可直接打印成 PDF） */
function campusReportHTML(){
  var st = campusState(), m = campusMerge(), f = st.fill || {};
  var total = 0;
  for(var k in m.views) total += m.views[k];
  var h = '';
  h += '<h1>职场鱼塘 · 试点使用情况报告</h1>';
  h += '<p class="cpmeta">生成时间：' + esc(new Date().toLocaleString())
     + ' · 数据来源：学生自愿提交的使用数据 ' + m.n + ' 份</p>';

  h += '<h2>一、这份报告是怎么来的</h2>';
  h += '<p>学生各自在自己电脑/手机上打开这份工具，不注册、不交简历。试点结束后，'
     + '学生自愿点「导出我的使用数据」，把文件交给就业办；就业办在这里导入，'
     + '自动合并成下面这份报告。<b>产品没有服务器，学生不交文件就统计不到</b>。'
     + '所以下面的数字是「提交文件的学生」的情况，不等于全体学生。</p>';

  h += '<h2>二、参与情况</h2>';
  h += '<table><tr><th>项目</th><th>数值</th></tr>';
  h += '<tr><td>提交使用数据的学生</td><td><b>' + m.n + '</b> 人</td></tr>';
  h += '<tr><td>实际参与人数（学院填）</td><td><b>' + (String(f.people||"").trim() || "待填") + '</b></td></tr>';
  h += '<tr><td>试点范围与周期（学院填）</td><td><b>' + (String(f.span||"").trim() || "待填") + '</b></td></tr>';
  h += '<tr><td>覆盖使用天数（并集）</td><td><b>' + m.days + '</b> 天'
     + (m.firstD ? '（' + esc(m.firstD) + ' 至 ' + esc(m.lastD) + '）' : '') + '</td></tr>';
  h += '<tr><td>提交者的平均使用天数</td><td><b>'
     + (m.n ? (m.daySum / m.n).toFixed(1) : "暂无")
     + '</b> 天</td></tr>';
  h += '</table>';

  h += '<h2>三、各个栏目的触达</h2>';
  if(!m.n){ h += '<p class="cpnone">还没有导入数据。</p>'; }
  else{
    h += '<p>下表是「至少用过一次」的人数，分母是提交文件的 ' + m.n + ' 人。</p>';
    h += '<table><tr><th>栏目</th><th>用过的人数</th><th>占提交者</th></tr>';
    CAMPUS_VIEWN.forEach(function(v){
      var c = m.views[v[0]] || 0;
      var pc = m.n ? Math.round(c * 100 / m.n) : 0;
      h += '<tr><td>' + esc(v[1]) + '</td><td><b>' + c + '</b></td><td>' + pc + '%</td></tr>';
    });
    h += '</table>';
  }

  h += '<h2>四、行为触达</h2>';
  if(!m.n){ h += '<p class="cpnone">还没有导入数据。</p>'; }
  else{
    h += '<table><tr><th>行为</th><th>发生过的人数</th><th>累计次数</th></tr>';
    CAMPUS_ACTN.forEach(function(a){
      var c = m.act[a[0]] || 0, s = m.sumAct[a[0]] || 0;
      h += '<tr><td>' + esc(a[1]) + '</td><td><b>' + c + '</b></td><td>' + s + '</td></tr>';
    });
    h += '</table>';
  }

  h += '<h2>五、学生反馈与评价（学院填）</h2>';
  h += '<p><b>学生反馈摘录：</b><br>' + esc(String(f.voice||"").trim() || "待填").replace(/\n/g,'<br>') + '</p>';
  h += '<p><b>就业办负责人评价：</b><br>' + esc(String(f.teacher||"").trim() || "待填").replace(/\n/g,'<br>') + '</p>';
  h += '<p><b>满意度（须写明口径）：</b><br>' + esc(String(f.satis||"").trim() || "待填") + '</p>';
  h += '<p><b>对比基线：</b><br>' + esc(String(f.base||"").trim() || "待填") + '</p>';

  h += '<h2>六、这份报告算不出来的东西</h2>';
  h += '<p>下面四项，试点报告里经常被要求，但这份工具<b>给不了</b>，也不做估算。'
     + '需要的话要另外去收：</p><ul>';
  CAMPUS_CANT.forEach(function(c){ h += '<li><b>' + esc(c.n) + '</b>：' + esc(c.w) + '</li>'; });
  h += '</ul>';

  h += '<h2>七、数据说明</h2>';
  h += '<ul>'
     + '<li>学生导出的文件里只有计数：用了几天、进过哪些栏目、做没做过某件事。'
     + '<b>没有简历正文、没有吐槽文字、没有面试回答、没有姓名与学号。</b></li>'
     + '<li>产品没有服务器、没有账号，学生的数据不经过任何第三方。'
     + '唯一会联网的动作是学生自己点「用我的模型」，且只把对话发给他自己配置的接口。</li>'
     + '<li>「覆盖使用天数」是并集（同一天有几个人用也只算一天）；「平均使用天数」是每人天数的平均值。'
     + '两个数口径不同，不要互相推。二者都只覆盖提交了文件的学生。'
     + '如果提交的人偏向活跃学生，这两个数都会偏高。</li>'
     + '</ul>';

  h += '<p class="cpfoot">本报告由《offer鲨 · 职场鱼塘》本地生成，未上传任何数据。</p>';
  return h;
}
function campusReportFile(){
  var css = 'body{font:14px/1.85 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;'
    + 'color:#22201C;max-width:760px;margin:0 auto;padding:34px 26px}'
    + 'h1{font-size:21px;margin:0 0 6px}h2{font-size:15.5px;margin:26px 0 8px;'
    + 'padding-bottom:6px;border-bottom:1px solid #E2D9CB}p{margin:0 0 9px}'
    + 'table{width:100%;border-collapse:collapse;font-size:13px;margin:0 0 12px}'
    + 'th,td{border-bottom:1px solid #E9E1D5;padding:6px 8px;text-align:left}'
    + 'th{font-size:12px;color:#8A8175}ul{margin:0 0 10px;padding-left:20px}li{margin:0 0 5px}'
    + '.cpmeta{font-size:12px;color:#8A8175}.cpnone{color:#8A8175}'
    + '.cpfoot{margin-top:26px;padding-top:12px;border-top:1px solid #E2D9CB;font-size:12px;color:#8A8175}'
    + '@media print{body{padding:0}}';
  /* ★ <\/style> <\/head> <\/body> 这样写是故意的，不是笔误：
     产物是「一个文件里同时有 <style>、<body> 和 <script>」的结构，build.py 有一条
     断言数「style 与 head 的闭合标签各自只能出现一次」（替换样式层时踩过这个坑）。
     连注释里都不能写那两个标签的字面量 —— 刚才就是注释把它数成了第二处。
     报告模板是运行时拼的字符串，值一模一样，但源码文本里不能出现这些字面量，
     否则产物里会多出第二个闭合标签，被断言拦住。 */
  var t = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">'
    + '<title>职场鱼塘 · 试点使用情况报告</title><style>' + css + '<\/style><\/head><body>'
    + campusReportHTML() + '<\/body><\/html>';
  return t;
}
function campusExportReport(){
  downloadText("职场鱼塘_试点使用情况报告_" + campusToday() + ".html", campusReportFile(), "text/html");
  trackPush("campus_report", { packs:campusState().packs.length });
  toast("报告已导出 · 用浏览器打开，可以直接打印成 PDF");
}

/* 给学生的说明：一段可以直接转发的话 */
function campusStudentNote(){
  return [
    "【一份可以带走的东西 · 职场鱼塘】",
    "",
    "这是一个装在单个网页文件里的求职工具，打开就能用，不用注册。",
    "里面有：职场画像（把简历读一遍，告诉你缺什么）、面试模拟、你的竞品、",
    "劳议鲨手（劳动争议的情形与证据清单）、鱼群密语（职场上那句话到底什么意思）。",
    "",
    "它没有服务器：简历只在你自己的电脑/手机上解析，不会上传，",
    "唯一会联网的地方是你自己点了「用我的模型」。",
    "",
    "【麻烦你帮一件事（自愿）】",
    "用过之后，在「院校版 → 学生：导出我的使用数据」点一下，",
    "会下载一个 json 文件。这个文件里只有计数：用了几天、进过哪些栏目、",
    "做没做过某件事。没有你的简历、没有你写过的任何一句话、没有姓名。",
    "把它交给就业办就行。",
    "",
    "也可以不交。不影响你用。"
  ].join("\n");
}

/* ---------------------------------------------------------------------
   渲染
   --------------------------------------------------------------------- */
function campusViewRow(k, n, m){
  var c = m.views[k] || 0;
  var pc = m.n ? Math.round(c * 100 / m.n) : 0;
  var w  = m.n ? Math.max(pc, c ? 2 : 0) : 0;
  return '<tr><td>' + esc(n) + '</td><td><b>' + c + '</b></td><td>' + pc + '%</td>'
       + '<td style="width:38%"><div class="cpbar" style="width:' + w + '%"></div></td></tr>';
}
function renderCampus(){
  var host = document.getElementById("campusOut");
  if(!host) return;
  injectCampusCSS();
  var st = campusState(), m = campusMerge();
  var filled = st.packs.length;

  var h = '<div class="cp-intro">';
  h += '<h2>这一页是给就业办老师看的</h2>';
  h += '<p>学生用左边那几个栏目就够了，<b>这一页学生可以不用</b>。'
     + '这里回答三件事：<b>这东西怎么在一所院校里落地</b>、'
     + '<b>学生的使用情况怎么汇总成一份可以交上去的东西</b>、'
     + '<b>数据到底经不经过谁的手</b>。</p>';
  h += '<div class="cp-warn"><b>先把做不到的说清楚。</b>'
     + '这个工具是单文件离线的，没有服务器、没有账号。'
     + '所以：<b>①</b> 拿不到全体学生的数据，只能收自愿交回来的文件；'
     + '<b>②</b> 投递通过率、录用率这类结果指标它算不出来（结果发生在企业那一端）；'
     + '<b>③</b> 「每季度自动出报告」做不到，报告要在这一页手动生成。'
     + '把这三条说在前面，比事后解释容易。</div>';
  h += '</div>';

  /* ---- 二、试点路径 ---- */
  h += '<section class="cp-sec">';
  h += '<div class="cp-sec-h"><h2>怎么在一个学院里跑起来</h2>'
     + '<span>四步 · 不需要预算审批、不进采购流程</span></div>';
  h += '<div class="cp-steps">'
     + '<div class="cp-step"><i>1</i><h3>选一个专业，不选全校</h3>'
     + '<p>30—80 人、4 周。范围越小，担责压力越小，出问题也只是这一个专业的事。</p>'
     + '<span class="cp-stepn">先例比方案有用</span></div>'
     + '<div class="cp-step"><i>2</i><h3>学生各开各的，不注册、不交简历</h3>'
     + '<p>文件发给学生（微信、班级群、U 盘都行），双击就能用。没有账号要发，没有名单要导。</p>'
     + '<span class="cp-stepn">IT 部门不需要配合</span></div>'
     + '<div class="cp-step"><i>3</i><h3>用完之后，学生自愿交一个文件</h3>'
     + '<p>在「院校版」里点一下，下载一个只有计数的 json，交给老师。</p>'
     + '<span class="cp-stepn">不想交的可以不交，不影响使用</span></div>'
     + '<div class="cp-step"><i>4</i><h3>在这一页导入，生成报告</h3>'
     + '<p>多份文件自动合并，出一份可直接打印的报告。用它去谈下一步的规模。</p>'
     + '<span class="cp-stepn">报告是这个月唯一要交的东西</span></div>'
     + '</div>';
  h += '<p class="cp-note"><b>为什么这样设计：</b>高校里最容易卡住的不是钱，是「谁签字、签了之后出事谁负责」。'
     + '免费小范围试用不签合同、不进采购、不落预算，中间层不需要为你背责任。这一条比任何功能都更能推动决策。</p>';
  h += '</section>';

  /* ---- 三、学生交接 ---- */
  h += '<section class="cp-sec">';
  h += '<div class="cp-sec-h"><h2>学生只需要做一件事</h2><span>把下面两样发给学生</span></div>';
  h += '<div class="cp-quote" id="cpNote">' + esc(campusStudentNote()) + '</div>';
  h += '<div class="cp-acts">'
     + '<button type="button" id="cpCopyNote">复制这段话</button>'
     + '<button type="button" id="cpStuExp" class="pri">学生：导出我的使用数据</button>'
     + '<span class="cpn">导出的文件自带说明，交给老师即可</span>'
     + '</div>';
  h += '<p class="cp-note">这一页的所有数据都是<b>同一个文件在自己机器上算出来的</b>：'
     + '学生点导出时，只把他的使用计数写进文件，简历正文、吐槽内容、面试回答一个字节都不写进去。</p>';
  h += '</section>';

  /* ---- 四、汇总 ---- */
  h += '<section class="cp-sec">';
  h += '<div class="cp-sec-h"><h2>汇总</h2><span>把学生交回来的文件拖进来，自动合并</span></div>';
  h += '<div class="cp-drop" id="cpDrop"><b>把学生交回的文件拖到这里</b>'
     + '<span>或者 <span class="lk" id="cpPick">点这里选文件</span> · 可一次选多份 · 同一台设备重复提交会自动去重</span></div>';
  h += '<input type="file" id="cpFiles" accept=".json,application/json" multiple aria-label="选择学生使用数据文件" style="display:none">';
  if(!filled){
    h += '<div class="cp-empty">还没有导入数据。先让一个学生把文件交回来，走一遍这个流程。'
       + '这一步同时也是给学生看的演示。</div>';
  }else{
    h += '<div class="cp-stat">'
       + '<div class="cp-kpi"><b>' + m.n + '</b><span>提交数据的学生</span></div>'
       + '<div class="cp-kpi"><b>' + m.days + '</b><span>覆盖使用天数</span></div>'
       + '<div class="cp-kpi"><b>' + (m.firstD ? esc(m.firstD).slice(5) : "—") + '</b><span>最早一天</span></div>'
       + '<div class="cp-kpi"><b>' + (m.lastD ? esc(m.lastD).slice(5) : "—") + '</b><span>最晚一天</span></div>'
       + '</div>';
    h += '<table class="cp-tbl"><tr><th>栏目</th><th>用过的人数</th><th>占提交者</th><th></th></tr>';
    CAMPUS_VIEWN.forEach(function(v){ h += campusViewRow(v[0], v[1], m); });
    h += '</table>';
    h += '<table class="cp-tbl"><tr><th>行为</th><th>发生过的人数</th><th>累计次数</th></tr>';
    CAMPUS_ACTN.forEach(function(a){
      h += '<tr><td>' + esc(a[1]) + '</td><td><b>' + (m.act[a[0]] || 0) + '</b></td><td>'
         + (m.sumAct[a[0]] || 0) + '</td></tr>';
    });
    h += '</table>';
    h += '<p class="cp-note"><b>分母是「提交文件的学生」，不是全体参与学生。</b>'
       + '沉默的学生不在里面，报告里也会这样写，不要把这两个数混起来用。</p>';
  }
  h += '<div class="cp-acts" style="margin-top:11px">'
     + '<button type="button" id="cpClear">清空已导入的数据</button>'
     + '<span class="cpn">已导入 ' + filled + ' 份 · 这些数据只存在这台设备上</span>'
     + '</div>';
  h += '</section>';

  /* ---- 五、报告 ---- */
  h += '<section class="cp-sec">';
  h += '<div class="cp-sec-h"><h2>成果报告</h2><span>上面自动算 + 下面手工填，合成一份可打印的报告</span></div>';
  h += '<div class="cp-fill">';
  CAMPUS_FILL.forEach(function(fd){
    h += '<label><span class="cpfn">' + esc(fd.n)
       + ' <span class="cpfh">' + esc(fd.h) + '</span></span>';
    if(fd.multi){
      h += '<textarea data-cpf="' + esc(fd.k) + '" placeholder="' + esc(fd.ph) + '">'
         + esc(campusFill(fd.k)) + '</textarea>';
    }else{
      h += '<input type="text" data-cpf="' + esc(fd.k) + '" value="' + esc(campusFill(fd.k))
         + '" placeholder="' + esc(fd.ph) + '">';
    }
    h += '</label>';
  });
  h += '</div>';
  h += '<p class="cp-note">这几个格子现在都是空的，<b>试点还没跑完，数字就应该是空的</b>。'
     + '等数据回来再填，写「待填」不写估的数。这六格里最后两格（满意度、基线）最容易出问题：'
     + '满意度不写口径等于没有，基线不做对比等于自说自话。</p>';
  h += '<h3 style="font-size:13.5px;margin:16px 0 7px;color:var(--txt,#2B2620)">这份报告算不出来的四项</h3>';
  h += '<ul class="cp-can">';
  CAMPUS_CANT.forEach(function(c){ h += '<li><b>' + esc(c.n) + '</b>：' + esc(c.w) + '</li>'; });
  h += '</ul>';
  h += '<div class="cp-acts" style="margin-top:12px">'
     + '<button type="button" id="cpRepPreview">预览报告</button>'
     + '<button type="button" id="cpRepExp" class="pri">导出报告</button>'
     + '<span class="cpn">导出的是 HTML，用浏览器打开可以直接打印成 PDF</span>'
     + '</div>';
  h += '<div id="cpRepPrev"></div>';
  h += '</section>';

  /* ---- 六、数据安全 ---- */
  h += '<section class="cp-sec">';
  h += '<div class="cp-sec-h"><h2>数据安全说明</h2><span>这一段是给 IT 部门和审批人看的</span></div>';
  h += '<div class="cp-quote" id="cpSecNote">' + esc(campusSecNote()) + '</div>';
  h += '<div class="cp-acts"><button type="button" id="cpCopySec">复制这段说明</button></div>';
  h += '</section>';

  /* ---- 七、档位 ---- */
  h += '<section class="cp-sec">';
  h += '<div class="cp-sec-h"><h2>档位</h2><span>价格由文件主人填 · 没填就写「待填」，不写占位数</span></div>';
  h += '<div class="cp-plan">';
  CAMPUS_PLAN.forEach(function(p){
    var v = campusPlanVal(p.id);
    h += '<article class="cp-plancard">'
       + '<div style="display:flex;align-items:baseline;gap:9px;justify-content:space-between">'
       + '<h3>' + esc(p.n) + '</h3>'
       + (v ? '<span class="cp-price">' + esc(v) + '</span>'
            : '<span class="cp-price cpptodo">价格待填</span>')
       + '</div>'
       + '<p class="cppd">' + esc(p.d) + '</p>'
       + '<p class="cppget"><b>含：</b>' + esc(p.get) + '</p>'
       + '<input type="text" data-cpplan="' + esc(p.id) + '" value="' + esc(v)
       + '" placeholder="填价格与周期，例：一学年 8000 元">'
       + '</article>';
  });
  h += '</div>';
  h += '<p class="cp-note"><b>实话：</b>这类本地文件的授权挡不住懂技术的人，'
     + '复制一份就能给全校用。所以档位不是「技术封锁」，是双方认可的采购单位。'
     + '真正的护城河是回访与报告这条服务链，不是那个文件。</p>';
  h += '</section>';

  host.innerHTML = h;
  bindCampus();
  trackPush("campus_view", { packs:filled });
}
function campusSecNote(){
  return [
    "【数据安全说明 · 职场鱼塘（单文件离线工具）】",
    "",
    "一、这个产品不采集什么",
    "不采集学籍信息，不采集身份证号，不采集手机号，不采集人脸与定位。",
    "没有注册流程，因此也不存在「学生账号」这一层数据。",
    "",
    "二、数据存在哪里",
    "学生的简历、回答、使用记录全部存在他自己的浏览器本地存储里，",
    "不经过任何服务器。产品侧没有数据库，没有后台，没有第三方统计 SDK。",
    "",
    "三、唯一会联网的动作",
    "只有学生自己点击「用我的模型」时，才会把当次对话发给学生本人配置的接口。",
    "不点就不会有任何外发请求。",
    "",
    "四、交给学校的是什么",
    "学生自愿导出的 json 文件，里面只有计数：使用了几天、进过哪些栏目、",
    "做没做过某件功能。不含简历正文、不含任何输入内容、不含姓名与学号。",
    "",
    "五、这个产品做不到什么",
    "没有服务器，所以学校侧拿不到全体学生的数据，只能收自愿提交的文件；",
    "覆盖率取决于学生的配合度。这一点不做任何修饰。"
  ].join("\n");
}
function bindCampus(){
  var host = document.getElementById("campusOut");
  if(!host) return;
  function go(id, fn){ var b = document.getElementById(id); if(b) b.onclick = fn; }
  go("cpCopyNote", function(){ cp(campusStudentNote()); trackPush("campus_copy", { what:"student_note" }); });
  go("cpCopySec",  function(){ cp(campusSecNote());     trackPush("campus_copy", { what:"security_note" }); });
  go("cpStuExp",   campusExportStudent);
  go("cpClear",    function(){ if(!campusState().packs.length){ toast("还没有导入数据"); return; } campusClearPacks(); });
  go("cpRepExp",   campusExportReport);
  go("cpRepPreview", function(){
    var d = document.getElementById("cpRepPrev");
    if(!d) return;
    d.innerHTML = d.innerHTML ? ""
      : '<div class="cp-quote" style="margin-top:13px">' + campusReportHTML() + '</div>';
    trackPush("campus_preview", { packs:campusState().packs.length });
  });
  var pick = document.getElementById("cpPick");
  var inp  = document.getElementById("cpFiles");
  if(pick && inp) pick.onclick = function(){ inp.click(); };
  if(inp) inp.onchange = function(){ campusImport(inp.files); inp.value = ""; };
  var drop = document.getElementById("cpDrop");
  if(drop && drop.getAttribute("data-cpbound") !== "1"){
    drop.setAttribute("data-cpbound", "1");
    drop.addEventListener("dragover", function(e){ e.preventDefault(); drop.style.borderColor = "var(--gold,#1E3A5F)"; });
    drop.addEventListener("dragleave", function(){ drop.style.borderColor = ""; });
    drop.addEventListener("drop", function(e){
      e.preventDefault(); drop.style.borderColor = "";
      if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) campusImport(e.dataTransfer.files);
    });
  }
  /* 待填字段与档位价格：换了就存，不等到点导出 —— 否则「填完忘了点保存」会丢。
     ★ 用延迟写：S 是全量 JSON 序列化进 localStorage 的，每敲一个字写一次会卡。 */
  Array.prototype.forEach.call(host.querySelectorAll("[data-cpf]"), function(el){
    el.oninput = function(){ campusSetFill(el.getAttribute("data-cpf"), el.value); };
  });
  Array.prototype.forEach.call(host.querySelectorAll("[data-cpplan]"), function(el){
    el.oninput = function(){
      var st = campusState();
      st.plan[el.getAttribute("data-cpplan")] = String(el.value || "");
      campusLazySave();
    };
  });
}
var _cpSaveT = null;
function campusLazySave(){
  if(_cpSaveT) clearTimeout(_cpSaveT);
  _cpSaveT = setTimeout(function(){ _cpSaveT = null; try{ save(); }catch(e){} }, 500);
}
