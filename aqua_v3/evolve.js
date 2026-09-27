/* =====================================================================
   进化雷达 · 技能学习
   ---------------------------------------------------------------------
   ★ 关于「每日更新信息」必须说清的一件事：
     本地单文件没有服务器，所以**不存在服务器推送的内容**。
     我做的是「按日期在本机确定性轮换的本地题库」：同一个技能，
     今天和明天给的东西不一样，且同一天重开还是同一条。
     这在体验上与「每天有新内容」一致，但它不是新闻，不会跟着行业变。
     这句话写在界面上，不包装成「AI 每日推送」。
   ★ 学习网站都是**真实存在的公开站点**，不是我们的服务；也没有做
     「AI 推荐课程」：推荐要基于真实数据，我没有。
   ★ 站点链接一律 target=_blank + rel=noopener。
   ===================================================================== */

var EV_CATS = ["硬技能", "沟通表达", "职场生存", "求职转行"];
/* 今日一条的三种类型 → CSS 类名。用拉丁类名而不是中文类名，
   避免后续维护时在编码上踩坑。 */
var EV_KIND = { "知识":"k-know", "练习":"k-prac", "资源":"k-res" };

var EV_SKILLS = [
/* ---------------- 硬技能 ---------------- */
{ id:'excel', n:'Excel / 数据处理', cat:'硬技能',
  why:'几乎所有岗位都要你「从这张表里看出点什么」，而这一项见效最快。',
  day:[
    {k:'知识', t:'先学「数据透视表」，不要先学函数',
     b:'透视表能解决八成「帮我统计一下」的活。顺序反了会变成背函数名，用的时候还是想不起来。'},
    {k:'练习', t:'拿你自己的工资条做一次透视',
     b:'按月份做「行」、按项目做「列」，横竖求和。做一遍比看十遍教程管用。'},
    {k:'知识', t:'SUMIFS 是加总里的主力，VLOOKUP 的问题在「只能往右查」',
     b:'要往左查用 INDEX+MATCH，或者新版直接用 XLOOKUP。'},
    {k:'资源', t:'先看官方文档，再看视频',
     b:'官方文档有英文术语对照，遇到报错时反而更好搜。',
     lk:{n:'Microsoft Learn · Excel', u:'https://learn.microsoft.com/zh-cn/office/excel/'}},
    {k:'练习', t:'把「手工复制粘贴」的那一步写成公式',
     b:'找一件你每周都要做的重复劳动，想办法让它变成一次点击。这一条练的是思路，不是函数。'}
  ],
  sites:[
    {n:'Microsoft Learn · Excel 官方教程', u:'https://learn.microsoft.com/zh-cn/office/excel/', w:'官方文档，函数与透视表都有中文说明'},
    {n:'中国大学MOOC', u:'https://www.icourse163.org/', w:'搜「Excel」有整套免费课，按周更新'},
    {n:'WPS 学堂', u:'https://www.wps.cn/learning/', w:'中文场景多，适合国内办公环境'}
  ]},

{ id:'sql', n:'SQL / 自己取数', cat:'硬技能',
  why:'能自己取数的人，不用等别人排期：这是最容易被看见的一项能力。',
  day:[
    {k:'知识', t:'SELECT → WHERE → GROUP BY → ORDER BY，四步能覆盖九成需求',
     b:'先想清楚「按什么分组」，再想「要哪些列」。反过来写通常要重写。'},
    {k:'知识', t:'JOIN 前先数一下两边的行数',
     b:'一对多的连接会让行数膨胀，算出来的和是错的。这是新手最常见的错误，而且不报错。'},
    {k:'练习', t:'用「先筛后连」改写一个慢查询',
     b:'把 WHERE 里能提前筛掉的条件提到 JOIN 之前，很多时候快一个数量级。'},
    {k:'知识', t:'NULL 不等于任何值，包括它自己',
     b:'所以判断要写 IS NULL，不能写 = NULL。COUNT(列名) 也不会数 NULL。'},
    {k:'练习', t:'给自己出一道题：本月新增用户里，有多少是第二次用',
     b:'这类「留存」问题是最好的练习素材，因为它真的需要想清楚口径。'}
  ],
  sites:[
    {n:'freeCodeCamp 中文 · 数据库', u:'https://www.freecodecamp.org/chinese/learn/', w:'免费、有交互练习，从查询到设计'},
    {n:'LeetCode 中文 · 数据库题库', u:'https://leetcode.cn/problemset/database/', w:'专门的 SQL 题，按难度排'},
    {n:'中国大学MOOC', u:'https://www.icourse163.org/', w:'搜「数据库」有高校完整课程'}
  ]},

{ id:'writing', n:'把一件事写清楚', cat:'硬技能',
  why:'职场里大多数「沟通问题」是「没写清楚」。这项能力不需要天赋，只需要一套结构。',
  day:[
    {k:'知识', t:'结论先行：第一句话就把结论说完',
     b:'「X 项目建议延期两周，原因是 A 和 B，需要你决定 C」：四要素一句话。后面才是展开。'},
    {k:'练习', t:'把最近一条长消息改成三行',
     b:'第一行结论，第二行依据，第三行你要对方做什么。改完对比一下原版。'},
    {k:'知识', t:'区分「事实」和「判断」，并标出来',
     b:'「昨天只完成了 3 条」是事实，「进度偏慢」是判断。混在一起写，对方会先把判断反驳掉，事实就没人看了。'},
    {k:'练习', t:'给一个坏消息写一封通知',
     b:'结构：坏消息 → 影响范围 → 已经做了什么 → 需要谁做什么 → 什么时候同步。'},
    {k:'知识', t:'能用列表就别用段落的「然而、因此」',
     b:'不是文风问题。列表让人能扫，扫得快才可能被回复。'}
  ],
  sites:[
    {n:'中国政府网 · 公文写作规范', u:'https://www.gov.cn/', w:'公文式结构的来源，很多职场文档沿用它'},
    {n:'中国大学MOOC · 应用写作', u:'https://www.icourse163.org/', w:'搜「应用写作」，有系统性课程'},
    {n:'Wikipedia · 金字塔原理', u:'https://zh.wikipedia.org/wiki/%E9%87%91%E5%AD%97%E5%A1%94%E5%8E%9F%E7%90%86', w:'结论先行的原始出处，先看梗概就够'}
  ]},

{ id:'english', n:'英语（读写够用就行）', cat:'硬技能',
  why:'目标不是流利，是「能读懂文档、能写清楚邮件」。这两件事三个月就能有明显变化。',
  day:[
    {k:'知识', t:'先把「读」练到能用，再管「说」',
     b:'读的成本最低、收益最快：技术文档、合同、邮件都是读。说需要环境和时间。'},
    {k:'练习', t:'每天精读一段你工作里真会遇到的英文',
     b:'不要泛读新闻。精读一段就够：查生词、抄下来、第二天回看。'},
    {k:'知识', t:'写邮件用短句，不用学复杂结构',
     b:'「Could you confirm by Friday?」比任何华丽句式都有效。写得越复杂，越显得不自信。'},
    {k:'练习', t:'把一封中文邮件翻译成英文，再删掉三分之一',
     b:'中译英的通病是逐字对应、句子过长。删完再读一遍会顺很多。'},
    {k:'知识', t:'遇到长难句先找主谓，跳过所有从句',
     b:'抽掉修饰部分，剩下的主谓宾就是意思。这一招能解决大部分「读不懂」。'}
  ],
  sites:[
    {n:'中国大学MOOC · 大学英语', u:'https://www.icourse163.org/', w:'高校课程，有免费旁听'},
    {n:'MDN 中文文档', u:'https://developer.mozilla.org/zh-CN/', w:'中英对照最好的技术文档之一'},
    {n:'B 站 · 学习区', u:'https://www.bilibili.com/v/knowledge/', w:'搜「英语 精读」，选长视频跟着读'}
  ]},

/* ---------------- 沟通表达 ---------------- */
{ id:'reportup', n:'向上汇报', cat:'沟通表达',
  why:'干得好但说不清，等于没干。汇报是你唯一能被看见的出口。',
  day:[
    {k:'知识', t:'汇报的默认结构：结论 → 依据 → 请求',
     b:'领导的时间比你的贵。第一句话没给结论，后面就没人听。'},
    {k:'知识', t:'带方案去，别带问题去',
     b:'「有个问题，两个方案，我倾向 A，因为…，需要你确认」：问题型汇报会让人想绕开你。'},
    {k:'练习', t:'把本周做的事压成三行，去掉所有过程描述',
     b:'过程是你的工作量，但不是对方的决策依据。对方只关心结果和风险。'},
    {k:'知识', t:'坏消息要早说，而且要带止损方案',
     b:'晚说一次，信任掉一半。早说的坏消息通常还能被当成「风险把控得好」。'},
    {k:'练习', t:'给一个「没做完」写一段汇报',
     b:'不要写「因为 A 部门配合不到位」。写「还差 A，已同步，预计周三前，如果周三没到我会 B」。'}
  ],
  sites:[
    {n:'中国大学MOOC · 管理沟通', u:'https://www.icourse163.org/', w:'搜「管理沟通」，讲的就是这个场景'},
    {n:'Wikipedia · 金字塔原理', u:'https://zh.wikipedia.org/wiki/%E9%87%91%E5%AD%97%E5%A1%94%E5%8E%9F%E7%90%86', w:'结论先行的结构性依据'}
  ]},

{ id:'negotiate', n:'谈钱与谈条件', cat:'沟通表达',
  why:'同一份工作，会谈和不会谈的差距常常是两成。这不是贪心，是把信息补齐。',
  day:[
    {k:'知识', t:'先有 BATNA（你的最佳替代方案），再开口',
     b:'手里有另一个选择的人，谈判时语气会不一样。不是演出来的，是真的不一样。'},
    {k:'知识', t:'让对方先出价，或者先给区间不给点',
     b:'先出具体数字的人容易被锚在低位。给区间（比如 20—25k）比给数字留的余地大。'},
    {k:'练习', t:'把你要的东西拆成「必须」和「可以让」两列',
     b:'必须项不超过两个。必须项一多，谈判就会崩。'},
    {k:'知识', t:'钱谈不动的时候谈别的：职级、汇报线、远程天数、签字费',
     b:'预算往往比薪资结构更硬。换一个维度常常能成。'},
    {k:'练习', t:'对着镜子把「我期望」这句话说十遍',
     b:'不是玄学。说不出口的人，在会议室里也说不出口。'}
  ],
  sites:[
    {n:'中国大学MOOC · 谈判学', u:'https://www.icourse163.org/', w:'有系统的谈判课，讲 BATNA 的原始框架'},
    {n:'人社部 · 薪酬与劳动政策', u:'https://www.mohrss.gov.cn/', w:'工资、合同、工时口径的官方来源'}
  ]},

{ id:'pushback', n:'拒绝与设边界', cat:'沟通表达',
  why:'不会拒绝的人，工作量会涨到只能做差。拒绝是一种工作能力，不是性格问题。',
  day:[
    {k:'知识', t:'拒绝要说「不」，不要只说「我尽量」',
     b:'「我尽量」等于答应了。到了交付日，责任还是你的。'},
    {k:'知识', t:'拒绝的是这件事的排期，不是这个人',
     b:'「我现在手上有 A 和 B，这件要加进来，就要动其中一件，你看动哪个」：把选择权交回去。'},
    {k:'练习', t:'把最近一次「被塞进来的活」重写一遍拒绝话术',
     b:'写下来才会发现：原来可以既拒绝又不翻脸。'},
    {k:'知识', t:'口头塞活，当天用文字确认一遍',
     b:'「刚才你说的那件事，我理解是…，对吗」：这一步同时是确认和留痕。'},
    {k:'练习', t:'数一下你手上同时进行的任务数量',
     b:'超过 3 件在推，就一定会有一件在拖。这不是效率问题，是数学问题。'}
  ],
  sites:[
    {n:'中国大学MOOC · 时间管理', u:'https://www.icourse163.org/', w:'搜「时间管理」，很多课都讲排期冲突'},
    {n:'Wikipedia · 边界理论', u:'https://zh.wikipedia.org/wiki/%E8%BE%B9%E7%95%8C', w:'先看「个人边界」这一条，语言比鸡汤准'}
  ]},

/* ---------------- 职场生存 ---------------- */
{ id:'legal', n:'劳动法常识', cat:'职场生存',
  why:'不是为了打官司，是为了在关键那几步不要签错字。',
  day:[
    {k:'知识', t:'「谁提出的」比「什么理由」更关键',
     b:'公司提出解除，和你写「个人原因」离职，结果差很远。任何文件上出现「个人原因」都要停下来。'},
    {k:'知识', t:'签之前先拍照，签之后要一份副本',
     b:'很多人只记得签，不记得留。没有副本，后面就没法还原条款。'},
    {k:'知识', t:'口头说的，当天用消息复述一遍',
     b:'对方回一个「嗯」，这段对话就变成书面证据了。成本极低。'},
    {k:'练习', t:'把「解除通知、工资条、考勤、社保记录」列成一张自己的清单',
     b:'在职时导出最省事，收走权限之后会很麻烦。'},
    {k:'资源', t:'先查法条原文，再问别人',
     b:'法条原文在官方数据库里，免费且准。别人转述的经常漏前提。',
     lk:{n:'国家法律法规数据库', u:'https://flk.npc.gov.cn/'}}
  ],
  sites:[
    {n:'国家法律法规数据库', u:'https://flk.npc.gov.cn/', w:'法条原文的官方来源，免费'},
    {n:'12348 公共法律服务', u:'https://www.12348.gov.cn/', w:'司法部平台，可免费咨询'},
    {n:'12333 人社咨询', u:'https://www.12333.gov.cn/', w:'社保、劳动关系、工伤的官方入口'}
  ]},

{ id:'project', n:'把事情推完', cat:'职场生存',
  why:'能开始的人很多，能收尾的人很少。收尾能力是稀缺品。',
  day:[
    {k:'知识', t:'开工前先定「什么叫做完」',
     b:'定义不清的任务，最后一定会以「再改改」结束。先写验收标准，再动手。'},
    {k:'知识', t:'把大任务切成能在一两天内看到结果的小块',
     b:'不是为了好看。是为了早一点知道方向对不对。'},
    {k:'练习', t:'给手上最模糊的那件事写三条验收标准',
     b:'写完通常会发现有两条你自己也没想清楚：那就是风险所在。'},
    {k:'知识', t:'每个任务都要有一个「下一个动作」',
     b:'写「推进项目」是没用的；写「周三前约到 A 确认排期」才有用。'},
    {k:'练习', t:'找一件拖了很久的事，只做它的第一步',
     b:'第一步应该小到不需要动力：比如「打开那个文档，写个标题」。'}
  ],
  sites:[
    {n:'中国大学MOOC · 项目管理', u:'https://www.icourse163.org/', w:'搜「项目管理」，有完整课程'},
    {n:'Wikipedia · 甘特图', u:'https://zh.wikipedia.org/wiki/%E7%94%98%E7%89%B9%E5%9B%BE', w:'排期可视化的基础，看概念就够'}
  ]},

{ id:'rhythm', n:'精力与节律', cat:'职场生存',
  why:'长期靠意志力扛的人，最后都会在第三周掉下来。节律是可持续性问题，不是态度问题。',
  day:[
    {k:'知识', t:'先记录一周，再谈优化',
     b:'不记录就调作息，等于闭着眼睛改参数。先知道自己在哪一段效率最高。'},
    {k:'知识', t:'把最难的事放在你效率最高的那 90 分钟',
     b:'大多数人是上午。但你要用自己的记录说话，不要照抄别人。'},
    {k:'练习', t:'今天记一次：工作了几小时 + 一句话状态',
     b:'蛐蛐上方那块「工作节律」就是干这个的，不用另开表。'},
    {k:'知识', t:'连续超载的第 4—7 天是危险区，不是稳定区',
     b:'产出会滞后下降，所以人会误以为还能扛。'},
    {k:'练习', t:'砍掉一件事，而不是再学一个效率工具',
     b:'超载时新增任何方法论都会变成新的负担。'}
  ],
  sites:[
    {n:'中国大学MOOC · 心理健康', u:'https://www.icourse163.org/', w:'搜「心理健康」，讲压力与恢复'},
    {n:'国家卫健委 · 健康科普', u:'http://www.nhc.gov.cn/', w:'睡眠与作息的官方科普来源'}
  ]},

/* ---------------- 求职转行 ---------------- */
{ id:'resume', n:'简历', cat:'求职转行',
  why:'简历不是自传，是一次筛选测试。它只需要回答一个问题：为什么是你。',
  day:[
    {k:'知识', t:'每条经历都写成「动作 + 对象 + 数字结果」',
     b:'「负责运营」是没用的。「搭了一套复投流程，把 ROI 从 1.8 提到 2.6」才有用。'},
    {k:'知识', t:'删掉所有形容词，留下所有数字',
     b:'「丰富的经验」「较强的能力」这类词在筛简历时等于没写。'},
    {k:'练习', t:'把最新一段经历压到三行以内',
     b:'压不下去通常说明你自己还没想清楚哪件事最重要。'},
    {k:'知识', t:'按目标岗位改，不要一份投所有',
     b:'同一段经历，投产品岗就突出定义和取舍，投运营岗就突出流程和指标。'},
    {k:'练习', t:'找一个人读你的简历，让他复述你最强的两件事',
     b:'他复述不出来，说明简历没传达出去。这个测试比任何模板都有用。'}
  ],
  sites:[
    {n:'中国大学MOOC · 求职指导', u:'https://www.icourse163.org/', w:'搜「求职」「就业指导」'},
    {n:'人社部 · 就业服务', u:'https://www.mohrss.gov.cn/', w:'就业政策与公共就业服务入口'},
    {n:'B 站 · 简历修改', u:'https://www.bilibili.com/v/knowledge/', w:'搜「简历」，看别人怎么改真实案例'}
  ]},

{ id:'industry', n:'行业与公司研究', cat:'求职转行',
  why:'面试里最能拉开差距的，是你知道这家公司在靠什么赚钱。',
  day:[
    {k:'知识', t:'先看它怎么赚钱，再看它要什么岗位',
     b:'商业模式的判断会直接改变你对岗位的理解，也让面试回答有根。'},
    {k:'知识', t:'财报是最诚实的信息源，比任何分析文章都准',
     b:'至少看懂三张表里那张「利润表」的前三行：收入、成本、毛利。'},
    {k:'练习', t:'对目标公司写三句话：卖什么、卖给谁、怎么收钱',
     b:'写不出来说明还没研究清楚。'},
    {k:'知识', t:'交叉验证：官方说法、媒体说法、员工说法，三个一起看',
     b:'只看一个来源，一定是偏的。'},
    {k:'资源', t:'统计口径要回到官方数据',
     b:'行业规模、增速这类数字，用官方统计而不是二手引用。',
     lk:{n:'国家统计局', u:'https://www.stats.gov.cn/'}}
  ],
  sites:[
    {n:'国家统计局', u:'https://www.stats.gov.cn/', w:'行业规模与增速的官方口径'},
    {n:'中国证监会 · 信息披露', u:'http://www.csrc.gov.cn/', w:'上市公司公告入口，财报原文'},
    {n:'巨潮资讯网', u:'http://www.cninfo.com.cn/', w:'A 股公告与财报全文，免费'}
  ]}
];

/* =====================================================================
   状态与选择
   ---------------------------------------------------------------------
   2026-09-24 改版：从「一次只选一个技能」改成「一组技能 + 掌握程度自评」。
   理由：只要在学东西的人，手上通常同时推着两三个方向；而「只选一个」
   会让人为了用这个功能而说谎。多选之后才有东西可以画成雷达图。

   ★ 数据兼容：旧的 log 是 {日期: 分钟数}（不分技能），新的是
     {日期: {技能id: 分钟数}}。读的时候两种都要认 ： 直接改结构会让
     老存档里的记录凭空消失，而用户没法知道是自己记丢了还是程序丢了。
   ===================================================================== */
var EV_MAX_PICKS = 6;        /* 雷达图的轴数上限：超过 7 根就读不出来了 */
/* 掌握程度自评。用「能做什么」描述，不用「熟练/精通」——
   后者每个人理解都不一样，自评会失真。 */
var EV_LEVELS = [
  "还没开始", "知道是怎么回事", "能照着做", "能独立做", "能处理例外", "能教别人"
];
var EV_LV_SHORT = ["0", "1", "2", "3", "4", "5"];

function evState(){
  if(!S.ev || typeof S.ev!=="object") S.ev = {};
  var e = S.ev;
  if(!e.log   || typeof e.log!=="object")   e.log   = {};
  if(!e.seen  || typeof e.seen!=="object")  e.seen  = {};
  if(!e.level || typeof e.level!=="object") e.level = {};
  if(!(e.picks instanceof Array)) e.picks = [];
  if(typeof e.skill!=="string") e.skill = "";
  if(typeof e.who!=="string")   e.who   = "";   /* 「记一笔」当前选中的技能 */
  if(!e.cat) e.cat = "";
  return e;
}
function evSkill(id){
  id = id || evState().skill;
  for(var i=0;i<EV_SKILLS.length;i++) if(EV_SKILLS[i].id===id) return EV_SKILLS[i];
  return null;
}
/* 雷达图的轴标签要短。技能名带括号说明的（如「英语（读写够用就行）」）
   在图上会撞在一起，所以取主名。 */
function evShort(sk){
  return String(sk.n).split(/[／/（(]/)[0].trim().slice(0,7);
}
function evPicks(){ return evState().picks; }
function evHas(id){ return evPicks().indexOf(id) >= 0; }
/* 雷达刷新：一套雷达，两个入口（工作状态 / 进化雷达）。
   在哪操作就刷哪 ： 不写死 renderEvolve，否则在工作状态里点自评，
   会去刷进化雷达那个（此刻是空的）页面。 */
function evRerender(){
  if(S.view === "status"){ renderStatus(); }
  else { renderEvolve(); }
}
function evToggle(id){
  var p = evPicks(), i = p.indexOf(id), sk = evSkill(id);
  if(i >= 0){ p.splice(i,1); toast("移出了「"+(sk?sk.n:"")+"」"); }
  else {
    if(p.length >= EV_MAX_PICKS){
      toast("最多 "+EV_MAX_PICKS+" 个 ： 再看多的轴，雷达图就读不出来了");
      return;
    }
    p.push(id);
    toast("加了「"+(sk?sk.n:"")+"」");
    if(!evState().skill) evState().skill = id;
    if(!evState().who)   evState().who   = id;
  }
  save(); evRerender();
  trackPush("radar_toggle", {id:id, on: i<0});   /* 埋点：雷达加/移技能 */
}
function evFocus(id){ evState().skill = id; save(); renderEvolve(); }
/* 掌握程度：0—5 自评 */
function evLevel(id){ return Math.max(0, Math.min(5, Math.round(+(evState().level[id]||0)))); }
function evSetLevel(id, v){
  evState().level[id] = Math.max(0, Math.min(5, Math.round(+v||0)));
  save(); evRerender();
  trackPush("radar_level", {id:id, v:evLevel(id)});   /* 埋点：雷达自评 */
  toast("「"+evShort(evSkill(id))+"」记作："+EV_LEVELS[evLevel(id)]);
}

/* ---------- 时间记录 ---------- */
/* 读某天某技能。旧格式（数字）归给当时的主技能 —— 不然老记录会消失。 */
function evLogOf(ds, id){
  var v = evState().log[ds];
  if(v == null) return 0;
  if(typeof v === "number") return (id && id !== evState().skill) ? 0 : v;
  return v[id] || 0;
}
function evTodayOf(id){ return evLogOf(today(), id); }
function evAddFor(id, v){
  var m = Math.max(0, Math.min(600, Math.round(+v||0)));
  if(!m){ toast("先填一个分钟数"); return; }
  var st = evState(), ds = today();
  if(typeof st.log[ds] === "number") st.log[ds] = { _old: st.log[ds] };
  if(!st.log[ds] || typeof st.log[ds] !== "object") st.log[ds] = {};
  st.log[ds][id] = (st.log[ds][id]||0) + m;
  save(); renderEvolve();
  toast("记下了 "+m+" 分钟到「"+evShort(evSkill(id))+"」");
}
/* 某技能的累计分钟 */
function evSumOf(id){
  var log = evState().log, n = 0;
  for(var k in log){ if(Object.prototype.hasOwnProperty.call(log,k)) n += evLogOf(k, id); }
  return n;
}
/* 全部技能的累计分钟（用「当天各技能之和」，旧格式原样算） */
function evTotalMins(){
  var log = evState().log, n = 0;
  for(var k in log){
    if(!Object.prototype.hasOwnProperty.call(log,k)) continue;
    var v = log[k];
    if(typeof v === "number") n += v;
    else for(var q in v) if(Object.prototype.hasOwnProperty.call(v,q) && q!=="_old") n += v[q];
    if(typeof v === "object" && v && v._old) n += v._old;
  }
  return n;
}
/* 最近 N 天某技能（id 省略 = 全部技能） */
function evRecent(id, days){
  var n = 0, d = new Date();
  for(var i=0;i<days;i++){
    var ds = d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
    n += id ? evLogOf(ds, id) : (function(){
      var v = evState().log[ds];
      if(v==null) return 0;
      if(typeof v==="number") return v;
      var t = 0; for(var q in v) if(Object.prototype.hasOwnProperty.call(v,q)) t += v[q];
      return t;
    })();
    d = new Date(d.getTime() - 86400000);
  }
  return n;
}
/* 有记录的天数 */
function evDayCount(){
  var log = evState().log, n = 0;
  for(var k in log){
    if(!Object.prototype.hasOwnProperty.call(log,k)) continue;
    var v = log[k];
    var s = (typeof v === "number") ? v : (function(){
      var t=0; for(var q in v) if(Object.prototype.hasOwnProperty.call(v,q)) t += v[q]; return t;
    })();
    if(s > 0) n++;
  }
  return n;
}
function evStreak(){
  /* 从今天往回数连续有记录的天数。今天没记也不清零 ——
     清零会让「今天忘了」变成惩罚，反而更容易放弃。 */
  var n = 0, d = new Date();
  for(var i=0;i<400;i++){
    var ds = d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
    var v = evState().log[ds];
    var s = (v==null)?0:((typeof v==="number")?v:(function(){
      var t=0; for(var q in v) if(Object.prototype.hasOwnProperty.call(v,q)) t += v[q]; return t;
    })());
    if(s > 0) n++;
    else if(i>0) break;
    d = new Date(d.getTime() - 86400000);
  }
  return n;
}

/* 按日期确定性轮换。
   ★ 这里刻意用「小整数累乘 + 取模」而不是 FNV 那一套：
     memberMake 踩过的坑是 `h*16777619` 超过 float64 精度、>>>0 拿到的是
     四舍五入后的结果。这里 h 始终小于 1000003，×31 后约 3.1e7，远在 2^53 内，
     所以是精确整数运算，结果稳定、可复核。 */
function evHash(str, mod){
  var h = 0, s = String(str);
  for(var i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) % 1000003;
  return h % (mod||1);
}
function evTodayIndex(sk){
  if(!sk) return 0;
  var st = evState();
  var key = "i_"+sk.id+"_"+today();
  /* 记住今天看到的是第几条，这样「换一条」之后再打开还是那一条 */
  return (st.seen[key]==null) ? evHash(sk.id+"@"+today(), sk.day.length) : st.seen[key];
}
function evNext(sk){
  var st = evState();
  var key = "i_"+sk.id+"_"+today();
  var cur = evTodayIndex(sk);
  st.seen[key] = (cur+1) % sk.day.length;
  save(); renderEvolve();
  toast("换成今天另一条（同一天再打开还是它）");
}

/* =====================================================================
   渲染
   ===================================================================== */
function fmtMin(m){
  if(m >= 60) return (m/60 >= 10 ? Math.round(m/60) : (m/60).toFixed(1)) + " 小时";
  return m + " 分钟";
}

/* 课表状态：7 天，0=周一。默认 7 个空数组。 */
var TT_DAYS = ["周一","周二","周三","周四","周五","周六","周日"];
function timetableState(){
  if(!Array.isArray(S.timetable) || S.timetable.length !== 7)
    S.timetable = [[],[],[],[],[],[],[]];
  return S.timetable;
}
function timetableHas(id){
  var t = timetableState();
  for(var d=0; d<7; d++) if(t[d].indexOf(id) >= 0) return true;
  return false;
}
function timetableAdd(id, day){
  if(timetableHas(id)) return false;
  timetableState()[day].push(id); save(); return true;
}
function timetableDel(id, day){
  var t = timetableState();
  var i = t[day].indexOf(id);
  if(i < 0) return;
  t[day].splice(i,1); save();
}
function renderTimetable(){
  var t = timetableState();
  var h = '<div class="card"><h3>我的课表</h3>'+
    '<p class="note" style="margin-top:0">挑课排到想学的日子。点课表里的课可以拿掉。</p>'+
    '<div class="ttgrid">';
  for(var d=0; d<7; d++){
    h += '<div class="ttday"><b>'+TT_DAYS[d]+'</b>';
    if(t[d].length){
      t[d].forEach(function(id){
        var sk = evSkill(id);
        h += '<button type="button" class="ttchip" data-tt="'+d+'" data-ttid="'+esc(id)+'" '+
          'title="点掉就从这天移除">'+esc(evShort(sk))+' <em>×</em></button>';
      });
    } else {
      h += '<span class="ttempty">空</span>';
    }
    h += '</div>';
  }
  h += '</div></div>';
  return h;
}
function renderCourses(){
  var h = '<div class="card"><h3>专业课程</h3>'+
    '<p class="note" style="margin-top:0">挑课排进上面的课表。每门课都有今日一条和站点。</p>';
  EV_CATS.forEach(function(cat){
    var list = EV_SKILLS.filter(function(x){ return x.cat===cat; });
    if(!list.length) return;
    h += '<div class="evcath"><b>'+esc(cat)+'</b><span>'+list.length+' 门</span></div>';
    h += '<div class="evpool">'+list.map(function(x){
      var on = timetableHas(x.id);
      return '<button type="button" class="evcard'+(on?" on":"")+'" data-course="'+esc(x.id)+'" '+
        'aria-pressed="'+(on?"true":"false")+'">'+
        '<b>'+esc(x.n)+'<span class="grab">'+(on?"✓ 已排课":"⋮⋮ 点我排课")+'</span></b>'+
        '<span>'+esc(x.why)+'</span></button>';
    }).join("")+'</div>';
  });
  h += '</div>';
  return h;
}
/* 排课：点课程卡 → 选排到周几 */
function openSchedule(id){
  evFocus(id);
  var sk = evSkill(id);
  var h = '<p class="note" style="margin-top:0">把「'+esc(sk.n)+'」排到哪天？</p>'+
    '<div class="ttpick">'+TT_DAYS.map(function(dn, d){
      return '<button type="button" class="sm" data-day="'+d+'">'+dn+'</button>';
    }).join("")+'</div>';
  openModal("排课", h, [{t:"取消",f:closeModal}]);
  $$("#mBody [data-day]").forEach(function(b){
    b.onclick = function(){
      var day = +b.getAttribute("data-day");
      if(timetableAdd(id, day)){ toast("已排到"+TT_DAYS[day]); }
      else { toast("这门课已经在课表里了"); }
      closeModal();
      renderEvolve();
    };
  });
}
function bindCourses(host){
  Array.prototype.forEach.call(host.querySelectorAll("[data-course]"), function(b){
    b.onclick = function(){ openSchedule(b.getAttribute("data-course")); };
  });
  Array.prototype.forEach.call(host.querySelectorAll("[data-tt]"), function(b){
    b.onclick = function(){
      timetableDel(b.getAttribute("data-ttid"), +b.getAttribute("data-tt"));
      renderEvolve();
    };
  });
  var nb = host.querySelector("#evNextBtn");
  if(nb) nb.onclick = function(){ var s=evSkill(); if(s) evNext(s); };
}
function renderEvolve(){
  var host = document.getElementById("evOut");
  if(!host) return;
  var h = "";
  /* ★ 2026-09-27：用户要求「在进化雷达里增加小测，添加项目经历，分析能力和修改简历」。
     这四件事是一条线，所以放在页面最前面，顺序就是它的用法：
       测（小测定锚）→ 析（哪一项只在你自己嘴里）→ 补（项目经历 = 证据）
       → 落地（改简历）。后面的课表 / 课程 / 今日一条是「学」，排在后面。
     实现在 lab.js（单独一个文件，挂 window.LAB）；这里只负责按顺序摆好、并转交绑定。 */
  if(window.LAB){
    h += LAB.quizCard();
    h += LAB.analysisCard();
    h += LAB.projCard();
    h += LAB.resumeCard();
  }
  /* 课表 */
  h += renderTimetable();
  /* 课程库 */
  h += renderCourses();
  /* 今日一条 + 站点（正在看的课程） */
  var sk2 = evSkill();
  if(sk2){
    var idx = evTodayIndex(sk2), item = sk2.day[idx];
    h += '<div class="evstar"><div class="evstar-h">'+
      '<span class="evkind '+(EV_KIND[item.k]||"")+'">'+esc(item.k)+'</span>'+
      '<b>'+esc(sk2.n)+' · 今日一条 · 第 '+(idx+1)+' / '+sk2.day.length+' 条</b>'+
      '<span class="evdate">'+esc(today())+'</span></div>'+
      '<h4>'+esc(item.t)+'</h4><p>'+esc(item.b)+'</p>'+
      (item.lk ? '<a class="evlink" href="'+esc(item.lk.u)+'" target="_blank" rel="noopener noreferrer">'+esc(item.lk.n)+' ↗</a>' : '')+
      '<div class="acts"><button class="sm" id="evNextBtn">今天换一条</button></div></div>';
    h += '<div class="card"><h3>学这个，去哪儿</h3>'+
      '<p class="note" style="margin-top:0"><b class="hl">站点是公开的，不是我们的服务。</b>'+
      '链接可能改版或失效；如果打不开，直接用站内搜索代替。</p>'+
      '<ul class="evsite">'+sk2.sites.map(function(x){
        return '<li><a href="'+esc(x.u)+'" target="_blank" rel="noopener noreferrer">'+esc(x.n)+' ↗</a>'+
          '<span>'+esc(x.w)+'</span></li>';
      }).join("")+'</ul></div>';
  }
  h += '<div class="evnote">★ 关于「每日更新」必须说清楚：这份文件<b>没有服务器</b>，'+
    '所以不存在「每天推送新内容」。这里的「今日一条」是<b>按日期在你本机确定性轮换</b>的本地题库：'+
    '今天和明天不一样，同一天重开还是同一条。<b>它不跟着行业变</b>。'+
    '想知道行业里的新东西，得自己去上面那些站点看。</div>';
  /* 流程串联 */
  h += '<div class="ovnext"><p>下一步：排好课表，去<b>【工作状态】</b>看看自己的能力画像，'+
    '或者去<b>【职场画像】</b>找找适合的岗位。</p>'+
    '<button class="ovgo" id="evToJob" type="button">去职场画像 →</button></div>';
  /* ★ 这三段原来是由 status.js 的 renderStatus 顺带渲染的（雷达挂在「工作状态」页里）。
     这一轮把 status.js 里那两行删掉、让雷达只留一个入口之后，必须在**这里**补上，
     否则「进化雷达」页只剩标题、说明与课表 —— 雷达图和技能卡一张都没有，
     而页面看起来完全正常（有标题、有正文），点了也没东西可点。 */
  h += evRadarCard();
  h += renderEvBars();
  h += evPoolCard();

  host.innerHTML = h;
  bindCourses(host);
  /* ★ 绑定：能力卡与等级按钮的点击全靠它。漏掉这一行时卡片点了不动、控制台不报错。 */
  bindEvolve(host);
  /* ★ lab.js 那四块（小测 / 能力分析 / 项目经历 / 改简历）的点击也靠这一行。
     DOM 是每轮重建的，所以绑定必须每轮重做 —— 少一行就是「点了没反应、且不报错」。 */
  if(window.LAB && LAB.bind){ try{ LAB.bind(host); }catch(e){} }
  var toJob = host.querySelector("#evToJob");
  if(toJob) toJob.onclick = function(){ view("job"); };
}
/* ---------------------------------------------------------------------
   雷达卡 = 拖放区
   --------------------------------------------------------------------- */
function evRadarCard(){
  var picks = evPicks();
  var labels = [], values = [];
  picks.forEach(function(id){ labels.push(evShort(evSkill(id))); values.push(evLevel(id)); });
  var radar = vizRadar(labels, values, 5, 300);

  var h = '<div class="card evdrop" id="evDrop">'+
    '<h3>掌握程度</h3>'+
    '<p class="note" style="margin-top:0">把右边的技能<b>拖进来</b>（手机上直接点）。'+
    '这五个轴是<b>你自己打的</b>，不是测评结果 ： 它的用处是让你看见'+
    '「我是不是只在其中一个方向上用力」。</p>';

  if(radar) h += radar;
  else h += '<div class="dropzone"><b>把技能拖到这里</b>'+
    '<span>至少挑 3 个才画得出雷达图<br>右边点一下也能加</span></div>';

  if(picks.length){
    h += '<div class="evchiprow">'+picks.map(function(id){
      return '<button type="button" class="evchip" data-evdrop="'+esc(id)+'" '+
        'title="点掉就移出" aria-label="移出 '+esc(evSkill(id).n)+'">'+
        esc(evShort(evSkill(id)))+'<em>×</em></button>';
    }).join("")+'</div>';
  }
  if(picks.length){
    h += '<div class="evlvedit">'+picks.map(function(id){
      return '<div class="evlvrow"><b>'+esc(evShort(evSkill(id)))+'</b>'+
        '<div class="evlvbtns" role="group" aria-label="'+esc(evSkill(id).n)+' 的掌握程度">'+
        EV_LV_SHORT.map(function(t,k){
          return '<button type="button" class="sm'+(evLevel(id)===k?" on":"")+'" '+
            'data-lvl="'+esc(id)+'" data-v="'+k+'" aria-pressed="'+(evLevel(id)===k?"true":"false")+'" '+
            'title="'+esc(EV_LEVELS[k])+'">'+t+'</button>';
        }).join("")+'</div>'+
        '<span class="evlvt">'+esc(EV_LEVELS[evLevel(id)])+'</span></div>';
    }).join("")+'</div>';
  }
  return h + '</div>';
}

/* ---------------------------------------------------------------------
   技能池：可拖的卡
   --------------------------------------------------------------------- */
function evPoolCard(){
  var picks = evPicks();
  var full = (picks.length >= EV_MAX_PICKS);
  var h = '<div class="card"><h3>技能池</h3>'+
    '<p class="note" style="margin-top:0">'+
    (full ? '<b class="hl">已经选满 '+EV_MAX_PICKS+' 个</b>。先点掉一个再加。'
          : '点一下加入，或者拖到左边的雷达图上。最多 '+EV_MAX_PICKS+' 个。')+
    '</p>';
  EV_CATS.forEach(function(cat){
    var list = EV_SKILLS.filter(function(x){ return x.cat===cat; });
    if(!list.length) return;
    h += '<div class="evcath"><b>'+esc(cat)+'</b><span>'+list.length+' 项</span></div>';
    h += '<div class="evpool">'+list.map(function(x){
      var on = evHas(x.id);
      var inc = (!on && full) ? ' data-incap="1"' : '';
      return '<button type="button" class="evcard'+(on?" on":"")+'" data-ev="'+esc(x.id)+'"'+
        inc+' draggable="true" aria-pressed="'+(on?"true":"false")+'">'+
        '<b>'+esc(x.n)+'<span class="grab">'+(on?"✓ 已加入":"⋮⋮ 可拖")+'</span></b>'+
        '<span>'+esc(x.why)+'</span>'+
        '</button>';
    }).join("")+'</div>';
  });
  return h + '</div>';
}

/* 最近 14 天全部技能的投入条形 */
function renderEvBars(){
  var out = [], now = new Date(), max = 1;
  for(var i=13;i>=0;i--){
    var d = new Date(now.getTime() - i*86400000);
    var ds = d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
    var v = evState().log[ds];
    var m = (v==null) ? 0 : ((typeof v === "number") ? v : (function(){
      var t=0; for(var q in v) if(Object.prototype.hasOwnProperty.call(v,q)) t += v[q]; return t;
    })());
    if(m>max) max = m;
    out.push({ds:ds, m:m});
  }
  return '<div class="evbars">'+out.map(function(x){
    var hp = Math.round(x.m/max*100);
    var zero = x.m ? "" : " zero";
    return '<div class="evb'+zero+'" title="'+x.ds+' '+x.m+' 分钟">'+
      '<u><b style="height:'+hp+'%"></b></u><i>'+x.ds.slice(8)+'</i></div>';
  }).join("")+'</div>'+
  '<div class="evbarnote">最近 14 天全部技能合计。空白的那几天不是失败，只是没记。</div>';
}

function bindEvolve(host){
  var q = function(s){ return host.querySelectorAll(s); };
  Array.prototype.forEach.call(q("[data-ev]"), function(b){
    b.onclick = function(){ evToggle(b.getAttribute("data-ev")); };
  });
  Array.prototype.forEach.call(q("[data-lvl]"), function(b){
    b.onclick = function(){ evSetLevel(b.getAttribute("data-lvl"), b.getAttribute("data-v")); };
  });
  Array.prototype.forEach.call(q("[data-who]"), function(b){
    b.onclick = function(){ evState().who = b.getAttribute("data-who"); save(); renderEvolve(); };
  });
  Array.prototype.forEach.call(q("[data-focus]"), function(b){
    b.onclick = function(){ evFocus(b.getAttribute("data-focus")); };
  });
  Array.prototype.forEach.call(q("[data-evdrop]"), function(b){
    b.onclick = function(){ evToggle(b.getAttribute("data-evdrop")); };
  });
  var nb = host.querySelector("#evNextBtn");
  if(nb) nb.onclick = function(){ var s=evSkill(); if(s) evNext(s); };
  var rs = host.querySelector("#evReselect");
  if(rs) rs.onclick = function(){ evState().skill=""; evState().picks=[]; save(); renderEvolve(); };
  var ad = host.querySelector("#evAdd");
  if(ad) ad.onclick = function(){
    var el = document.getElementById("evMin");
    var picks = evPicks();
    var who = evState().who && picks.indexOf(evState().who)>=0 ? evState().who : picks[0];
    if(who) evAddFor(who, el ? el.value : 0);
  };
  var mi = host.querySelector("#evMin");
  if(mi) mi.onkeydown = function(e){
    if(e.key==="Enter"){
      var picks = evPicks();
      var who = evState().who && picks.indexOf(evState().who)>=0 ? evState().who : picks[0];
      if(who) evAddFor(who, mi.value);
    }
  };
  bindEvDrag(host);
}

/* ---------------------------------------------------------------------
   拖拽：把技能池里的卡拖到雷达卡上
   ★ dragover 必须 preventDefault ： 否则 drop 永远不触发，而且不报错。
     这是 HTML5 拖放最常见的一个哑坑（表现就是「拖过去没反应」）。
   ★ 点击仍然能用（同一个 evToggle）。手机上拖不了，拖拽只是加分项，
     不能是唯一入口。
   --------------------------------------------------------------------- */
function bindEvDrag(host){
  var zone = host.querySelector("#evDrop");
  Array.prototype.forEach.call(host.querySelectorAll(".evpool [data-ev]"), function(card){
    card.ondragstart = function(e){
      if(card.getAttribute("data-incap")){ e.preventDefault(); return; }
      try { e.dataTransfer.setData("text/plain", card.getAttribute("data-ev")); } catch(err){}
      try { e.dataTransfer.effectAllowed = "copy"; } catch(err){}
      card.classList.add("dragging");
      if(zone) zone.classList.add("hot");
    };
    card.ondragend = function(){
      card.classList.remove("dragging");
      if(zone) zone.classList.remove("hot","over");
    };
  });
  if(!zone) return;
  zone.ondragover = function(e){
    e.preventDefault();
    try { e.dataTransfer.dropEffect = "copy"; } catch(err){}
    if(!zone.classList.contains("over")) zone.classList.add("over");
  };
  zone.ondragleave = function(e){
    /* dragleave 会在子元素之间反复触发，判一下是不是真的离开了整块区域 */
    if(e.relatedTarget && zone.contains(e.relatedTarget)) return;
    zone.classList.remove("over");
  };
  zone.ondrop = function(e){
    e.preventDefault();
    zone.classList.remove("over","hot");
    var id = "";
    try { id = e.dataTransfer.getData("text/plain"); } catch(err){}
    if(!id) return;
    if(evHas(id)){ toast("「"+evShort(evSkill(id))+"」已经在雷达上了"); return; }
    evToggle(id);                 /* evToggle 自己会提示「加了…」 */
  };
}
