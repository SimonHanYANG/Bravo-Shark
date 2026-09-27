/* =====================================================================
   求职雷达 · 画像版  ： 主逻辑
   流程：简历 → 画像（自动抓取）→ 七词 → 匹配 → 模拟 → 题集 → 复盘
   ===================================================================== */

/* ==================== 工具 ==================== */
function $(s){return document.querySelector(s);}
function $$(s){return Array.prototype.slice.call(document.querySelectorAll(s));}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function fmtTpl(s){return esc(s).replace(/\{([^}]+)\}/g,function(_,x){return "<em>{"+x+"}</em>";});}
function uid(){return Math.random().toString(36).slice(2,9);}
function cp(t){
  var s=String(t||"");
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(s).then(function(){toast("已复制");},function(){fb(s);});
  }else fb(s);
  function fb(x){var a=document.createElement("textarea");a.value=x;document.body.appendChild(a);a.select();try{document.execCommand("copy");toast("已复制");}catch(e){toast("复制失败，请手动选中");}document.body.removeChild(a);}
}
function toast(m){
  var t=$("#toast");if(!t)return;
  t.textContent=m;
  /* 长文本（诊断信息带 ①②③ 的那种）换成长方形气泡并允许换行 ——
     原来是 999px 圆角单行胶囊，长句子会撑出屏幕，等于把最该看的信息藏起来。 */
  var lng=String(m||"").length>34;
  t.classList.toggle("long",lng);
  t.classList.add("on");
  clearTimeout(t._h);
  t._h=setTimeout(function(){t.classList.remove("on");},lng?6000:2400);
}
function flash(){var s=$("#saveTip");if(!s)return;s.textContent="已存档 "+new Date().toTimeString().slice(0,5);clearTimeout(s._h);s._h=setTimeout(function(){s.textContent="";},2000);}
function pick(a,n){var b=a.slice(),o=[];while(b.length&&o.length<n){o.push(b.splice(Math.floor(Math.random()*b.length),1)[0]);}return o;}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function uniq(a){var s={},o=[];a.forEach(function(x){if(!s[x]){s[x]=1;o.push(x);}});return o;}

/* ==================== 状态 ==================== */
var KEY="offersha_v1";
var S={step:0,resume:{raw:"",facts:null},prof:null,sel:[],match:null,jd:null,
       bank:null,sess:null,cfg:null,tune:null,set:null,cal:{},
       /* —— 鱼塘版新增 —— */
       view:"me",jobTab:0,ivTab:0,
       coin:0,own:["classic"],skin:"classic",
       /* 装扮三件套：配色 / 衣服 / 形状 */
       shape:"mega",outfit:"sweater",ownShape:["mega"],ownOutfit:["sweater"],shopTab:"skin",
       fish:[],likes:{},likeBonus:{},poolMode:"all",mood:"无语",book:[],
       pick:"",gift:0,
       /* —— 劳议鲨手 / 鱼群密语 —— */
       disTab:0,dis:null,bbxLast:"",
       /* —— 待办 / 提醒 —— */
       todo:[],todoOpen:false,todoFired:{},
       /* —— 竞品 —— */
       rivalTab:0,rival:[],rivalJd:"",
       /* —— 访问轨迹（只进导出存档，不外发）—— */
       trail:[],
       /* —— 面试官分类 / 分享与付费插入点 —— */
       iv:{type:"",pressure:0},svc:null,
       /* ★ 这一批是 2026-09-24 新增的。必须声明在这里，不能只靠 evState()/comState()
          这种「用时懒建」的写法：load() 是 for(var k in S) 逐键还原的，
          没在初始 S 里声明过的键**永远不会被还原**：
          表现就是「存档里明明有，一刷新就没了」，而且导出存档时看得到、看不出问题。 */
       member:null,customMoods:[],com:null,comName:"",rhythm:[],grp:null,ev:null,pendingImg:"",track:[],timetable:[[],[],[],[],[],[],[]],docs:[],works:[],docFilter:"",
       /* ★ lab（进化雷达里的 小测 / 项目经历 / 能力分析）：同样必须在这里声明。
          labState() 里那套「用时懒建」是兜底，不是借口 —— 没在初始 S 里声明的键
          永远不会被 load() 还原，表现是「答完了小测，一刷新分数全没了」，
          而导出存档里看着又是有值的（最难查的一类）。 */
       lab:null,
       /* ★ resumeEdit（简历的结构化编辑，resume_edit.js 写的那个）：这是一个**既有 bug**，
          2026-09-27 在加「项目经历」时才暴露出来 —— 它以前从来没在初始 S 里声明过，
          resume_edit.js 靠 model() 用时懒建。于是：
            · 用户在「自己编辑简历」里分条填的每一格，写进了存档，但 load() 按 S 的键还原，
              这个键不在 S 里 → **一刷新全部回到空白**；
            · 更难看的是导出存档里能看到这些值，所以「看着有、实际没有」。
          项目经历是能力分析的证据来源，丢了它整个分析就没意义，所以在这里补上声明。 */
       resumeEdit:null,
       /* —— 导航置顶：默认两项必须与 navpin.js 的 PIN_DEF 一致（build.py 有断言对比） —— */
       /* ★ 默认置顶 = 当前动线的头两项（navpin.js TRACKS.new.pins）。
          两处必须一致：navpin 只在 renderNavPins 里读它，初始值错了就会
          「首访看到旧默认、清存档后仍不对」。build.py 有断言对比这一对。 */
       pins:["job","interview"],
       /* —— 分享奖励（share.js）：本地计数，没有服务器核对 —— */
       share:null,
       /* —— 通道：新人 new / 进阶 pro（navpin.js 的 TRACKS）
             ★ 键名是 lane，不是 track ： S.track 是行为日志数组（track.js 用它 push）。
               同名会让日志和通道互相覆盖，两边一起坏。 ： */
       lane:"new",
       /* ★ pay：付费服务的「价格 + 入口」配置（pay.js 写）。
          同样必须声明在这里 —— load() 是 for(var k in S) 逐键还原的，
          没声明的键永远还原不了：表现是「填好了价格，一刷新全变待填」，
          而导出配置里看着又是有值的。 */
       pay:null,
       /* ★ campus：院校版（campus.js 写）—— 学生数据包、报告待填字段、档位价格。
          同样必须声明在这里。load() 是 for(var k in S) 逐键还原的，没声明的键
          永远还原不了：表现是「填完报告字段一刷新全空」，
          而导出存档里看着又是有值的（这类最难查）。 */
       campus:null,
       /* —— 首次进入前不显示主界面 —— */
       entered:false};
var STEPS=["简历","画像","七词","匹配","模拟","题集","复盘"];
var PIDS=["p0","p1","p2","p3","p4","p5","p6"];

function save(){try{localStorage.setItem(KEY,JSON.stringify(S));flash();}catch(e){toast("存档失败：本地存储已满");}}
function load(){
  try{
    var raw=localStorage.getItem(KEY);
    if(raw){
      var o=JSON.parse(raw);
      // 整体恢复：只按 S 自己的键取值，新增字段不必再手动加一遍
      for(var k in S){
        if(Object.prototype.hasOwnProperty.call(o,k)&&o[k]!==undefined) S[k]=o[k];
      }
      // 兜底，防止旧存档缺字段
      if(!S.resume) S.resume={raw:"",facts:null};
      if(!S.resume.raw) S.resume.raw="";
      if(!S.sel) S.sel=[];
      if(!S.cal) S.cal={};
      if(!S.fish) S.fish=[];
      if(!S.likes) S.likes={};
      if(!S.likeBonus) S.likeBonus={};
      if(!S.own) S.own=["classic"];
      if(!S.skin) S.skin="classic";
      if(!S.shape) S.shape="mega";
      if(!S.outfit) S.outfit="sweater";
      if(!S.ownShape) S.ownShape=["mega"];
      if(!S.ownOutfit) S.ownOutfit=["sweater"];
      if(!S.shopTab) S.shopTab="skin";
      if(typeof S.pick!=="string") S.pick="";
      if(!S.book) S.book=[];
      if(typeof S.coin!=="number") S.coin=0;
      if(!S.poolMode) S.poolMode="all";
      if(!S.view) S.view="me";
      if(typeof S.disTab!=="number") S.disTab=0;
      if(!S.dis) S.dis={type:"",stage:"",money:"",peer:"",evid:"",flags:[],date:"",ans:{}};
      if(!S.dis.ans) S.dis.ans={};
      if(!S.dis.flags) S.dis.flags=[];
      if(typeof S.bbxLast!=="string") S.bbxLast="";
      if(!Array.isArray(S.todo)) S.todo=[];
      if(typeof S.todoOpen!=="boolean") S.todoOpen=false;
      if(!S.todoFired||typeof S.todoFired!=="object") S.todoFired={};
      if(typeof S.rivalTab!=="number") S.rivalTab=0;
      if(!Array.isArray(S.rival)) S.rival=[];
      if(typeof S.rivalJd!=="string") S.rivalJd="";
      if(!Array.isArray(S.trail)) S.trail=[];
      if(!S.iv||typeof S.iv!=="object") S.iv={type:"",pressure:0};
      if(!S.svc||typeof S.svc!=="object") S.svc={on:false,who:"",what:"",price:"",how:"",scope:""};
      if(!S.pay||typeof S.pay!=="object") S.pay={items:{}};
      if(!S.pay.items||typeof S.pay.items!=="object") S.pay.items={};
      /* 旧存档（<2026-09-27）没有院校版字段：补成空壳，四个子键都要有。
         空数组是合法状态（还没导入任何学生数据），不能因为长度为 0 就跳过。 */
      if(!S.campus||typeof S.campus!=="object") S.campus={};
      if(typeof S.campus.sid!=="string") S.campus.sid="";
      if(!Array.isArray(S.campus.packs)) S.campus.packs=[];
      if(!S.campus.fill||typeof S.campus.fill!=="object") S.campus.fill={};
      if(!S.campus.plan||typeof S.campus.plan!=="object") S.campus.plan={};
      /* 旧存档（<2026-09-25）没有置顶字段：补成默认两项。
         注意：已经是数组就一律照用 ： 空数组是「用户自己取消了全部置顶」的合法状态，
         不能因为长度为 0 就给他补回默认值，否则取消不掉。 */
      if(!Array.isArray(S.pins)) S.pins=["job","interview"];
      /* 置顶默认改过一次（面试/劳议 → 动线头两项）。旧存档里若还留着那两条旧默认，
         升级一次；用户自己改过的（不等于旧默认）原样保留，不覆盖人的选择。 */
      if(typeof S.pinV!=="number"){
        S.pinV=2;
        if(S.pins.join(",")==="interview,dispute") S.pins=["job","interview"];
      }
      /* 分享计数（share.js）：旧存档没有这个字段，补一个空壳；已有就一律沿用
         （n=0 是「还没分享过」，不是「缺字段」）。 */
      if(!S.share||typeof S.share!=="object") S.share={ n:0, day:"", today:0, got:[], last:{k:"",at:0} };
      if(!Array.isArray(S.share.got)) S.share.got=[];
      if(!S.share.last||typeof S.share.last!=="object") S.share.last={k:"",at:0};
      if(S.lane!=="pro" && S.lane!=="new") S.lane="new";
    }
  }catch(e){}
}

/* ==================== 简历解析 ==================== */
var SKILLDIC={"数据分析":["数据","数据分析","指标","sql","报表","bi"],"产品能力":["产品","prd","需求","原型","迭代","版本"],
 "增长运营":["增长","运营","留存","转化","拉新","活动","用户"],"项目管理":["项目","pmp","交付","排期","落地","统筹"],
 "技术能力":["java","python","sql","go","架构","算法","开发","代码","api"],"设计表达":["设计","ui","视觉","交互","figma","文案"],
 "销售商务":["销售","商务","客户","签单","业绩","渠道"],"财务":["财务","预算","成本","核算","审计"],
 "教学教研":["教学","教研","课程","培训","讲义"],"医疗专业":["临床","医疗","医药","护理","注册","gcp"],
 "合规风控":["合规","风控","审计","法务","监管"],"团队管理":["管理","带团队","负责人","统筹","团队"],
 "外语":["英语","英语流利","雅思","托福","cet"],"政府事务":["政务","政府","机关","公文","报批"],
 "供应链":["供应链","物流","采购","仓储","生产"],"市场品牌":["品牌","市场","营销","投放","公关"]};
var INDWORD={"互联网/IT":["互联网","软件","it","科技","网络","电商","平台"],"AI/大模型":["人工智能","ai","大模型","算法","llm","机器学习"],
 "金融/保险":["金融","银行","保险","证券","基金","风控","理财"],"消费/零售":["零售","快消","消费","门店","商超","品牌方"],
 "制造/工业":["制造","工厂","产线","工艺","精益","工业","设备"],"医疗/健康":["医疗","医药","临床","健康","护理","器械","生物"],
 "教育/培训":["教育","培训","学校","课程","教研","k12","高校"],"文旅/酒店":["文旅","旅游","酒店","民宿","景区","度假","餐饮"],
 "体制内/国企":["国企","央企","政府","机关","事业单位","公立","管理局"],"公益/NGO":["公益","基金","ngo","慈善","社会组织","志愿"],
 "媒体/文化":["媒体","文化","出版","影视","博物馆","文创","广告"],"咨询/专业服务":["咨询","顾问","事务所","专业服务","律师","会计"]};


/* ============ 简历抓取增强：清噪 → 分区加权 → 否定感知 ============ */
var RNOISE = /(简历编号|更新时间|浏览次数|投递时间|到岗时间|期望薪资|期望城市|手机号|联系电话|邮箱|招聘网|猎聘|智联|前程无忧|BOSS直聘|58同城|岗位职责：|任职要求：|任职资格：|薪资面议)/;
var NEG1 = /(没有|没|无|未|不曾|从未|缺乏|缺少|不具备|不会|不懂|谈不上|很少|几乎不)/;

function cleanResume(raw){
  var lines = String(raw || "").replace(/\r\n/g, "\n").split("\n");
  var out = [];
  for (var i = 0; i < lines.length; i++){
    var t = lines[i].trim();
    if (!t) continue;
    if (RNOISE.test(t)) continue;
    out.push(t);
  }
  return out.join("\n");
}

/* 分段权重：工作与项目经历 > 教育/技能 > 自我评价 */
var RSEC = [
  {re: /工作经历|工作经验|职业经历|从业经历/g, w: 3},
  {re: /项目经历|项目经验|主要项目/g, w: 3},
  {re: /实习经历|实习经验/g, w: 2.4},
  {re: /教育经历|教育背景|学历/g, w: 1.4},
  {re: /专业技能|技能|证书|语言能力|培训/g, w: 1.4},
  {re: /自我评价|个人优势|个人简介|自我描述|兴趣爱好/g, w: 0.8}
];
function resumeWeighted(clean){
  var t = String(clean || ""), spans = [], k, m;
  for (k = 0; k < RSEC.length; k++){
    var sec = RSEC[k];
    sec.re.lastIndex = 0;
    while ((m = sec.re.exec(t))) spans.push({at: m.index, w: sec.w});
  }
  if (spans.length < 2) return t;                 /* 没切开就别乱加权 */
  spans.sort(function(a, b){ return a.at - b.at; });
  var out = [], cur = 0;
  for (k = 0; k < spans.length; k++){
    out.push(t.slice(cur, spans[k].at));
    var end = (k + 1 < spans.length) ? spans[k + 1].at : t.length;
    var seg = t.slice(spans[k].at, end);
    /* 必须支持小数倍：权重 0.8 若用 Math.round 会变成 1，等于完全没降权。
       整数倍整段重复，小数部分按比例截取：这才是真的「按权重计词」。 */
    var w = spans[k].w, full = Math.floor(w), frac = w - full;
    var buf = "";
    for (var r = 0; r < full; r++) buf += seg + "\n";
    if (frac > 0.02) buf += seg.slice(0, Math.round(seg.length * frac)) + "\n";
    if (!buf) buf = seg.slice(0, Math.round(seg.length * Math.min(1, w))) + "\n";
    out.push(buf);
    cur = end;
  }
  out.push(t.slice(cur));
  return out.join("");
}

/* 否定感知：命中词前面 6 字内出现否定词就不算 */
function hitW(t, w){
  var j = t.indexOf(w);
  while (j >= 0){
    if (!NEG1.test(t.slice(Math.max(0, j - 6), j))) return true;
    j = t.indexOf(w, j + 1);
  }
  return false;
}
function hasWordW(t, re){
  var m = String(t || "").match(re);
  if (!m) return false;
  var i = t.indexOf(m[0]);
  return !NEG1.test(t.slice(Math.max(0, i - 6), i));
}

function extractFacts(t){
  t=t||"";
  var low=t.toLowerCase();
  var yrs=null,m=t.match(/(\d{1,2})\s*(?:年|\+)\s*(?:以上)?\s*(?:工作|从业|行业|互联网|产品|管理)?\s*经验/);
  if(m) yrs=+m[1];
  if(yrs==null){var m2=t.match(/(\d{1,2})\s*年(?:工作|从业|行业)/);if(m2)yrs=+m2[1];}
  if(yrs==null){
    var ys=(t.match(/20\d{2}/g)||[]).map(Number).filter(function(x){return x>1990&&x<2030;});
    if(ys.length>=2) yrs=Math.max.apply(null,ys)-Math.min.apply(null,ys);
  }
  var inds=[];Object.keys(INDWORD).forEach(function(k){
    INDWORD[k].forEach(function(w){ if(hitW(low,w)&&inds.indexOf(k)<0) inds.push(k); });
  });
  var skills=[];Object.keys(SKILLDIC).forEach(function(k){
    if(SKILLDIC[k].some(function(w){return hitW(low,w);})) skills.push(k);
  });
  var nums=(t.match(/\d+(?:\.\d+)?\s*(?:%|万|亿|人|个|倍|次|条|家|k|K|万级)/g)||[]);
  var orgs=(t.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,8}(公司|科技|大学|学院|集团|研究院|事务所|银行|医院|中心|基金会|局)/g)||[]);
  var seen={},org2=[];orgs.forEach(function(x){if(!seen[x]){seen[x]=1;org2.push(x);}});
  var gaps=/待业|gap|间隔年|裸辞|考研|备考/.test(t);
  var swit=/转型|转行|跨行业|跨专业|从.{0,8}转到/.test(t);
  var vague=/相关工作|等等|参与|协助|支持|负责日常|一定的/.test(t);
  var manage=hasWordW(t,/团队|带过|管理|下属|负责人|统筹/);
  return {years:yrs,inds:inds,skills:skills,nums:nums.length,numsList:nums.slice(0,5),
    orgs:org2.slice(0,4),gaps:gaps,swit:swit,vague:vague,manage:manage,
    len:t.replace(/\s/g,"").length};
}

/* ---------- 文件导入 ---------- */
function setResumeText(t,msg){
  $("#resumeRaw").value=t;
  toast(msg||("已读取 "+t.replace(/\s/g,"").length+" 字"));
  doParse();
}
function oddGlyphs(t){return (t.match(/[\u2E80-\u2EFF\u2F00-\u2FDF]/g)||[]).length;}
function normalizeDocText(t){
  t=String(t||"").replace(/\r\n/g,"\n");
  var map={"⻅":"见","⻢":"马","⻛":"风","⻜":"飞","⻚":"页","⻔":"门","⾰":"革","⾯":"面","⾳":"音","⾸":"首","⿊":"黑","⼈":"人","⼤":"大","⼩":"小","⼭":"山","⼯":"工","⼼":"心","⼿":"手","⽔":"水","⽕":"火","⽇":"日","⽉":"月","⽥":"田","⽩":"白","⽬":"目","⽯":"石","⽴":"立","⽵":"竹","⽶":"米","⽺":"羊","⽻":"羽","⾊":"色","⾏":"行","⾐":"衣","⾔":"言","⾦":"金","⾧":"长","⾨":"门","⾴":"页","⾵":"风","⾷":"食","⾹":"香"};
  t=t.replace(/[\u2E80-\u2EFF\u2F00-\u2FDF]/g,function(c){return map[c]||c;});
  /* 只把全角数字与字母转半角。不要用 NFKC——它连中文全角标点（：；！）
     一起转掉，简历原文的标点会被改得不像原文。 */
  t=t.replace(/[\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A]/g,function(c){
    return String.fromCharCode(c.charCodeAt(0)-0xFEE0);
  });
  return t;
}
/* PDF 兜底去重：部分 PDF 会把同一段文字绘制两遍（填充层 + 描边层），或带一层
   隐藏的 OCR 文本，pdf.js 会把两遍都返回，表现为「同样的话出现两次」。
   这里只处理「整篇恰好重复两遍」这一种：保守做法，不会误伤正常的重复用字。 */
function dedupeDoubled(t){
  var s=String(t||"").trim();
  if(s.length<160) return t;
  var mid=Math.floor(s.length/2);
  for(var d=-2;d<=2;d++){
    var k=mid+d;
    if(k<60||k*2>s.length+4) continue;
    if(s.slice(0,k)===s.slice(k,2*k)) return s.slice(0,k)+s.slice(2*k);
  }
  return t;
}
function zipFindEOCD(u){
  for(var i=u.length-22;i>=0&&i>u.length-65558;i--){
    if(u[i]===0x50&&u[i+1]===0x4b&&u[i+2]===0x05&&u[i+3]===0x06) return i;
  }
  return -1;
}
/* ============ docx 正文提取 ============
   必须做三件事，缺一件就会出问题：
   1) 只取 <w:t> 里的文字，绝不能把标签本身当正文：否则用户看到的
      是 XML 源码，满屏重复的 w:p / w:r / w:rPr / w:val，看起来就像「重复出现字」。
   2) 剔除 <w:del>（修订时被删掉的原文）与 <w:instrText>（域代码，如页码、
      超链接指令）：不剔除的话，同一句话会出现两遍。
   3) 段落 </w:p> 转换行、<w:tab/> 转制表、<w:br/> 转换行，否则整篇会糊成一行。 */
function docxXmlToText(xml){
  var s=String(xml||"");
  s=s.replace(/<w:del\b[^>]*>[\s\S]*?<\/w:del>/g,"");
  s=s.replace(/<w:instrText\b[^>]*>[\s\S]*?<\/w:instrText>/g,"");
  var lines=s.split(/<\/w:p>/).map(function(p){
    var buf=[],re=/<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>/g,m;
    while((m=re.exec(p))!==null){
      if(m[1]!==undefined) buf.push(m[1]);
      else buf.push(m[0].indexOf("w:tab")>=0?"\t":"\n");
    }
    return buf.join("");
  });
  return lines.join("\n")
    .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"')
    .replace(/&apos;/g,"'").replace(/&amp;/g,"&");
}
function readDocx(buf,cb){
  try{
    var u=new Uint8Array(buf),i=zipFindEOCD(u);
    if(i<0) return cb(new Error("不是有效的 docx（没找到 ZIP 结尾记录）"));
    /* 走中央目录，不要走本地文件头：
       EOCD 的 +10 是条目数、+16 是中央目录起始偏移；
       中央目录条目签名是 PK\x01\x02（0x02014b50），**固定头 46 字节之后还跟着
       变长的「文件名 + extra + 注释」，所以步长必须是 46+nlen+elen+clen，
       不能按固定 46 步进**（否则第二条起就错位，永远找不到 document.xml）。 */
    var n=u[i+10]|(u[i+11]<<8), off=u[i+16]|(u[i+17]<<8)|(u[i+18]<<16)|(u[i+19]<<24);
    var dv=new DataView(buf);
    for(var k=0,p=off;k<n;k++){
      if(dv.getUint32(p,true)!==0x02014b50) break;
      var method=dv.getUint16(p+10,true), csize=dv.getUint32(p+20,true);
      var nlen=dv.getUint16(p+28,true), elen=dv.getUint16(p+30,true), clen=dv.getUint16(p+32,true);
      var lho=dv.getUint32(p+42,true);
      var name=new TextDecoder().decode(u.subarray(p+46,p+46+nlen));
      p+=46+nlen+elen+clen;
      if(name!=="word/document.xml") continue;
      /* 本地文件头：30 字节固定段 + 文件名 + extra，数据紧随其后 */
      var lnlen=u[lho+26]|(u[lho+27]<<8), lelen=u[lho+28]|(u[lho+29]<<8);
      var ds=lho+30+lnlen+lelen;
      var data=u.subarray(ds,ds+csize);
      var done=function(txt){cb(null,normalizeDocText(docxXmlToText(txt)));};
      if(method===0) done(new TextDecoder("utf-8").decode(data));
      else if(typeof DecompressionStream==="function"){
        var rs=new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        new Response(rs).text().then(done,function(e){cb(e);});
      }else cb(new Error("这个 docx 用了压缩格式，当前浏览器解不了，请把文字复制过来"));
      return;
    }
    cb(new Error("没找到 word/document.xml（可能是 .doc 老格式或文件已损坏）"));
  }catch(e){cb(e);}
}
function readPdf(file,cb){
  var fallback="PDF 解析失败，请把简历文字直接粘贴进去（支持 ctrl+V）";
  var urls=["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js",
            "https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.min.js"];
  var i=0;
  (function next(){
    if(i>=urls.length) return cb(new Error(fallback));
    var u=urls[i++];
    var sc=document.createElement("script");sc.src=u;
    sc.onload=function(){
      var PDF=window.pdfjsLib&&window.pdfjsLib.getDocument;
      if(!PDF) return cb(new Error(fallback));
      var fr=new FileReader();
      fr.onload=function(){
        PDF({data:new Uint8Array(fr.result)}).promise.then(function(pdf){
          var ps=[];for(var n=1;n<=pdf.numPages;n++) ps.push(pdf.getPage(n).then(function(pg){return pg.getTextContent();}));
          Promise.all(ps).then(function(cs){
            cb(null,normalizeDocText(dedupeDoubled(cs.map(function(c){return c.items.map(function(x){return x.str;}).join("");}).join("\n"))));
          },function(){cb(new Error(fallback));});
        },function(){cb(new Error(fallback));});
      };
      fr.onerror=function(){cb(new Error(fallback));};
      fr.readAsArrayBuffer(file);
    };
    sc.onerror=next;
    document.head.appendChild(sc);
  })();
}
function handleFile(f){
  var nm=(f.name||"").toLowerCase();
  if(/\.(txt|md)$/.test(nm)){var fr=new FileReader();fr.onload=function(){setResumeText(String(fr.result));};fr.readAsText(f,"utf-8");return;}
  if(/\.docx$/.test(nm)){
    var fr2=new FileReader();
    fr2.onload=function(){readDocx(fr2.result,function(err,txt){
      if(err){toast("docx 读取失败");$("#p0hint").textContent=err.message;return;}
      setResumeText(txt);
    });};
    fr2.readAsArrayBuffer(f);return;
  }
  if(/\.pdf$/.test(nm)){
    toast("正在读取 PDF…");
    readPdf(f,function(err,txt){
      if(err){toast("PDF 解析失败");$("#p0hint").textContent=err.message;return;}
      var n=oddGlyphs(txt);setResumeText(txt);
      if(n) $("#p0hint").textContent="检测到 "+n+" 个偏旁字形已转换，若仍有乱码，建议换导出工具重导 PDF。";
    });
    return;
  }
  toast("只支持 txt / docx / pdf，其余格式请直接粘贴文字");
}

/* =====================================================================
   人格画像引擎（本版核心）
   四维：内核动机 T/F · 认知 N/S · 行事 J/P · 人际 A/G
   ===================================================================== */
var LEX={
  mot_T:["达成","完成","增长","提升","降本","营收","利润","指标","roi","签单","业绩","交付","结果","效率","转化","成本","产出","kpi","目标","份额","gmv","流水","变现"],
  mot_F:["团队","文化","氛围","认同","用户","帮助","带教","品牌","叙事","影响","使命","口碑","关怀","成长","伙伴","体验","故事","初心","价值感","被看见"],
  cog_N:["战略","框架","体系","模型","规划","方法论","顶层","架构","设计","创新","从0到1","从 0 到 1","模式","结构","逻辑","洞察","路径","机制","打法"],
  cog_S:["流程","细则","执行","标准","规范","落地","操作","维护","迭代","经验","实操","检查","清单","复盘","具体","台账","对账","按流程"],
  sty_J:["计划","里程碑","排期","节点","制度","规范","按计划","如期","提前","pmp","目标管理","日程","项目制","拆解","优先级"],
  sty_P:["灵活","应变","调整","探索","试错","快速响应","随时","临时","救火","变化","边走边调","机会","随机","变通","见招拆招"],
  soc_A:["独立","主导","牵头","一个人","自主","自己完成","独立负责","亲自","闭环","单打","自己扛","我把"],
  soc_G:["协作","配合","团队","支持","服从","一起","协同","沟通","协调","融入","伙伴","汇报","对齐","拉通","跨部门"]
};
function countHits(low,arr){var n=0;arr.forEach(function(w){var i=-1;while((i=low.indexOf(w,i+1))>=0){if(NEG1.test(low.slice(Math.max(0,i-6),i)))continue;n++;}});return n;}
function ratio(a,b,A,B){var t=a+b;if(!t)return 50;return clamp(Math.round(a/t*100),3,97);}

function quadOf(low){
  var T=countHits(low,LEX.mot_T),F=countHits(low,LEX.mot_F);
  var N=countHits(low,LEX.cog_N),Sc=countHits(low,LEX.cog_S);
  var J=countHits(low,LEX.sty_J),P=countHits(low,LEX.sty_P);
  var A=countHits(low,LEX.soc_A),G=countHits(low,LEX.soc_G);
  // 动机：T 多 → 偏 T（值小）；F 多 → 偏 F（值大）
  var mv=ratio(F,T,"F","T"), cv=ratio(Sc,N,"S","N"), sv=ratio(P,J,"P","J"), ov=ratio(G,A,"G","A");
  return {
    mot:{v:mv<50?"T":"F",p:mv,n:"内核动机",a:"目标利益",b:"认同与叙事",d:QUAD.mot.d},
    cog:{v:cv<50?"N":"S",p:cv,n:"认知方式",a:"抽象推演",b:"细节经验",d:QUAD.cog.d},
    sty:{v:sv<50?"J":"P",p:sv,n:"行事风格",a:"预设框架",b:"随机应变",d:QUAD.sty.d},
    soc:{v:ov<50?"A":"G",p:ov,n:"人际取向",a:"自主独立",b:"依附圈层",d:QUAD.soc.d},
    code:(mv<50?"T":"F")+(cv<50?"N":"S")+(sv<50?"J":"P")+(ov<50?"A":"G")
  };
}

/* 从简历里找一句最能支撑该标签的原话。
   双通道：① 该标签四维倾向对应的语料词命中（主）② 标签文本的 2 字滑窗重合（辅）。
   只用①会漂，只用②会因为「标签是书面语、简历是行动语」而一句都匹配不上。 */
function bigrams(s){
  var t=String(s||"").replace(/[\s，,。、；;：:（）()·！!？?"'']/g,""),o=[];
  for(var i=0;i<t.length-1;i++) o.push(t.slice(i,i+2));
  return uniq(o);
}
function evidenceFor(raw,p){
  var d=p.d;
  var dimLex=[d[0]==="T"?LEX.mot_T:LEX.mot_F,
              d[1]==="N"?LEX.cog_N:LEX.cog_S,
              d[2]==="J"?LEX.sty_J:LEX.sty_P,
              d[3]==="A"?LEX.soc_A:LEX.soc_G];
  var grams=bigrams(p.t+p.img+p.adv);
  var sents=String(raw||"").split(/[。；\n;！!？?]/).map(function(x){return x.trim();}).filter(function(x){return x.length>=8;});
  var best="",bs=0;
  sents.forEach(function(s){
    var low=s.toLowerCase(),n=0;
    dimLex.forEach(function(arr){n+=countHits(low,arr)*1.6;});
    grams.forEach(function(g){if(s.indexOf(g)>=0)n+=1.3;});
    n+=Math.min(s.length/90,0.4);
    if(n>bs){bs=n;best=s;}
  });
  if(bs<1.2) return "";
  return best.length>48?best.slice(0,48)+"…":best;
}

/* 从 100 型里挑最贴合的 n 个 */
function matchLabels(raw,quad,n){
  var low=String(raw||"").toLowerCase();
  var terms=uniq([].concat(LEX.mot_T,LEX.mot_F,LEX.cog_N,LEX.cog_S,LEX.sty_J,LEX.sty_P,LEX.soc_A,LEX.soc_G));
  var cnt={};terms.forEach(function(k){if(low.indexOf(k)>=0)cnt[k]=1;});
  var out=PERSONA100.map(function(p,i){
    var d=p.d,s=0;
    s+= (d[0]===quad.mot.v?22:7);
    s+= (d[1]===quad.cog.v?20:6);
    s+= (d[2]===quad.sty.v?20:6);
    s+= (d[3]===quad.soc.v?20:6);
    var text=(p.n+p.t+p.img+p.adv+p.bl+p.gp);
    var hit=0;Object.keys(cnt).forEach(function(k){ if(text.indexOf(k)>=0) hit++; });
    s+=Math.min(hit*4,24);
    return {p:p,s:s,i:i};
  });
  out.sort(function(a,b){return b.s-a.s;});
  var picked=[],codeCount={},sameQuad=0;
  for(var i=0;i<out.length&&picked.length<n;i++){
    var x=out[i],c=x.p.c;
    if((codeCount[c]||0)>=2) continue;
    // 与主卡同四维的最多留 1 个，否则一屏全是同一张脸，画像失去信息量
    if(x.p.d===quad.code&&sameQuad>=1) continue;
    codeCount[c]=(codeCount[c]||0)+1;
    if(x.p.d===quad.code) sameQuad++;
    picked.push({p:x.p,s:x.s,fit:0,ev:evidenceFor(raw,x.p)});
  }
  // 贴合度归一到 68–96：只取前几名时绝对分会挤在一起，归一后才有可读的排序
  var ss=picked.map(function(x){return x.s;});
  var lo=Math.min.apply(null,ss),hi=Math.max.apply(null,ss);
  picked.forEach(function(x){x.fit=clamp(Math.round(68+(x.s-lo)/Math.max(1,hi-lo)*28),60,97);});
  return picked;
}

/* 找出画像的「刹车点」：在什么情况下会做对自己不利的选择 */
function brakeOf(labels,quad){
  var p0=labels[0]?labels[0].p:null;
  var pre="";
  if(quad.mot.v==="F") pre="太在意别人的评价，";
  else if(quad.soc.v==="G") pre="怕破坏关系、不敢拒绝，";
  else if(quad.sty.v==="J") pre="规则被打破时容易先对抗再评估，";
  else if(quad.cog.v==="N") pre="容易停在推演阶段、迟迟不下场，";
  var tail=p0?String(p0.bl||"").split("；")[0]:"";
  return pre+(tail?("典型表现是："+tail+"。"):"压力上来时会优先保住体面，而不是保住结果。");
}

/* 组装完整画像 */
function buildProfile(raw,facts){
  var clean=cleanResume(raw);
  var weighted=resumeWeighted(clean);          /* 分区加权：工作经历说话更算数 */
  var low=String(weighted||"").toLowerCase();
  var quad=quadOf(low);
  var n=4;
  var rich=(facts.nums>=3?1:0)+(facts.manage?1:0)+(facts.len>600?1:0);
  n=clamp(4+rich,4,6);
  var labels=matchLabels(weighted,quad,n);
  // 临时标签：从剩下的高匹配里取，且与原标签不同型
  var used={};labels.forEach(function(x){used[x.p.i]=1;});
  var pool=PERSONA100.map(function(p,i){return {p:p,i:i};}).filter(function(x){return !used[x.i];});
  var temp=pool.slice(0,2).map(function(x){
    var when="";
    if(x.p.gp) when=x.p.gp; else when="在压力或利益冲突明显时才会显现。";
    return {name:x.p.n,tag:x.p.t,when:when};
  });
  return {quad:quad,labels:labels,temp:temp,brake:brakeOf(labels,quad),src:"本地规则引擎"};
}

/* 旧步骤导航已移除：新版是「左侧栏视图 + 子页」，见文件末尾的改造层 */

/* ==================== 步骤 0：简历 ==================== */
function doParse(){
  var t=$("#resumeRaw").value.trim();
  if(t.replace(/\s/g,"").length<80){toast("内容太少，画像会不准：至少贴 80 个字");return;}
  var f=extractFacts(cleanResume(t));   /* 事实统计走清噪文本，长度不受加权放大 */
  S.resume={raw:t,facts:f};
  S.prof=buildProfile(t,f);
  S.sel=[];S.match=null;S.jd=null;S.bank=null;
  S.sess=null;
  save();
  var msg="已解析：约 "+(f.years==null?"—":f.years)+" 年经验 · 行业 "+((f.inds||[]).join("、")||"未识别")+
          " · 技能 "+((f.skills||[]).slice(0,4).join("、")||"未识别")+" · 数字 "+f.nums+" 处";
  $("#p0hint").textContent=msg;
  var _po=$("#p0out"); if(_po) _po.innerHTML='<div class="card"><h3>第一步完成 · 下一步看画像</h3>'+
    '<div class="kv"><div>工作年限<b>'+(f.years==null?"未识别":f.years+" 年")+'</b></div>'+
    '<div>识别到的行业<b>'+((f.inds||[]).length||"—")+'</b></div>'+
    '<div>可迁移技能<b>'+((f.skills||[]).length||"—")+'</b></div>'+
    '<div>量化成果<b>'+f.nums+' 处</b></div></div>'+
    '<p class="note">'+(f.vague?'简历里有「参与 / 协助 / 负责日常」这类模糊词，画像会偏保守。':'动词写得实，画像可信度较高。')+
    (f.swit?' 有转行信号，画像会额外考虑。':'')+'</p>'+
    '<div class="acts"><button class="pri" id="btnGo1">去看画像 →</button></div></div>';
  var g1=$("#btnGo1"); if(g1) g1.onclick=function(){go(1);};
  toast("画像已生成，"+S.prof.labels.length+" 个标签");
  renderProfFish(true);   /* 画像确定 → 你的鱼跳出来 */
}

/* ==================== 步骤 1：画像 ==================== */
function quadHTML(dim){
  var arr=[["mot",dim[0]],["cog",dim[1]],["sty",dim[2]],["soc",dim[3]]];
  return '<div class="quad">'+arr.map(function(x){
    var o=QUAD[x[0]],v=x[1],isA=(v===o.a),pct=isA?18:82;
    return '<div class="qb"><div class="ql"><span>'+o.n+'</span><b>'+esc(isA?o.at:o.bt)+'</b></div>'+
      '<div class="qt"><em style="left:'+Math.min(50,pct)+'%;width:'+Math.abs(pct-50)+'%"></em>'+
      '<u style="left:'+pct+'%"></u></div></div>';
  }).join("")+'</div>';
}
function quadScaleHTML(q){
  var arr=[["mot",q.mot],["cog",q.cog],["sty",q.sty],["soc",q.soc]];
  return '<div class="quad">'+arr.map(function(x){
    var o=x[1],pct=clamp(o.p,4,96);
    return '<div class="qb"><div class="ql"><span>'+esc(o.a)+' ← '+esc(o.n)+' → '+esc(o.b)+'</span><span>'+pct+'%</span></div>'+
      '<div class="qt"><em style="left:'+Math.min(50,pct)+'%;width:'+Math.abs(pct-50)+'%"></em>'+
      '<u style="left:'+pct+'%"></u></div></div>';
  }).join("")+'</div>';
}
function pcardHTML(l,idx){
  var p=l.p;
  return '<div class="pcard">'+
    '<div class="pav">'+avatarSVG(p.d,96,idx+1)+'</div>'+
    '<div class="pmain">'+
      '<div class="prow"><span class="code">'+esc(p.d)+'</span><h4>'+esc(p.t)+'</h4><span class="fit">贴合 '+l.fit+'%</span></div>'+
      '<div class="aka">'+esc(p.aka||"")+'</div>'+
      '<div class="tt">原代号 '+esc(p.c)+' · '+avatarDesc(p.d)+'</div>'+
      quadHTML(p.d)+
      '<div class="pm"><i>画像</i><span>'+esc(p.img)+'</span>'+
      '<i>优势</i><span class="good">'+esc(p.adv)+'</span>'+
      '<i>盲区</i><span class="warn">'+esc(p.bl)+'</span>'+
      '<i>博弈</i><span>'+esc(p.gp)+'</span></div>'+
      /* 按用户要求：画像里不再展示简历原句证据。
         证据仍在数据里（l.ev），需要时把上面这段加回去即可。 */
    '</div></div>';
}
/* 旧画像渲染已移除：改造层的 renderProfile 完全取代了它（原实现引用本版不存在的 #profileOut） */

/* ==================== 步骤 2：七词 ==================== */
var DIMNAME={};
var PARALLEL={"能力侧重":1,"团队形态":1,"话语权":1,"组织氛围":1,"价值来源":1};
(function(){DIMS.forEach(function(d){d.kw.forEach(function(w){DIMNAME[w]=d.n;});});})();
function nearTagsOf(jd,w){var dn=DIMNAME[w];if(!dn||!PARALLEL[dn])return [];return (jd.tags||[]).filter(function(t){return DIMNAME[t]===dn;});}
function selHas(w){return S.sel.indexOf(w)>=0;}

var WORDMAP={mot_T:["高现金月薪","结果说话","绩效占比高","参与决策"],
  mot_F:["使命感","团队成就","年轻有活力","专业主义"],
  cog_N:["从 0 到 1 搭建","横向涉猎","专家深耕","快速晋升"],
  cog_S:["优化迭代","体系化培养","流程规范","稳定年薪"],
  sty_J:["固定双休","长期雇佣","流程规范","稳定年薪"],
  sty_P:["弹性远程","项目制","创业共担","随时能抽身"],
  soc_A:["独立负责一块","自由自主","专业主义","完全远程"],
  soc_G:["大团队分工细","带人管理","年轻有活力","团队成就"]};
function suggestWords(){
  if(!S.prof){toast("先有画像才能猜");return;}
  var q=S.prof.quad,cand=[];
  function add(k){ (WORDMAP[k]||[]).forEach(function(w){cand.push(w);}); }
  add(q.mot.v==="T"?"mot_T":"mot_F");
  add(q.cog.v==="N"?"cog_N":"cog_S");
  add(q.sty.v==="J"?"sty_J":"sty_P");
  add(q.soc.v==="A"?"soc_A":"soc_G");
  cand=uniq(cand);
  var valid=[];DIMS.forEach(function(d){d.kw.forEach(function(w){if(cand.indexOf(w)>=0)valid.push(w);});});
  valid=uniq(valid);
  DIMS.forEach(function(d){d.kw.forEach(function(w){if(valid.length<7&&valid.indexOf(w)<0)valid.push(w);});});
  S.sel=valid.slice(0,7);save();renderTree();renderRank();
  toast("按画像猜了一版排序，按你的直觉改");
}

function renderTree(){
  var h="";
  DIMS.forEach(function(d){
    var cnt=d.kw.filter(selHas).length;
    h+='<details class="dimgrp"'+(cnt?" open":"")+'><summary><b>'+esc(d.n)+'</b><i>'+(cnt?("已选 "+cnt):(d.kw.length+" 个"))+'</i></summary><div class="kws">';
    d.kw.forEach(function(w){
      var on=selHas(w),dis=!on&&S.sel.length>=7;
      h+='<span class="chip'+(on?" on":"")+(dis?" dis":"")+'" data-w="'+esc(w)+'">'+esc(w)+'</span>';
    });
    h+='</div></details>';
  });
  $("#dimTree").innerHTML=h;
  $$("#dimTree .chip").forEach(function(el){
    el.onclick=function(){
      var w=el.dataset.w,i=S.sel.indexOf(w);
      if(i>=0) S.sel.splice(i,1);
      else{ if(S.sel.length>=7){toast("已经 7 个了，先去掉一个");return;} S.sel.push(w); }
      save();renderTree();renderRank();
    };
  });
}
/* 权重按「实际选了几个」分配：第 1 个 = n，第 2 个 = n−1 … 最后一个 = 1。
   选满 7 个时正好是原来的 7,6,5,4,3,2,1；只选 1 个时它权重就是 1，不虚高。 */
function wOf(i){return Math.max(1,S.sel.length-i);}
/* 分母随选词数变化：权重和×4（命中）+ 12（行业）+ 8（技能）+ 5（年限）。n=7 时正好回到 137。 */
function denomOf(){var n=S.sel.length;return n*(n+1)/2*4+25;}
function renderRank(){
  $("#selCount").textContent=S.sel.length;
  if(!S.sel.length){$("#rankList").innerHTML='<div class="empty">还没选。上面展开任一类，点关键词。</div>';return;}
  $("#rankList").innerHTML=S.sel.map(function(w,i){
    return '<div class="rankitem"><span class="no">'+(i+1)+'</span>'+
      '<div class="who"><b>'+esc(w)+'</b><small>'+esc(DIMNAME[w]||"")+'</small></div>'+
      '<span class="w">权重 '+wOf(i)+'</span>'+
      '<div class="mini"><button data-up="'+i+'"'+(i===0?" disabled":"")+'>↑</button>'+
      '<button data-dn="'+i+'"'+(i===S.sel.length-1?" disabled":"")+'>↓</button>'+
      '<button data-rm="'+i+'">×</button></div></div>';
  }).join("");
  $$("#rankList button[data-up]").forEach(function(b){b.onclick=function(){var i=+b.dataset.up;var t=S.sel[i-1];S.sel[i-1]=S.sel[i];S.sel[i]=t;save();renderTree();renderRank();};});
  $$("#rankList button[data-dn]").forEach(function(b){b.onclick=function(){var i=+b.dataset.dn;var t=S.sel[i+1];S.sel[i+1]=S.sel[i];S.sel[i]=t;save();renderTree();renderRank();};});
  $$("#rankList button[data-rm]").forEach(function(b){b.onclick=function(){S.sel.splice(+b.dataset.rm,1);save();renderTree();renderRank();};});
}

/* ==================== 步骤 3：匹配 ==================== */
function scoreJD(jd){
  var f=S.resume.facts||{},why=[],sc=0,hit=[],near=[],miss=[];
  S.sel.forEach(function(w,i){
    var W=wOf(i);
    if(jd.tags.indexOf(w)>=0){sc+=W*4;hit.push(w);why.push({t:"你排第"+(i+1)+"的「"+w+"」这家基本符合",g:1});}
    else{
      var sd=nearTagsOf(jd,w);
      if(sd.length){sc+=W*1.2;near.push({w:w,by:sd[0]});why.push({t:"「"+w+"」这家没有，但它要的是同一类关注点里的「"+sd[0]+"」",g:2});}
      else miss.push(w);
    }
  });
  var indHit=(f.inds||[]).filter(function(x){return jd.tags.indexOf(x)>=0;});
  if(indHit.length){sc+=12;why.push({t:"你过去在"+indHit.join("、")+"的经历可以直接搬过来",g:1});}
  var cov=(jd.needs||[]).filter(function(n){
    return (f.skills||[]).some(function(s){return n.indexOf(s)>=0||(SKILLDIC[s]&&SKILLDIC[s].some(function(w){return n.indexOf(w)>=0;}));});
  }).length;
  if(cov){sc+=Math.min(8,cov*2);why.push({t:"技能需求有 "+cov+" 条跟你的简历重合",g:1});}
  if(f.years!=null&&f.years>=4){sc+=5;why.push({t:f.years+" 年经验在这个类型里属于能直接上手",g:1});}
  // 画像加成：这家 HR 的性格画像与你的行事风格是否对路
  if(S.prof){
    var q=S.prof.quad,hrt=jd.hr.t||"";
    if(q.sty.v==="J"&&/流程型|抠细节/.test(hrt)){sc+=4;why.push({t:"你是规则优先型，这家 HR 也是流程抠细节型，沟通成本低",g:1});}
    if(q.sty.v==="P"&&/结果型|强势/.test(hrt)){sc+=3;why.push({t:"你随机应变，这家 HR 吃结果不吃流程，容易对上",g:1});}
    if(q.mot.v==="F"&&/结果说话/.test((jd.tags||[]).join(""))){sc-=3;why.push({t:"你偏认同导向，这家是纯结果说话的环境，需要心理准备",g:0});}
  }
  miss.slice(0,2).forEach(function(w){why.push({t:"你想要的「"+w+"」这家不匹配，需要确认",g:0});});
  var pct=Math.round(Math.max(0,sc)/denomOf()*100);
  return {id:jd.id,jd:jd,sc:Math.round(sc),pct:Math.max(18,Math.min(96,pct)),why:why,hit:hit,near:near,miss:miss};
}
function jdById(id){for(var i=0;i<JDS.length;i++) if(JDS[i].id===id) return JDS[i];return JDS[0];}

function jdCard(x,label,note){
  var j=x.jd,zero=(x.hit&&x.hit.length===0);
  return '<div class="jdcard'+(label==="第 1"?" top1":"")+'">'+
    (note?'<div class="restnote">'+esc(note)+'</div>':'')+
    '<div class="jdhead"><div><div class="rkrow"><span class="rk'+(zero?" zero":"")+'">'+esc(label)+'</span><h4>'+esc(j.title)+'</h4></div>'+
    '<div class="meta">'+esc(j.meta)+'</div></div>'+
    '<div class="scorebox"><div class="n">'+x.pct+'%</div><div class="l">匹配度</div></div></div>'+
    '<div class="bar"><i style="width:'+x.pct+'%"></i></div>'+
    '<div class="tagw">'+(x.hit.length?x.hit.map(function(w){return '<span class="tagx hit">'+esc(w)+'</span>';}).join(""):'<span class="tagx miss">没有一个入选关键词命中</span>')+
      (x.near&&x.near.length?x.near.slice(0,3).map(function(o){return '<span class="tagx near">≈ '+esc(o.w)+'</span>';}).join(""):"")+
      (x.miss.length?x.miss.slice(0,3).map(function(w){return '<span class="tagx miss">缺 '+esc(w)+'</span>';}).join(""):"")+'</div>'+
    '<div class="sect"><div class="lb">为什么排在这里</div>'+x.why.map(function(w){return '<div class="q">'+(w.g?'<b>·</b> ':'<em>·</em> ')+esc(w.t)+'</div>';}).join("")+'</div>'+
    '<div class="sect"><div class="lb">这家公司实际信什么</div><div class="tx">'+esc(j.vals)+'</div></div>'+
    '<div class="sect"><div class="lb">它在找什么能力</div>'+j.needs.map(function(n){return '<div class="q">· '+esc(n)+'</div>';}).join("")+'</div>'+
    '<div class="sect"><div class="lb">HR 大概率是什么性格</div><div class="tx"><b style="color:var(--gold)">'+esc(j.hr.t)+'</b><br>'+esc(j.hr.why)+'<br><em style="color:var(--cyan)">怎么应对：</em>'+esc(j.hr.how)+'</div></div>'+
    '<div class="sect"><div class="lb">面试会怎么走</div><ol class="rounds">'+j.rounds.map(function(r){return '<li><b>'+esc(r.n)+'</b> · '+esc(r.what)+'</li>';}).join("")+'</ol></div>'+
    (j.risks&&j.risks.length?'<div class="sect"><div class="lb">红旗信号</div>'+j.risks.map(function(r){return '<div class="q"><em>· </em>'+esc(r)+'</div>';}).join("")+'</div>':'')+
    '<div class="acts"><button class="'+(label==="第 1"?"gold":"")+'" data-pick="'+esc(j.id)+'">选这家 · 看为什么投 / 简历怎么改 / 考什么题</button></div>'+
  '</div>';
}
function restReason(x){
  if(x.miss.length){var w=x.miss[0],ri=S.sel.indexOf(w);return '没进第一批的原因：你排第 '+(ri+1)+' 的「'+w+'」，这家确实给不了。';}
  if(x.hit.length<=2) return '没进第一批的原因：7 个关键词里只命中 '+x.hit.length+' 个。';
  return '没进第一批的原因：该命中的都命中了，但简历重合的其他加分项（行业、技能、年限）比前面那几家少。';
}
function renderMatch(){
  if(!S.sel.length){$("#matchOut").innerHTML='<div class="empty">先在七词页至少选 1 个关键词。</div>';return;}
  var all=JDS.map(scoreJD).sort(function(a,b){return b.sc-a.sc;});
  S.match=all.map(function(x){return {id:x.id,pct:x.pct};});
  save();
  trackPush("job_match", {n:all.length});   /* 埋点：跑了一次寻岗匹配 */
  var zero=all.filter(function(x){return x.hit.length===0;});
  var pos=all.filter(function(x){return x.hit.length>0;});
  var b1=pos.slice(0,10),b2=pos.slice(10),h="";
  h+='<div class="batchhd"><div class="bt1">第一批 · 现在投</div><p>这 '+b1.length+' 家是你 7 个关键词真正命中、并且简历经历能对上号的。按匹配度从高到低排，<b>先投前 3 家</b>，别一次全投。</p>'+
     (zero.length?'<p class="tienote">另有 '+zero.length+' 家跟你的 7 个关键词<b>零交集</b>，已排在最后，不参与编号：'+zero.map(function(x){return esc(x.jd.title);}).join("、")+'。</p>':'')+'</div>';
  b1.forEach(function(x,i){h+=jdCard(x,i===0?"第 1":("第 "+(i+1)),null);});
  if(b2.length){
    h+='<div class="batchhd b2"><div class="bt2">第二批 · 留作对照</div><p>这些也有命中，但要么权重低、要么简历对不上。等你面完第一批再回头看，通常会有新判断。</p></div>';
    b2.forEach(function(x,i){h+=jdCard(x,"第 "+(i+11),restReason(x));});
  }
  if(zero.length){
    h+='<div class="batchhd b2"><div class="bt2">零交集 · '+zero.length+' 家（不参与编号）</div>'+
       '<p>这 '+zero.length+' 家和你选的 7 个关键词<b>一项都没命中</b>。列出来不是让你投，是让你看清这把筛子到底滤掉了什么：'+
       '如果你发现真正想投的正好出现在这里，说明关键词选错了，回上一页改。</p></div>';
    zero.forEach(function(x){
      h+=jdCard(x,"零交集",'零交集的原因：你的 7 个关键词它一个都没要，最直接被「'+(x.miss[0]||S.sel[S.sel.length-1])+'」挡住。');
    });
  }
  $("#matchOut").innerHTML=h;
  $$("#matchOut button[data-pick]").forEach(function(b){b.onclick=function(){S.jd=b.dataset.pick;save();openAdvice(jdById(S.jd));};});
  var first=b1[0]||pos[0];
  if(first&&!S.jd){S.jd=first.id;save();}
  // 选中一家后由卡片上的按钮弹窗展示投递建议，不再自动铺到页面底部
}

/* ---------- 投递建议：为什么投 / 简历怎么改 / 有哪些问题和模板 ---------- */
function adviceHTML(j){
  var f=S.resume.facts||{},x=scoreJD(j),L=S.prof?S.prof.labels:[];
  var why=[];
  why.push("<b>这家真正在挑的是：</b>"+esc(j.vals.slice(0,90))+"…");
  why.push("<b>你哪里合：</b>"+(x.hit.length?("你排前面的「"+x.hit.slice(0,3).join("、")+"」都在它的要求里。"):"关键词命中偏少，属于「可以投但别抱高预期」。")+
    (f.years!=null?(" "+f.years+" 年经验对上它的年限要求。"):""));
  why.push("<b>你哪里不合：</b>"+(x.miss.length?("「"+x.miss.slice(0,3).join("、")+"」这几条给不了，别在面试里硬圆。"):"关键词层面没有硬伤，主要看现场表达。"));
  if(L.length) why.push("<b>从画像看：</b>你是 "+esc(L.slice(0,2).map(function(a){return a.p.n;}).join(" / "))+"，这家 HR 是「"+esc(j.hr.t)+"」，"+((S.prof.quad.sty.v==="J"&&/流程/.test(j.hr.t))?"你们在「按不按规矩来」上是一路，直接讲流程和凭据就好。":"注意别用你的默认节奏去对话，先听清对方的考核口径。"));

  var fixes=[];
  (j.tips||[]).slice(0,3).forEach(function(t,i){fixes.push({from:(f.vague?"简历里有「参与/协助」这类模糊表述 ":"")+"（第 "+(i+1)+" 处）",to:t});});
  if(f.nums<3) fixes.push({from:"目前全文只有 "+f.nums+" 处量化",to:"每条经历都补一个数字：规模、变化幅度、时间。没有精确数字就给区间和口径，别写「大幅提升」。"});

  var h="";
  h+='<div class="card hi"><h3>选了「'+esc(j.title)+'」· 投递三件事</h3>'+
     '<h4 style="margin:14px 0 6px;font-size:14px;color:var(--gold)">一、为什么投（或不投）</h4>'+
     why.map(function(w){return '<div class="q">· '+w+'</div>';}).join("")+
     '<h4 style="margin:16px 0 6px;font-size:14px;color:var(--gold)">二、简历怎么改</h4>'+
     fixes.map(function(v){return '<div class="q"><em>原文/现状：</em>'+esc(v.from)+'<br><b>改成：</b>'+esc(v.to)+'</div>';}).join("")+
     '<h4 style="margin:16px 0 6px;font-size:14px;color:var(--gold)">三、会有哪些问题（按可能性排序）</h4>'+
     (j.qs||[]).map(function(q,i){
       return '<div class="q"><b>'+(i+1)+'. '+esc(q.q)+'</b><br><em>考察点：</em>'+esc(q.why)+
         '<div class="say"><div class="s1">照着填</div><div class="tpl">'+fmtTpl(q.say)+'</div>'+
         '<div class="bt"><button data-cp="'+i+'">复制模板</button></div></div></div>';
     }).join("")+
     '<div class="acts"><button id="btnLLMAdv" class="gold">让大模型按调教协议重写一版</button>'+
     '<button id="btnToSim2" class="pri">就按这家去模拟面试</button></div>'+
     '<div class="note">这些按岗位类型推的，不是真题。真题在题集页。</div></div>';
  return h;
}
/* 点卡片按钮 → 弹窗展示（不再铺到页面最下方） */
function openAdvice(j){
  if(!j) return;
  openModal("投递建议 · "+j.title,adviceHTML(j),[{t:"关掉",c:"pri",f:closeModal}]);
  var m=$("#mBody");
  Array.prototype.forEach.call(m.querySelectorAll("button[data-cp]"),function(b){
    b.onclick=function(){var q=(j.qs||[])[+b.dataset.cp];if(q)cp(q.say.replace(/\{([^}]+)\}/g,function(_,x){return "【"+x+"】";}));};
  });
  var a=$("#btnLLMAdv"); if(a) a.onclick=function(){llmAdvice(j);};
  var b2=$("#btnToSim2"); if(b2) b2.onclick=function(){closeModal();startSim();};
}

/* ==================== LLM 接入 ==================== */
var PROVIDERS={
  zhipu:{n:"智谱 GLM glm-4-flash（零成本·永久免费·可直连）",u:"https://open.bigmodel.cn/api/paas/v4",m:"glm-4-flash"},
  silicon:{n:"硅基流动 Qwen2.5-7B（零成本·永久免费·可直连）",u:"https://api.siliconflow.cn/v1",m:"Qwen/Qwen2.5-7B-Instruct"},
  deepseek:{n:"DeepSeek V4-Flash（需先充值·可直连）",u:"https://api.deepseek.com/v1",m:"deepseek-v4-flash"},
  deepseekpro:{n:"DeepSeek V4-Pro（贵一倍·强推理·可直连）",u:"https://api.deepseek.com/v1",m:"deepseek-v4-pro"},
  moonshot:{n:"月之暗面 Kimi（仅代理可用，直连必失败）",u:"https://api.moonshot.cn/v1",m:"moonshot-v1-8k"},
  openai:{n:"OpenAI（国内常不可达）",u:"https://api.openai.com/v1",m:"gpt-4o-mini"},
  proxy:{n:"本地代理 http://127.0.0.1:8787/v1",u:"http://127.0.0.1:8787/v1",m:"glm-4-flash"},
  custom:{n:"自定义（OpenAI 兼容）",u:"",m:""}
};
var RETIRED={"deepseek-chat":"deepseek-v4-flash","deepseek-reasoner":"deepseek-v4-flash"};
function llmReady(){return !!(S.cfg&&S.cfg.on&&S.cfg.key&&S.cfg.baseUrl&&S.cfg.model);}
function syncLlmTip(){
  var el=$("engPill");if(!el)return;
  if(llmReady()){el.textContent="AI · "+S.cfg.model;el.className="pill ok";}
  else{el.textContent="本地规则引擎";el.className="pill warn";}
}
/* ---------- Key 清洗与预检（2026-09-25）----------
   ★ 为什么要做这一层：401 是**服务端拒收钥匙**，不是网络问题。
     而 401 最常见的三种来源，全都是「复制粘贴」这个动作造成的：
       ① 钥匙根本不是这家的（换服务商时旧 key 还留在输入框里 ： 这就是最阴的一种）
       ② 复制到了看不见的字符：零宽空格 U+200B、方向标记 U+200E/U+200F、
          全角空格 U+3000、中文引号、省略号 …
       ③ 钥匙被删过 / 换过账户
     trim() 只能去掉首尾的「空白字符」，对 ①②里面那些**不是空白**的字符一点办法都没有，
     所以它们会原封不动被塞进 Authorization 头，服务端只能回 401。
     这里把①②在**发出去之前**就修掉，并把③交给诊断信息去说。 */
function cleanKey(raw){
  var s=String(raw==null?"":raw);
  var n0=s.length;
  /* 先去掉「看不见但会跟着走」的格式字符，再去掉一切空白（含全角空格） */
  s=s.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\u00AD]/g,"");
  s=s.replace(/[\s\u3000]/g,"");
  return { key:s, removed:n0-s.length };
}
function keyFinger(key){
  var k=String(key||"");
  if(!k) return "（空）";
  if(k.length<=12) return k.slice(0,2)+"…";
  return k.slice(0,6)+"…"+k.slice(-4);
}
/* 预检：只报「几乎可以确定错」的情况，其余一律 warn 不 err —— 别把好 key 拦在门外 */
function keyCheck(key, prov){
  var k=String(key||"");
  if(!k) return { lv:"err", msg:"还没填 Key" };
  if(/[^\x20-\x7E]/.test(k)) return { lv:"err",
    msg:"Key 里有非 ASCII 字符（全角引号、中文、省略号…），这把钥匙发出去必然被判 401 ： 请重新复制。" };
  if(prov==="deepseek"||prov==="deepseekpro"){
    if(/^sk-[0-9a-f]{32}$/.test(k)) return { lv:"ok", msg:"格式对得上 DeepSeek（sk- + 32 位，共 35 字符）" };
    if(k.length>40||!/^sk-/.test(k)) return { lv:"warn",
      msg:"这把 Key 长 "+k.length+" 字符、形如 "+keyFinger(k)+"，不像 DeepSeek 的钥匙（sk- + 32 位 = 35 字符）。"+
          "多半是别家平台的 Key 留在了输入框里 ： 换服务商时旧 Key 不会被自动清掉。" };
    return { lv:"warn", msg:"形如 "+keyFinger(k)+"（"+k.length+" 字符），和 DeepSeek 常见的 35 字符不完全一致，先试一把。" };
  }
  if(prov==="zhipu" && k.indexOf(".")<0) return { lv:"warn",
    msg:"智谱的 Key 形如 id.secret（中间有一个点），你这把没有 ： 确认一下是不是复制成了别的东西。" };
  if(k.length<20) return { lv:"warn", msg:"只有 "+k.length+" 字符，太短，多数平台的 Key 都在 30 字符以上。" };
  return { lv:"ok", msg:"格式看起来没问题（"+k.length+" 字符，形如 "+keyFinger(k)+"）" };
}
function llmErrMsg(status,t){
  var tail=String(t||"").slice(0,150);
  var cfg=S.cfg||{}, fp=keyFinger(cfg.key), len=String(cfg.key||"").length;
  if(status===401||status===403){
    var m="HTTP "+status+"：服务端拒收这把钥匙（它收到的样子："+fp+" · "+len+" 字符）。按可能性排：\n";
    if(cfg.prov==="deepseek"||cfg.prov==="deepseekpro"){
      m+="① 这把 Key 不是 DeepSeek 的 ： DeepSeek 是 sk- + 32 位 = 35 字符，你这把是 "+len+" 字符。"
        +"换服务商时输入框里的旧 Key 不会自动清，先把 Key 换成 DeepSeek 控制台里那把；\n"
        +"② 这把 Key 已被删除，或属于另一个账户（回 platform.deepseek.com 重新生成一把）；\n"
        +"③ 复制时带了看不见的字符（新版保存时会自动清，若已清过，问题就在①②）。";
    }else{
      m+="① Key 与服务商不匹配（换服务商之后旧 Key 还留在输入框里，这是最常见的一种）；\n"
        +"② Key 已被删除，或属于另一个账户；\n"
        +"③ 复制时带了看不见的字符（保存时会自动清，若已清掉则看①②）。";
    }
    m+="\n最快的一步：点「测一下通不通」： 它先单独验钥匙，再单独调模型，会直接告诉你是钥匙的问题还是地址的问题。";
    return m;
  }
  if(status===402) return "HTTP 402：账户余额不足（钥匙是有效的，只是没钱）。DeepSeek 新账户要先充值；想零成本就切智谱 glm-4-flash 或硅基流动 Qwen2.5-7B，两家永久免费。";
  if(status===404) return "HTTP 404：地址或模型名不对。Base URL 要以 /v1 结尾；deepseek-chat 已退役，应填 deepseek-v4-flash；智谱填 glm-4-flash。";
  if(status===422) return "HTTP 422：参数被拒（多半是模型名不被这家支持）。换个模型名再试。";
  if(status===429) return "HTTP 429：限流或免费额度用尽。免费模型有 QPS 上限（智谱约 30），放慢再试。";
  if(status>=500) return "HTTP "+status+"：上游服务端错误（不是你的 Key 问题），稍后重试。";
  return "HTTP "+status+" "+tail;
}
async function llm(msgs,temp){
  var url=S.cfg.baseUrl.replace(/\/+$/,"")+"/chat/completions";
  var ctl=(typeof AbortController!=="undefined")?new AbortController():null;
  var timer=ctl?setTimeout(function(){ctl.abort();},60000):null;
  try{
    var r=await fetch(url,{method:"POST",signal:ctl?ctl.signal:undefined,
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+S.cfg.key},
      body:JSON.stringify({model:S.cfg.model,messages:msgs,temperature:(temp==null?0.75:temp),stream:false})});
    if(!r.ok){var t="";try{t=await r.text();}catch(e){}throw new Error(llmErrMsg(r.status,t));}
    var j=await r.json();
    var c=j&&j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;
    if(!c) throw new Error("返回内容为空（可能模型名不被支持）");
    return String(c).trim();
  }catch(e){
    if(e&&e.name==="AbortError") throw new Error("请求超时 60s：网络不可达或端点无响应");
    if(e instanceof TypeError||/Failed to fetch|NetworkError|Load failed|ERR_FAILED/i.test(String(e.message)))
      throw new Error("Failed to fetch：网络不可达或 CORS 被拦截。若填的是本地代理，确认 ai-proxy.mjs 已启动；否则换智谱 / DeepSeek / 硅基流动");
    throw e;
  }finally{if(timer)clearTimeout(timer);}
}
function parseJSON(t){
  var s=String(t||"").trim();
  s=s.replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
  var i=s.indexOf("{"),j=s.lastIndexOf("}");
  if(i<0||j<0) throw new Error("模型没有返回 JSON");
  return JSON.parse(s.slice(i,j+1));
}
/* 统一入口：有模型走调教协议，没模型返回 null 让本地引擎接手 */
async function ai(stage,ctx,userInput){
  if(!llmReady()) return null;
  var txt=await llm(tuneMessages(stage,ctx,userInput));
  return parseJSON(txt);
}
function ctxOf(){
  var f=S.resume.facts||{};
  var ind=(S.bank&&S.bank.ind)||(f.inds&&f.inds[0])||"";
  return {ind:ind,fam:"",years:(f.years==null?"":(f.years+" 年")),city:"",stage:"",org:""};
}
async function llmPersona(){
  if(!llmReady()){toast("先去「设置」里打开大模型接管");return;}
  toast("正在让模型重推画像…");
  try{
    var r=await ai("persona",ctxOf(),"简历原文如下：\n"+(S.resume.raw||"").slice(0,4000));
    if(!r||!r.labels||!r.labels.length) throw new Error("模型没给出可用标签");
    var byCode={};PERSONA100.forEach(function(p){if(!byCode[p.c])byCode[p.c]=p;});
    var labels=r.labels.slice(0,6).map(function(l){
      var p=byCode[l.code]||PERSONA100[0];
      return {p:p,fit:clamp(+l.fit||70,30,97),ev:l.evidence||""};
    });
    var q=r.quad||{};
    var code=(q.mot==="F"?"F":"T")+(q.cog==="S"?"S":"N")+(q.sty==="P"?"P":"J")+(q.soc==="G"?"G":"A");
    S.prof=buildProfile(S.resume.raw,S.resume.facts);
    S.prof.labels=labels;
    S.prof.quad=Object.assign(S.prof.quad,{code:code});
    S.prof.temp=(r.temp||[]).map(function(t){return {name:t.name||"",tag:"",when:t.when||""};});
    S.prof.brake=r.brake||S.prof.brake;
    S.prof.src="大模型（调教协议）";
    save();renderProfile();renderProfFish(true);toast("画像已由模型重推");
  }catch(e){toast("模型调用失败："+e.message);}
}
async function llmAdvice(j){
  if(!llmReady()){toast("先去「设置」里打开大模型接管");return;}
  toast("正在按调教协议重写投递建议…");
  try{
    var L=S.prof?S.prof.labels.map(function(a){return a.p.n+"("+a.p.d+")";}).join("、"):"";
    var input="【简历】\n"+(S.resume.raw||"").slice(0,2500)+"\n\n【画像标签】"+L+
      "\n\n【入选的 7 个关键词（按权重）】"+S.sel.join(" > ")+"\n\n【目标 JD】\n"+JSON.stringify(j);
    var r=await ai("match",ctxOf(),input);
    if(!r) throw new Error("空返回");
    var h='<div class="card hi"><h3>「'+esc(j.title)+'」· 大模型按调教协议给的一版</h3>';
    h+='<h4 style="margin:12px 0 6px;font-size:14px;color:var(--gold)">一、为什么投</h4><div class="tx">'+esc(r.why||"")+'</div>';
    if(r.fit&&r.fit.length) h+='<div class="sect"><div class="lb">对上的地方</div>'+r.fit.map(function(x){return '<div class="q">· '+esc(x)+'</div>';}).join("")+'</div>';
    if(r.gap&&r.gap.length) h+='<div class="sect"><div class="lb">对不上的地方</div>'+r.gap.map(function(x){return '<div class="q"><em>· </em>'+esc(x)+'</div>';}).join("")+'</div>';
    if(r.resumeFix&&r.resumeFix.length){
      h+='<div class="sect"><div class="lb">简历怎么改</div>'+r.resumeFix.map(function(v){
        return '<div class="q"><em>原文：</em>'+esc(v.from)+'<br><b>改成：</b>'+esc(v.to)+'</div>';}).join("")+'</div>';
    }
    if(r.qs&&r.qs.length){
      h+='<div class="sect"><div class="lb">会有哪些问题</div>'+r.qs.map(function(q,i){
        return '<div class="q"><b>'+(i+1)+'. '+esc(q.q)+'</b><br><em>考察点：</em>'+esc(q.probe||"")+
          (q.tpl?'<div class="say"><div class="s1">照着填</div><div class="tpl">'+fmtTpl(q.tpl)+'</div></div>':'')+'</div>';}).join("")+'</div>';
    }
    h+='<div class="note">来源：大模型。协议里禁掉了「编造简历里没有的经历」。</div></div>';
    var _ab=$("#adviceBox"); if(_ab) _ab.innerHTML=h;
    toast("已用模型重写");
  }catch(e){toast("模型调用失败："+e.message);}
}

/* ==================== 步骤 4：面试模拟 ==================== */
var GENERIC=[
  {q:"先用一句话说清楚：你这三年到底解决了什么问题？",probe:"结论先行、能不能收敛"},
  {q:"上一份工作里，你做的哪件事是你自己主导的？别人做了什么？",probe:"归因到人"},
  {q:"那件事的结果是多少？口径是谁定的？",probe:"数字与口径"},
  {q:"讲一次你判断失误的经历，当时如果重来你会改哪一步？",probe:"反思深度"},
  {q:"你和直属上级意见不一致最激烈的一次，最后怎么处理的？",probe:"向上管理"},
  {q:"如果我告诉你这个岗位下周可能换方向，你怎么看？",probe:"承压与稳定性"},
  {q:"你最近在用哪些 AI 工具？它帮你省了多少时间，边界在哪？",probe:"AI 素养"},
  {q:"你还有什么想问我的？",probe:"反问质量"}
];
var PROBE=["具体数字是多少？","这件事里哪部分是你亲自做的？","如果当时资源只有一半，你怎么办？","你觉得对手会怎么评价这件事？"];

function bankIndexFor(indName){
  for(var i=0;i<HRBANK.IND.length;i++){ if(HRBANK.IND[i][0]===indName) return i; }
  return -1;
}
function autoIndustry(){
  var f=S.resume.facts||{},inds=f.inds||[];
  var MAP={"互联网/IT":1,"AI/大模型":22,"金融/保险":3,"消费/零售":17,"制造/工业":10,"医疗/健康":9,
    "教育/培训":8,"文旅/酒店":17,"体制内/国企":12,"公益/NGO":20,"媒体/文化":19,"咨询/专业服务":14};
  for(var i=0;i<inds.length;i++){ if(MAP[inds[i]]!=null) return MAP[inds[i]]; }
  return 0;
}
function hrQuestion(qn,indIdx){
  var row=HRBANK.QRS[qn]; if(!row) return null;
  var q=row[0];
  if(Array.isArray(q)) q=q[indIdx]||q[0];
  else q=q.replace(/\{I\}/g, (HRBANK.IND[indIdx]||["",""])[1]);
  return {q:q,probe:row[1],tpl:HRBANK.TPLS[(row[2]||"A").charAt(0)]?HRBANK.TPLS[(row[2]||"A").charAt(0)][1]:""};
}
function simPlan(){
  var j=jdById(S.jd||(S.match&&S.match[0]&&S.match[0].id));
  var ind=autoIndustry();
  var plan=[];
  var g=hrQuestion(1,ind); if(g) plan.push({q:g.q,probe:g.probe,src:"题库·动机"});
  (j.qs||[]).slice(0,2).forEach(function(x){plan.push({q:x.q,probe:x.why,src:"JD 专项",say:x.say});});
  [12,15].forEach(function(n){var g2=hrQuestion(n,ind);if(g2)plan.push({q:g2.q,probe:g2.probe,src:"题库·行为"});});
  [24,26].forEach(function(n){var g2=hrQuestion(n,ind);if(g2)plan.push({q:g2.q,probe:g2.probe,src:"题库·情景"});});
  plan.push({q:GENERIC[5].q,probe:GENERIC[5].probe,src:"承压"});
  plan.push({q:GENERIC[7].q,probe:GENERIC[7].probe,src:"反问"});
  return plan;
}
var FREE_ROUNDS=4;   // 答满 4 轮就允许直接去看复盘，不必把预设轮次全部跑完
function pushMsg(r,t,w){S.sess.msgs.push({r:r,t:t,w:w||""});save();renderChat();}
function renderChat(){
  var box=$("#msgs");if(!box)return;
  if(!S.sess){box.innerHTML='<div class="msg sys">还没有开始。回匹配页点「进面试模拟」，或在这里直接开始。</div>'+
    '<div class="acts" style="justify-content:center"><button class="pri" id="btnSimStart">开始面试</button></div>';
    var b=$("#btnSimStart");if(b)b.onclick=startSim;return;}
  box.innerHTML=S.sess.msgs.map(function(m){
    if(m.r==="ai") return '<div class="msg ai"><span class="who">面试官'+(m.w?" · "+esc(m.w):"")+'</span>'+esc(m.t)+'</div>';
    if(m.r==="me") return '<div class="msg me">'+esc(m.t)+'</div>';
    if(m.r==="tip") return '<div class="msg tip">'+esc(m.t)+'</div>';
    return '<div class="msg sys">'+esc(m.t)+'</div>';
  }).join("");
  // 答满 4 轮就放开「去看复盘」——不必把预设轮次全部跑完
  if(!S.sess.done && S.sess.turns.length>=FREE_ROUNDS){
    box.innerHTML+='<div class="msg sys">已经答了 '+S.sess.turns.length+' 轮，这个样本量足够看出问题了。想停就点下面去看复盘，想再练几轮也可以。</div>'+
      '<div class="acts" style="justify-content:center;margin-top:4px">'+
      '<button class="pri big" id="btnEndNow">答够了 · 去看复盘</button>'+
      '<button id="btnKeepGoing">再答几轮</button></div>';
    var e1=$("#btnEndNow"); if(e1) e1.onclick=function(){finishSim();go(6);};
    var e2=$("#btnKeepGoing"); if(e2) e2.onclick=function(){toast("继续。想停随时点「去看复盘」");};
  }
  /* ★ 2026-09-27：原来这里是「滚到页面最底」。输入条还在视口底部悬浮时没问题，
     但它被搬进页内（对话区下面、设置上面）之后，页面最底是设置区 ——
     滚过去的结果是输入框被顶出屏幕上方，每答一句都要往上找一次。
     改成「保证输入条在屏幕里」：只在它超出视口时才滚，且只滚到刚好露出来。 */
  setTimeout(function(){ keepComposerInView(); },30);
}
function startSim(){
  var plan=simPlan();
  var j=jdById(S.jd||(S.match&&S.match[0]&&S.match[0].id));
  S.sess={jd:j.id,plan:plan,i:0,msgs:[],turns:[],done:false,ind:autoIndustry(),
          mode:llmReady()?"llm":"off",started:Date.now()};
  S.sel=sugSel();
  go(4);
  var _ivt=ivTypeOf(ivState().type)||ivTypeOf(ivRecommend());
  if(_ivt) S.iv.type=_ivt.id;
  pushMsg("sys","场景已载入："+j.title+" · "+(llmReady()?"大模型接管（调教协议）":"本地规则引擎")+
    " · 共 "+plan.length+" 轮" + (_ivt? (" · 面试官："+_ivt.n+(ivState().pressure?"（压力模式）":"")) : ""));
  pushMsg("tip","开打前先记住这位面试官的标准："+(_ivt?_ivt.tip:""));
  pushMsg("ai",ivOpeningLine());
  askNext();
  save();
  if(typeof syncIvDuelVis==="function") syncIvDuelVis();   /* 开打 → 收起对阵框，把对话顶上来 */
  /* ★ 开打后回到页面顶部：对话区就在最上面，第一句是面试官的话。
     不留这一步的话，焦点和浏览器习惯会把页面停在设置卡上（实测滚出 1300px），
     用户得自己往上翻才看得到面试官开口 —— 等于「放在最上面」白放。 */
  scrollTopSoon();
}
function scrollTopSoon(){
  setTimeout(function(){
    try{ window.scrollTo({ top:0, behavior:"smooth" }); }catch(e){ window.scrollTo(0,0); }
  }, 60);
}
function askNext(){
  var s=S.sess;if(!s)return;
  if(s.i>=s.plan.length){finishSim();return;}
  var p=s.plan[s.i];
  s.cur=p;
  if(s.mode==="llm"){
    pushMsg("sys","面试官正在想…");
    llmTurn(p).then(function(txt){
      S.sess.msgs.pop();
      pushMsg("ai",txt||p.q,p.src+" · 第 "+(s.i+1)+" 轮");
    }).catch(function(e){
      S.sess.msgs.pop();
      pushMsg("tip","模型不可用（"+e.message+"），本轮切回本地题库。");
      pushMsg("ai",p.q,p.src+" · 第 "+(s.i+1)+" 轮");
    });
  }else{
    pushMsg("ai",p.q,p.src+" · 第 "+(s.i+1)+" 轮");
  }
}
async function llmTurn(p){
  var j=jdById(S.sess.jd),f=S.resume.facts||{},L=S.prof?S.prof.labels.map(function(a){return a.p.n;}).join("、"):"";
  var hist=S.sess.msgs.slice(-8).map(function(m){return (m.r==="me"?"候选人：":"面试官：")+m.t;}).join("\n");
  var input="【岗位】"+j.title+"（"+j.meta+"）\n【企业价值观】"+j.vals.slice(0,80)+
    "\n【HR 画像】"+j.hr.t+"\n【候选人画像标签】"+L+"\n【候选人简历摘要】"+(S.resume.raw||"").slice(0,900)+
    "\n\n【本场对话】\n"+(hist||"（刚开始）")+
    "\n\n【本轮预设问题（可改写或顺着他上一句追问）】"+p.q+"（考察："+p.probe+"）"+
    "\n\n只输出面试官这一句台词。";
  return await llm(tuneMessages("sim",ctxOf(),input),0.7);
}
function sugSel(){return S.sel;}
/* 六维评分 */
var DIMS6=["结论先行","数字与口径","归因到人","承压回应","反问质量","岗位契合"];
function grade(t,sess){
  t=String(t||"");
  var out={};
  // 结论先行
  var concl=/^(我|这|先|结论|主要|第一|1[、.]|首先)/.test(t)||/\d[、.]|第一|第二|首先|其次/.test(t);
  var len=t.length;
  out["结论先行"]=concl?(len>80?3:2):(len>140?1:0);
  // 数字与口径
  var nums=(t.match(/\d+(?:\.\d+)?\s*(?:%|万|亿|人|个|倍|次|条|家|天|小时|周|月)/g)||[]).length;
  var kou=/口径|同比|环比|按.{0,6}算|统计|基线/.test(t);
  out["数字与口径"]=nums>=2?(kou?4:3):(nums===1?2:0);
  // 归因到人
  var mine=/我(负责|主导|牵头|设计|提出|推动|做|写了|搭|完成|决定|谈判)/.test(t);
  var we=/我们/.test(t);
  out["归因到人"]=mine?(we?3:4):(we?1:0);
  // 承压回应：是否在追问后回答
  var isProbe=sess&&sess.cur&&/追问|承压/.test(sess.cur.src||"");
  var overlap=0;
  if(sess&&sess.msgs.length){
    var last=S.sess.turns.length?S.sess.turns[S.sess.turns.length-1].t:"";
    if(last){var a=new Set(last.slice(0,60));var b=t.slice(0,60);for(var i=0;i<b.length;i++)if(a.has(b[i]))overlap++;overlap=b.length?overlap/b.length:0;}
  }
  out["承压回应"]=t.length<20?0:(t.length>=60?3:2);
  // 参数化：若处在追问轮且与上一答高度重合 → 判复述
  if(sess&&sess.probing&&overlap>0.55) out["承压回应"]=1;
  // 反问质量
  var inviting=sess&&sess.cur&&/反问/.test(sess.cur.src||"");
  out["反问质量"]=inviting?(/\?|？/.test(t)?(/团队|考核|业务|成长|指标|节奏/.test(t)?4:3):1):2;
  // 岗位契合
  var j=jdById(sess?S.sess.jd:null),hit=0;
  (j.tags||[]).forEach(function(tag){if(t.indexOf(tag)>=0)hit++;});
  (j.needs||[]).forEach(function(n){if(t.indexOf(n.slice(0,4))>=0)hit++;});
  out["岗位契合"]=hit>=3?4:(hit===2?3:(hit===1?2:1));
  var sum=0;DIMS6.forEach(function(k){sum+=out[k];});
  return {lv:out,total:sum};
}
function send(){
  var el=$("#inp"),t=el.value.trim();
  if(!t){toast("先写点什么");return;}
  if(!S.sess){toast("先开始面试");return;}
  var s=S.sess;
  pushMsg("me",t);
  var g=grade(t,s);
  s.turns.push({q:s.cur?s.cur.q:"",t:t,lv:g.lv,total:g.total,src:s.cur?s.cur.src:""});
  // 掉到 1 级以下的维度 >=2 个，这题自动进错题集
  var _weak=[];DIMS6.forEach(function(k){ if((g.lv[k]||0)<=1) _weak.push(k); });
  if(_weak.length>=2){
    addBook({q:((s.cur&&s.cur.q)||"")+"",src:((s.cur&&s.cur.src)||"")+"",mine:t,weak:_weak,
             at:new Date().toLocaleDateString()});
  }
  el.value="";save();
  // 承压追问：这一轮答得空，先追一次再进下一个
  if(!s.probing&&s.cur&&g.lv["数字与口径"]<=1&&s.i<s.plan.length-1){
    s.probing=true;
    var pr=PROBE[Math.floor(Math.random()*PROBE.length)];
    if(s.mode==="llm"){
      pushMsg("sys","面试官正在追问…");
      llmTurn({q:pr,probe:"承压追问"}).then(function(txt){
        S.sess.msgs.pop();pushMsg("ai",txt||pr,"追问");
      }).catch(function(){S.sess.msgs.pop();pushMsg("ai",pr,"追问");});
    }else pushMsg("ai",pr,"追问");
    return;
  }
  s.probing=false;s.i++;
  if(s.i>=s.plan.length) finishSim();
  else{
    if(s.turns.length===FREE_ROUNDS) pushMsg("tip","已经答了 "+FREE_ROUNDS+" 轮，够看出问题了。想停就点下面的「答够了 · 去看复盘」，想继续也行。");
    setTimeout(askNext,450);
  }
}
function finishSim(){
  var s=S.sess;if(!s)return;
  s.done=true;s.ended=Date.now();save();
  pushMsg("sys","面试结束 · 共 "+s.turns.length+" 轮 · 结果已进入复盘");
  if(typeof syncIvDuelVis==="function") syncIvDuelVis();   /* 打完了 → 对阵框回来（分享按钮在里面） */
  toast("面试结束，去看复盘");
}

/* ==================== 步骤 5：题集 ==================== */
function bankItems(ind,mod){
  var out=[];
  for(var n=1;n<=100;n++){
    if(Math.ceil(n/10)!==mod) continue;
    var it=hrQuestion(n,ind); if(!it) continue;
    out.push({n:n,q:it.q,probe:it.probe,tpl:it.tpl,mod:mod});
  }
  return out;
}
function weakMods(){
  if(!S.prof) return [];
  var q=S.prof.quad,w=[];
  if(q.mot.v==="F") w.push(7);        // 数据与结果导向
  if(q.cog.v==="N") w.push(3);        // 专业硬技能
  if(q.sty.v==="P") w.push(6);        // 向上管理与稳定性
  if(q.soc.v==="G") w.push(3);        // 硬技能
  return uniq(w);
}
function renderBank(){
  var f=S.resume.facts||{};
  if(!S.bank) S.bank={ind:autoIndustry(),mod:0};
  var ind=S.bank.ind,mod=S.bank.mod;
  var indName=(HRBANK.IND[ind]||["",""])[0];
  var wk=weakMods();
  var h='';
  h+='<div class="fld"><label>选行业题库（共 '+HRBANK.IND.length+' 个行业 · 每个 100 题 × 10 模块）</label><select id="bankInd">'+
     HRBANK.IND.map(function(x,i){return '<option value="'+i+'"'+(i===ind?" selected":"")+'>'+esc(x[0])+'</option>';}).join("")+'</select></div>';
  $("#bankStat").innerHTML='<div><b>3000</b>题库总量</div><div><b>'+HRBANK.IND.length+'</b>行业</div>'+
    '<div><b>10</b>模块</div><div><b>12</b>答题模板</div>'+
    '<div><b>'+esc(indName)+'</b>当前行业</div>';
  $("#modTabs").innerHTML=HRBANK.MODS.map(function(m,i){
    return '<button class="'+(i===mod?"on":"")+'" data-mod="'+i+'">'+(i+1)+'. '+esc(m)+(wk.indexOf(i+1)>=0?' <span style="color:var(--red)">攻坚</span>':'')+'</button>';
  }).join("");
  var items=bankItems(ind,mod+1);
  h+='<div class="card"><h3>'+(mod+1)+'. '+esc(HRBANK.MODS[mod])+' · '+items.length+' 题</h3>'+
    items.map(function(it,i){
      var weak=wk.indexOf(it.mod)>=0;
      return '<div class="qitem"><div class="qh"><span class="qn">'+(i+1)+'</span>'+
        '<div class="qq">'+fmtTpl(it.q)+(weak?' <span class="qtag" style="color:var(--red);border-color:#5a2b22">弱点攻坚</span>':'')+'</div></div>'+
        '<div class="qmeta"><span class="qtag">考点 · '+esc(it.probe||"")+'</span>'+
        (it.tpl?'<span class="qtag">模板</span>':'')+'</div>'+
        (it.tpl?'<div class="qtpl"><b>照着填</b>：'+esc(it.tpl)+'</div>':'')+
        '<div class="qfoot"><button class="sm" data-cpq="'+i+'">复制题干</button>'+
        '<button class="sm" data-mkb="'+i+'">加进我的题集</button></div></div>';
    }).join("")+'</div>';
  h+='<div class="card"><h3>我的题集（'+((S.bank.mine||[]).length)+' 题）</h3><div id="mineList"></div>'+
     '<div class="acts"><button id="btnLLMBank" class="gold">让大模型按画像定制一份题集</button>'+
     '<button id="btnExportBank">导出题集</button></div></div>';
  $("#bankOut").innerHTML=h;
  $("#bankInd").onchange=function(){S.bank.ind=+this.value;save();renderBank();};
  $$("#modTabs button").forEach(function(b){b.onclick=function(){S.bank.mod=+b.dataset.mod;save();renderBank();};});
  $$("#bankOut button[data-cpq]").forEach(function(b){b.onclick=function(){cp(items[+b.dataset.cpq].q);};});
  $$("#bankOut button[data-mkb]").forEach(function(b){b.onclick=function(){
    var it=items[+b.dataset.mkb];S.bank.mine=S.bank.mine||[];
    if(S.bank.mine.some(function(x){return x.q===it.q;})){toast("已经在题集里了");return;}
    S.bank.mine.push(it);save();renderBank();toast("已加进题集");};});
  renderMine();
  var lb=$("#btnLLMBank");if(lb)lb.onclick=llmBank;
  var eb=$("#btnExportBank");if(eb)eb.onclick=exportBank;
}
function renderMine(){
  var box=$("#mineList");if(!box)return;
  var mine=S.bank.mine||[];
  if(!mine.length){box.innerHTML='<div class="empty">还没加题。在上面点「加进我的题集」。</div>';return;}
  box.innerHTML=mine.map(function(it,i){
    return '<div class="qitem"><div class="qh"><span class="qn">'+(i+1)+'</span><div class="qq">'+esc(it.q)+'</div></div>'+
      '<div class="qmeta"><span class="qtag">'+esc(it.probe||"")+'</span></div>'+
      (it.tpl?'<div class="qtpl"><b>照着填</b>：'+esc(it.tpl)+'</div>':'')+
      '<div class="qfoot"><button class="sm" data-rmb="'+i+'">移除</button></div></div>';
  }).join("");
  $$("#mineList button[data-rmb]").forEach(function(b){b.onclick=function(){S.bank.mine.splice(+b.dataset.rmb,1);save();renderBank();};});
}
function exportBank(){
  var mine=S.bank.mine||[];
  if(!mine.length){toast("题集是空的");return;}
  var t="我的题集（"+mine.length+" 题）\n\n"+mine.map(function(it,i){
    return (i+1)+". "+it.q+"\n   考点："+(it.probe||"")+(it.tpl?("\n   模板："+it.tpl):"");
  }).join("\n\n");
  cp(t);
  var a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([t],{type:"text/plain;charset=utf-8"}));
  a.download="我的面试题集.txt";a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);},3000);
  toast("已导出并复制");
}
async function llmBank(){
  if(!llmReady()){toast("先去「设置」里打开大模型接管");return;}
  toast("正在按画像定制题集…");
  try{
    var L=S.prof?S.prof.labels.map(function(a){return a.p.n+"("+a.p.d+")";}).join("、"):"";
    var j=jdById(S.jd||(S.match&&S.match[0]&&S.match[0].id));
    var base=bankItems(S.bank.ind,S.bank.mod+1).slice(0,8).map(function(x){return x.q;}).join("；");
    var r=await ai("bank",ctxOf(),"【画像】"+L+"\n【简历摘要】"+(S.resume.raw||"").slice(0,1200)+
      "\n【目标岗位】"+j.title+"\n【本题库同模块样题（可参考风格，但不要照抄）】"+base);
    if(!r||!r.items||!r.items.length) throw new Error("模型没给出题目");
    S.bank.mine=S.bank.mine||[];
    r.items.forEach(function(it){
      S.bank.mine.push({q:it.q,probe:it.probe||"",tpl:it.tpl||"",mod:0,tag:it.tag||"AI 定制"});
    });
    save();renderBank();
    toast("模型生成了 "+r.items.length+" 题，已加进题集");
  }catch(e){toast("模型调用失败："+e.message);}
}

/* ==================== 步骤 6：复盘 + 预测分析 ==================== */
function reportDims(){
  var t=S.sess?S.sess.turns:[];
  if(!t.length) return null;
  var agg={};DIMS6.forEach(function(k){agg[k]=0;});
  t.forEach(function(x){DIMS6.forEach(function(k){agg[k]+=(x.lv[k]||0);});});
  DIMS6.forEach(function(k){agg[k]=agg[k]/t.length;});
  return agg;
}
function forecast(){
  if(!S.sess) return null;
  var dims=reportDims(),t=S.sess.turns;
  if(!dims||!t.length) return null;
  var f=(S.resume&&S.resume.facts)||{},j=jdById(S.sess.jd);
  /* ★ 逐个字段兜底：缺字段时用 0，绝不让 NaN 漏到界面上。
     口径不变，只是把「没有这个字段」当成 0 处理。 */
  var fNums=(typeof f.nums==="number" && isFinite(f.nums))?f.nums:0;
  var fYears=(typeof f.years==="number" && isFinite(f.years))?f.years:null;
  var avg=dims?DIMS6.reduce(function(a,k){return a+dims[k];},0)/DIMS6.length:0;
  var base=avg/4*54;                       // 维度分映射到 0–54
  base+=Math.min(fNums,6)*3;               // 量化成果
  if(fYears!=null) base+=fYears>=3?6:3;    // 年限
  if(f.vague) base-=4;                     // 模糊表述扣分
  var comp=/成熟平台|500 人/.test(j.meta||"")?-4:2;   // 越成熟的岗竞争越激烈
  var rounds=t.length;
  if(rounds<5) base-=6;                    // 样本不足
  base=clamp(base+8,12,72);
  var lo=clamp(Math.round(base-9),8,80),hi=clamp(Math.round(base+7),lo+5,88);
  var basis=[];
  basis.push("六维平均 "+avg.toFixed(1)+"/4（"+DIMS6.map(function(k){return k+" "+(dims[k]).toFixed(1);}).join("、")+"）");
  basis.push("简历里可归因的数字 "+fNums+" 处"+(fNums>=4?"（够用）":"（偏少，是主要扣分项）"));
  basis.push(t.length<5?"本场只答了 "+t.length+" 轮，样本偏少，区间放得很宽":"本场答了 "+t.length+" 轮，样本基本够用");
  if(f.vague) basis.push("简历里有「参与/协助」这类模糊动词，面试官会顺着追问");
  basis.push("目标岗位："+j.title+"（"+(j.meta||"")+"），"+(comp<0?"成熟平台的竞争者更多":"这个赛道候选池相对窄"));
  var weak=DIMS6.slice().sort(function(a,b){return dims[a]-dims[b];})[0];
  var risk=[];
  if(dims["数字与口径"]<2.5) risk.push({risk:"讲结果时没有数字或口径，面试官会判定「不是他干的」",fix:"当场补一句：「这个数是我们内部口径，同比按季度算，我负责的那部分是 X%。」"});
  if(dims["归因到人"]<2.5) risk.push({risk:"全程说「我们」，功劳被稀释，无法归因到你头上",fix:"把「我们」改成「我们组 + 我负责的那块是……」，一句话把边界划出来。"});
  if(dims["承压回应"]<2.5) risk.push({risk:"被追问时重复原话或开始解释，显得心虚",fix:"被追问先接住：「您问的是数字还是过程？我按数字说：」把追问转成你熟悉的题。"});
  if(dims["反问质量"]<2.5) risk.push({risk:"反问环节问薪资或加班，把主动权交出去",fix:"改问：「这个岗位下半年最想解决的一个问题是什么？」：既显格局又能套出真实需求。"});
  if(!risk.length) risk.push({risk:"整体没有明显硬伤，风险在「太稳」：缺少让人记住的点",fix:"准备一个 30 秒的「反常识小故事」，专门用来留下记忆点。"});
  return {lo:lo,hi:hi,basis:basis,weak:weak,risks:risk.slice(0,3),avg:avg,dims:dims};
}
function renderReport(){
  if(!S.sess){$("#report").innerHTML='<div class="empty">还没有面试记录。先去模拟页走一轮。</div>';return;}
  var t=S.sess.turns,dims=reportDims();
  if(!t.length){$("#report").innerHTML='<div class="empty">这场还没答题。</div>';return;}
  var j=jdById(S.sess.jd),h="",usedTurn={};
  h+='<div class="card"><h3>这场面试的数据（'+t.length+' 轮 · '+esc(j.title)+'）</h3>';
  /* 第一段：关键数字 */
  h+='<div class="card-sec"><div class="card-sec-h">这一场的关键数字</div><div class="kv"><div>轮次<b>'+t.length+'</b></div><div>模式<b>'+(S.sess.mode==="llm"?"大模型接管":"本地引擎")+'</b></div>'+
     '<div>总得分<b>'+t.reduce(function(a,x){return a+x.total;},0)+'/'+(t.length*24)+'</b></div>'+
     '<div>用时<b>'+Math.max(1,Math.round(((S.sess.ended||Date.now())-S.sess.started)/60000))+' 分钟</b></div></div></div>';
  /* 第二段：六维雷达。数值直接取 dims，和下面的逐维明细同源 ——
     另算一套的话，改了评分逻辑图和列表就会对不上。 */
  var dl6=[], dv6=[];
  DIMS6.forEach(function(k){ dl6.push(k); dv6.push(Math.round(dims[k]*100)/100); });
  var radar6 = (typeof vizRadar==="function") ? vizRadar(dl6, dv6, 4, 330) : null;
  if(radar6){
    h+='<div class="card-sec"><div class="card-sec-h">六维形状</div>'+radar6+
       '<p class="tbnote">圆的是「六项都到 4」的理想形。哪一边<strong>凹进去</strong>，'+
       '哪里就是这一场的短板 ： 不必六边都推，先补最凹的那一边。</p></div>';
  }
  /* 第三段：逐维明细 */
  h+='<div class="card-sec"><div class="card-sec-h">逐维明细与判级依据</div>';
  DIMS6.forEach(function(k){
    var v=dims[k],pct=Math.round(v/4*100);
    var col=v>=3?"var(--green)":(v>=2?"var(--mid)":"var(--red)");
    // 每个维度挑「本维得分最高、且还没被别的维度引用过」的那一轮，避免六行原句全是同一句
    var cands=t.map(function(x,i){return {i:i,x:x,v:(x.lv[k]||0)};}).sort(function(a,b){return b.v-a.v;});
    var pick=null;
    for(var ci=0;ci<cands.length;ci++){ if(!usedTurn[cands[ci].i]){pick=cands[ci];break;} }
    if(!pick) pick=cands[0];
    if(pick) usedTurn[pick.i]=1;
    h+='<div class="dimrow"><div class="dimhead"><span class="lb">'+esc(k)+'</span>'+
       '<span class="bar"><i style="width:'+pct+'%;background:'+col+'"></i></span>'+
       '<span class="vv">'+v.toFixed(1)+'/4</span></div>'+
       '<div class="dimrule">判级依据：0 没出现 / 1 有但弱 / 2 达标 / 3 到位 / 4 很到位（本场 '+t.length+' 轮取平均）</div>'+
       (pick&&pick.x.t?'<div class="dimev"><div class="q">第 '+(pick.i+1)+' 轮原句（本维 '+pick.v+' 级）：「'+esc(pick.x.t.slice(0,90))+'」</div></div>':'')+
       '</div>';
  });
  h+='</div></div>';
  // 预测分析
  var fc=forecast();
  if(fc){
    h+='<div class="card hi"><h3>预计分析报告</h3>';
    h+='<div class="fc"><div class="fcbar"><span class="fn" style="color:var(--gold)">'+fc.lo+'–'+fc.hi+'%</span>'+
       '<span class="fb"><span class="frow"><i style="width:'+fc.hi+'%;background:linear-gradient(90deg,var(--gold2),var(--gold))"></i></span>'+
       '<small>本轮通过概率区间（判断，不是承诺）</small></span></div>';
    h+='<div class="sect"><div class="lb">这个区间是怎么来的</div>'+fc.basis.map(function(b){return '<div class="q">· '+esc(b)+'</div>';}).join("")+'</div>';
    h+='<div class="sect"><div class="lb">只改一件事，改哪个收益最大</div><div class="tx"><b style="color:var(--gold)">'+esc(fc.weak)+'</b> ： 这是当前拉低整体最多的维度。下一场把这一件事做扎实，比全面撒网更有效。</div></div>';
    h+='<div class="sect"><div class="lb">最可能翻车的 '+fc.risks.length+' 个点 + 当场怎么救</div><ul class="risklist">'+
       fc.risks.map(function(r){return '<li><b>风险：</b>'+esc(r.risk)+'<br><b>当场补救：</b>'+esc(r.fix)+'</li>';}).join("")+'</ul></div>';
    h+='<div class="forecast-note">概率区间由本场表现（六维）+ 简历质量 + 岗位竞争度推算，'+
       '<b>不掌握的信息包括：竞争者的数量与水平、岗位真实编制、面试官个人偏好</b>。所以这是判断，不是承诺：真实结果落在区间之外也很正常。</div>';
    h+='<div class="acts"><button id="btnLLMRep" class="gold">让大模型按逐字稿重算一遍</button>'+
       '<button id="btnExportRep" class="pri">导出这份报告</button></div>';
    h+='</div>';
  }
  h+=ivReportBlock();
  h+=momentHTML("report");
  $("#report").innerHTML=h;
  bindIvReport();
  bindMoment(document.getElementById("report"),"report");
  var lr=$("#btnLLMRep");if(lr)lr.onclick=llmReport;
  var er=$("#btnExportRep");if(er)er.onclick=exportReport;
}
async function llmReport(){
  if(!llmReady()){toast("先去「设置」里打开大模型接管");return;}
  toast("正在让模型读逐字稿重算…");
  try{
    var t=S.sess.turns.map(function(x,i){return "第"+(i+1)+"轮 Q:"+x.q+"\nA:"+x.t;}).join("\n\n");
    var j=jdById(S.sess.jd);
    var r=await ai("report",ctxOf(),"【岗位】"+j.title+"\n【简历摘要】"+(S.resume.raw||"").slice(0,1000)+"\n\n【逐字稿】\n"+t.slice(0,6000));
    if(!r) throw new Error("空返回");
    var h='<div class="card hi"><h3>大模型按调教协议给的这版报告</h3>';
    if(r.dims){
      h+=r.dims.map(function(d){
        var pct=Math.round((+d.level||0)/4*100);
        return '<div class="dimrow"><div class="dimhead"><span class="lb">'+esc(d.name)+'</span><span class="bar"><i style="width:'+pct+'%"></i></span><span class="vv">'+esc(d.level)+'/4</span></div>'+
          '<div class="dimev"><div class="q">'+esc(d.evidence||"")+'</div></div></div>';
      }).join("");
    }
    if(r.pass){
      h+='<div class="fc"><div class="fcbar"><span class="fn" style="color:var(--gold)">'+esc(r.pass.lo)+'–'+esc(r.pass.hi)+'%</span>'+
         '<span class="fb"><span class="frow"><i style="width:'+clamp(+r.pass.hi,0,100)+'%;background:linear-gradient(90deg,var(--gold2),var(--gold))"></i></span>'+
         '<small>模型给的通过概率区间</small></span></div>';
      h+='<div class="sect"><div class="lb">依据</div><div class="tx">'+esc(r.pass.basis||"")+'</div></div>';
      h+='<div class="sect"><div class="lb">模型明说不掌握的信息</div><div class="tx">'+esc(r.pass.uncertain||"")+'</div></div></div>';
    }
    if(r.next) h+='<div class="sect"><div class="lb">下一场只改一件事</div><div class="tx">'+esc(r.next)+'</div></div>';
    if(r.risks&&r.risks.length) h+='<div class="sect"><div class="lb">翻车风险与补救</div><ul class="risklist">'+
      r.risks.map(function(x){return '<li><b>'+esc(x.risk)+'</b><br>'+esc(x.fix)+'</li>';}).join("")+'</ul></div>';
    h+='</div>';
    $("#report").insertAdjacentHTML("beforeend",h);
    toast("模型报告已追加在下方");
  }catch(e){toast("模型调用失败："+e.message);}
}
function exportReport(){
  var t=S.sess.turns,dims=reportDims(),fc=forecast(),j=jdById(S.sess.jd);
  var out="求职雷达 · 复盘报告\n岗位："+j.title+"\n日期："+new Date().toLocaleString()+"\n\n";
  out+="【逐字稿】\n"+t.map(function(x,i){return "第"+(i+1)+"轮 ["+x.src+"]\nQ: "+x.q+"\nA: "+x.t;}).join("\n\n");
  out+="\n\n【六维得分】\n"+DIMS6.map(function(k){return k+"："+dims[k].toFixed(1)+"/4";}).join("\n");
  if(fc){out+="\n\n【预计分析】\n通过概率区间："+fc.lo+"–"+fc.hi+"%\n依据：\n"+fc.basis.map(function(b){return "· "+b;}).join("\n")+
    "\n最大改进点："+fc.weak+"\n风险：\n"+fc.risks.map(function(r){return "· "+r.risk+" → "+r.fix;}).join("\n");}
  cp(out);
  toast("报告已复制到剪贴板");
}

/* ==================== 人物图鉴 ==================== */
var GALBAND=["高层管理 / 老板","中层骨干 / 老员工","新人 / 基层员工","人际博弈 / 权谋特质","工作特质 / 能力性格"];
var QUADORDER=["TNJA","TNJG","TNPA","TNPG","TSJA","TSJG","TSPA","TSPG","FNJA","FNJG","FNPA","FNPG","FSJA","FSJG","FSPA","FSPG"];
function openGallery(mode){
  mode=mode||"role";
  var h='';
  h+='<div class="discbox"><b>这是给你查人用的。</b>前一类是「职场里会遇到的 100 种人」：老板、同事、HR 都可能在里头；后一类是「四维原型 100 型」：你自己的画像就是从这一套里挑出来的。'+
     '命名统一为「某某者 / 某某家」或写意的比喻。<b>先看清对面是哪种人，比看懂岗位要求更省事。</b></div>';
  h+='<div class="modtabs">'+
     '<button data-g="role" class="'+(mode==="role"?"on":"")+'">职场里会遇到的 100 种人</button>'+
     '<button data-g="quad" class="'+(mode==="quad"?"on":"")+'">四维原型 100 型</button></div>';
  if(mode==="role"){
    GALBAND.forEach(function(b){
      var list=ROLES100.filter(function(x){return x.band===b;});
      if(!list.length) return;
      h+='<div class="bandhd">'+esc(b)+' · '+list.length+' 种</div><div class="gal">'+
         list.map(function(x){return '<div class="g"><b>'+esc(x.name)+'</b><span>'+esc(x.desc.slice(0,74))+(x.desc.length>74?"…":"")+'</span></div>';}).join("")+'</div>';
    });
  }else{
    QUADORDER.forEach(function(d){
      var list=PERSONA100.filter(function(p){return p.d===d;});
      if(!list.length){
        h+='<div class="bandhd">'+d+' · 0 型</div><div class="gal"><div class="g">'+
           '<b>这一型暂缺</b><span>素材里没有这一类组合的原型。不是被隐藏，是源头确实没写：所以你的画像也永远推不出这一型。</span></div></div>';
        return;
      }
      h+='<div class="bandhd">'+d+' · '+list.length+' 型</div><div class="gal">'+
         list.map(function(p){return '<div class="g"><b>'+esc(p.t)+'</b><small>'+esc(p.aka||"")+'</small><span>'+esc(p.img.slice(0,64))+(p.img.length>64?"…":"")+'</span></div>';}).join("")+'</div>';
    });
  }
  openModal("人物图鉴",h,[{t:"关掉",c:"pri",f:closeModal}]);
  Array.prototype.forEach.call($("#mBody").querySelectorAll(".modtabs button"),function(b){
    b.onclick=function(){openGallery(b.dataset.g);};
  });
}

/* ==================== 设置 / 说明 / 导入导出 ==================== */
var WHYHTML=
 '<div class="card"><h3>这一版和 JD 雷达有什么不同</h3><p class="note">'+
 '顺序反过来了：<b>先看你是哪种人（画像），再让你挑要什么（七词）</b>。原来的「打法」改成了「题集」并挪到模拟之后。'+
 '新加了从简历自动抓取的四维人格画像、2D 形象、以及接通大模型时的调教协议。</p></div>'+
 '<div class="card"><h3>画像怎么来的</h3><p class="note">'+
 '本地引擎按四维框架（内核动机 T/F · 认知 N/S · 行事 J/P · 人际 A/G）统计简历里的动词与语料倾向，'+
 '再从 100 个原型里挑出贴合度最高的 4–6 个，每个标签都会回引简历里的原句。'+
 '<b>它是行为倾向，不是心理诊断，也不是永久标签。</b></p></div>'+
 '<div class="card"><h3>数据都在你本机</h3><p class="note">'+
 '简历、画像、题集、面试记录只在这台设备上，不上传服务器。'+
 '接了第三方模型时，只有你点「让大模型…」的内容会发出去。'+
 '想彻底清掉就点顶栏「清空」。</p></div>'+
 '<div class="card"><h3>题库来源</h3><p class="note">'+
 '底稿是 30 行业 × 10 模块 × 100 题的通用题库。大模型接管时按你的画像加延伸题。</p></div>';
 
/* 自检：分两步走，先把「钥匙」和「模型/参数」两件事拆开 ——
   否则 401 和 404 混在一句「失败」里，用户只能瞎试。 */
async function llmProbe(){
  var cfg=S.cfg||{}, out=[];
  var base=String(cfg.baseUrl||"").replace(/\/+$/,"");
  out.push({ k:"配置", lv:"info", v:(cfg.prov||"-")+" · "+base+" · "+(cfg.model||"-")+
                                " · Key "+keyFinger(cfg.key)+"（"+String(cfg.key||"").length+" 字符）" });
  var chk=keyCheck(cfg.key, cfg.prov);
  out.push({ k:"Key 预检", lv:chk.lv, v:chk.msg });
  /* 第 1 步：只验钥匙。GET /models 是 OpenAI 兼容端点的通行探测；
     2026-09-25 实测：不用它也能自己判 ： 但要接受「某些平台没有 /models」这件事，所以非 401 都只算跳过。 */
  try{
    var r=await fetch(base+"/models",{headers:{"Authorization":"Bearer "+cfg.key}});
    if(r.status===401||r.status===403)
      out.push({ k:"第 1 步 · 只验钥匙", lv:"err",
        v:"连 GET /models 都被拒（HTTP "+r.status+"）→ 问题在钥匙本身，跟模型名、参数、你写的问题都无关。" });
    else if(r.ok)
      out.push({ k:"第 1 步 · 只验钥匙", lv:"ok",
        v:"GET /models 通过（HTTP 200）→ 钥匙有效。如果下一步还失败，就去查模型名或参数。" });
    else
      out.push({ k:"第 1 步 · 只验钥匙", lv:"warn",
        v:"GET /models 返回 HTTP "+r.status+"（这家可能没这个探测口），跳过。" });
  }catch(e){
    var net=(e instanceof TypeError)||/Failed to fetch|NetworkError|Load failed/i.test(String(e.message));
    out.push({ k:"第 1 步 · 只验钥匙", lv:"err",
      v: net ? ("连不上 "+base+"：浏览器直连被拦（CORS）或端点不通。本地代理要确认 ai-proxy.mjs 在跑；"+
                "直连建议用智谱 / 硅基流动 / DeepSeek 这三个")
             : ("连不上 "+base+"："+e.message) });
    return out;
  }
  /* 第 2 步：真的调一次模型（最省 token：让它只回两个字） */
  try{
    var t0=Date.now();
    var txt=await llm([{role:"user",content:"只回两个字：通了"}],0.2);
    out.push({ k:"第 2 步 · 真调模型", lv:"ok",
      v:"通了（"+Math.round((Date.now()-t0)/1000)+" 秒）· 它回了："+String(txt).slice(0,40) });
  }catch(e){
    out.push({ k:"第 2 步 · 真调模型", lv:"err", v:e.message });
  }
  return out;
}

function openSet(){
  var c=S.cfg||{on:0,key:"",baseUrl:"",model:"",prov:"zhipu"};
  var h='<div class="card"><h3>大模型接管</h3>'+
   '<p class="note">打开后，画像、投递建议、面试官、题集、复盘都交给模型。'+
   '调用走的是上面那套<b>调教协议</b>，不是把你的话直接丢过去。任何一步失败都会自动回落到本地引擎，不会中断流程。</p>'+
   '<div class="setgrp"><div class="lb">开关</div><div class="rowb">'+
   '<button data-on="1" class="'+(c.on?"on":"")+'">打开（用大模型）</button>'+
   '<button data-on="0" class="'+(!c.on?"on":"")+'">关闭（纯本地）</button></div></div>'+
   '<div class="setgrp"><div class="lb">服务商</div><div class="fld"><select id="cfgProv">'+
   Object.keys(PROVIDERS).map(function(k){return '<option value="'+k+'"'+(k===(c.prov||"zhipu")?" selected":"")+'>'+esc(PROVIDERS[k].n)+'</option>';}).join("")+
   '</select></div></div>'+
   '<div class="setgrp"><div class="lb">Base URL</div><div class="fld"><input type="text" id="cfgUrl" value="'+esc(c.baseUrl||"")+'" placeholder="https://open.bigmodel.cn/api/paas/v4"></div></div>'+
   '<div class="setgrp"><div class="lb">模型名</div><div class="fld"><input type="text" id="cfgModel" value="'+esc(c.model||"")+'" placeholder="glm-4-flash"></div></div>'+
   '<div class="setgrp"><div class="lb">API Key</div><div class="fld"><input type="password" id="cfgKey" value="'+esc(c.key||"")+'" placeholder="只存在本机浏览器"></div>'+
   '<div class="keyfp" id="cfgKeyFp"></div><div class="keyhint" id="cfgKeyHint"></div></div>'+
   '<div class="acts"><button class="pri" id="cfgSave">保存并启用</button><button id="cfgTest">测一下通不通</button></div>'+
   '<div class="diag" id="cfgDiag"></div>'+
   '<div class="note">免费可选：智谱 glm-4-flash、硅基流动 Qwen2.5-7B。DeepSeek 需先充值。'+
   '本地起代理的话用 ai-proxy.mjs，填 http://127.0.0.1:8787/v1。</div></div>';
  h+='<div class="card"><h3>存档备份</h3><p class="note">导出成一个文件。换设备或清浏览器前存一份。</p>'+
   '<div class="acts"><button id="setExp">导出备份</button><button id="setImp">导入备份</button></div></div>';
  h+='<div class="card"><h3>改进这个产品</h3>'+
   '<p class="note">行为记录只存在本机，不上传。'+
   '愿意的话，导出一份<b>完全脱敏的日志</b>发给团队，帮它做得更顺手。</p>'+
   '<div class="acts"><button id="setTrack">导出行为日志</button><button id="setTrackClear">清空日志</button></div></div>';
  h+='<div class="card"><h3>友好设置</h3>'+
   '<div class="setgrp"><div class="lb">整体缩放</div><div class="rowb">'+
   [1,2,3].map(function(z){return '<button data-z="'+z+'" class="'+(defSet().z===z?"on":"")+'">'+["标准","放大","更大"][z-1]+'</button>';}).join("")+'</div></div>'+
   '<div class="setgrp"><div class="lb">行距</div><div class="rowb">'+
   [17,19,22].map(function(l){return '<button data-lh="'+l+'" class="'+(defSet().lh===l?"on":"")+'">'+(l===17?"紧凑":l===19?"标准":"宽松")+'</button>';}).join("")+'</div></div>'+
   '<div class="setgrp"><div class="lb">动效</div><div class="rowb">'+
   '<button data-motion="1" class="'+(defSet().motion?"on":"")+'">开启</button><button data-motion="0" class="'+(!defSet().motion?"on":"")+'">关闭</button></div></div>'+
   '<div class="setgrp"><div class="lb">栏宽</div><div class="rowb">'+
   '<button data-narrow="0" class="'+(defSet().narrow?"":"on")+'">标准</button><button data-narrow="1" class="'+(defSet().narrow?"on":"")+'">窄栏（好读）</button></div></div>'+
   '</div>';
  openModal("设置",h,[{t:"完成",c:"pri",f:closeModal}]);
  $$("#mBody button[data-on]").forEach(function(b){b.onclick=function(){S.cfg=S.cfg||{};S.cfg.on=+b.dataset.on;save();syncLlmTip();openSet();};});
  /* Key 指纹 + 预检：401 的时候，用户唯一能自己核对的就是「我发出去的到底长什么样」。
     所以把「指纹 + 字符数 + 有没有看不见的字符」直接摆在输入框下面。 */
  function kHint(){
    var el=$("#cfgKey"), fp=$("#cfgKeyFp"), hh=$("#cfgKeyHint");
    var raw=el?el.value:"", ck=cleanKey(raw);
    if(fp) fp.innerHTML = ck.key
      ? ('输入框里：<b>'+esc(keyFinger(ck.key))+'</b> · '+ck.key.length+' 字符'+
         (ck.removed>0 ? ' · <span class="khw">含 '+ck.removed+' 个看不见的字符（保存时自动清掉）</span>' : ''))
      : '还没有 Key';
    var chk=keyCheck(ck.key, $("#cfgProv").value);
    if(hh) hh.innerHTML='<span class="kh '+chk.lv+'">预检 · '+esc(chk.msg)+'</span>';
  }
  $("#cfgProv").onchange=function(){
    var p=PROVIDERS[this.value];S.cfg=S.cfg||{};
    if(p.u){$("#cfgUrl").value=p.u;} if(p.m){$("#cfgModel").value=p.m;}
    kHint();   /* ★ 换服务商必须重跑预检：旧 Key 不会被自动清掉，401 多半就是这么来的 */
  };
  var _ckEl=$("#cfgKey"); if(_ckEl) _ckEl.oninput=kHint;
  kHint();
  $("#cfgSave").onclick=function(){
    var ret=applyCfg();
    if(ret) toast("已保存并启用 · "+S.cfg.model);
    kHint();
  };
  $("#cfgTest").onclick=async function(){
    var ret=applyCfg(), box=$("#cfgDiag");
    if(!ret){
      if(box) box.innerHTML='<div class="dg warn"><b>还没法测</b><span>先把 Base URL / 模型名 / Key 三项填对（看上面的预检）。</span></div>';
      return;
    }
    if(box) box.innerHTML='<div class="dg info"><b>正在测</b><span>第 1 步只验钥匙，第 2 步才真的调一次模型。</span></div>';
    var rows=await llmProbe();
    if(box) box.innerHTML=rows.map(function(x){
      return '<div class="dg '+x.lv+'"><b>'+esc(x.k)+'</b><span>'+esc(x.v)+'</span></div>';
    }).join("");
    var bad=false; rows.forEach(function(x){ if(x.lv==="err") bad=true; });
    toast(bad ? "没过 · 看自检结果，它会告诉你是钥匙还是地址" : ("通了 · "+S.cfg.model));
  };
  function applyCfg(){
    var ck=cleanKey($("#cfgKey").value);
    if(ck.removed>0) $("#cfgKey").value=ck.key;   /* 清洗结果写回输入框，用户看得见 */
    var c={on:1,prov:$("#cfgProv").value,baseUrl:$("#cfgUrl").value.trim(),model:$("#cfgModel").value.trim(),key:ck.key};
    if(RETIRED[c.model]) {toast("检测到已退役模型名，已自动换成 "+RETIRED[c.model]);c.model=RETIRED[c.model];$("#cfgModel").value=c.model;}
    S.cfg=Object.assign({},S.cfg||{},c);
    if(!S.cfg.baseUrl||!S.cfg.model||!S.cfg.key){S.cfg.on=0;save();syncLlmTip();toast("还缺 Base URL / 模型名 / Key，先保持本地引擎");return false;}
    var chk=keyCheck(S.cfg.key, S.cfg.prov);
    if(chk.lv==="err"){                        /* 非 ASCII 这种是「必然 401」，不许带着它去调用 */
      S.cfg.on=0; save(); syncLlmTip();
      $("#cfgDiag").innerHTML='<div class="dg err"><b>Key 没通过预检</b><span>'+esc(chk.msg)+'</span></div>';
      toast("Key 没通过预检，已保持本地引擎");
      return false;
    }
    save(); syncLlmTip();
    if(ck.removed>0){
      $("#cfgDiag").innerHTML='<div class="dg warn"><b>已清掉 '+ck.removed+' 个看不见的字符</b>'+
        '<span>零宽空格 / 全角空白这类字符不会被 trim 掉，会原样塞进请求头 ： 这是 401 最常见的来源之一。已自动清理。</span></div>';
    }else if(chk.lv==="warn"){
      $("#cfgDiag").innerHTML='<div class="dg warn"><b>Key 预检有疑点（不拦你，先试）</b><span>'+esc(chk.msg)+'</span></div>';
    }
    return true;
  }
  $$("#mBody button[data-z]").forEach(function(b){b.onclick=function(){setSet("z",+b.dataset.z);openSet();};});
  $$("#mBody button[data-lh]").forEach(function(b){b.onclick=function(){setSet("lh",+b.dataset.lh);openSet();};});
  $$("#mBody button[data-motion]").forEach(function(b){b.onclick=function(){setSet("motion",+b.dataset.motion);openSet();};});
  $$("#mBody button[data-narrow]").forEach(function(b){b.onclick=function(){setSet("narrow",+b.dataset.narrow);openSet();};});
  var se=$("#setExp");if(se)se.onclick=doExport;
  var si=$("#setImp");if(si)si.onclick=doImport;
  var st=$("#setTrack");if(st)st.onclick=trackExport;
  var sc=$("#setTrackClear");if(sc)sc.onclick=trackClear;
}
function openModal(t,b,btns){
  $("#mTitle").textContent=t;$("#mBody").innerHTML=b;
  $("#mFoot").innerHTML="";
  (btns||[]).forEach(function(x){
    var el=document.createElement("button");
    if(x.c)el.className=x.c;el.textContent=x.t;el.onclick=x.f;
    $("#mFoot").appendChild(el);
  });
  $("#mask").classList.add("on");
}
function closeModal(){$("#mask").classList.remove("on");}
function openWhy(){openModal("说明 · 这一版怎么来的",WHYHTML,[{t:"知道了",c:"pri",f:closeModal}]);}

function defSet(){return {z:1,lh:19,motion:1,narrow:0};}
function curSet(){return Object.assign(defSet(),S.set||{});}
function setSet(k,v){S.set=Object.assign(curSet(),{});S.set[k]=v;save();applySet();}
function applySet(){
  var c=curSet();
  document.documentElement.dataset.z=c.z;
  document.documentElement.dataset.lh=c.lh;
  document.documentElement.dataset.motion=c.motion;
  document.documentElement.dataset.narrow=c.narrow;
}
function doExport(){
  try{
    var tr=Array.isArray(S.trail)?S.trail.slice():[];
    var out={}; for(var k in S) out[k]=S[k];
    out._read={
      "导出时间": new Date().toLocaleString(),
      "走了几页": tr.length,
      "总时长_秒": tr.length? Math.round((Date.now()-tr[0].t)/1000) : 0,
      "每页停留_秒": tr.map(function(x,i){
        var nxt=(i+1<tr.length)? tr[i+1].t : Date.now();
        return x.v+' 停留'+Math.round((nxt-x.t)/1000)+'s';
      }),
      "最后一步": tr.length? tr[tr.length-1].v : '(没走动)',
      "有没有做成事": {
        "生成过画像": !!(S.prof&&S.prof.labels&&S.prof.labels.length),
        "选过七词": (S.sel||[]).length,
        "进过模拟": !!S.sess,
        "放过鱼": (S.fish||[]).length,
        "记过错题": (S.book||[]).length,
        "用过鱼群密语": !!S.bbxLast,
        "用过待办": (S.todo||[]).length,
        "记过竞品动态": (S.rival||[]).length
      }
    };
    var blob=new Blob([JSON.stringify(out,null,1)],{type:"application/json"});
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download="offer鲨_存档_"+new Date().toISOString().slice(0,10)+".json";a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);},3000);
    toast("已导出存档（含可读的轨迹摘要）");
  }catch(e){toast("导出失败");}
}
function doImport(){
  var inp=document.createElement("input");inp.type="file";inp.accept=".json";
  inp.onchange=function(){
    var f=inp.files[0];if(!f)return;
    var fr=new FileReader();
    fr.onload=function(){
      try{
        var o=JSON.parse(fr.result);
        localStorage.setItem(KEY,JSON.stringify(o));
        toast("已导入，正在重新载入…");
        setTimeout(function(){location.reload();},500);
      }catch(e){toast("文件格式不对");}
    };
    fr.readAsText(f,"utf-8");
  };
  inp.click();
}

/* ==================== 事件绑定 ==================== */
function bind(){
  $("#btnParse").onclick=doParse;
  $("#btnDemo").onclick=function(){
    $("#resumeRaw").value=DEMO;
    doParse();
  };
  $("#btnClear").onclick=function(){
    $("#resumeRaw").value="";$("#p0hint").textContent="";var _po2=$("#p0out"); if(_po2) _po2.innerHTML="";
    S.resume={raw:"",facts:null};S.prof=null;S.sel=[];S.match=null;S.jd=null;S.bank=null;S.sess=null;
    save();toast("已清空第一步");
  };
  $("#dropZone").onclick=function(){$("#file").click();};
  $("#file").onchange=function(){if(this.files[0])handleFile(this.files[0]);};
  ["dragenter","dragover"].forEach(function(ev){
    $("#dropZone").addEventListener(ev,function(e){e.preventDefault();$("#dropZone").style.borderColor="var(--gold2)";});
  });
  ["dragleave","drop"].forEach(function(ev){
    $("#dropZone").addEventListener(ev,function(e){e.preventDefault();$("#dropZone").style.borderColor="";});
  });
  $("#dropZone").addEventListener("drop",function(e){
    if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);
  });

  $("#lkSuggest").onclick=suggestWords;
  $("#btnToMatch").onclick=function(){
    if(!S.sel.length){toast("至少选 1 个关键词");return;}
    go(3);
  };
  $("#btnBack2").onclick=function(){go(2);};
  $("#btnToSim").onclick=startSim;

  $("#btnSend").onclick=send;
  $("#inp").addEventListener("keydown",function(e){
    if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)){e.preventDefault();send();}
  });
  $("#btnMic").onclick=asrToggle;

  $("#btnSet").onclick=openSet;
  $("#btnWhy").onclick=openWhy;
  /* 院校版入口。★ 用空安全写法：这一版里像 btnImp / btnReset 是有的，
     但院校版入口可能在别的构建树里不存在 —— $("#x").onclick 遇到 null 会抛，
     异常从 bind() 抛出会让后面所有初始化（开屏、底栏、首屏）全部不执行。 */
  var _bc=$("#btnCampus"); if(_bc) _bc.onclick=function(){ view("campus"); };
  $("#btnExp").onclick=doExport;
  var bi=$("#btnImp"); if(bi) bi.onclick=doImport;
  var _br=$("#btnReset"); if(_br) _br.onclick=function(){
    openModal("清空全部数据",'<p>会删掉这台设备上保存的简历、画像、题集与面试记录，且不可恢复。确定？</p>',
      [{t:"确定清空",c:"pri",f:function(){
        try{localStorage.removeItem(KEY);}catch(e){}
        closeModal();toast("已清空，正在重载…");setTimeout(function(){location.reload();},400);
      }},{t:"算了",f:closeModal}]);
  };
  $("#mClose").onclick=closeModal;
  $("#mask").onclick=function(e){if(e.target===$("#mask"))closeModal();};
}
function asrOK(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition);}
function asrToggle(){
  if(!asrOK()){toast("这个浏览器不支持语音输入，用键盘也一样");return;}
  var R=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(asrToggle._r){asrToggle._r.stop();asrToggle._r=null;$("#btnMic").classList.remove("on");return;}
  var r=new R();r.lang="zh-CN";r.continuous=true;r.interimResults=true;
  asrToggle._r=r;$("#btnMic").classList.add("on");
  r.onresult=function(e){
    var s="";
    for(var i=e.resultIndex;i<e.results.length;i++) s+=e.results[i][0].transcript;
    $("#inp").value=s;
  };
  r.onend=function(){$("#btnMic").classList.remove("on");asrToggle._r=null;};
  r.onerror=function(){toast("语音识别中断，可以再点一次");$("#btnMic").classList.remove("on");asrToggle._r=null;};
  r.start();
}
var DEMO="李雯，女，29 岁，本科（市场营销），7 年互联网运营经验。\n"+
"2019-2021 在草莓出行做用户运营：负责新客首单转化，把注册到首单的转化率从 18% 提到 27%，其中我主导的优惠券分层策略贡献了大约一半，这个口径是按首单口径算的，季度同比。\n"+
"2021-2023 在云枢科技做增长运营，带过 2 人小组。我牵头重做了召回体系，把 30 日沉默用户的召回率从 4.1% 拉到 8.6%，为此我和数据团队吵过两次，最后定了新的埋点规范。\n"+
"2023-至今 在麦禾做运营负责人，统筹 5 人的运营小组，管着一年 300 万的投放预算。我搭了一套从选品到复投的流程，把 ROI 从 1.8 提到 2.6。\n"+
"我习惯先把流程和指标定死再推，不太喜欢临时改需求；但也因此被说过节奏慢。团队里我一般先把事扛下来，不太会拒绝别人塞过来的活。\n"+
"技能：SQL、Excel、神策、埋点体系搭建、A/B 测试、投放优化。英语可日常沟通。";

/* ==================== 启动 ==================== */
function initAll(){
  load();
  applySet();
  syncLlmTip();
  bind();
  bindNav();
  buildSplash();
  grantGift();                 /* 新手礼包：只在第一次发 */
  if(S.resume.raw){ var rr=$("#resumeRaw"); if(rr) rr.value=S.resume.raw; }
  if(S.resume.facts&&S.prof){ var h0=$("#p0hint"); if(h0) h0.textContent="已恢复上次的简历与画像。"; }
  fillNavIcons();              /* 侧栏九只鲨鱼图标（icons.js 生成） */
  renderNavPins();             /* 导航置顶 + 通道排序（navpin.js） */
  syncTrackUI();               /* 侧栏顶部的通道名与置顶组标题 */
  mountHeroFish();             /* 跟着光标游的那条鱼（fish3d.js） */
  syncDock();
  window.addEventListener("resize", syncDock);
  renderMoods();
  bindChatter();
  bindGrowth();                /* 隐私 / 分享卡 / 鱼群密语 / 无障碍 */
  bindTodo();                  /* 待办 / 提醒 / 日程导出 */
  bindShareFab();              /* 常驻分享按钮 */
  renderProfFish(false);       /* 已有画像时静态显示，不重放动画 */
  view(S.view||"me");
  if(!S.set){ S.set=defSet(); save(); }
}
document.addEventListener("DOMContentLoaded",initAll);

/* =====================================================================
   ↓↓↓ 本段为「职场鱼塘」版本的改造层 ↓↓↓
   导航（左侧栏视图 + 子页）、我的鱼塘、蛐蛐、错题集
   ===================================================================== */

/* ==================== 导航 ==================== */
/* 气泡转场：切视图时冒几个气泡，弱化「跳页面」的割裂感。
   ★ 尊重 data-motion=0 与 prefers-reduced-motion，减动效时一个都不冒。 */
function bubbleBurst(){
  if(document.documentElement.getAttribute("data-motion")==="0") return;
  try{
    var n=6+Math.floor(Math.random()*5);
    for(var i=0;i<n;i++){
      var b=document.createElement("span");
      b.className="bub";
      var sz=(4+Math.random()*9).toFixed(1);
      b.style.left=(Math.random()*100).toFixed(1)+"%";
      b.style.top=(50+Math.random()*45).toFixed(1)+"%";
      b.style.width=b.style.height=sz+"px";
      b.style.setProperty("--d",(1.2+Math.random()*1.5).toFixed(2)+"s");
      b.style.animationDelay=(Math.random()*0.4).toFixed(2)+"s";
      document.body.appendChild(b);
      (function(el){setTimeout(function(){try{el.remove();}catch(e){}},2300);})(b);
    }
  }catch(e){}
}
function view(v){
  /* 通道隔离：点到的栏目属于另一个通道时，把通道切过去，而不是把人挡在外面。
     内部串场按钮（进化雷达 → 职场画像 之类）因此照旧能用。 */
  if(typeof trackOf==="function" && typeof trackHas==="function" && v!=="me"
     && !(typeof trackBoth==="function" && trackBoth(v))){
    var tk=trackOf(v);
    if(tk && tk!==trackId()){
      S.lane=tk;
      var t=TRACKS[tk], cur=Array.isArray(S.pins)?S.pins:[];
      var keep=cur.filter(function(x){ return t.items.indexOf(x)>=0; });
      S.pins=keep.length?keep:t.pins.slice();
      if(typeof toast==="function") toast("已切到「"+t.n+"」");
    }
    renderNavPins(); syncTrackUI();
  }
  S.view=v; trailPush(v); save();
  bubbleBurst();   /* 气泡转场 */
  trackPush("view", {v:v});   /* 埋点：进入哪一页 */
  Array.prototype.forEach.call(document.querySelectorAll(".vpane"),function(el){
    el.classList.toggle("on", el.id==="v-"+v);
  });
  /* ★ 只认 [data-v]：置顶开关（.nvpin）也是 #nav 里的 button，
     不排除掉就会被当成导航项绑上 view(undefined)。 */
  Array.prototype.forEach.call(document.querySelectorAll("#nav button[data-v]"),function(b){
    b.classList.toggle("on", b.dataset.v===v);
  });
  /* 窄屏下导航是横向滚动条：把当前项带回可视区，否则高亮会留在屏幕外 */
  var _nv=document.getElementById("nav");
  if(_nv && _nv.scrollWidth>_nv.clientWidth+2){
    var _on=_nv.querySelector("button.on");
    if(_on && _on.scrollIntoView) _on.scrollIntoView({block:"nearest",inline:"nearest"});
  }
  var mc=document.getElementById("meCard");
  if(mc) mc.classList.toggle("on", v==="me");
  renderComposer();
  window.scrollTo({top:0,behavior:"smooth"});
  renderMoments();
  if(v==="me") renderMe();
  else if(v==="status"){ renderStatus(); }
  else if(v==="school"){ renderSchool(); }
  else if(v==="chatter"){ renderTank(); renderPool(); renderShop(); }
  else if(v==="job"){ applyJob(); renderProfFish(false); }
  else if(v==="interview") applyIv();
  else if(v==="dispute"){ applyDis(); mountCaseCta("disCaseHost","dis"); }
  else if(v==="tool") renderTool();
  else if(v==="pay") renderPay();
  /* 院校版：不在 TRACKS 里的视图。trackOf() 对它返回空串，
     上面那段「跨通道点击自动切通道」会直接跳过 —— 不需要为它开例外。 */
  else if(v==="campus" && typeof renderCampus==="function") renderCampus();
  else if(v==="rival") applyRival();
  else if(v==="grow"){ renderEvolve(); }
  renderShareFab();
  renderBackBar();    /* 返回条：进子页 / 回首页都要跟着改 */
  syncDock();         /* 子页标签吸顶要让开「今日安排」条的高度 */
  mountOverview(v);   /* 概览卡：每次切视图重算 ： 数字必须实时，不能缓存 */
  a11yAll();
  /* 方法与来源（firstrun.js 提供）：不进通道导航，从「设置」与首屏提示进入。
     放在函数最末尾 —— 前面那次插错位置直接落进了 SUBTABS 对象里，语法就炸了。 */
  if(v==="method" && typeof renderMethod==="function") renderMethod();
}
/* 返回条：一个按钮解决「在二级页面里出不来」。
   ★ 规则只有两条，不做花活：
     ① 在栏目的子页里（tab ≠ 0）→ 回到该栏目的首页（tab 0），标签写栏目名；
     ② 已经在栏目首页 → 回「我的鱼塘」，标签写「回到我的鱼塘」。 */
var SUBTABS={
  interview:{ tab:function(){return S.ivTab||0;},       back:function(){iv(0);},   n:"面试模拟" },
  job:      { tab:function(){return S.jobTab||0;},      back:function(){job(0);},  n:"职场画像" },
  dispute:  { tab:function(){return S.disTab||0;},      back:function(){dis(0);},  n:"劳议鲨手" }
};
/* 子页标签吸顶要避开「今日安排」条：它的高度会变（折叠/展开/换行），
   所以不写死数值，每次切视图与窗口变化时量一次，写进 --dockh。 */
function syncDock(){
  var tb=document.getElementById("todoBar"), h=0;
  if(tb){
    var cs=getComputedStyle(tb), r=tb.getBoundingClientRect();
    if(cs.display!=="none" && cs.visibility!=="hidden" && r.height>0) h=Math.round(r.height)+2;
  }
  document.documentElement.style.setProperty("--dockh", h+"px");
}
function renderBackBar(){
  var b=document.getElementById("btnBack");
  if(!b) return;
  var v=S.view||"me", sub=SUBTABS[v];
  var inSub = !!(sub && sub.tab()!==0);
  if(inSub){
    b.textContent="← 返回 "+sub.n;
    b.onclick=function(){ sub.back(); };
  }else{
    b.textContent="← 回到我的鱼塘";
    b.onclick=function(){ view("me"); };
  }
  /* 已经在「我的鱼塘」并且没进子页 → 这个按钮没意义，收起来 */
  b.hidden = (v==="me" && !inSub);
}
/* ★ 2026-09-27：输入条从「底部悬浮」搬到「对话区下面、设置上面」（用户要求）。
   为什么这么搬：悬浮条固定在视口底部，会盖住它正下方的「① 这一场，谁面你」；
   搬进页内之后动线是一条直线 —— 读完最后一条面试官的话，回答框紧接着在下面，
   再往下才是设置。
   ★ 搬位写在 JS 里而不是 body.html：body 在皮肤树里要逐字节一致；
     而且这里是幂等的（已经在 pane 里就不动），不会每次切页都重排。
   ★ 样式也必须跟着从 fixed 改成 relative（见 style.html 的 .composer），
     否则搬进 #i0 之后一个 fixed 会盖住整页 —— 那正是这次要改掉的毛病。 */
/* 输入条搬进页内之后的配套动作：保证它在屏幕里。
   只在它超出视口时才滚，且只滚到刚好露出来（不把整页甩到底）。
   返回 false 表示「这一页没有输入条」，调用方可以退回原来的行为。 */
function keepComposerInView(){
  var c=document.getElementById("composer");
  if(!c || c.classList.contains("hidden") || !c.offsetParent) return false;
  var r=c.getBoundingClientRect();
  if(r.bottom > window.innerHeight - 8 || r.top < 0){
    var target=Math.max(0, window.scrollY + r.bottom - window.innerHeight + 28);
    try{ window.scrollTo({top:target,behavior:"smooth"}); }catch(e){ window.scrollTo(0,target); }
  }
  return true;
}
function renderComposer(){
  var c=document.getElementById("composer");
  if(!c) return;
  var pane=document.getElementById("i0"), anchor=document.getElementById("ivSetup");
  if(pane && anchor && c.parentNode!==pane) pane.insertBefore(c, anchor);
  var show=(S.view==="interview" && (S.ivTab||0)===0);
  c.classList.toggle("hidden", !show);
  /* ★ 输入条可见时把常驻分享按钮收起来：它固定在右下角，而发送键也在右侧，
     实测逐档滚动扫描有 2 个位置会重叠（390px 与 1280px 都有）。
     **发送键是这一页的主操作，不能被任何东西盖住。**
     分享入口在这一页并不缺（「这一场对阵」有一行分享、还有分享解锁那几条）。 */
  document.body.classList.toggle("composing", show);
}
function job(i){
  S.jobTab=i; save();
  if(S.view!=="job") view("job"); else applyJob();
}
function applyJob(){
  var i=S.jobTab||0;
  Array.prototype.forEach.call(document.querySelectorAll(".fpane"),function(el,k){
    el.style.display=(k===i)?"":"none";
  });
  Array.prototype.forEach.call(document.querySelectorAll("#jobTabs button"),function(b){
    b.classList.toggle("on", (+b.dataset.f)===i);
  });
  if(i===1){ renderTree(); renderRank(); }
  if(i===2){ renderMatch(); }
  if(typeof renderBackBar==="function") renderBackBar();
}
function iv(i){
  S.ivTab=i; save();
  if(S.view!=="interview") view("interview"); else applyIv();
}
function applyIv(){
  var i=S.ivTab||0;
  /* 子页顺序：0 模拟 / 1 群面(会员) / 2 即时咨询(会员) / 3 错题集 / 4 复盘。
     切换靠 .ipane 的 DOM 顺序索引，所以 body.html 里的排列必须与这里一致。 */
  Array.prototype.forEach.call(document.querySelectorAll(".ipane"),function(el,k){
    el.style.display=(k===i)?"":"none";
  });
  /* 「谁坐对面」那一行（duel.js）挂在标签栏上方，是五个子页共用的一格，
     但它只在「模拟」页有意义 ： 群面有自己的那一桌鱼，别让两处打架。 */
  var _dv=document.getElementById("ivDuelBox");
  if(_dv) _dv.hidden=(i!==0);
  Array.prototype.forEach.call(document.querySelectorAll("#ivTabs button"),function(b){
    b.classList.toggle("on", (+b.dataset.i)===i);
  });
  renderComposer();
  if(i===0){ renderChat(); renderIvSetup(); }
  renderBackBar();
  if(i===1) renderGroup();
  if(i===2) renderConsult();
  if(i===3) renderBook();
  if(i===4) renderReport();
  /* 复盘刚出分时，右下角的分享按钮要跟着变成「复盘成绩」 */
  if(typeof renderShareFab==="function") renderShareFab();
}
/* 兼容旧调用点：把原来的步骤号映射到「视图 + 子页」 */
function go(i){
  if(i===0) return job(0);
  if(i===1) return view("me");
  if(i===2) return job(1);
  if(i===3) return job(2);
  if(i===4) return iv(0);
  if(i===5) return iv(3);   /* 错题集：现在排在子页第 4 个，索引 3 */
  if(i===6) return iv(4);   /* 复盘：索引 4 */
}

/* ==================== 我的鱼塘 ==================== */
function meCode(){
  return (S.prof&&S.prof.quad&&S.prof.quad.code) ? S.prof.quad.code : "TNJA";
}
function meNick(){
  var L=(S.prof&&S.prof.labels)?S.prof.labels:[];
  return L.length ? L[0].p.t : "未登录的鲨鱼";
}
function renderMe(){
  var look=myLook();
  var L=(S.prof&&S.prof.labels)?S.prof.labels:[];
  var a1=document.getElementById("meAv");
  if(a1) a1.innerHTML=fishSVG(stageOf().id, 34, {aria:"你的鱼"});
  var a2=document.getElementById("meBig");
  if(a2) a2.innerHTML=fishSVG(stageOf().id, 168, {aria:"你现在是"+stageOf().n});
  var n1=document.getElementById("meName");
  if(n1) n1.textContent=meNick();
  var s1=document.getElementById("meSub");
  if(s1) s1.textContent=L.length ? (shapeName(look.shape)+" · 画像已生成") : "点这里看我的鱼塘";
  var c1=document.getElementById("meCoinTop"); if(c1) c1.textContent=(S.coin||0);
  var c2=document.getElementById("meCoinBig"); if(c2) c2.textContent=(S.coin||0);
  var bn=document.getElementById("meBigName"); if(bn) bn.textContent=meNick();
  var bs=document.getElementById("meBigSub");
  if(bs) bs.textContent = L.length
    ? (shapeName(look.shape)+" · "+skinById(look.skin).name+" · "+outfitById(look.outfit).name+
       " · 画像："+L.map(function(x){return x.p.t;}).slice(0,3).join(" / ")+" 等 "+L.length+" 个标签")
    : "还没有名字。先去「职场画像 → 简历」把简历交出来，画像会自动长出来。";
  var st=document.getElementById("meStats");
  if(st){
    var fishN=(S.fish||[]).length;
    var gotLike=(S.fish||[]).reduce(function(a,f){return a+likeCount(f);},0);
    var sessN=(S.hist&&S.hist.length)||(S.sess?1:0);
    var bookN=(S.book||[]).length;
    var dressN=(S.own||["classic"]).length+(S.ownOutfit||[DEF_OUTFIT]).length+(S.ownShape||[DEF_SHAPE]).length;
    st.innerHTML=
      '<div><b>'+fishN+'</b><small>我放的鱼</small></div>'+
      '<div><b>'+gotLike+'</b><small>收到的赞</small></div>'+
      '<div><b>'+(S.coin||0)+'</b><small>鱼币</small></div>'+
      '<div><b>'+dressN+'</b><small>拥有装扮</small></div>'+
      '<div><b>'+bookN+'</b><small>错题</small></div>'+
      '<div><b>'+sessN+'</b><small>模拟场次</small></div>';
  }
  renderProfile();
  renderGrowthCard();  /* 你的鱼：长到哪一阶段了（fish3d.js） */
  renderShareProg();   /* 分享进度卡：拿装扮（share.js） */
}
/* 覆盖旧版：画像渲染到账号页 */
function renderProfile(){
  var host=document.getElementById("meProfile");
  if(!host) return;
  if(!S.prof||!S.prof.labels||!S.prof.labels.length){
    host.innerHTML='<div class="card" style="margin-top:16px"><h3>还没有画像</h3>'+
      '<p class="note">去「职场画像 → 简历」交出简历，画像生成在这里。'+
      '画像是一套四维框架（动机 / 认知 / 行事 / 人际），抓 4–6 个最贴合你的原型，每个都附原句作证据。</p></div>';
    return;
  }
  var q=S.prof.quad,L=S.prof.labels,h="",look=myLook();
  h+='<h2 class="sec">机器读到的你</h2>';
  h+='<div class="pcard mine">'+
      '<div class="pav">'+avatarSVG(q.code,132,0,look)+'</div>'+
      '<div class="pmain">'+
        '<div class="prow"><span class="code">'+esc(q.code)+'</span><h4>'+esc(L[0].p.t)+'</h4></div>'+
        '<div class="aka">'+esc(L[0].p.aka||"")+'</div>'+
        '<div class="tt">'+esc(avatarDesc(q.code,look))+'</div>'+
        quadScaleHTML(q)+
        '<div class="pm"><i>刹车点</i><span class="warn">'+esc(S.prof.brake||"")+'</span></div>'+
      '</div></div>';
  h+='<h2 class="sec">常驻主标签 · '+L.length+' 个（3–6 个属于正常区间）</h2>';
  L.forEach(function(l,i){ h+=pcardHTML(l,i); });
  if(S.prof.temp&&S.prof.temp.length){
    h+='<h2 class="sec">临时标签 · 压力或场景切换时才激活</h2><div class="card">'+
      S.prof.temp.map(function(t){
        return '<div class="q"><b>'+esc(t.name)+'</b>'+(t.when?'<br><em>什么时候会被激活：</em>'+esc(t.when):'')+'</div>';
      }).join("")+'</div>';
  }
  h+='<div class="card"><h3>这张画像的边界</h3><p class="note">来源：'+esc(S.prof.src||"本地规则引擎")+
     '。它描述的是<b>行为倾向</b>，不是心理诊断，也不是永久标签：同一个人在不同场景下会切换主导模式。</p>'+
     '<div class="acts"><button id="btnReProf">重新抓一次画像</button><button id="btnLLMProf">让大模型重推画像</button></div></div>';
  host.innerHTML=h;
  var a=document.getElementById("btnReProf");
  if(a) a.onclick=function(){ S.prof=buildProfile(S.resume.raw,S.resume.facts); save(); renderProfile(); renderProfFish(true); toast("已重新抓取"); };
  var b=document.getElementById("btnLLMProf");
  if(b) b.onclick=llmPersona;
}

/* ==================== 蛐蛐 ==================== */
/* 状态标签：内置 24 个 + 你自己的。
   自定义的那个会在标签角上带一个 ✕，点它可以删掉（有二次确认）。 */
function renderMoods(){
  var host=document.getElementById("moodRow");
  if(!host) return;
  var all=moodsAll();
  var cur=S.mood||"无语";
  if(all.indexOf(cur)<0) cur=S.mood="无语";
  host.innerHTML=all.map(function(m){
    var cu=isCustomMood(m);
    return '<button type="button" data-m="'+esc(m)+'" class="'+(m===cur?"on":"")+(cu?" cu":"")+'">'+
      '<i>'+esc(moodIcon(m))+'</i><span>'+esc(m)+'</span>'+
      (cu?'<u class="mox" data-mx="'+esc(m)+'" title="删掉这个状态">✕</u>':'')+
      '</button>';
  }).join("");
  Array.prototype.forEach.call(host.querySelectorAll("button[data-m]"),function(b){
    b.onclick=function(e){
      if(e.target && e.target.classList && e.target.classList.contains("mox")) return;
      S.mood=b.dataset.m; save(); renderMoods();
    };
  });
  Array.prototype.forEach.call(host.querySelectorAll(".mox"),function(b){
    b.onclick=function(e){
      e.stopPropagation();
      var m=b.dataset.mx;
      openModal("删掉这个状态", '<p class="note" style="margin-top:0">「'+esc(m)+'」是你自己加的状态。'+
        '删掉之后它就从选项里消失，<b>但已经用这个状态放出去的鱼不会变</b>：那些鱼保留当时的标签与配色。</p>',
        [{t:"删掉", c:"pri", f:function(){ moodDel(m); closeModal(); renderMoods(); }},
         {t:"不删了", f:closeModal}]);
    };
  });
}
function openMoodAdd(){
  openModal("加一个自己的状态", '<div class="svcform">'+
    '<p class="note" style="margin-top:0">内置的覆盖不到，就自己写一个。'+
    '最多 8 个字，最多存 12 个。<b class="hl">它会自动生成专属的鱼身配色</b>，也会进「工作节律」的状态统计。</p>'+
    '<label class="rvfld"><span>状态名</span>'+
      '<input id="moodNew" type="text" maxlength="8" placeholder="例：被甲方反复折磨 / 刚谈完绩效"></label>'+
    '<div class="moodprev" id="moodPrev"></div>'+
    '</div>', [
    {t:"加上", c:"pri", f:function(){
      var el=document.getElementById("moodNew");
      if(moodAdd(el?el.value:"")){ closeModal(); renderMoods(); }
      else { var e2=document.getElementById("moodNew"); if(e2) e2.focus(); }
    }},
    {t:"算了", f:closeModal}
  ]);
  var inp=document.getElementById("moodNew");
  if(inp){
    inp.focus();
    inp.oninput=function(){
      var p=document.getElementById("moodPrev");
      if(!p) return;
      var v=String(inp.value||"").trim();
      if(!v){ p.innerHTML=""; return; }
      p.innerHTML='<span class="moodprev-t">长这样：</span>'+
        '<button type="button" class="on"><i>🏷</i><span>'+esc(v)+'</span></button>'+
        '<span class="moodprev-c">鱼身配色码 '+esc(moodCode(v))+'</span>';
    };
  }
}
/* 蛐蛐内部两个标签页：鱼池 / 商店 */
function openChatTab(t){
  Array.prototype.forEach.call(document.querySelectorAll("#chatTabs button"),function(b){
    b.classList.toggle("on", b.dataset.t===t);
  });
  var pw=document.getElementById("poolWrap"), sw=document.getElementById("shopWrap");
  if(pw) pw.style.display=(t==="pool")?"":"none";
  if(sw) sw.style.display=(t==="shop")?"":"none";
  if(t==="shop") renderShop(); else { renderTank(); renderPool(); }
}
function bindChatter(){
  var ta=document.getElementById("chatIn");
  if(ta){
    ta.addEventListener("input",function(){
      var c=document.getElementById("chatCnt");
      if(c) c.textContent=ta.value.length;
      if(ta.value.length>120) ta.value=ta.value.slice(0,120);
    });
  }
  var post=document.getElementById("btnPost");
  if(post) post.onclick=function(){
    var t=ta?ta.value:"";
    if(postFish(t,S.mood||"无语")){ ta.value=""; var c=document.getElementById("chatCnt"); if(c) c.textContent="0"; }
  };
  var dice=document.getElementById("btnDice");
  if(dice) dice.onclick=function(){
    var all=moodsAll(), old=S.mood;
    /* 随到一个跟当前不一样的，否则「换个状态」看起来没反应 */
    for(var k=0;k<8;k++){ S.mood=all[Math.floor(Math.random()*all.length)]; if(S.mood!==old) break; }
    save(); renderMoods(); toast("换成了「"+S.mood+"」");
  };
  var madd=document.getElementById("btnMoodAdd");
  if(madd) madd.onclick=openMoodAdd;
  var pic=document.getElementById("btnPic");
  if(pic) pic.onclick=fishPicPick;
  renderPicPrev();
  Array.prototype.forEach.call(document.querySelectorAll("#chatTabs button"),function(b){
    b.onclick=function(){ openChatTab(b.dataset.t); };
  });
  Array.prototype.forEach.call(document.querySelectorAll("#poolTabs button"),function(b){
    b.onclick=function(){
      S.poolMode=b.dataset.p; save();
      Array.prototype.forEach.call(document.querySelectorAll("#poolTabs button"),function(x){ x.classList.toggle("on",x===b); });
      renderPool();
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("#shopTabs button"),function(b){
    b.onclick=function(){ S.shopTab=b.dataset.shopshelf; save(); renderShop(); };
  });
  var tank=document.getElementById("tankOut");
  if(tank){
    tank.onclick=function(e){
      var el=(e.target&&e.target.closest)?e.target.closest("[data-tf]"):null;
      if(el) pickFish(el.dataset.tf);
    };
  }
}

/* ==================== 错题集 ==================== */
function addBook(item){
  if(!item||!item.q) return;
  S.book=S.book||[];
  for(var i=0;i<S.book.length;i++) if(S.book[i].q===item.q) return;
  S.book.unshift(item);
  S.book=S.book.slice(0,80);
  save();
}
function renderBook(){
  var host=document.getElementById("bookOut");
  if(!host) return;
  var list=S.book||[];
  var h="";
  if(!list.length){
    h+='<div class="card"><h3>错题集是空的</h3><p class="note">去「面试模拟 → 模拟」打一场。掉到 1 级以下的题会自动收到这里。</p>'+
       '<div class="acts"><button class="pri big" id="btnGoSim">去打一场</button></div></div>';
  }else{
    h+='<div class="card hi"><h3>我答砸的题 · '+list.length+' 条</h3>'+
       '<p class="note" style="margin-top:0">每条都留着当时的原话和掉分维度。下面重写一版，写下来才算过。</p></div>';
    h+=list.map(function(b,i){
      return '<div class="bitem">'+
        '<div class="bq">'+(i+1)+'. '+esc(b.q)+'</div>'+
        '<div class="bm">'+(b.src?'<span>'+esc(b.src)+'</span>':'')+
          (b.weak||[]).map(function(w){return '<span class="low">'+esc(w)+' 掉分</span>';}).join("")+
          '<span>'+esc(b.at||"")+'</span></div>'+
        '<div class="bmy"><b>当时的原话：</b>'+esc(b.mine||"（没记到）")+'</div>'+
        '<textarea data-bk="'+i+'" placeholder="重写一版：先给结论，再给数字和口径，最后说清哪部分是你做的。">'+esc(b.fix||"")+'</textarea>'+
        '<div class="acts" style="margin-top:8px"><button class="sm" data-save="'+i+'">存下我的版本</button>'+
        '<button class="sm" data-rm="'+i+'">删掉这条</button></div>'+
      '</div>';
    }).join("");
    h+='<div class="acts"><button id="btnGoSim2" class="pri big">再打一场</button></div>';
  }
  // 建议练的题（题库里挑弱点模块）
  var wk=weakMods(),ind=autoIndustry();
  var rec=[];
  wk.forEach(function(m){ bankItems(ind,m).slice(0,4).forEach(function(x){ rec.push(x); }); });
  if(rec.length){
    h+='<h2 class="sec">建议补练 · 按你的画像挑的</h2>';
    rec.slice(0,8).forEach(function(it){
      h+='<div class="qitem"><div class="qh"><span class="qn">·</span><div class="qq">'+fmtTpl(it.q)+'</div></div>'+
         '<div class="qmeta"><span class="qtag">'+esc(it.probe||"")+'</span><span class="qtag" style="color:var(--red);border-color:#E6C3BA">弱点攻坚</span></div>'+
         (it.tpl?'<div class="qtpl"><b>照着填</b>：'+esc(it.tpl)+'</div>':'')+'</div>';
    });
  }
  host.innerHTML=h;
  Array.prototype.forEach.call(host.querySelectorAll("[data-save]"),function(b){
    b.onclick=function(){
      var i=+b.dataset.save, ta=host.querySelector('[data-bk="'+i+'"]');
      S.book[i].fix=ta?ta.value:""; save(); toast("存下了");
    };
  });
  Array.prototype.forEach.call(host.querySelectorAll("[data-rm]"),function(b){
    b.onclick=function(){ S.book.splice(+b.dataset.rm,1); save(); renderBook(); renderMe(); toast("删掉了"); };
  });
  var g1=document.getElementById("btnGoSim"), g2=document.getElementById("btnGoSim2");
  if(g1) g1.onclick=function(){ iv(0); };
  if(g2) g2.onclick=function(){ iv(0); };
}

/* ==================== 事件绑定（新版） ==================== */
function bindNav(){
  Array.prototype.forEach.call(document.querySelectorAll("#nav button[data-v]"),function(b){
    b.onclick=function(){ view(b.dataset.v); };
  });
  var mc=document.getElementById("meCard");
  if(mc) mc.onclick=function(){ view("me"); };
  Array.prototype.forEach.call(document.querySelectorAll("#jobTabs button"),function(b){
    b.onclick=function(){ job(+b.dataset.f); };
  });
  Array.prototype.forEach.call(document.querySelectorAll("#ivTabs button"),function(b){
    b.onclick=function(){ iv(+b.dataset.i); };
  });
  /* 开屏两个通道：选完就按那条动线布置侧栏（还能随时切） */
  var tn=document.getElementById("trackNew"), tp=document.getElementById("trackPro");
  if(tn) tn.onclick=function(e){ e.stopPropagation(); setTrack("new",false); enterApp(); };
  if(tp) tp.onclick=function(e){ e.stopPropagation(); setTrack("pro",false); enterApp(); };
  var sp=document.getElementById("splash");
  if(sp) sp.onclick=function(){ enterApp(); };   /* 点空白处：进默认通道，不改已选的 */
  var g1=document.getElementById("btnGoChatter");
  if(g1) g1.onclick=function(){ view("chatter"); };
  var g2=document.getElementById("btnGoJob");
  if(g2) g2.onclick=function(){ job(0); };
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"){
      var m=document.getElementById("mask");
      if(m&&m.classList.contains("on")) closeModal();
    }
  });
}
