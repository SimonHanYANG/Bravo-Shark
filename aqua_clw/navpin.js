/* =====================================================================
   导航置顶（2026-09-25）
   ---------------------------------------------------------------------
   要解决的问题：九个栏目在侧栏里平铺。第一次打开的人不知道先点哪个，
   而「不知道该点哪儿」的默认动作是关掉。置顶只做一件事：把
   「今天遇到事、今天就能用」的两项放到最上面，让第一眼有两个明确落点。

   默认两项：面试模拟（练一次，今天投的岗就能用）、劳议鲨手（出事当天最急）。
   剩下七个栏目都是要攒时间才有产出的，放在下面按组看更合理。

   ★ 三条硬约束（以后改动不要松）
     ① 置顶只改顺序，不改功能：被钉住的项就是**同一个按钮节点**被搬到上面，
        没有第二份副本 ： 徽标（navBadge）、鲨鱼图标、跳转逻辑都只有一份。
     ② 存档键 S.pins（视图名数组）。用户把它清空就是清空，不再自动补回默认值，
        否则「取消全部置顶」会自己长回来。
     ③ 「原位」一律以 body.html 里的三组为准。每次重绘先把所有项按原位顺序放回，
        再按 S.pins 的顺序搬上来 ： 无论怎么点、重绘多少次都不会漂移。
   ===================================================================== */
var PIN_DEF = ["interview", "dispute"];

/* 两个通道 = 两种动线。数组顺序就是侧栏从上到下的顺序 ——
   ★ 默认置顶取动线的头两项：这样「置顶组 + 下面的列表」拼起来正好等于动线顺序。
     置顶默认若取别的项，第一眼看到的先后顺序就和动线打架（用户会以为顺序乱了）。
   用户不需要想「先点哪个」，第一项就是第一件该做的事。
   ★ 改顺序只改这里；body.html 里的源码顺序不参与排序（那边只是节点仓库）。 */
var TRACKS = {
  new: { n:"我在找工作", pins:["job","interview"], title:"先做这两件",
         why:"先交简历 → 练面试 → 看清对手 → 补课 → 出事能救",
         items:["job","interview","rival","school","dispute","pay"] },
  pro: { n:"我想看清自己", pins:["status","grow"], title:"先看这两件",
         why:"先看自己 → 补能力 → 每天说一句 → 随时读懂话",
         items:["status","grow","chatter","tool","pay"] }
};
/* ★ 状态键叫 S.lane 不叫 S.track：S.track 已经是「行为日志数组」（track.js 在用），
   同名会互相覆盖 ： 一次就能让日志和通道同时坏掉。 */
function trackId(){ return (S.lane==="pro") ? "pro" : "new"; }
function curTrack(){ return TRACKS[trackId()]; }
function trackOf(v){
  for (var k in TRACKS) if (TRACKS[k].items.indexOf(v)>=0) return k;
  return "";
}
/* ★ 两个通道都有的栏目（现在只有「付费服务」）。
   点它不该把自己所在的通道换掉 —— view() 里那段「跨通道点击自动切通道」
   会给它做例外，否则从进阶通道点付费服务会被硬拽回求职通道。
   判据写成「出现在 1 条以上动线里」，以后再加双向栏目不用改代码。 */
function trackBoth(v){
  var n=0;
  for (var k in TRACKS) if (TRACKS[k].items.indexOf(v)>=0) n++;
  return n>1;
}
function trackHas(v){ return curTrack().items.indexOf(v)>=0; }
function syncTrackUI(){
  var t=curTrack();
  var nm=document.getElementById("navTrackName"); if(nm) nm.textContent=t.n;
  var ph=document.getElementById("pinGrpH"); if(ph) ph.textContent=t.title;
  /* ★ 侧栏那颗「⌂ 主界面」：回开屏（开屏就是选通道的地方，所以切通道也在这里）。
     之前这颗按钮从来没绑过事件 —— 点了没反应（用户 2026-09-26 报的）。 */
  var b=document.getElementById("btnSwitchTrack");
  if(b) b.onclick=function(){ if(typeof backToSplash==="function") backToSplash(); };
}
/* 切通道：旧通道的置顶在新通道里没有意义，换成本通道的默认两项。
   用户自己改过、且新通道里也有 → 保留（不硬覆盖用户的选择）。 */
function setTrack(k, jump){
  if(!TRACKS[k]) k="new";
  S.lane=k;
  var t=TRACKS[k], cur=Array.isArray(S.pins)?S.pins:[];
  var keep=cur.filter(function(v){ return t.items.indexOf(v)>=0; });
  S.pins = keep.length ? keep : t.pins.slice();
  save();
  renderNavPins(); syncTrackUI();
  /* ★ 切通道时如果正停在「付费服务」上，这一页的内容要跟着通道换。
     不重画的话会留着上一个通道的目录（用户看到「我在找工作」却列着在职能力）。
     只重画这一个面板，不动别的。 */
  if(S.view==="pay" && typeof renderPay==="function") renderPay();
  if(jump && t.items[0]) view(t.items[0]);
  trackPush("track", { k:k });
}
var PIN_SVG = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">'
  + '<path d="M8 1.7 3 6.7l1.15 1.15L7.2 4.75V11h1.6V4.75l3.05 3.1L13 6.7z" fill="currentColor"/>'
  + '<rect x="3" y="12.5" width="10" height="1.8" rx=".9" fill="currentColor"/></svg>';

var NAVW = [];      /* 按 body.html 原始顺序存下来的包装节点，只在首绘时确定一次 */

function navWrapList(){
  if (NAVW.length) return NAVW;
  var nav = document.getElementById("nav");
  if (!nav) return NAVW;
  var ws = nav.querySelectorAll(".nvi");
  for (var i = 0; i < ws.length; i++){
    /* 只存节点本身：排序不再依赖「原位」（现在由 TRACKS 的动线顺序决定），
       所以不记 __home/__next ： 留着只会误导下一个人以为还要插回原位。 */
    NAVW.push(ws[i]);
  }
  return NAVW;
}
function navByV(v){
  var it = navWrapList();
  for (var i = 0; i < it.length; i++) if (it[i].getAttribute("data-wv") === v) return it[i];
  return null;
}
/* 读存档 + 洗数据：去重、丢掉已经不存在的栏目名（比如以后删掉某个视图） */
function pinList(){
  if (!Array.isArray(S.pins)) S.pins = PIN_DEF.slice();
  var out = [], seen = {};
  for (var i = 0; i < S.pins.length; i++){
    var v = S.pins[i];
    if (typeof v !== "string" || seen[v] || !navByV(v)) continue;
    if (!trackHas(v)) continue;                  /* 另一个通道的置顶不算数 */
    seen[v] = 1; out.push(v);
  }
  return out;
}
function navLabel(v){
  var bs = document.querySelectorAll("#nav button[data-v]");
  for (var i = 0; i < bs.length; i++){
    if (bs[i].getAttribute("data-v") !== v) continue;
    var nb = bs[i].querySelector(".nb");
    var txt = bs[i].textContent || "";
    if (nb && nb.textContent) txt = txt.replace(nb.textContent, "");   /* 徽标数字不算名字 */
    return (txt || "").replace(/\s+/g, " ").trim() || v;
  }
  return v;
}
function fillPinIcons(){
  var ns = document.querySelectorAll("#nav .pinic");
  for (var i = 0; i < ns.length; i++){
    if (ns[i].getAttribute("data-filled") === "1") continue;
    ns[i].innerHTML = PIN_SVG;
    ns[i].setAttribute("data-filled", "1");
  }
}
function togglePin(v){
  var ps = pinList();
  var k = ps.indexOf(v);
  if (k >= 0) ps.splice(k, 1); else ps.push(v);
  S.pins = ps;
  save();
  renderNavPins();
  trackPush("nav_pin", { v: v, on: (k < 0) });
  toast(k >= 0 ? "已取消置顶" : "已置顶，排在最上面");
}
function renderNavPins(){
  var nav = document.getElementById("nav");
  var grp = document.getElementById("navGrpPin");
  var list = document.getElementById("navPinList");
  if (!nav || !grp || !list) return;
  var it = navWrapList();
  if (!it.length) return;

  /* ① 按「通道动线」重排 + 隐藏另一个通道。
        ★ 不能按源码顺序排：源码顺序只是节点仓库的顺序，动线顺序只认 TRACKS。
          每次重绘都先按动线重排一遍，所以反复点、来回切通道都不会漂。 */
  var navListEl = document.getElementById("navList");
  var order = curTrack().items;
  if (navListEl){
    /* ★ 先把九个节点全部收回列表：否则上一个通道被钉住的项会赖在置顶组里
         变成看不见的幽灵（hidden 了但还占着位置、还会被 pinOrder 数进去）。 */
    for (var i = 0; i < it.length; i++) navListEl.appendChild(it[i]);
    for (var j = 0; j < order.length; j++){
      var ow = navByV(order[j]);
      if (ow) navListEl.appendChild(ow);  /* 依次追加 = 依次排在后面，最终就是动线顺序 */
    }
  }
  for (var k2 = 0; k2 < it.length; k2++){
    it[k2].hidden = (order.indexOf(it[k2].getAttribute("data-wv")) < 0);
  }

  /* ② 按 S.pins 的顺序把钉住的搬到置顶组 */
  var ps = pinList();
  for (var j = 0; j < ps.length; j++){
    var h = navByV(ps[j]);
    if (h) list.appendChild(h);
  }
  grp.hidden = (ps.length === 0);   /* 一个都没钉 → 整组收起，不留空壳标题 */

  /* ③ 被搬空的组连标题一起收起（否则剩下一个孤零零的组头） */
  var gs = nav.querySelectorAll(".navgrp");
  for (var g = 0; g < gs.length; g++){
    if (gs[g] === grp) continue;
    gs[g].hidden = (gs[g].querySelectorAll(".nvi").length === 0);
  }

  /* ④ 开关自身状态 + 中文提示（title 与 aria-label 同时改，读屏才读得对） */
  for (var k = 0; k < it.length; k++){
    var ww = it[k], v = ww.getAttribute("data-wv");
    var on = ps.indexOf(v) >= 0;
    ww.classList.toggle("pin-on", on);
    var t = ww.querySelector(".nvpin");
    if (!t) continue;
    t.setAttribute("aria-pressed", on ? "true" : "false");
    var lab = (on ? "取消置顶「" : "置顶「") + navLabel(v) + "」";
    t.setAttribute("title", lab);
    t.setAttribute("aria-label", lab);
    t.onclick = function(e){
      e.preventDefault(); e.stopPropagation();
      togglePin(this.getAttribute("data-pin"));
    };
  }
  fillPinIcons();
}
