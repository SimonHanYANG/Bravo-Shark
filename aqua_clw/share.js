/* =====================================================================
   分享奖励（2026-09-25）
   ---------------------------------------------------------------------
   为什么做：这份文件是本地单文件，分享动作（复制配文 / 生成分享卡）以前
   **只产生一句话，不产生任何反馈** —— 分享完页面什么都没变，人就不会再分享。

   这一版给分享装上回执：分享一次 → 加鱼币、得限定装扮，攒够次数解锁追加话术包。

   ★ 三条必须写清楚的边界（改动时不要松）
     ① 奖励靠**本地计数**，没有服务器核对 ： 界面上明写这一句，不许含糊。
        它不是防作弊的积分系统，是「你做了这个动作，这里给你个回执」。
     ② 解锁的是**追加内容**（进阶话术包），原有功能一个都不锁。
        （2026-09-24 已经明确去过一次会员锁，不能又绕回来锁住主功能。）
     ③ 鱼币每天最多领 3 次，同一个来源 20 秒内只算一次 ： 避免连点刷币。
   ===================================================================== */

var SHARE_UNLOCK_N = 5;   /* 分享满几次解锁进阶话术包（duel.js 里引用） */

/* 分享限定装扮：不进商店价格体系，只能靠分享拿到（share 字段 = 需要几次） */
SKINS.push({ id:"sharecoral", name:"分享限定 · 珊瑚金", desc:"分享 1 次拿到的颜色", price:0, share:1,
  body:"#E2734A", body2:"#C2552C", belly:"#F7B692", fin:"#9E3F22", cloth:"#7E2E15", trim:"#FFF6EF", bg:"#FCEDE4" });
OUTFITS.push({ id:"sharepin", name:"分享限定 · 别针西装", desc:"分享 2 次拿到的衣服", price:0, share:2 });
SHAPES.push({ id:"sharefin", name:"分享限定 · 旗鱼鳍",  desc:"分享 3 次拿到的品种", price:0, share:3,
  lx:0.92, hy:1.06, dor:1.6, sn:1.3, tl:1.25, bl:0.94, eye:1.02, teeth:0.9, blush:0, brow:1 });

function shareState(){
  if(!S.share || typeof S.share!=="object") S.share={ n:0, day:"", today:0, got:[], last:{k:"",at:0} };
  if(!Array.isArray(S.share.got)) S.share.got=[];
  if(!S.share.last || typeof S.share.last!=="object") S.share.last={k:"",at:0};
  if(typeof S.share.n!=="number") S.share.n=0;
  if(typeof S.share.today!=="number") S.share.today=0;
  return S.share;
}
function shareCount(){ return shareState().n; }
function shareDayKey(){ var d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

var SHARE_TIERS = [
  { n:1, coin:30,  kind:"skin",   id:"sharecoral", why:"皮肤「分享限定 · 珊瑚金」" },
  { n:2, coin:50,  kind:"outfit", id:"sharepin",   why:"衣服「分享限定 · 别针西装」" },
  { n:3, coin:80,  kind:"shape",  id:"sharefin",   why:"品种「分享限定 · 旗鱼鳍」" },
  { n:SHARE_UNLOCK_N, coin:120, unlock:true,        why:"进阶话术包（面试加压 6 句 + 谈话硬话术 6 张）" }
];
function grantOwn(kind, id){
  var arr = kind==="skin" ? S.own : kind==="outfit" ? S.ownOutfit : S.ownShape;
  if(!Array.isArray(arr)) return false;
  if(arr.indexOf(id)>=0) return false;
  arr.push(id); return true;
}
/* 分享一次：记数 → 发奖 → 回执。任何分享动作最后都调它。 */
function shareDone(kind, silent){
  var st=shareState(), now=Date.now();
  if(st.last.k===kind && now-st.last.at<20000){       /* 同一个来源 20 秒内只算一次 */
    if(!silent) toast("同一次分享只算一次");
    return st.n;
  }
  st.last={k:kind, at:now};
  var day=shareDayKey();
  if(st.day!==day){ st.day=day; st.today=0; }
  st.n++; st.today++;
  var got=[];
  SHARE_TIERS.forEach(function(t){
    if(st.n<t.n || st.got.indexOf(t.n)>=0) return;
    st.got.push(t.n);
    var ok=false;
    if(t.coin && st.today<=3){ addCoin(t.coin, "分享奖励 · 第 "+t.n+" 次"); ok=true; }
    if(t.kind) grantOwn(t.kind, t.id);
    got.push(t.why + (t.coin&&ok ? " + "+t.coin+" 鱼币" : ""));
  });
  save();
  trackPush("share", { k:kind, n:st.n });
  if(!silent){
    if(got.length) toast("分享奖励到账："+got.join("，"));
    else if(st.today>3) toast("已记 1 次分享（累计 "+st.n+" 次）· 今天鱼币已领满 3 次");
    else toast("已记 1 次分享（累计 "+st.n+" 次）");
  }
  if(typeof renderShareProg==="function") renderShareProg();
  if(typeof renderGrowthCard==="function") renderGrowthCard();   /* 分享会让鱼长大，当场刷新 */
  if(typeof renderShop==="function" && document.getElementById("shopOut")) renderShop();
  refreshAdvPacks();   /* 刚解锁的话术包要当场出现，不能等用户下次进这一页 */
  return st.n;
}
/* 就地刷新所有进阶话术包：分享完立刻看到「已解锁」，否则奖励就变成了一句空话。
   注意：整页重绘太粗（会打断正在进行的模拟），只换这一个节点。 */
function refreshAdvPacks(){
  if(typeof advPackHTML!=="function") return;
  Array.prototype.forEach.call(document.querySelectorAll("[data-adv]"),function(el){
    var kind=el.getAttribute("data-adv"), parent=el.parentNode;
    if(!kind||!parent) return;
    var tmp=document.createElement("div");
    tmp.innerHTML=advPackHTML(kind);
    if(!tmp.firstElementChild) return;
    parent.replaceChild(tmp.firstElementChild, el);
    if(typeof bindAdvPack==="function") bindAdvPack(parent, kind);
  });
}
/* 分享的统一出口：先复制可发出去的文案，再记一次分享。
   ★ 复制失败（浏览器不给剪贴板）也要记账 ： 用户确实做了这个动作，只是我们没拿到文本。 */
function shareNow(kind){
  var c=(typeof CONV_SPOTS!=="undefined") ? CONV_SPOTS[kind] : null;
  var txt=c ? c.cap() : "";
  if(txt){ cp(txt); }
  if(typeof bubbleBurst==="function") bubbleBurst();
  shareDone(kind);
  if(txt) toast("已复制，粘到聊天里发出去 · 已记 1 次分享");
}

/* ---------------- 我的鱼塘：分享进度卡 ---------------- */
function shareProgHTML(){
  var st=shareState();
  var next=null;
  for(var i=0;i<SHARE_TIERS.length;i++){ if(st.n<SHARE_TIERS[i].n){ next=SHARE_TIERS[i]; break; } }
  var h='<div class="card shareprog"><h3>分享进度 · 拿装扮</h3>'+
    '<p class="note" style="margin-top:0">分享一次记一次：限定颜色 → 衣服 → 品种，攒到 '+
    SHARE_UNLOCK_N+' 次开进阶话术包。<b>所有分享入口都算</b>，'+
    '复制配文、生成分享卡、把这一场发给朋友，都算。</p>'+
    '<div class="sp-row"><b>'+st.n+'</b> 次已记录'+(st.day===shareDayKey()?(' · 今天 '+st.today+' 次'):'')+'</div>'+
    '<div class="sp-dots">'+SHARE_TIERS.map(function(t){
      var on=st.n>=t.n;
      return '<span class="spdot'+(on?" on":"")+'" title="'+esc(t.why)+'"><i>'+t.n+'</i></span>';
    }).join("")+'</div>'+
    '<div class="sp-list">'+SHARE_TIERS.map(function(t){
      var on=st.n>=t.n;
      return '<div class="spi'+(on?" on":"")+'"><span class="spn">分享 '+t.n+' 次</span>'+
        '<span class="spw">'+esc(t.why)+'</span><span class="sps">'+(on?"已拿到":"还差 "+(t.n-st.n)+" 次")+'</span></div>';
    }).join("")+'</div>'+
    '<div class="sp-note">奖励按<b>本机计数</b>发放，没有服务器核对 ： 它不是积分系统，是「你做了这个动作，这里给你个回执」。'+
    '清空存档（设置 → 清空）会一起清零。</div>'+
    '<div class="acts"><button class="pri" id="spGo">'+(next?("下一次奖励：还差 "+(next.n-st.n)+" 次"):"全部拿到，再分享也不亏")+'</button></div>'+
  '</div>';
  return h;
}
function renderShareProg(){
  var host=document.getElementById("shareProg");
  if(!host) return;
  host.innerHTML=shareProgHTML();
  var b=document.getElementById("spGo");
  if(b) b.onclick=function(){
    /* 优先使用当前页的分享对象；没有就退回到画像卡 */
    var t=(typeof shareFabTarget==="function") ? shareFabTarget() : null;
    if(t){ t.f(); return; }
    if(typeof openShareCard==="function" && S.prof && S.prof.labels && S.prof.labels.length){ openShareCard("profile"); return; }
    toast("这一页还没有可分享的内容 · 先去「职场画像」交一份简历，画像卡就会长出来");
  };
}
