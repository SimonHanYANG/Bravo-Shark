/* =====================================================================
   付费服务（2026-09-27 新增）
   ---------------------------------------------------------------------
   要解决的问题：产品里「能自己做的」已经很全，但「需要人帮的」只有
   convert.js 那五个「此刻可以做两件事」的插入点 —— 用户要点到那个位置、
   且刚好有结果，才看得到。这一页把它收成一个常驻栏目。

   ★ 四条纪律（以后改动不要松）
     ① **不预设价格、不预设链接。** 收款方是文件主人，代码不知道也不猜。
        没填的格子显示「待填」，不是空白、也不是占位数字。
     ② **复用既有的服务信息**（convert.js 的 svcState）：联系方式只有一处配置，
        填一次，五个插入点和这一页一起生效。这里不引入第二套「我的联系方式」。
     ③ **产品本体现在本来就免费。** 所以「会员福利」不许写成「解锁功能」，
        必须写成「人工部分 + 后续更新」。写成解锁功能就是假话。
     ④ **劳动争议那一条必须带硬边界**：不给法律意见、不预测结果、不算金额，
        涉及金额或已进入程序的转执业律师。这条写进卡片本身，不写在别处。

   ★ 状态键 S.pay（必须同时在 app.js 的初始 S 里声明，否则刷新就丢）。
   ===================================================================== */

var PAY_CSS_ID = "payCss";

function payState(){
  if(!S.pay || typeof S.pay !== "object") S.pay = { items:{} };
  if(!S.pay.items || typeof S.pay.items !== "object") S.pay.items = {};
  return S.pay;
}
function payCfg(id){
  var st = payState(), o = st.items[id];
  if(!o || typeof o !== "object") o = { price:"", link:"" };
  if(typeof o.price !== "string") o.price = "";
  if(typeof o.link  !== "string") o.link  = "";
  return o;
}
function payPrice(id){ return String(payCfg(id).price || "").trim(); }
function payLink(id){  return String(payCfg(id).link  || "").trim(); }

/* 条目类型：四种，和用户说的一样 —— 会员福利 / 材料包 / 咨询 / 代做 */
var PAY_KIND = {
  member: { n:"会员福利", c:"k-member" },
  pack:   { n:"材料包",   c:"k-pack"   },
  call:   { n:"咨询",     c:"k-call"   },
  make:   { n:"代做",     c:"k-make"   }
};

/* ---------------------------------------------------------------------
   目录：按主题分开。track = new（求职通道）/ pro（进阶通道）/ any（两个通道都显示）。
   ★ get 那一行写的是「拿到手是什么」，不是「点一下会怎样」——
     用户买的是交付物，不是按钮。
   --------------------------------------------------------------------- */
var PAY_CAT = [
  { id:"resume", track:"new", n:"简历与投递", d:"从原文到能被读完的一版",
    items:[
      { id:"rs-pack", kind:"pack", t:"简历自检 20 条 + 改写模板",
        d:"一份检查清单 + 三个可套用的改写句式表。",
        get:"复制成文档，自己对着改一遍" },
      { id:"rs-make", kind:"make", t:"简历逐段改写 · 一轮反馈",
        d:"你发原文，我给改写版，并逐条说明为什么这么改。",
        get:"把简历原文发给我" },
      { id:"rs-member", kind:"member", t:"简历多版本归档",
        d:"按岗位分版本、留改动历史，投过哪一版一眼能找到。",
        get:"产品内「工作状态 · 文档夹」已支持，会员含整理与命名规范" }
    ]},

  { id:"iv", track:"new", n:"面试", d:"练到能当场接住",
    items:[
      { id:"iv-pack", kind:"pack", t:"六类面试官题单 + 高分答法",
        d:"对应产品里那六类面试官，每题给「先说什么、再说什么」。",
        get:"复制成文档" },
      { id:"iv-call", kind:"call", t:"群面陪练 · 1 小时",
        d:"用产品里的群面题开局，我扮其余五个角色，结束后给复盘。",
        get:"约一个时间" },
      { id:"iv-member", kind:"member", t:"面试错题集与复盘长期保留",
        d:"每场模拟的成绩、掉分项、复盘记录归档，清空存档也不丢。",
        get:"会员含归档与逐场点评" }
    ]},

  { id:"dis", track:"new", n:"劳动争议", d:"先把事实理清，再决定说什么",
    items:[
      { id:"dis-pack", kind:"pack", t:"17 类场景证据清单 + 谈话演练稿",
        d:"产品里按场景生成的那份，这里给可打印、可复制的版本。",
        get:"复制成文档" },
      { id:"dis-call", kind:"call", t:"1 对 1 咨询 · 转合作律师",
        d:"★ 本工具不给法律意见、不预测结果、不算金额。已经涉及金额或已经进入程序的，该找的是执业律师。这一步只做转接。",
        get:"说明情况，我判断是否需要转" },
      { id:"dis-member", kind:"member", t:"加急响应与优先排队",
        d:"工作日 24 小时内回第一条；队列排在前面。",
        get:"会员权益" }
    ]},

  { id:"cap", track:"pro", n:"在职能力", d:"知道自己差哪一条",
    items:[
      { id:"cap-pack", kind:"pack", t:"能力雷达解读手册 + 补齐路径表",
        d:"解释雷达里每一项在问什么，以及差一条时先补哪一个。",
        get:"复制成文档" },
      { id:"cap-make", kind:"make", t:"一对一能力盘点 · 90 分钟",
        d:"按你的岗位要求逐项过一遍，出一份「已占 / 待补 / 可放弃」三栏表。",
        get:"约一个时间" },
      { id:"cap-member", kind:"member", t:"能力库细分档",
        d:"在现有能力项之外，按你的行业补一档更细的项。",
        get:"会员权益" }
    ]},

  { id:"talk", track:"pro", n:"话术与沟通", d:"把憋着的那句变成能说出口的",
    items:[
      { id:"tk-pack", kind:"pack", t:"分场景话术包 · 汇报 / 涨薪 / 拒绝 / 离职",
        d:"每个场景给「先说什么、对方会怎么接、你怎么接回去」。",
        get:"复制成文档" },
      { id:"tk-call", kind:"call", t:"谈话前 30 分钟陪练",
        d:"谈之前对一遍，重点练最可能翻车的那两句。",
        get:"约一个时间" },
      { id:"tk-make", kind:"make", t:"一次谈话稿代写",
        d:"你把情况说清，我写一版逐字稿，并附对方可能的三种回应。",
        get:"把情况发我" }
    ]},

  { id:"all", track:"any", n:"通用", d:"两个通道都用得上",
    items:[
      { id:"all-member", kind:"member", t:"会员 · 上面所有人工服务都含在内",
        d:"★ 产品本体现在本来就免费。会员买的是人工部分（改写 / 陪练 / 盘点）与后续更新，不是解锁功能。",
        get:"一次付费覆盖人工部分" },
      { id:"all-call", kind:"call", t:"20 分钟问答 · 不知道从哪开始就用这个",
        d:"你把现状说三句，我告诉你先做哪一件、用产品里的哪一页。",
        get:"约一个时间" },
      { id:"all-custom", kind:"make", t:"其他定制 · 按需报价",
        d:"企业内训、批量简历、团队话术库这类。",
        get:"说明需求，我给方案与报价" }
    ]}
];

function payById(id){
  for(var i=0;i<PAY_CAT.length;i++){
    var th=PAY_CAT[i];
    for(var j=0;j<th.items.length;j++) if(th.items[j].id===id) return th.items[j];
  }
  return null;
}
function payThemes(){
  var t = (trackId()==="pro") ? "pro" : "new";
  return PAY_CAT.filter(function(th){ return th.track===t || th.track==="any"; });
}
function payCount(){ return PAY_CAT.reduce(function(a,th){ return a+th.items.length; },0); }
function payFilledCount(){
  return PAY_CAT.reduce(function(a,th){
    return a + th.items.filter(function(it){
      return payPrice(it.id)||payLink(it.id);
    }).length;
  },0);
}

/* ---------------------------------------------------------------------
   样式：随模块注入，不写进 style.html。
   ★ 两个原因：① 皮肤树（aqua_clw）会对 style.html 做逐字节比对，
     往里加东西会让那条「功能一行未改」的断言失去意义；
     ② 子集化样式表按保留类名过滤，新类名写进去会被切走、界面静默变白。
   颜色一律带兜底（var(--x,#hex)），取不到令牌也不会失效。
   --------------------------------------------------------------------- */
function injectPayCSS(){
  if(document.getElementById(PAY_CSS_ID)) return;
  var css = [
  "#payOut{max-width:900px}",
  ".payintro{border:1px solid var(--line,#E7DFD4);background:var(--bg2,#FFFFFF);border-radius:14px;",
    "padding:16px 18px;margin:4px 0 18px}",
  ".payintro b{color:var(--gold,#1E3A5F)}",
  ".payintro p{font-size:13.5px;color:var(--dim,#58514A);margin:0 0 8px}",
  ".payrule{list-style:none;margin:8px 0 10px;padding:0}",
  ".payrule li{font-size:13px;color:var(--dim2,#5A544C);line-height:1.75;padding-left:16px;position:relative}",
  ".payrule li::before{content:'';position:absolute;left:2px;top:.72em;width:5px;height:5px;",
    "border-radius:50%;background:var(--gold,#1E3A5F);opacity:.55}",
  ".paywho{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;font-size:13.5px;",
    "background:var(--bg3,#F4EEE3);border-radius:10px;padding:9px 12px;margin-top:4px}",
  ".paywho b{color:var(--txt,#2B2620)}",
  ".paywho span{color:var(--dim,#58514A)}",
  ".payown{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;padding-top:12px;",
    "border-top:1px dashed var(--line,#E7DFD4)}",
  ".payown button{font-size:12.5px;padding:6px 13px;border-radius:999px}",
  ".payown .payn{font-size:12px;color:var(--dim2,#8A8175);align-self:center}",
  ".paytheme{margin:0 0 22px}",
  ".paytheme-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;margin:0 0 10px;",
    "padding-left:13px;position:relative}",
  ".paytheme-h::before{content:'';position:absolute;left:0;top:.5em;width:8px;height:2px;",
    "border-radius:2px;background:var(--gold,#1E3A5F)}",
  ".paytheme-h h2{font-size:16px;margin:0;color:var(--txt,#2B2620);letter-spacing:-.2px}",
  ".paytheme-h span{font-size:12.5px;color:var(--dim2,#8A8175)}",
  ".paygrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(258px,1fr));gap:10px}",
  ".paycard{display:flex;flex-direction:column;gap:7px;border:1px solid var(--line,#E7DFD4);",
    "background:var(--bg2,#FFFFFF);border-radius:13px;padding:13px 15px}",
  ".paycard:hover{border-color:var(--line2,#D6C9B4)}",
  ".paytop{display:flex;align-items:center;justify-content:space-between;gap:8px}",
  ".paykind{font-size:11.5px;font-weight:700;letter-spacing:.06em;border-radius:999px;",
    "padding:2px 9px;border:1px solid transparent;white-space:nowrap}",
  ".k-member{background:#EAF1F8;color:#1D5580;border-color:#CFE0EE}",
  ".k-pack{background:#EDF3E6;color:#3F6B1C;border-color:#D6E4C6}",
  ".k-call{background:#F6ECE0;color:#8A5320;border-color:#E9D6BE}",
  ".k-make{background:#F5EAEA;color:#8C3630;border-color:#E8CFCD}",
  ".payprice{font-size:13px;font-weight:700;color:var(--txt,#2B2620);white-space:nowrap}",
  ".payprice.paytodo{font-weight:400;color:var(--dim2,#8A8175);",
    "border:1px dashed var(--line2,#D6C9B4);border-radius:999px;padding:1px 9px;font-size:11.5px}",
  ".paycard h3{font-size:14.5px;margin:0;color:var(--txt,#2B2620);line-height:1.5}",
  ".paycard .payd{font-size:12.5px;line-height:1.7;color:var(--dim,#58514A);margin:0}",
  ".paycard .payget{font-size:12.5px;line-height:1.7;color:var(--dim2,#8A8175);margin:0;",
    "padding-top:7px;border-top:1px dashed var(--line,#E7DFD4)}",
  ".paycard .payget b{color:var(--dim,#58514A)}",
  ".paycard .paygo{margin-top:auto;align-self:flex-start;font-size:12.5px;padding:6px 14px;border-radius:999px}",
  ".paycard[data-todo='1'] .paygo{border-style:dashed}",
  ".payempty{font-size:13.5px;color:var(--dim2,#8A8175);border:1px dashed var(--line2,#D6C9B4);",
    "border-radius:12px;padding:16px 18px}",
  /* 配置弹窗：宿主在 #mBody 里，不在 #v-pay 内 —— 所以不加宿主前缀，
     靠 pay 前缀保证不撞名（.rvfld 那种通用名会被别的模块盖掉）。 */
  ".paysect{margin:0 0 14px;padding:0 0 10px;border-bottom:1px dashed var(--line,#E7DFD4)}",
  ".paysect>b{display:block;font-size:13px;color:var(--gold,#1E3A5F);margin:0 0 7px}",
  ".payrow{display:grid;grid-template-columns:1fr;gap:6px;margin:0 0 11px}",
  ".payrow .payrn{font-size:12.5px;font-weight:700;color:var(--txt,#2B2620);line-height:1.5}",
  ".paycfgfoot{margin-top:4px}",
  "@media(max-width:560px){.paygrid{grid-template-columns:1fr}}"
  ].join("\n");
  var s = document.createElement("style");
  s.id = PAY_CSS_ID;
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
}

/* ---------------------------------------------------------------------
   渲染
   --------------------------------------------------------------------- */
function payCardHTML(it){
  var k = PAY_KIND[it.kind] || PAY_KIND.pack;
  var price = payPrice(it.id), link = payLink(it.id);
  var todo = (!price || !link) ? "1" : "0";
  var h = '<article class="paycard" data-pay="'+esc(it.id)+'" data-todo="'+todo+'">';
  h += '<div class="paytop"><span class="paykind '+k.c+'">'+esc(k.n)+'</span>';
  h += price ? '<span class="payprice">'+esc(price)+'</span>'
             : '<span class="payprice paytodo">价格待填</span>';
  h += '</div>';
  h += '<h3>'+esc(it.t)+'</h3>';
  h += '<p class="payd">'+esc(it.d)+'</p>';
  h += '<p class="payget"><b>拿到手：</b>'+esc(it.get)+'</p>';
  h += '<button type="button" class="paygo" data-paygo="'+esc(it.id)+'">'
     + (link ? "获取方式" : "还没填入口 · 先配置") + '</button>';
  h += '</article>';
  return h;
}
function payThemeHTML(th){
  return '<section class="paytheme" data-paytheme="'+esc(th.id)+'">'
    + '<div class="paytheme-h"><h2>'+esc(th.n)+'</h2><span>'+esc(th.d)+'</span></div>'
    + '<div class="paygrid">'+ th.items.map(payCardHTML).join('') +'</div>'
    + '</section>';
}
function renderPay(){
  var host = document.getElementById("payOut");
  if(!host) return;
  injectPayCSS();
  var s = svcState();
  var themes = payThemes();
  var filled = payFilledCount(), total = payCount();

  var h = '<div class="payintro">';
  h += '<p><b>这一页只放「需要人帮的」。</b>能自己做完的都在左边那几个栏目里，'
     + '而且产品本体是免费的。这里收的是人工部分：改写、陪练、盘点、代写。</p>';
  h += '<ul class="payrule">'
     + '<li>价格与入口由文件主人填写。<b>没填的格子写「待填」，不写占位数字。</b></li>'
     + '<li>点「获取方式」＝复制联系方式或链接，不会自动跳转、不会要你注册。</li>'
     + '<li>涉及法律、医疗、金额这些事，这一页只做流程与转接，不给结论。</li>'
     + '</ul>';
  if(svcConfigured()){
    h += '<div class="paywho"><b>'+esc(s.who||"（未填是谁）")+'</b>'
       + (s.what?'<span>'+esc(s.what)+'</span>':'')
       + (s.how ?'<span>'+esc(s.how)+'</span>' :'')+'</div>';
  }else{
    h += '<div class="paywho" style="display:block"><b>还没填服务信息。</b>'
       + '<span>填一次，上面那块和各页面那五处插入点都用同一份。</span></div>';
  }
  h += '<div class="payown">'
     + '<button type="button" id="payBtnSvc">填服务信息</button>'
     + '<button type="button" id="payBtnCfg" class="pri">配置价格与入口</button>'
     + '<button type="button" id="payBtnExp">导出配置</button>'
     + '<span class="payn">文件主人用 · 已填 '+filled+' / '+total+' 条</span>'
     + '</div></div>';

  if(!themes.length){
    h += '<div class="payempty">这个通道暂时没有上架的条目。</div>';
  }else{
    h += themes.map(payThemeHTML).join('');
  }
  host.innerHTML = h;

  var bs = document.getElementById("payBtnSvc");
  if(bs) bs.onclick = function(){ if(typeof openSvcSet==="function") openSvcSet(); else toast("这一版没有服务信息配置"); };
  var bc = document.getElementById("payBtnCfg");
  if(bc) bc.onclick = openPaySet;
  var be = document.getElementById("payBtnExp");
  if(be) be.onclick = payExport;

  trackPush("pay_view", { track: trackId(), filled: filled });
}

/* 「获取方式」：复制，不跳转。三种降级都给出下一步，不做点了没反应的假按钮。 */
function payOpen(id){
  var it = payById(id);
  if(!it){ toast("这一条已经不在了"); return; }
  var link = payLink(id), s = svcState();
  if(link){
    cp(link);
    trackPush("pay_click", { id:id, via:"link" });
    toast("已复制入口，贴上就能找到我");
    return;
  }
  if(svcConfigured() && String(s.how||"").trim()){
    cp(String(s.how));
    trackPush("pay_click", { id:id, via:"svc" });
    toast("已复制联系方式 · 发我时带上「"+it.t+"」这四个字");
    return;
  }
  trackPush("pay_click", { id:id, via:"none" });
  toast("这条还没填入口：点上面「配置价格与入口」");
}
function bindPay(){
  var host = document.getElementById("payOut");
  if(!host || host.getAttribute("data-bound")==="1") return;
  host.setAttribute("data-bound","1");
  host.addEventListener("click", function(e){
    var t = e.target;
    var b = t && t.closest ? t.closest("[data-paygo]") : null;
    if(!b) return;
    e.preventDefault();
    payOpen(b.getAttribute("data-paygo"));
  }, true);
}

/* ---------------------------------------------------------------------
   配置：只配「价格」和「入口」。联系方式复用 convert.js 的那一份，
   不在这里再做一个「我的联系方式」。
   --------------------------------------------------------------------- */
function openPaySet(){
  var rows = PAY_CAT.map(function(th){
    var h = '<div class="paysect"><b>'+esc(th.n)+'</b>';
    th.items.forEach(function(it){
      h += '<label class="payrow">'
         + '<span class="payrn">'+esc(it.t)+'</span>'
         + '<input type="text" data-pkp="'+esc(it.id)+'" value="'+esc(payPrice(it.id))+'" placeholder="价格，例：99 元 / 份">'
         + '<input type="text" data-pkl="'+esc(it.id)+'" value="'+esc(payLink(it.id))+'" placeholder="入口：微信号 / 闲鱼口令 / 链接">'
         + '</label>';
    });
    return h + '</div>';
  }).join('');
  var h = '<div class="paycfgbox">'
    + '<p class="note" style="margin-top:0"><b>给你自己用。</b>'
    + '空着的格子在前台显示「待填」，不是空白。可以一条一条慢慢填。'
    + '联系方式来自「我的服务信息」，要改那里的字就点下面那颗按钮。</p>'
    + rows
    + '<div class="paycfgfoot"><button type="button" id="payGoSvc">改服务信息</button></div>'
    + '</div>';
  openModal("配置价格与入口", h, [
    { t:"保存", c:"pri", f:function(){
        var st = payState(), n = 0;
        PAY_CAT.forEach(function(th){ th.items.forEach(function(it){
          var pe = document.querySelector('[data-pkp="'+it.id+'"]');
          var le = document.querySelector('[data-pkl="'+it.id+'"]');
          var v = { price: pe ? String(pe.value||"").trim() : "",
                    link : le ? String(le.value||"").trim() : "" };
          st.items[it.id] = v;
          if(v.price || v.link) n++;
        }); });
        save();
        closeModal();
        renderPay();
        toast("已保存 · " + n + " / " + payCount() + " 条有价格或入口");
        trackPush("pay_cfg", { filled:n });
      }},
    { t:"全部清空", f:function(){
        payState().items = {}; save(); closeModal(); renderPay(); toast("已清空价格与入口");
      }},
    { t:"算了", f:closeModal }
  ]);
  var gs = document.getElementById("payGoSvc");
  if(gs) gs.onclick = function(){ closeModal(); if(typeof openSvcSet==="function") openSvcSet(); };
}

/* 导出成一个可以贴回 pay.js 的 PAY_FILL 片段，方便一次配好、发给所有人 */
function payExport(){
  var st = payState();
  var out = { _meta:{ product:"职场鱼塘 · 付费服务", exportAt:new Date().toLocaleString(),
    note:"把 items 里填好的值贴回 pay.js 顶部的 PAY_FILL，其他人打开就是填好的状态" },
    svc: svcState(), items: st.items };
  downloadText("职场鱼塘_付费配置_" + payStamp() + ".json",
    JSON.stringify(out, null, 1), "application/json");
  trackPush("pay_export", { filled: payFilledCount() });
  toast("已导出配置 · " + payFilledCount() + " 条有价格或入口");
}
function payStamp(){
  var d = new Date();
  return d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2);
}

/* 首次绑定：脚本在 body 末尾执行，所以 #payOut 已经在了 */
injectPayCSS();
bindPay();
