/* =====================================================================
   firstrun.js —— 双通道版的「按诊断优化」层（2026-09-27）
   ---------------------------------------------------------------------
   诊断报告里属于产品层的四条，全部收在这一个文件里，尽量不动既有模块：
     ① 首屏不给 4 个 0：没档案时不给零值仪表盘，给「先看一份样例画像」。
     ② 先给结果、再要输入：样例画像一键可看，看完再决定要不要填自己的。
     ③ 结论标来源性质：每一页的结论是什么性质（有出处 / 法条依据 / 规则推演 /
        本库判断 / 你的输入），并在「方法与来源」页给完整交代。
     ④ 装饰层降级为可选：设置里一个「精简模式」开关（默认开），
        关掉课堂/鱼池/商店/皮肤这类装饰入口与展示块。

   ★ 为什么是新文件而不是改 app.js：
     app.js 是 130 KB 的 7 步状态机，动它的风险远大于收益（实测每改一处
     平均要复查 3 处调用点）。这里全部用「运行时挂载 + 包装」完成，
     不需要改既有函数体，也便于将来整块移除。

   ★ 本文件是 IIFE，内部函数**缩进两格**：构建里有一条「重复定义」检查，
     它按「顶格 = 全局」判断。顶格写 esc/blank 这类通用名会被误报成冲突。
   ===================================================================== */
(function(){
  var SID = "fr-style";

  var CSS = [
    ".srctag{display:inline-block;font-size:11.5px;font-weight:700;line-height:1.7;padding:0 8px;border-radius:6px;",
    "  margin-left:8px;vertical-align:2px;cursor:help;white-space:nowrap}",
    ".sg-src{background:#E6EFF7;color:#1E3A5F}",
    ".sg-law{background:#EFE7F5;color:#4A3A78}",
    ".sg-rule{background:#E7F2ED;color:#0B6049}",
    ".sg-judge{background:#F6EEE4;color:#7A5230}",
    ".sg-user{background:#F0EFEC;color:#4C4844}",
    ".frlegend{display:flex;flex-direction:column;gap:7px;margin-top:6px}",
    ".frlegend div{font-size:13.5px;line-height:1.75;color:var(--dim,#5C554B)}",
    ".frlimits{margin:6px 0 0;padding-left:20px;line-height:1.9;font-size:14px;color:var(--dim,#5C554B)}",
    ".frlimits .hard{color:#C9553D;font-weight:700}",
    ".frbox{border:1px solid var(--line,#E4DBCC);border-radius:14px;background:var(--bg3,#F1EBE0);padding:12px 15px;margin:10px 0}",
    ".frbox h4{margin:0 0 5px;font-size:13.5px;color:var(--gold2,#8A6D1F)}",
    ".frbox p{margin:0 0 6px;font-size:13.5px;line-height:1.85;color:var(--dim,#5C554B)}",
    ".frbox b{color:var(--txt,#2B2620)}",
    ".frfirst{margin:10px 0 4px;border:1px solid var(--line,#E4DBCC);border-radius:16px;",
    "  background:linear-gradient(180deg,#FFFDF9,#F6F1E7);padding:14px 16px}",
    ".frfirst h3{margin:0 0 6px;font-size:15px;color:var(--txt,#2B2620)}",
    ".frfirst p{margin:0 0 10px;font-size:13.5px;color:var(--dim,#5C554B);line-height:1.8}",
    ".frfirst .row{display:flex;gap:9px;flex-wrap:wrap}",
    ".frfirst .row button{font:inherit;font-size:13.5px;font-weight:700;padding:8px 16px;border-radius:999px;cursor:pointer;",
    "  border:1px solid var(--line2,#D6C9B4);background:#FFFDF9;color:var(--dim,#5C554B)}",
    ".frfirst .row button.pri{background:var(--gold,#1E3A5F);border-color:var(--gold,#1E3A5F);color:#fff}",
    ".frfirst .row button:hover{border-color:var(--gold2,#8A6D1F)}",
    "html[data-slim='1'] .nvi[data-wv='school']{display:none}",
    "html[data-slim='1'] .nvi[data-wv='chatter'] .nb{display:none!important}",
    ".frsetmore{margin:6px 0 0;font-size:13px;color:var(--dim2,#8A8175);line-height:1.8}"
  ].join("\n");

  function injectCSS(){
    if(document.getElementById(SID)) return;
    var s=document.createElement("style"); s.id=SID; s.textContent=CSS;
    document.head.appendChild(s);
  }

  /* ---------------- 样例简历 ----------------
     目的：让第一次打开的人**先看到结果**，再决定要不要填自己的。
     ★ 这段文本必须能被 extractFacts 认出来，所以三处都照顾到了：
       出现「4 年工作经验」、公司名带「有限公司」、描述里带数字。 */
  var SAMPLE = [
    "周立诚 · 大连 · 期望岗位：设备 / 电气自动化工程师 · 本科",
    "4 年工作经验",
    "",
    "工作经历",
    "2021.07—2025.06  大连华隆装备制造有限公司  设备 / 电气自动化工程师",
    "· 负责 3 条产线电气系统的日常维护与点检标准重写，非计划停机从每月 6 次降到 1 次",
    "· 主导产线 PLC 程序改造，换型时间从 90 分钟压到 25 分钟",
    "· 带 2 名新人做设备台账与备件管理，备件库存金额下降 18%",
    "",
    "项目经历",
    "产线设备联网与数据采集改造  电气主责",
    "· 把 42 台设备的运行数据接进采集系统，故障定位时间从半天缩到 1 小时",
    "",
    "教育经历",
    "2017.09—2021.06  大连工业大学  自动化  本科",
    "",
    "技能",
    "PLC、设备维护、点检标准、数据采集、电气图纸、仪表标定"
  ].join("\n");

  /* ---------------- 来源性质标记 ---------------- */
  var TAG_KIND = {
    src:   "有出处（外部来源可查）",
    law:   "法条依据（现行条文）",
    rule:  "规则推演（本库把规则写在页面上，可逐条反驳）",
    judge: "本库判断（整理归纳，没有外部统计支撑）",
    user:  "你的输入（不是本库推断的）"
  };
  function srcTag(kind, text){
    var k = TAG_KIND[kind] ? kind : "judge";
    return '<span class="srctag sg-'+k+'" title="'+TAG_KIND[k]+'">'+text+'</span>';
  }

  /* 每一页的结论「是什么做的」——标在标题旁，用户一眼就能判断该信几分 */
  var VIEW_TAG = {
    job:      ["rule",  "判定规则公开"],
    interview:["judge", "本库题库"],
    rival:    ["src",   "公开信息比对"],
    dispute:  ["law",   "法条依据"],
    status:   ["user",  "你的输入"],
    grow:     ["user",  "你的输入"],
    chatter:  ["user",  "你的输入"],
    tool:     ["judge", "本库词库"],
    school:   ["judge", "本库整理"],
    me:       ["user",  "你的输入"]
  };

  function tagHeadlines(){
    for (var v in VIEW_TAG){
      var pane=document.getElementById("v-"+v);
      if(!pane) continue;
      var h1=pane.querySelector(".vhead h1");
      if(!h1 || h1.querySelector(".srctag")) continue;
      h1.insertAdjacentHTML("beforeend", srcTag(VIEW_TAG[v][0], VIEW_TAG[v][1]));
    }
  }

  /* ---------------- 「方法与来源」页 ---------------- */
  function methodHTML(){
    var T=srcTag;
    return ''+
    '<div class="vhead"><h1>方法与来源</h1></div>'+
    '<div class="frbox"><h4>这一页回答一件事</h4><p>这里每一个结论是怎么来的、材料从哪来、'+
      '哪些是它可以负责的、哪些它负不了责。<b>写完这一页，你才需要判断它值不值得信。</b></p></div>'+

    '<div class="frbox"><h4>① 本库怎么判断</h4>'+
      '<p><b>画像</b>'+T("rule","规则推演")+'：把简历原文做词面统计（年限、行业词、技能词、量化数字、模糊词），'+
        '再按公开的岗位共性归纳成标签。它读的是字面，不是语义 —— 写「靠指标做决定」而岗位写「数据驱动」，它会算成没命中。</p>'+
      '<p><b>岗位匹配</b>'+T("rule","规则推演")+'：你选的关键词 + 简历事实，和 20 类岗位画像做词面比对，'+
        '分成「现在能投」和「留作对照」两批。规则写在页面上，你可以逐条反驳。</p>'+
      '<p><b>面试模拟</b>'+T("judge","本库题库")+'：题目按岗位与面试官类型，从本库题库里取；'+
        '它不预测你会不会被录用，只看你的回答有没有踩到那几个坑。</p>'+
      '<p><b>劳动争议</b>'+T("law","法条依据")+'：只引现行条文与处置流程，<b>不给法律意见、不预测结果、不算任何金额</b>。</p>'+
      '<p><b>竞品与行情</b>'+T("src","公开信息比对")+'：来自公开渠道的词面比对，会标明是哪一类公开信息。</p>'+
    '</div>'+

    '<div class="frbox"><h4>② 材料从哪来</h4>'+
      '<p>题与话术：整理自公开的面试经验与职场公开讨论，属'+T("judge","本库判断")+'。</p>'+
      '<p>岗位画像：通用归纳，不是某一家的招聘口径。</p>'+
      '<p>法条：劳动合同法、劳动法、调解仲裁法等现行条文（引条文号）；'+
        '不确定条文号的（举证责任分配、妇女权益保障法具体条款）<b>只写规则、不写编号</b>。</p>'+
      '<p class="hard"><b>★ 本库没有数据来源页可查的统计口径。</b>它的性质是「按公开规则整理的工具」，'+
        '不是「有出处的研究报告」。凡是要拿数字去对外汇报的场合，请换成真实来源的数据。</p>'+
    '</div>'+

    '<div class="frbox"><h4>③ 五条边界（写死在界面上，不会当建议卖给你）</h4>'+
      '<ul class="frlimits">'+
      '<li class="hard">不预测结果：不说「你这样谈能成」，也不说「你能拿到多少」。</li>'+
      '<li class="hard">不给法律意见：给的是流程、证据清单与话术参考，不是法律结论。</li>'+
      '<li class="hard">不算任何金额：只列可主张的项目名与法条依据，不算钱。</li>'+
      '<li>不做心理评估：不诊断、不打分、不推测你的心理状态。</li>'+
      '<li>不上传原文：没有服务器、没有账号，简历与记录只写在这台设备的浏览器存储里。</li>'+
      '</ul></div>'+

    '<div class="frbox"><h4>④ 它在什么情况下不该用</h4>'+
      '<p>要一份能拿去仲裁或诉讼的正式法律结论 → 去找执业律师，本库给不了。</p>'+
      '<p>要准确的薪资行情 → 去看招聘平台的真实挂单，本库不提供薪资数据。</p>'+
      '<p>要判断自己是不是有心理问题 → 去找专业人士，本库不做这件事。</p>'+
      '<p>要一份能对外汇报的统计结论 → 本库的画像与匹配都是规则推演，不能当调研数据。</p>'+
    '</div>'+

    '<div class="frbox"><h4>⑤ 数据存在哪</h4>'+
      '<p>全部写在这台设备的浏览器存储（localStorage）里，键名 <b>offersha.*</b>。'+
        '换设备、清浏览器数据都会丢 —— 想留就先去「设置 → 存档备份」导出一份明文文件。</p>'+
      '<p>导出的是明文 JSON：里面有什么，你自己打开看一眼就知道，不必信我说的。</p>'+
    '</div>'+

    '<div class="frbox"><h4>结论旁边的色块是什么意思</h4><div class="frlegend">'+
      '<div>'+T("src","有出处")+' 外部来源可查，能追到具体渠道。</div>'+
      '<div>'+T("law","法条依据")+' 引现行条文，条号写在正文里。</div>'+
      '<div>'+T("rule","规则推演")+' 规则写在页面上，你可以逐条反驳。</div>'+
      '<div>'+T("judge","本库判断")+' 整理归纳，没有外部统计支撑 —— 信几分由你定。</div>'+
      '<div>'+T("user","你的输入")+' 不是本库推断的，是你自己填的。</div>'+
    '</div></div>';
  }
  function renderMethod(){
    var host=document.getElementById("methodOut");
    if(host) host.innerHTML=methodHTML();
  }

  /* ---------------- 首屏：先给结果，再要输入 ---------------- */
  function isBlank(){
    return !(window.S && S.resume && S.resume.raw);
  }
  function firstCard(){
    if(!isBlank()) return "";
    return ''+
    '<div class="frfirst" id="frFirst">'+
      '<h3>先看结果，再决定要不要填自己的</h3>'+
      '<p>不用先交简历。点下面第一个按钮，会载入一份<b>样例简历</b>并直接跑完画像与匹配 —— '+
        '先看清这东西能给出什么，再决定要不要换成你自己的。</p>'+
      '<div class="row">'+
        '<button type="button" class="pri" id="frSample">先看一份样例画像</button>'+
        '<button type="button" id="frMine">直接填我自己的</button>'+
        '<button type="button" id="frHow">它凭什么这么判断？</button>'+
      '</div>'+
    '</div>';
  }
  function mountFirst(){
    var pane=document.getElementById("v-job");
    if(!pane || !isBlank()) return;
    if(document.getElementById("frFirst")) return;
    var vh=pane.querySelector(".vhead");
    if(!vh) return;
    vh.insertAdjacentHTML("afterend", firstCard());
    bindFirst();
  }
  function bindFirst(){
    var a=document.getElementById("frSample");
    if(a) a.onclick=loadSample;
    var b=document.getElementById("frMine");
    if(b) b.onclick=function(){
      var t=document.getElementById("resumeRaw");
      if(t){ try{ t.scrollIntoView({block:"center"}); t.focus(); }catch(e){} }
      if(typeof toast==="function") toast("把简历整段贴进上面的框，点「解析简历 · 自动抓画像」");
    };
    var c=document.getElementById("frHow");
    if(c) c.onclick=openMethod;
  }
  function loadSample(){
    var t=document.getElementById("resumeRaw");
    if(!t){ if(typeof toast==="function") toast("先进入「职场画像」页"); return; }
    t.value=SAMPLE;
    try{ if(typeof doParse==="function") doParse(); }catch(e){
      if(typeof toast==="function") toast("解析这一步报错了："+e.message);
      return;
    }
    var eb=document.getElementById("frFirst"); if(eb) eb.remove();
    /* ★ 概览卡只在切换视图时重算 —— 这里必须手动重挂一次，
       否则解析完了、指标还停在「没档案」那一版（实测就是这样）。 */
    try{ if(typeof mountOverview==="function") mountOverview("job"); }catch(e){}
    if(typeof toast==="function") toast("这是样例。把内容换成你自己的，画像会跟着变");
    /* 样例跑完直接把人带到第二步：先看结果，再谈输入 */
    try{ if(typeof go==="function") setTimeout(function(){ go(1); },420); }catch(e){}
  }

  /* ---------------- 打开「方法与来源」 ---------------- */
  function openMethod(){
    try{ if(typeof closeModal==="function") closeModal(); }catch(e){}
    if(typeof view==="function") view("method");
  }

  /* ---------------- 设置里挂：方法与来源 + 精简模式 ---------------- */
  function patchSet(){
    var body=document.getElementById("mBody");
    if(!body) return;
    /* ★ 不能「卡片已存在就直接 return」：那样点开关后重建会被跳过，
       按钮选中态与页面表现就会不同步（这就是实测「切换无效」的根因）。 */
    var stale=body.querySelector("#frSetCard");
    if(stale && stale.getAttribute("data-slim")===String(document.documentElement.dataset.slim)) return;
    if(stale) stale.parentNode.removeChild(stale);
    var slim=(document.documentElement.dataset.slim!=="0");
    var card=''+
    '<div class="card" id="frSetCard" data-slim="'+(slim?"1":"0")+'"><h3>方法与来源</h3>'+
      '<p class="note">这一版新增：每一页的结论旁都会标出<b>它的性质</b>'+
      '（有出处 / 法条依据 / 规则推演 / 本库判断 / 你的输入）。看不懂某个结论凭什么，去这一页。</p>'+
      '<div class="acts"><button id="frOpenMethod">看「方法与来源」</button></div></div>'+
    '<div class="card"><h3>精简模式</h3>'+
      '<p class="note">关掉装饰类内容（小鱼课堂、鱼币与商店、皮肤与装扮、课表排课、待办）。'+
      '它们不影响任何一个主功能；开着是热闹，关掉是安静。</p>'+
      '<div class="setgrp"><div class="lb">当前</div><div class="rowb">'+
        '<button data-frslim="1" class="'+(slim?"on":"")+'">精简（默认）</button>'+
        '<button data-frslim="0" class="'+(!slim?"on":"")+'">显示装饰</button></div></div>'+
      '<p class="frsetmore">这个开关只改显示，不删数据 —— 你原来生成的东西还在，随时可以打开看。</p>'+
    '</div>';
    body.insertAdjacentHTML("afterbegin", card);
    var om=document.getElementById("frOpenMethod");
    if(om) om.onclick=openMethod;
    Array.prototype.forEach.call(body.querySelectorAll("[data-frslim]"), function(b){
      b.onclick=function(){
        var on=b.getAttribute("data-frslim");
        document.documentElement.dataset.slim=on;
        try{ if(window.S){ S.frSlim=(on==="1"); if(typeof save==="function") save(); } }catch(e){}
        patchSet();
      };
    });
  }
  function wrapSet(){
    if(typeof window.openSet!=="function" || window.openSet._frWrapped) return;
    var orig=window.openSet;
    var w=function(){ var r=orig.apply(this,arguments); try{ patchSet(); }catch(e){} return r; };
    w._frWrapped=true;
    window.openSet=w;
  }

  /* ---------------- 出厂的统一挂载点 ---------------- */
  /* ★ 「方法与来源」不进通道导航，容器也就在运行时建：
     挂到 #v-me 的同一个父节点里，view() 里那段 .vpane 循环自然会认它。 */
  function ensurePane(){
    if(document.getElementById("v-method")) return;
    var me=document.getElementById("v-me");
    if(!me || !me.parentNode) return;
    var d=document.createElement("div");
    d.className="vpane"; d.id="v-method";
    d.innerHTML='<div id="methodOut"></div>';
    me.parentNode.appendChild(d);
  }
  function ensure(){
    injectCSS();
    ensurePane();
    tagHeadlines();
    mountFirst();
    if(document.getElementById("methodOut")) renderMethod();
    wrapSet();
  }

  function boot(){
    injectCSS();
    /* 精简模式：默认开。存档里存过就按存的来。 */
    var slim = (window.S && typeof S.frSlim==="boolean") ? S.frSlim : true;
    document.documentElement.dataset.slim = slim ? "1" : "0";

    var tries=0;
    (function loop(){
      ensure();
      if(tries++ > 25) return;
      setTimeout(loop, 200);
    })();

    /* 切页之后宿主可能被重渲染：包一层 view，每次切页都补齐 */
    if(typeof window.view==="function" && !window.view._frWrapped){
      var orig=window.view;
      var w=function(v){ var r=orig.apply(this,arguments); try{ ensure(); }catch(e){} return r; };
      w._frWrapped=true;
      window.view=w;
    }
  }

  if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded", boot); }
  else { boot(); }

  window.FR = {
    sample: SAMPLE,
    srcTag: srcTag,
    methodHTML: methodHTML,
    renderMethod: renderMethod,
    openMethod: openMethod,
    loadSample: loadSample,
    isBlank: isBlank
  };
})();
