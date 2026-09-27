/* =====================================================================
   lab.js —— 进化雷达里的四件事：小测 · 项目经历 · 能力分析 · 改简历
   ---------------------------------------------------------------------
   用户要求（原话）：「在进化雷达里增加小测，添加项目经历，分析能力和修改简历」。
   这四件事其实是一条线，所以放在同一页、按顺序排：

     ① 小测     —— 给自评定个锚。自评（0—5）最大的问题是每个人理解不一样，
                   所以先答几道情境题，拿一个外部参照再回到自评。
     ② 项目经历 —— 把「说得出的能力」变成「有据可查的能力」。
                   能力分析会把没有证据的自评单独点出来，入口就在这里。
     ③ 能力分析 —— 把四样东西摆在一起：自评 / 小测 / 证据 / 投入时长。
                   它的用处只有一个：告诉你哪一项「只在你自己嘴里」。
     ④ 改简历   —— 上面三步的结论最后要落到简历上，否则白做。

   ★ 四条硬边界（写死在界面上，不许以后放宽）
     1. 小测是**本地题库**，不是任何机构认证，也不代表真实水平；
        它只测「这几种情形你怎么选」，测不出动手能力，也测不出「能教别人」那一档。
     2. 能力分析**不给总分、不排名、不预测**。它只做一件事：
        把「有证据」和「只是自评」分开。分数一旦给出，用户会拿它去跟人比。
     3. 证据是**关键词匹配**出来的，会误判 —— 界面上逐条显示命中的原话，
        用户自己看着删。不许把匹配结果包装成「系统识别出你具备 X 能力」。
     4. 不替用户写简历。项目经历也要用户自己填，这里只提供格子。

   ★ 本文件不改样式表：样式随模块注入，颜色全部带兜底值
     （var(--gold,#1E3A5F) 这样写），取不到也不会失效。
   ===================================================================== */

/* =====================================================================
   ① 小测题库
   ---------------------------------------------------------------------
   每个技能 3 道**情境题**（不是名词解释）：给一个真会遇到的场面，
   四个选项里选一个最专业的做法。这样测的是判断，不是记忆。
   ★ 正确答案的位置是打散的（不是全在 B），否则做两题就摸到规律。
     a  = 最专业的那一项（2 分）
     alt= 说得过去但不最佳（1 分），-1 表示没有第二档
     w  = 为什么。必须写清「另外几个错在哪」，否则用户只知道对错学不到东西。
   ===================================================================== */
var LAB_Q = {

/* ---------------- 硬技能 ---------------- */
excel:[
 {q:'领导说「帮我看看上季度各地区销售的变化」，你第一步做什么？',
  o:['先把原表整段复制给他，让他自己看',
     '先确认三件事：地区按哪个口径分、上季度指哪几个月、他要结论还是要明细',
     '直接做一张折线图发过去',
     '先把几张表用 VLOOKUP 并成一张'],
  a:1, alt:3,
  w:'差在做没做「口径确认」。先做图表（第 3 项）看着积极，但口径一错就得重做，而且领导会以为你看不出问题。第 4 项是合理的第二步，不是第一步。'},
 {q:'一张 8 万行的表，要按「月份 × 产品线」汇总销售额，最快的做法是？',
  o:['写 SUMIFS，拉满 12 行 × 每条产品线一列',
     '筛选之后手工加总',
     '数据透视表：月份拖到行、产品线拖到列、销售额求和',
     '按产品线拆成多个工作表分别算，最后再合'],
  a:2, alt:0,
  w:'透视表能一步给出交叉汇总，而且口径改了直接拖。第 1 项不算错，只是要写 N 个公式、改口径时要重来一遍。'},
 {q:'同事发来的客户名单里，同一个客户出现了「大连XX有限公司」和「大连xx有限公司 」两种写法。你要统计不重复的客户数，先做什么？',
  o:['直接用「删除重复项」',
     '用 COUNTIF 数一遍再说',
     '先统一大小写、去掉首尾空格和全角空格，再去重',
     '目视扫一遍，手工合并'],
  a:2, alt:1,
  w:'「删除重复项」只按字符完全相等判断，不先清洗就会把同一个客户算成两家 —— 而且它不报错，数字看起来很正常。'},
],

sql:[
 {q:'要回答「本月新增用户里有多少是第二次使用」，你第一步做什么？',
  o:['直接写 JOIN，把两张表连起来看',
     '先把两个口径定死：「新增」按注册日还是首次使用日？「第二次使用」按天还是按次？',
     '用 COUNT(*) 数一下总数',
     '先把数据导到 Excel 里做透视'],
  a:1, alt:0,
  w:'这类题难在口径不在语法。口径没定就写 SQL，写出来的东西自己一周后也说不清对不对。'},
 {q:'两个表 JOIN 之后行数比左表多了三倍，最可能的原因是什么？',
  o:['一对多的连接导致行数膨胀了',
     '数据库坏了，重启一下',
     'WHERE 条件写错了',
     '要加 DISTINCT 把多余的行去重'],
  a:0, alt:3,
  w:'一对一的连接不会膨胀，一对多才会，而且**不报错** —— 这之后算出来的求和是错的，这是新手最常见的错。第 4 项是治症状：真正该做的是先把多出来的是哪一类行找出来。'},
 {q:'一个查询很慢，WHERE 里能筛掉大部分行的条件，改写的方向是？',
  o:['加 LIMIT 少查一点',
     '换一个数据库',
     '把能提前筛掉的条件提到 JOIN 之前，先筛后连',
     '把结果缓存起来'],
  a:2, alt:-1,
  w:'先筛后连能把参与连接的行数降下来，很多时候快一个数量级。加索引是另一件对的事，但它改的是「怎么找」，先筛后连改的是「找多少」。'},
],

writing:[
 {q:'项目要延期两周，你要给领导发一条消息。第一句最该写什么？',
  o:['「最近事情比较多，项目可能要晚一点」',
     '「最近辛苦大家了，我先说下情况」',
     '「X 项目建议延期两周，原因是 A 和 B，需要你定 C」',
     '把过程从头讲一遍，让领导自己判断'],
  a:2, alt:-1,
  w:'领导的时间比你的贵：第一句没给结论，后面就没人细看。第 1 项既没给原因也没给请求，等于把问题又推回去了。'},
 {q:'「本次活动的转化率有所提升，用户反馈良好。」这句话最大的问题是什么？',
  o:['太口语，不够正式',
     '没有数字也没有来源 —— 「有所提升」无法核对，等于没说',
     '主语不明确',
     '太短了，信息量不够'],
  a:1, alt:-1,
  w:'换成「转化率从 3.1% 到 4.0%（渠道后台，8 月 1—15 日）」，对方才能判断这件事重不重要。判断和事实要分开写，这里两样都没有。'},
 {q:'要给全组发一封「坏消息」通知，比较稳的结构是？',
  o:['坏消息 → 影响范围 → 已经做了什么 → 需要谁做什么 → 什么时候同步',
     '先讲一段背景，最后再说坏消息',
     '只讲已经解决的部分，坏消息私下说',
     '先给解决方案，不讲原因'],
  a:0, alt:1,
  w:'第 2 项会让所有人翻到最后才知道发生了什么；第 3 项一旦被发现，信任掉得比坏消息本身快。'},
],

english:[
 {q:'目标只是「能读懂文档、能写清楚邮件」，先练哪一项最划算？',
  o:['口语，因为最容易看出进步',
     '听力，因为输入量最大',
     '阅读：技术文档、合同、邮件都是读，成本最低、收益最快',
     '先背完一本单词书再开始'],
  a:2, alt:-1,
  w:'口语要环境和时间，投入产出比在短期内最低。阅读可以一个人完成，而且和工作直接挂钩。'},
 {q:'「Could you confirm by Friday?」比一段语法复杂的句式好在哪？',
  o:['更礼貌',
     '语法更正确',
     '写得越复杂，越容易让人以为你不确定；短句最有效',
     '更正式，适合对上级'],
  a:2, alt:-1,
  w:'职场英文的目标是「对方看懂并回复」，不是展示句式。中译英最常见的毛病就是逐字对应、句子过长。'},
 {q:'一句英文长难句读不懂，最有效的一招是？',
  o:['每个词都查一遍，再连起来',
     '先抽掉所有从句和修饰，找出主谓宾，剩下的就是意思',
     '整句跳过，看下一句',
     '先背语法书里的从句章节'],
  a:1, alt:0,
  w:'查完所有词仍然读不懂，是因为信息被修饰成分埋住了。先拿主干，再回头补修饰。'},
],

/* ---------------- 沟通表达 ---------------- */
reportup:[
 {q:'你在汇报里发现一个风险，你会怎么说？',
  o:['只说风险，让领导自己判断',
     '带方案去：「两个方案，我倾向 A，因为…，需要你确认」',
     '先不说，等有确定的影响再讲',
     '在群里公开提一下'],
  a:1, alt:2,
  w:'只提问题的人，久了会被绕开。带方案去不是表演，是把决定权还给对方、把工作量留在自己这边。'},
 {q:'把本周做的事压成三行汇报，最该删掉的是什么？',
  o:['结果和数字',
     '过程描述（开了几次会、改了几版）',
     '风险和需要的支持',
     '下一步的计划'],
  a:1, alt:0,
  w:'过程是你的工作量，但它不是对方的决策依据。对方只关心结果、风险和要他拍板的事。'},
 {q:'一件事没做完，汇报里怎么写？',
  o:['「因为 A 部门配合不到位」',
     '「还差 A，已同步，预计周三前交付；如果周三没到，我会启动 B」',
     '先不写，等做完了再一起说',
     '「还在推进中，请领导放心」'],
  a:1, alt:-1,
  w:'第 1 项把责任推出去，第 4 项等于没信息。坏消息早说 + 带止损方案，常常还能被当成风险把控得好。'},
],

negotiate:[
 {q:'谈薪之前，最该准备好的东西是什么？',
  o:['一套话术，背熟',
     '你的最佳替代方案（手里另一个选择是什么）',
     '同事的薪资传闻',
     '说服对方的话术和情绪'],
  a:1, alt:-1,
  w:'手里有替代方案的人，说话的语气会不一样 —— 这不是演出来的。第 3 项用一个你无法核实的数字当依据，一旦被反问就站不住。'},
 {q:'对方问「你期望的薪资是多少」，比较好的回答是？',
  o:['直接报一个数，显得干脆',
     '「越高越好」，留空间',
     '给一个区间，并说明依据（现在多少、市场大致范围）',
     '「按公司标准来就行」'],
  a:2, alt:3,
  w:'先出具体数字的人容易被锚在低位。第 4 项看着配合，但等于把定价权全交出去；真要说，也要补一句你的依据。'},
 {q:'薪资谈不动的时候，还能谈什么？',
  o:['只能算了，先答应下来',
     '职级、汇报线、远程天数、签字费、试用期时长',
     '要求多几天年假',
     '用别的 offer 威胁对方'],
  a:1, alt:2,
  w:'预算往往比薪资结构更硬，换一个维度常常能成。年假确实算一个维度，但它排在最后 —— 先谈影响你日常和后续涨幅的那几项。'},
],

pushback:[
 {q:'你手上正在推 A 和 B，领导又塞来 C。最好的回应是？',
  o:['「好的，我尽量」',
     '「C 加进来就要动 A 或 B，你看动哪个？」',
     '直接说「做不了」',
     '接下来，回去加班做完'],
  a:1, alt:2,
  w:'第 1 项的「我尽量」等于答应了，到交付日责任还是你的。第 3 项拒绝得太硬，其实是同一件事没找到说法 —— 把选择权交回去，比说不行有效。'},
 {q:'「我尽量吧」这句话的问题在哪？',
  o:['不够礼貌',
     '等于答应了，但没留下任何可以调整的余地',
     '太短，显得不重视',
     '没有说明时间'],
  a:1, alt:3,
  w:'「尽量」在对方听来就是「可以」。要拒绝的是这件事的排期，不是这个人 —— 说清动哪一件，成功率反而更高。'},
 {q:'领导在走廊上口头派了一件事给你，最好补一句什么？',
  o:['不用补，记在心里就行',
     '当天用文字复述一遍：「刚才那件事，我理解是…，对吗」',
     '等对方再提一次',
     '写在私人备忘录里，不给对方看'],
  a:1, alt:-1,
  w:'这一步同时是确认和留痕，成本极低。口头派活后面变成「我没说过」，是最常见的扯皮场景。'},
],

/* ---------------- 职场生存 ---------------- */
legal:[
 {q:'公司让你签一份文件，上面写着「个人原因」四个字。你该怎么做？',
  o:['直接签，先把手续办了',
     '停下来问清楚这一条的作用，签之前拍照，签之后要一份副本',
     '划掉「个人原因」再签，不要副本',
     '拍照发到群里，让同事一起看'],
  a:1, alt:0,
  w:'公司提出解除和你写「个人原因」离职，结果差很远。第 3 项方向对，但改了不给副本等于没改 —— 对方手里的那份才是算数的。'},
 {q:'口头沟通完一件事，最省事的留痕方式是什么？',
  o:['全程录音',
     '当天用消息把内容复述一遍，让对方回一个「嗯」',
     '自己写在备忘录里',
     '当场让对方写个字条'],
  a:1, alt:3,
  w:'对方回一个「嗯」，这段对话就变成有来有往的书面记录，而成本只是一条消息。录音在很多场景下并不好用。'},
 {q:'还在职的时候，最该做的一件事是什么？',
  o:['什么都不用做，真出事再说',
     '把解除通知、工资条、考勤、社保记录列成清单，趁有权限先导出',
     '先去咨询律师',
     '跟关系好的同事先通个气'],
  a:1, alt:-1,
  w:'在职时导出这些是最省事的；权限被收走之后会很麻烦。这不是「准备打官司」，是把资料先放自己手里。'},
],

project:[
 {q:'接到一个说得不太清楚的任务，第一步做什么？',
  o:['先动起来，边做边问',
     '先定「什么叫做完」：把验收标准写下来再动手',
     '先问同事以前是怎么做的',
     '先排一个详细的时间表'],
  a:1, alt:2,
  w:'定义不清的任务，最后一定会以「再改改」结束。先写验收标准，能让你早一点知道方向对不对。'},
 {q:'待办里写「推进项目」，问题在哪？',
  o:['字太少，看不清',
     '没有下一个具体动作，所以它永远排不到今天',
     '不够正式',
     '没有写负责人'],
  a:1, alt:-1,
  w:'「推进项目」是没用的；「周三前约到 A 确认排期」才有用。每个任务都要有一个下一步动作。'},
 {q:'一件拖了很久的事，最好的启动方式是什么？',
  o:['安排一整个周末专门做它',
     '只做第一步，小到不需要动力（比如「打开文档，写个标题」）',
     '等状态好的时候再做',
     '换一个更高级的工具来管理它'],
  a:1, alt:-1,
  w:'拖很久通常不是因为懒，是因为第一步太大。砍到「不需要动力」为止，才启动得起来。'},
],

rhythm:[
 {q:'想调整作息，第一件事做什么？',
  o:['直接定 6 点起，靠意志力',
     '先记录一周：什么时候效率最高、什么时候最容易犯错',
     '买一本效率手册',
     '照抄一个公认健康的作息表'],
  a:1, alt:-1,
  w:'不记录就调作息，等于闭着眼睛改参数。先知道自己的曲线，再决定把最难的事放在哪一段。'},
 {q:'连续超载的第 4—7 天，通常意味着什么？',
  o:['身体已经适应了，可以继续',
     '这是危险区：产出会滞后下降，所以人容易误判自己还能扛',
     '效率最高的一段，应该抓住',
     '正常波动，不用管'],
  a:1, alt:-1,
  w:'危险的地方在于「当下感觉还行」—— 下降是滞后的，等感觉到的时候已经在往下掉了。'},
 {q:'已经明显超载了，最该做的是哪一件？',
  o:['再学一个时间管理方法',
     '砍掉一件事，而不是再学一个效率工具',
     '每天早起两小时补回来',
     '逼自己提高专注度'],
  a:1, alt:-1,
  w:'超载时新增任何方法论都会变成新的负担。先减量，再谈方法。'},
],

/* ---------------- 求职转行 ---------------- */
resume:[
 {q:'「负责运营」这种写法，应该换成哪一种？',
  o:['「负责运营工作，认真负责」',
     '「丰富的运营经验，能力较强」',
     '「搭了一套复投流程，把 ROI 从 1.8 提到 2.6」',
     '「参与策划并执行了多个运营活动」'],
  a:2, alt:3,
  w:'动作 + 对象 + 数字结果，才是一次筛选测试想看到的。第 4 项是「参与」，说不清你做了什么，反而降低可信度。'},
 {q:'简历里最该优先删掉的是哪一类词？',
  o:['数字',
     '时间',
     '公司名',
     '形容词：「丰富」「较强」「熟练」'],
  a:3, alt:-1,
  w:'形容词在筛简历时等于没写，而且会占掉本来可以写结果的位置。数字是删号，不是删词。'},
 {q:'检验这份简历有没有传达清楚，最实用的方法是？',
  o:['自己读三遍',
     '找一个人读完，让他复述你最强的两件事',
     '换一个更好的模板',
     '控制在一页以内'],
  a:1, alt:-1,
  w:'他复述不出来，说明简历没把重点传出去 —— 这个测试比任何模板都准，因为它测的是读者，不是你。'},
],

industry:[
 {q:'面试前研究目标公司，先看什么？',
  o:['员工在网上怎么评价它',
     '它怎么赚钱：卖什么、卖给谁、怎么收钱',
     '办公环境好不好',
     '现在在招多少人'],
  a:1, alt:-1,
  w:'商业模式的判断会直接改变你对岗位的理解，也让面试里的回答有根。员工评价参考可以，但它解释不了岗位为什么存在。'},
 {q:'行业规模、增速这类数字，应该优先用哪一个来源？',
  o:['自媒体分析文章',
     '官方统计口径（统计局、行业主管部门的公报）',
     '同事或前辈说的',
     '问 AI 要一个数字'],
  a:1, alt:-1,
  w:'自媒体和 AI 的数字经常没有出处，面试里被追问一句「这个数据哪来的」就崩了。要引用就用能指到原文的。'},
 {q:'要求你对目标公司写三句话：卖什么、卖给谁、怎么收钱。写不出来说明什么？',
  o:['语文表达需要练',
     '还没研究清楚，需要回去再看一遍',
     '这家公司业务太复杂，可以跳过',
     '这个要求本身不合理'],
  a:1, alt:-1,
  w:'这三句话是理解一家公司的最小单元。写不出来就去补，别带着模糊的理解去面试。'},
]
};

/* 小测得分 → 建议自评档。★ 测不出第 5 档（能教别人），
   所以上限就是 4，并在界面上写明 —— 一份选择题冒充不了「能教别人」那一档。 */
function labSuggest(sc, total){
  if(!total) return 0;
  var p = sc / (total*2);
  if(p >= 0.9) return 4;
  if(p >= 0.67) return 3;
  if(p >= 0.34) return 2;
  return 1;
}

/* =====================================================================
   ② 证据词表：能力分析用
   ---------------------------------------------------------------------
   ★ 说明白它是干什么的：把项目 / 经历 / 简历里的**原话**找出来，
     让用户自己判断「这算不算证据」。它不做判断，只做索引。
   ===================================================================== */
var LAB_KW = {
  excel:["excel","透视","函数","表格","数据表","汇总","报表","sumif","vlookup","数据整理"],
  sql:["sql","取数","查询","数据库","join","数据提取","跑数"],
  writing:["写清","文档","方案","总结","报告","撰写","汇报材料","写作","公号","推文"],
  english:["英语","英文","外语","english","英文文档","翻译"],
  reportup:["汇报","周报","月报","述职","向上","请示","沟通领导","对齐"],
  negotiate:["谈判","谈薪","涨薪","争取","薪资","offer","条件","待遇"],
  pushback:["拒绝","边界","排期","优先级","加塞","说不","冲突"],
  legal:["劳动法","合同","仲裁","社保","工伤","离职","竞业","解除","赔偿"],
  project:["项目","推进","落地","验收","里程碑","闭环","交付","上线"],
  rhythm:["节律","作息","精力","超载","加班","状态记录","早睡","恢复"],
  resume:["简历","面试","投递","求职","招聘","offer"],
  industry:["行业","财报","竞品","市场","商业模式","研究","调研","对标"]
};

function labState(){
  if(!S.lab || typeof S.lab!=="object") S.lab = {};
  var L = S.lab;
  if(!L.ans  || typeof L.ans!=="object")  L.ans  = {};   /* {技能id:[每题选的序号]} */
  if(!L.done || typeof L.done!=="object") L.done = {};   /* {技能id:true} */
  if(!Array.isArray(L.projs)) L.projs = [];              /* 本页加过的项目（与简历里的同一份） */
  if(typeof L.sk!=="string") L.sk = "";
  return L;
}
function labSk(id){
  if(typeof EV_SKILLS==="undefined") return null;
  for(var i=0;i<EV_SKILLS.length;i++) if(EV_SKILLS[i].id===id) return EV_SKILLS[i];
  return null;
}
function labShort(id){
  var sk=labSk(id);
  if(!sk) return id;
  if(typeof evShort==="function") return evShort(sk);
  return String(sk.n).split(/[／/（(]/)[0].trim().slice(0,7);
}
function labQs(id){ return (LAB_Q[id]||[]); }
function labQuizScore(id){
  var qs=labQs(id), ans=labState().ans[id];
  if(!qs.length || !Array.isArray(ans) || ans.length<qs.length) return null;
  var sc=0;
  qs.forEach(function(q,i){
    if(ans[i]===q.a) sc+=2;
    else if(q.alt>=0 && ans[i]===q.alt) sc+=1;
  });
  return { sc:sc, total:qs.length, max:qs.length*2, lv:labSuggest(sc, qs.length) };
}

/* ---------- 证据：把原话找出来（只做索引，不做判断） ---------- */
function labSources(){
  var out=[];
  try{
    var d=(window.S && S.resumeEdit && typeof S.resumeEdit==="object") ? S.resumeEdit : null;
    if(d){
      (d.projs||[]).forEach(function(p,i){
        out.push({ src:"项目经历 "+(i+1)+"「"+(p.name||"未命名")+"」",
                   text:[p.name,p.role,p.desc,p.result,(p.tags||[]).join(" ")].filter(Boolean).join(" ") });
      });
      (d.works||[]).forEach(function(w,i){
        if(!(w.co||w.role||w.desc)) return;
        out.push({ src:"工作经历 "+(i+1)+"「"+(w.co||w.role)+"」",
                   text:[w.co,w.role,w.desc].filter(Boolean).join(" ") });
      });
    }
  }catch(e){}
  try{
    if(window.S && Array.isArray(S.works)){
      S.works.forEach(function(w,i){
        out.push({ src:"作品与经历 "+(i+1)+"「"+(w.title||"未命名")+"」",
                   text:[w.title,w.body].filter(Boolean).join(" ") });
      });
    }
  }catch(e){}
  try{
    var f=(window.S && S.resume && S.resume.facts) ? S.resume.facts : null;
    if(f && f.skills && f.skills.length) out.push({ src:"简历解析出的技能", text:f.skills.join(" ") });
    if(f && f.inds && f.inds.length)     out.push({ src:"简历解析出的方向", text:f.inds.join(" ") });
    if(window.S && S.resume && S.resume.raw) out.push({ src:"简历正文", text:S.resume.raw });
  }catch(e){}
  return out;
}
function labHit(sid, text){
  var kws=LAB_KW[sid]||[], t=String(text||"").toLowerCase();
  for(var i=0;i<kws.length;i++) if(t.indexOf(kws[i])>=0) return kws[i];
  return "";
}
/* 某个技能的命中证据（去重、每条带回引原话） */
function labEvidence(sid){
  var out=[], seen={};
  labSources().forEach(function(s){
    var k=labHit(sid, s.text);
    if(!k || seen[s.src+k]) return;
    seen[s.src+k]=1;
    var i=String(s.text).toLowerCase().indexOf(k);
    out.push({ src:s.src, kw:k, quote:String(s.text).slice(Math.max(0,i-12), i+22).replace(/\s+/g," ") });
  });
  return out;
}

/* =====================================================================
   ③ 能力分析：四样东西摆在一起，只回答「哪一项只在你自己嘴里」
   ---------------------------------------------------------------------
   规则写在代码里、也写在界面上，用户能逐条反驳：
     自评    ← 进化雷达的 0—5 自评（S.ev.level）
     小测    ← 本页的 3 道情境题（S.lab.ans）
     证据    ← 项目 / 工作 / 作品 / 简历里出现过的关键词（只做索引）
     投入    ← 这个技能累计记过的分钟数（S.ev.log）
   ★ 不给总分、不排名、不预测。四档只描述状态，不描述人。
   ===================================================================== */
var LAB_TIER = {
  solid:{ n:"说得清",   c:"ok",   act:"有自评也有出处，先不用动。" },
  selfonly:{ n:"只有自评", c:"warn", act:"简历上写不出来。去下面加一条项目经历。" },
  quizonly:{ n:"测出来了没自评", c:"info", act:"把自评调到小测建议的那一档，或说明为什么不认同。" },
  none:{ n:"还没碰",   c:"dim",  act:"不用全做。挑一个真会用到的再开始。" }
};
function labRows(){
  var L=labState(), out=[];
  if(typeof EV_SKILLS==="undefined") return out;
  EV_SKILLS.forEach(function(sk){
    var lv = (typeof evLevel==="function") ? evLevel(sk.id) : 0;
    var q  = labQuizScore(sk.id);
    var ev = labEvidence(sk.id);
    var mins = (typeof evSumOf==="function") ? evSumOf(sk.id) : 0;
    var tier;
    if(lv>=2 && ev.length) tier="solid";
    else if(lv>=2) tier="selfonly";
    else if(q && q.lv>=2) tier="quizonly";
    else tier="none";
    out.push({ id:sk.id, n:sk.n, short:labShort(sk.id), cat:sk.cat,
               lv:lv, q:q, ev:ev, mins:mins, tier:tier });
  });
  /* 排前面的是「最该动手」的：只有自评的排最前，其次是有东西没自评的 */
  var order={ selfonly:0, quizonly:1, none:2, solid:3 };
  out.sort(function(a,b){
    return (order[a.tier]-order[b.tier]) || (b.ev.length-a.ev.length) || (b.mins-a.mins);
  });
  return out;
}
function labCounts(){
  var c={ solid:0, selfonly:0, quizonly:0, none:0 };
  labRows().forEach(function(r){ c[r.tier]++; });
  return c;
}

/* =====================================================================
   ④ 渲染
   ===================================================================== */
function labQuizCard(){
  var L=labState();
  var done=0, tot=0, sum=0;
  EV_SKILLS.forEach(function(sk){
    var q=labQuizScore(sk.id);
    tot++;
    if(q){ done++; sum += q.max ? q.sc/q.max : 0; }
  });
  var h='<div class="card"><h3>能力小测</h3>'+
    '<p class="note" style="margin-top:0">每项技能 <b>3 道情境题</b>：给一个真会遇到的场面，'+
    '选一个你认为最专业的做法。'+
    '<b class="hl">这是本机题库，不是任何机构认证</b> —— 它测的是这几种情形你会怎么选，'+
    '测不出动手能力，也测不出「能教别人」那一档。它的用处是给自评定个锚。</p>';
  h+='<div class="labstat">已完成 <b>'+done+' / '+tot+'</b> 项'+
     (done ? ' · 平均正确率 <b>'+Math.round(sum/done*100)+'%</b>' : '')+'</div>';
  EV_CATS.forEach(function(cat){
    var list=EV_SKILLS.filter(function(x){ return x.cat===cat; });
    if(!list.length) return;
    h+='<div class="evcath"><b>'+esc(cat)+'</b><span>'+list.length+' 项</span></div>';
    h+='<div class="labquizgrid">'+list.map(function(sk){
      var q=labQuizScore(sk.id), n=(LAB_Q[sk.id]||[]).length;
      return '<button type="button" class="labqcard'+(q?" lqd":"")+'" data-quiz="'+esc(sk.id)+'">'+
        '<b>'+esc(labShort(sk.id))+'</b>'+
        '<span>'+(q ? ('答完了 · '+q.sc+' / '+q.max+' 分 · 建议 '+EV_LV_SHORT[q.lv]+' 档')
                    : (n+' 道题 · 还没做'))+'</span></button>';
    }).join("")+'</div>';
  });
  h+='</div>';
  return h;
}

function labAnalysisCard(){
  var rows=labRows(), c=labCounts();
  var h='<div class="card"><h3>能力分析</h3>'+
    '<p class="note" style="margin-top:0">把四样东西摆在一起看：'+
    '<b>自评</b>（你自己打分）· <b>小测</b>（情境题得分）· <b>证据</b>（项目/经历/简历里出现过的原话）· '+
    '<b>投入</b>（你记过的分钟数）。<br>'+
    '<b class="hl">它不给总分，也不排名</b> —— 只回答一个问题：'+
    '哪一项「只在你自己嘴里」。'+
    '证据是按关键词找出来的，<b>会误判</b>，所以每条都带原话，你自己看着删。</p>';
  h+='<div class="labtier">'+
    '<span class="t-ok">说得清 <b>'+c.solid+'</b></span>'+
    '<span class="t-warn">只有自评 <b>'+c.selfonly+'</b></span>'+
    '<span class="t-info">测出来了没自评 <b>'+c.quizonly+'</b></span>'+
    '<span class="t-dim">还没碰 <b>'+c.none+'</b></span></div>';
  if(c.selfonly){
    var first=rows.filter(function(r){ return r.tier==="selfonly"; })[0];
    h+='<div class="labnext">下一步做一件就够：给「<b>'+esc(first.short)+'</b>」加一条项目经历 —— '+
       '你现在给它打了 '+first.lv+' 档，但项目 / 经历 / 简历里找不到出处。</div>';
  } else if(!c.solid && !c.quizonly){
    h+='<div class="labnext">先做一项小测，或者先加一条项目经历 —— 两样都还没有的时候，这张表看不出东西。</div>';
  } else {
    h+='<div class="labnext">没有「只有自评」的项。可以把小测做得更细，或者去改简历把已有证据写进去。</div>';
  }
  h+='<div class="lablist">';
  rows.forEach(function(r){
    var T=LAB_TIER[r.tier];
    h+='<div class="labrow lr-'+T.c+'">'+
      '<div class="lr-h"><b>'+esc(r.short)+'</b><span class="lrtag lr-'+T.c+'">'+esc(T.n)+'</span>'+
      '<em>'+esc(r.cat)+'</em></div>'+
      '<div class="lr-nums">'+
        '<span>自评 <b>'+(r.lv||0)+'</b></span>'+
        '<span>小测 '+(r.q?('<b>'+r.q.sc+'/'+r.q.max+'</b>'):'<i>未做</i>')+'</span>'+
        '<span>证据 <b>'+r.ev.length+'</b> 条</span>'+
        '<span>投入 <b>'+r.mins+'</b> 分</span>'+
      '</div>';
    if(r.ev.length){
      h+='<div class="lr-ev">'+r.ev.slice(0,3).map(function(e){
        return '<span title="'+esc(e.src)+'">'+esc(e.src)+'：…'+esc(e.quote)+'…</span>';
      }).join("")+(r.ev.length>3?('<span class="labmore">还有 '+(r.ev.length-3)+' 条</span>'):'')+'</div>';
    }
    h+='<p class="lr-act">'+esc(T.act)+
      (r.tier==="quizonly" ? ' <button type="button" class="sm" data-adopt="'+esc(r.id)+'">按小测调到 '+EV_LV_SHORT[r.q.lv]+' 档</button>' : '')+
      (r.tier==="selfonly" ? ' <button type="button" class="sm" data-toproj="'+esc(r.id)+'">加一条项目经历</button>' : '')+
      '</p>';
    h+='</div>';
  });
  h+='</div>';
  h+='<p class="note">规则（可逐条反驳）：自评 ≥2 分且找到出处 → 说得清；'+
    '自评 ≥2 分但找不到出处 → 只有自评；自评 ≤1 分但小测建议 ≥2 档 → 测出来了没自评；'+
    '其余 → 还没碰。「投入」只统计你在进化雷达里记过的分钟，没有记录就是 0，'+
    '<b>不代表你没在这件事上花时间</b>。</p>';
  h+='</div>';
  return h;
}

function labProjCard(focusId){
  var d=(window.S && S.resumeEdit && typeof S.resumeEdit==="object") ? S.resumeEdit : null;
  var projs=(d && Array.isArray(d.projs)) ? d.projs : [];
  var L=labState();
  var pre=L.sk || focusId || "";
  var h='<div class="card" id="labProj"><h3>项目经历</h3>'+
    '<p class="note" style="margin-top:0">项目经历是能力分析里唯一的「证据」。'+
    '填完直接写进简历的项目经历那一段，再走原来的解析管线 —— <b>画像会跟着更新</b>。'+
    '<b class="hl">这里不替你写内容</b>，只给格子。</p>';
  if(projs.length){
    h+='<div class="labplist">'+projs.map(function(p,i){
      return '<div class="labpitem"><b>'+esc(p.name||"（未命名）")+'</b>'+
        '<span>'+esc([p.role,p.result].filter(Boolean).join(" · ")||"（没写角色和结果）")+'</span>'+
        '<button type="button" class="labpx" data-pdel="'+i+'" aria-label="删掉这条">✕</button></div>';
    }).join("")+'</div>';
  } else {
    h+='<p class="note">还没有项目经历。转行、跨行业的人最该补的就是这一块 —— 它证明能力能搬走。</p>';
  }
  h+='<button type="button" class="pri" id="labProjAdd">＋ 添加项目经历</button>'+
    '<button type="button" class="sm" id="labResumeOpen2" style="margin-left:8px">去简历里逐条改</button>';
  h+='</div>';
  return h;
}

function labResumeCard(){
  var d=(window.S && S.resumeEdit && typeof S.resumeEdit==="object") ? S.resumeEdit : null;
  var raw=(window.S && S.resume && S.resume.raw) ? S.resume.raw : "";
  var txt="";
  try{ txt=(typeof window.resumeEditText==="function") ? window.resumeEditText() : ""; }catch(e){ txt=""; }
  var body=txt || raw || "";
  var chars=body.replace(/\s/g,"").length;
  var nums=(body.match(/\d+(?:\.\d+)?\s*(?:%|万|亿|人|个|倍|次|条|家|台|天|小时)/g)||[]).length;
  var works=(d&&Array.isArray(d.works)) ? d.works.filter(function(w){ return w.co||w.role||w.desc; }).length : 0;
  var projs=(d&&Array.isArray(d.projs)) ? d.projs.filter(function(p){ return p.name||p.desc||p.result; }).length : 0;
  var h='<div class="card"><h3>改简历</h3>'+
    '<p class="note" style="margin-top:0">上面三步的结论最后要落到简历上，否则白做。'+
    '这里是同一份简历的另一个入口（职场画像里那个也是它，改哪边都一样）。</p>'+
    '<div class="lr-nums labnums">'+
      '<span>正文 <b>'+chars+'</b> 字</span>'+
      '<span>量化成果 <b>'+nums+'</b> 处</span>'+
      '<span>工作经历 <b>'+works+'</b> 段</span>'+
      '<span>项目经历 <b>'+projs+'</b> 项</span>'+
    '</div>';
  if(chars<80) h+='<p class="labw soft" style="margin-top:8px"><b>还不到 80 字。</b>画像至少需要 80 个字才不至于乱猜。</p>';
  else if(!nums) h+='<p class="labw soft" style="margin-top:8px"><b>一处数字成果都没有。</b>「做了什么」谁都会写，「做到什么程度」才是分水岭。</p>';
  else if(!projs) h+='<p class="labw soft" style="margin-top:8px"><b>还没有项目经历。</b>它是能力分析里唯一的证据来源，补一条比多写两句形容词有用。</p>';
  else h+='<p class="labw good" style="margin-top:8px"><b>可以了。</b>改完会自动重新解析，画像和岗位匹配跟着更新。</p>';
  h+='<div class="acts"><button type="button" class="pri" id="labResumeOpen">✎ 自己编辑简历</button></div>';
  h+='</div>';
  return h;
}

/* =====================================================================
   ⑤ 小测流程（一次一题，答完逐题回引）
   ===================================================================== */
function labQuizOpen(skId){
  injectCSS();
  var qs=labQs(skId);
  if(!qs.length){ toast("这一项还没有题"); return; }
  var ans=Array.isArray(labState().ans[skId]) ? labState().ans[skId].slice(0,0) : [];
  var step=0;

  function paint(){
    var sk=labSk(skId);
    if(step>=qs.length){ return paintResult(); }
    var q=qs[step];
    var h='<div id="labQuiz">'+
      '<p class="note" style="margin-top:0">「<b>'+esc(sk?sk.n:skId)+'</b>」· 第 '+(step+1)+' / '+qs.length+' 题</p>'+
      '<h4 class="lq-q">'+esc(q.q)+'</h4>'+
      '<div class="lq-opts">'+q.o.map(function(o,i){
        return '<button type="button" class="lq-opt" data-pick="'+i+'">'+
          '<i>'+String.fromCharCode(65+i)+'</i>'+esc(o)+'</button>';
      }).join("")+'</div>'+
      '<p class="note">选一个你认为最专业的做法 —— 这里没有「全部都对」，只有一个是最稳的。</p>'+
      '</div>';
    openModal("能力小测", h, [{t:"退出", f:closeModal}]);
    $$("#mBody [data-pick]").forEach(function(b){
      b.onclick=function(){
        ans[step]=+b.getAttribute("data-pick");
        step++;
        paint();
      };
    });
  }

  function paintResult(){
    var sc=0;
    qs.forEach(function(q,i){
      if(ans[i]===q.a) sc+=2; else if(q.alt>=0 && ans[i]===q.alt) sc+=1;
    });
    var L=labState();
    L.ans[skId]=ans.slice();
    L.done[skId]=true;
    save();
    if(typeof trackPush==="function") trackPush("lab_quiz",{id:skId, sc:sc, max:qs.length*2});
    var lv=labSuggest(sc, qs.length);
    var h='<div id="labQuiz">'+
      '<div class="lq-score"><b>'+sc+' / '+(qs.length*2)+'</b>'+
      '<span>建议自评档：<b>'+EV_LV_SHORT[lv]+'</b> · '+esc(EV_LEVELS[lv])+'</span></div>'+
      '<p class="note"><b class="hl">这只是 3 道情境题。</b>它测不出动手能力，也测不出「能教别人」那一档（那要别人说了算）。'+
      '它的用处是给你一个外部参照，再回去看自己的自评。</p>';
    h+='<div class="lq-rev">'+qs.map(function(q,i){
      var mine=ans[i], ok=(mine===q.a), half=(!ok && q.alt>=0 && mine===q.alt);
      var tag = ok ? '<span class="lq-tag lqt-ok">最佳</span>'
                   : (half ? '<span class="lq-tag lqt-half">说得过去</span>' : '<span class="lq-tag lqt-no">不建议</span>');
      return '<div class="lq-item'+(ok?" lqi-ok":"")+'">'+
        '<div class="lq-item-h">'+tag+'<b>第 '+(i+1)+' 题</b></div>'+
        '<p class="lq-q2">'+esc(q.q)+'</p>'+
        '<p class="lq-a">你选的：'+esc(q.o[mine]||"—")+'</p>'+
        (ok?"":('<p class="lq-a lqa-best">更稳的做法：'+esc(q.o[q.a])+'</p>'))+
        '<p class="lq-w">'+esc(q.w)+'</p></div>';
    }).join("")+'</div>';
    h+='</div>';
    openModal("能力小测 · 结果", h, [
      {t:"按建议更新自评", c:"pri", f:function(){
        if(typeof evSetLevel==="function"){ evSetLevel(skId, lv); }
        else { toast("自评没能更新"); }
        closeModal();
        if(typeof renderEvolve==="function") renderEvolve();
      }},
      {t:"重做一次", c:"", f:function(){ ans=[]; step=0; paint(); }},
      {t:"知道了", c:"", f:function(){ closeModal(); if(typeof renderEvolve==="function") renderEvolve(); }}
    ]);
  }

  paint();
}

/* =====================================================================
   ⑥ 添加项目经历（写进简历的那一份，不是另存一份）
   ===================================================================== */
function labProjOpen(preset){
  injectCSS();
  var d=(window.S && S.resumeEdit && typeof S.resumeEdit==="object") ? S.resumeEdit : null;
  if(!d){ toast("请先到「职场画像」看一次简历，再回来加"); return; }
  if(!Array.isArray(d.projs)) d.projs=[];
  var tags=(preset && labSk(preset)) ? [preset] : [];
  var draft={ name:"", role:"", from:"", to:"", desc:"", result:"", tags:tags.slice() };

  function chips(){
    var list=(typeof EV_SKILLS!=="undefined") ? EV_SKILLS : [];
    return '<div class="lq-tags">'+list.map(function(sk){
      var on=draft.tags.indexOf(sk.id)>=0;
      return '<button type="button" class="lq-tag-btn'+(on?" lqt-on":"")+'" data-tag="'+esc(sk.id)+'">'+
        esc(labShort(sk.id))+'</button>';
    }).join("")+'</div>';
  }
  function body(){
    return '<div id="labProjForm">'+
      '<p class="note" style="margin-top:0">只填你真做过的。'+
      '<b class="hl">结果那一格尽量放数字</b>（把 X 从 4 次降到 1 次 / 覆盖 12 家客户），'+
      '没有数字也照实写，别编 —— 面试时会被追问。</p>'+
      '<div class="labf-row"><label><span>项目名</span>'+
        '<input data-k="name" value="'+esc(draft.name)+'" placeholder="某产线设备联网改造"></label>'+
      '<label><span>你的角色</span>'+
        '<input data-k="role" value="'+esc(draft.role)+'" placeholder="电气主责 / 唯一执行人"></label></div>'+
      '<div class="labf-row"><label><span>起（可留空）</span><input data-k="from" value="'+esc(draft.from)+'" placeholder="2024.03"></label>'+
      '<label><span>止（可留空）</span><input data-k="to" value="'+esc(draft.to)+'" placeholder="2024.09"></label></div>'+
      '<label><span>做了什么（一行一条）</span>'+
        '<textarea data-k="desc" placeholder="改了什么 · 怎么改的 · 遇到什么并怎么处理">'+esc(draft.desc)+'</textarea></label>'+
      '<label><span>结果（数字优先）</span>'+
        '<input data-k="result" value="'+esc(draft.result)+'" placeholder="非计划停机从每月 6 次降到 1 次"></label>'+
      '<label><span>用到哪些能力（点一下勾上，能力分析靠这个找证据）</span></label>'+
      chips()+
      '</div>';
  }
  function collect_(root){
    Array.prototype.forEach.call(root.querySelectorAll("[data-k]"),function(el){
      draft[el.getAttribute("data-k")]=el.value;
    });
  }
  function paint(){
    openModal("添加项目经历", body(), [
      {t:"保存并写进简历", c:"pri", f:function(){
        collect_(document.getElementById("mBody"));
        if(!draft.name && !draft.desc){ toast("至少写个项目名或做了什么"); paint(); return; }
        if(!d.projs) d.projs=[];
        d.projs.push({
          name:draft.name, role:draft.role,
          from:draft.from, to:draft.to,
          desc:draft.desc, result:draft.result,
          tags:draft.tags.slice()
        });
        try{ S.resumeEdit=d; }catch(e){}
        /* ★ 走原有的保存管线：拼文本 → 写回简历框 → 重新解析画像。
           不自己另造一套解析，画像 / 匹配 / 面试看到的还是同一份。 */
        var txt="";
        try{ txt=(typeof window.resumeEditText==="function") ? window.resumeEditText() : ""; }catch(e){ txt=""; }
        var ta=document.getElementById("resumeRaw");
        if(ta && txt) ta.value=txt;
        save();
        var before=(window.S && S.resume && S.resume.raw) ? S.resume.raw : "";
        var threw=false;
        try{ if(typeof window.doParse==="function") doParse(); }catch(e){ threw=true; }
        /* ★ 别把「写进去了」说成「解析成功了」。
           doParse() 有一条静默早退：正文不足 80 个字它直接 return（只弹一句提示）。
           实测：用户第一次用这个入口时简历通常是空的 —— 那时候说「已重新解析」是假话，
           而假话的代价是他以为画像更新了，后面看到的一直是旧的。 */
        var after=(window.S && S.resume && S.resume.raw) ? S.resume.raw : "";
        var parsed = !!txt && String(after).trim()===String(txt).trim() && after!==before;
        closeModal();
        if(threw) toast("项目已写进简历，但自动解析报错 —— 去「职场画像」看一眼");
        else if(parsed) toast("已写进简历并重新解析");
        else if(String(txt).replace(/\s/g,"").length<80)
          toast("写进简历了，但正文还不到 80 字，画像没重算 —— 去把工作经历补上（能力分析不受影响）");
        else toast("已写进简历，但没触发重新解析 —— 去「职场画像」点一下解析");
        if(typeof trackPush==="function") trackPush("lab_proj",{tags:draft.tags.length});
        if(typeof renderEvolve==="function") renderEvolve();
      }},
      {t:"取消", c:"", f:closeModal}
    ]);
    var host=document.getElementById("mBody");
    if(!host) return;
    host.addEventListener("input", function(ev){
      var el=ev.target;
      if(el && el.getAttribute && el.getAttribute("data-k")) collect_(host);
    });
    host.addEventListener("click", function(ev){
      var el=ev.target;
      if(!el || !el.getAttribute) return;
      var id=el.getAttribute("data-tag");
      if(!id) return;
      collect_(host);
      var at=draft.tags.indexOf(id);
      if(at>=0) draft.tags.splice(at,1); else draft.tags.push(id);
      paint();
    }, true);
  }
  paint();
}

/* =====================================================================
   ⑦ 样式（运行时注入，颜色全部带兜底；不改 style.html）
   ===================================================================== */
var LAB_SID = "lab-style";
function injectCSS(){
  if(document.getElementById(LAB_SID)) return;
  var css = [
  "#evOut .labstat{font-size:13px;color:var(--dim,#5C554B);background:var(--bg3,#F4EEE3);",
    "border-radius:10px;padding:7px 12px;margin:0 0 10px}",
  "#evOut .labstat b{color:var(--gold,#1E3A5F)}",
  "#evOut .labquizgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:8px}",
  "#evOut .labqcard{font:inherit;text-align:left;cursor:pointer;border:1px solid var(--line2,#D6C9B4);",
    "background:var(--bg2,#FFFDF9);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:4px}",
  "#evOut .labqcard:hover{border-color:var(--gold,#1E3A5F)}",
  "#evOut .labqcard b{font-size:13.5px;color:var(--txt,#2B2620)}",
  "#evOut .labqcard span{font-size:12px;color:var(--dim2,#8A8175);line-height:1.6}",
  "#evOut .labqcard.lqd{border-color:var(--good,#1F7A5C);background:#F2F8F5}",
  "#evOut .labqcard.lqd span{color:var(--good,#1F7A5C);font-weight:700}",
  "#evOut .labtier{display:flex;flex-wrap:wrap;gap:8px;margin:2px 0 10px}",
  "#evOut .labtier span{font-size:12.5px;padding:4px 11px;border-radius:999px;border:1px solid var(--line2,#D6C9B4)}",
  "#evOut .labtier b{font-weight:700}",
  "#evOut .t-ok{background:#E7F2ED;color:#0B6049;border-color:#BEDFCF!important}",
  "#evOut .t-warn{background:#FBF0E4;color:#8A5A1E;border-color:#EBD6B8!important}",
  "#evOut .t-info{background:#EAF1F8;color:#1B4E7A;border-color:#C6DBEC!important}",
  "#evOut .t-dim{background:var(--bg3,#F4EEE3);color:var(--dim2,#8A8175)!important}",
  "#evOut .labnext{font-size:13.5px;line-height:1.8;color:var(--txt,#2B2620);background:var(--bg3,#F4EEE3);",
    "border-left:3px solid var(--gold2,#C9A227);border-radius:0 10px 10px 0;padding:9px 13px;margin:0 0 12px}",
  "#evOut .lablist{display:flex;flex-direction:column;gap:8px}",
  "#evOut .labrow{border:1px solid var(--line,#E4DBCC);border-radius:12px;padding:10px 13px;background:var(--bg2,#FFFDF9)}",
  "#evOut .labrow.lr-warn{border-left:3px solid #C9A227}",
  "#evOut .labrow.lr-info{border-left:3px solid #4A7CA8}",
  "#evOut .labrow.lr-ok{border-left:3px solid #1F7A5C}",
  "#evOut .lr-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
  "#evOut .lr-h b{font-size:14px;color:var(--txt,#2B2620)}",
  "#evOut .lr-h em{font-style:normal;font-size:11.5px;color:var(--dim2,#8A8175);margin-left:auto}",
  "#evOut .lrtag{font-size:11.5px;font-weight:700;padding:1px 8px;border-radius:999px}",
  "#evOut .lrtag.lr-ok{background:#E7F2ED;color:#0B6049}",
  "#evOut .lrtag.lr-warn{background:#FBF0E4;color:#8A5A1E}",
  "#evOut .lrtag.lr-info{background:#EAF1F8;color:#1B4E7A}",
  "#evOut .lrtag.lr-dim{background:var(--bg3,#F4EEE3);color:var(--dim2,#8A8175)}",
  "#evOut .lr-nums{display:flex;flex-wrap:wrap;gap:12px;font-size:12.5px;color:var(--dim,#5C554B);margin-top:6px}",
  "#evOut .lr-nums b{color:var(--gold,#1E3A5F);font-weight:700}",
  "#evOut .lr-nums i{font-style:normal;color:var(--dim2,#8A8175)}",
  "#evOut .lr-ev{display:flex;flex-direction:column;gap:3px;margin-top:6px}",
  "#evOut .lr-ev span{font-size:12px;color:var(--dim,#5C554B);background:var(--bg3,#F4EEE3);",
    "border-radius:8px;padding:4px 9px;line-height:1.6}",
  "#evOut .lr-ev span.labmore{background:none;color:var(--dim2,#8A8175);padding:0 2px}",
  "#evOut .lr-act{font-size:12.5px;color:var(--dim,#5C554B);line-height:1.8;margin:7px 0 0}",
  "#evOut .lr-act button{margin-left:2px}",
  "#evOut .labplist{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}",
  "#evOut .labpitem{display:flex;align-items:center;gap:8px;border:1px dashed var(--line2,#D6C9B4);",
    "border-radius:10px;padding:7px 11px;background:var(--bg,#FAF7F1)}",
  "#evOut .labpitem b{font-size:13px;color:var(--txt,#2B2620)}",
  "#evOut .labpitem span{font-size:12px;color:var(--dim2,#8A8175);flex:1 1 auto}",
  "#evOut .labw{font-size:12.5px;line-height:1.75;padding:8px 11px;border-radius:10px;margin:0}",
  "#evOut .labw.soft{background:#F6EEE4;color:#7A5230}",
  "#evOut .labw.good{background:#E7F2ED;color:#0B6049}",
  "#evOut .labpx{background:none;border:none;cursor:pointer;font-size:14px;color:var(--dim2,#8A8175)}",
  "#evOut .labpx:hover{color:var(--bad,#C9553D)}",
  /* 小测弹窗 */
  "#mBody .lq-q{font-size:15px;line-height:1.75;color:var(--txt,#2B2620);margin:6px 0 12px}",
  "#mBody .lq-opts{display:flex;flex-direction:column;gap:8px}",
  "#mBody .lq-opt{font:inherit;text-align:left;cursor:pointer;display:flex;gap:10px;align-items:flex-start;",
    "border:1px solid var(--line2,#D6C9B4);background:var(--bg2,#FFFDF9);border-radius:12px;padding:10px 13px;",
    "font-size:13.5px;line-height:1.7;color:var(--txt,#2B2620)}",
  "#mBody .lq-opt:hover{border-color:var(--gold,#1E3A5F);background:var(--bg3,#F4EEE3)}",
  "#mBody .lq-opt i{font-style:normal;font-weight:700;color:var(--gold2,#8A6D1F);flex:0 0 18px}",
  "#mBody .lq-score{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin:0 0 8px}",
  "#mBody .lq-score b{font-size:22px;color:var(--gold,#1E3A5F)}",
  "#mBody .lq-score span{font-size:13px;color:var(--dim,#5C554B)}",
  "#mBody .lq-rev{display:flex;flex-direction:column;gap:9px;margin-top:10px}",
  "#mBody .lq-item{border:1px solid var(--line,#E4DBCC);border-radius:12px;padding:10px 13px;background:var(--bg2,#FFFDF9)}",
  "#mBody .lq-item.lqi-ok{border-color:#BEDFCF;background:#F2F8F5}",
  "#mBody .lq-item-h{display:flex;align-items:center;gap:8px}",
  "#mBody .lq-item-h b{font-size:12.5px;color:var(--dim2,#8A8175)}",
  "#mBody .lq-tag{font-size:11.5px;font-weight:700;padding:1px 8px;border-radius:999px}",
  "#mBody .lq-tag.lqt-ok{background:#DCEFE6;color:#0B6049}",
  "#mBody .lq-tag.lqt-half{background:#FBF0E4;color:#8A5A1E}",
  "#mBody .lq-tag.lqt-no{background:#F7E3DE;color:#9C3B25}",
  "#mBody .lq-q2{font-size:13.5px;color:var(--txt,#2B2620);line-height:1.7;margin:6px 0}",
  "#mBody .lq-a{font-size:12.5px;color:var(--dim,#5C554B);line-height:1.7;margin:0}",
  "#mBody .lq-a.lqa-best{color:#0B6049;font-weight:700}",
  "#mBody .lq-w{font-size:12.5px;color:var(--dim,#5C554B);line-height:1.8;margin:6px 0 0;",
    "background:var(--bg3,#F4EEE3);border-radius:8px;padding:7px 10px}",
  "#mBody .lq-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}",
  "#mBody .lq-tag-btn{font:inherit;font-size:12px;padding:3px 9px;border-radius:999px;cursor:pointer;",
    "border:1px solid var(--line2,#D6C9B4);background:var(--bg2,#FFFDF9);color:var(--dim,#5C554B)}",
  "#mBody .lq-tag-btn.lqt-on{background:var(--gold,#1E3A5F);border-color:var(--gold,#1E3A5F);color:#fff;font-weight:700}",
  "#mBody .labf-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}",
  "#mBody .labf-row label{display:block}",
  "#mBody .labf-row span{display:block;font-size:11.5px;font-weight:700;color:var(--dim2,#8A8175);margin-bottom:3px}",
  "#mBody #labProjForm input,#mBody #labProjForm textarea{width:100%;font:inherit;font-size:13.5px;",
    "padding:7px 10px;border-radius:10px;border:1px solid var(--line2,#D6C9B4);background:var(--bg,#FAF7F1);color:var(--txt,#2B2620)}",
  "#mBody #labProjForm textarea{min-height:76px;line-height:1.7;resize:vertical}",
  "#mBody #labProjForm>label{display:block;margin-bottom:8px}",
  "#mBody .labw{font-size:12.5px;line-height:1.75;padding:8px 11px;border-radius:10px;margin:0}",
  "#mBody .labw.soft{background:#F6EEE4;color:#7A5230}",
  "#mBody .labw.good{background:#E7F2ED;color:#0B6049}",
  "@media (max-width:720px){#evOut .labquizgrid{grid-template-columns:1fr 1fr}",
    "#mBody .labf-row{grid-template-columns:1fr}}"
  ].join("\n");
  var s=document.createElement("style"); s.id=LAB_SID; s.textContent=css;
  document.head.appendChild(s);
}

/* =====================================================================
   ⑧ 绑定（宿主是渲染完的 #evOut；DOM 是每轮重建的，所以全部走委托）
   ===================================================================== */
function labBind(host){
  if(!host) return;
  Array.prototype.forEach.call(host.querySelectorAll("[data-quiz]"), function(b){
    b.onclick=function(){ labQuizOpen(b.getAttribute("data-quiz")); };
  });
  Array.prototype.forEach.call(host.querySelectorAll("[data-adopt]"), function(b){
    b.onclick=function(){
      var id=b.getAttribute("data-adopt"), q=labQuizScore(id);
      if(!q) return;
      if(typeof evSetLevel==="function") evSetLevel(id, q.lv);
      toast("「"+labShort(id)+"」自评已调到 "+EV_LV_SHORT[q.lv]+" 档");
    };
  });
  Array.prototype.forEach.call(host.querySelectorAll("[data-toproj]"), function(b){
    b.onclick=function(){ labState().sk=b.getAttribute("data-toproj"); save(); labProjOpen(b.getAttribute("data-toproj")); };
  });
  Array.prototype.forEach.call(host.querySelectorAll("[data-pdel]"), function(b){
    b.onclick=function(){
      var i=+b.getAttribute("data-pdel");
      var d=(window.S && S.resumeEdit) ? S.resumeEdit : null;
      if(!d || !Array.isArray(d.projs)) return;
      d.projs.splice(i,1);
      save();
      try{ var t=window.resumeEditText(); var ta=document.getElementById("resumeRaw"); if(ta&&t) ta.value=t; }catch(e){}
      try{ if(typeof window.doParse==="function") doParse(); }catch(e){}
      toast("已删掉这条项目经历");
      if(typeof renderEvolve==="function") renderEvolve();
    };
  });
  var a=host.querySelector("#labProjAdd");
  if(a) a.onclick=function(){ labProjOpen(labState().sk||""); };
  ["#labResumeOpen","#labResumeOpen2"].forEach(function(sel){
    var b=host.querySelector(sel);
    if(b) b.onclick=function(){
      if(typeof window.openResumeEditor==="function") window.openResumeEditor();
      else toast("简历编辑器没加载，去「职场画像」那一页改");
    };
  });
}

window.LAB = {
  quizCard: labQuizCard,
  analysisCard: labAnalysisCard,
  projCard: labProjCard,
  resumeCard: labResumeCard,
  bind: labBind,
  quizOpen: labQuizOpen,
  projOpen: labProjOpen,
  rows: labRows,
  counts: labCounts,
  evidence: labEvidence,
  score: labQuizScore,
  suggest: labSuggest,
  Q: LAB_Q, KW: LAB_KW
};
