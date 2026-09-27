/* =====================================================================
   鲨鱼互动（2026-09-25）
   ---------------------------------------------------------------------
   「对面是谁」这件事，原来只有一行小字（直属 Leader / HR 面 …）。
   这一版把它变成两条鲨鱼面对面：左边是对面那位（名字与身份挂在鲨鱼下面），
   右边是你的主形象。点谁谁开口 ： 点对面看他第一句会问什么、他真正在看的点；
   点你自己看你先开口该说什么，能直接复制。

   ★ 设计约束（改动时不要松）
     ① 鲨鱼一律复用 avatarSVG，不新画一种鱼 ： 和你的形象、商店预览同一套块面语言。
     ② 名字 / 身份是固定表（DUEL_IV / DUEL_LAW），**不随机**：
        同一个人每次打开都得是同一个人，否则「谁面我」这件事就白说了。
     ③ 对面说的话取自已有数据（IV_TYPES 的 open/watch/trap、DIS 的 talk 卡），
        不另编一套内容 ： 学名这件事只该有一个来源。
     ④ 劳议鲨手的三条硬边界照旧：不给法律意见、不预测结果、不算金额。
        这里只出现「对方会怎么说 / 你可以怎么说」，不出现任何结论。
   ===================================================================== */

/* 六类面试官：名字 + 身份 + 配色（与 IV_TYPES 的 id 对齐） */
var DUEL_IV = {
  lead:    { name:"周振",  role:"带团队 6 年的业务 Leader",      skin:"ocean", shape:"mega",  outfit:"plaid",   code:"TNJA" },
  cross:   { name:"李蔓",  role:"隔壁组的同级 · 交叉面",          skin:"mint",  shape:"meng",  outfit:"sweater", code:"FSJG" },
  boss:    { name:"郝总",  role:"分管业务的副总裁",               skin:"gold",  shape:"bing",  outfit:"vest",    code:"TNJG" },
  hr:      { name:"陈静",  role:"HRBP · 管薪酬与合规",            skin:"rose",  shape:"meng",  outfit:"suit",    code:"FSJA" },
  founder: { name:"老陆",  role:"创始人 · 亲自面到最后",          skin:"grape", shape:"bing",  outfit:"hoodie",  code:"TSJG" },
  task:    { name:"出题人", role:"只给一个真实任务 · 不说话",      skin:"ghost", shape:"tou",   outfit:"sweater", code:"FNJA" }
};

/* 劳议鲨手：对面三种人（拍板的人不一样，说法就不一样） */
var DUEL_LAW = {
  hr:   { name:"小满",   role:"HR · 谈离职与结算",     skin:"rose",  shape:"meng", outfit:"suit",    code:"FSJG" },
  lead: { name:"老薛",   role:"你的直属主管",           skin:"ocean", shape:"guo",  outfit:"plaid",   code:"TNJA" },
  boss: { name:"陆总",   role:"老板 · 只谈结果",        skin:"gold",  shape:"bing", outfit:"vest",    code:"TNJG" }
};
var LAW_ROLE_N = { hr:"HR", lead:"直属主管", boss:"老板 / 法人" };

/* 群面：五个角色 + 你。配色按角色固定，翻来覆去都是这五条鱼。 */
var DUEL_GRP = {
  frame:   { skin:"coral", shape:"bing",  outfit:"hoodie" },
  time:    { skin:"mint",  shape:"meng",  outfit:"sweater" },
  against: { skin:"ocean", shape:"guo",   outfit:"plaid" },
  quiet:   { skin:"rose",  shape:"tou",   outfit:"suit" },
  detail:  { skin:"grape", shape:"mega",  outfit:"vest" }
};
/* 每个角色「在这一场里干什么、你可以怎么接」——群面的关键不是听懂他说了什么，
   是看清他占了哪个位置，然后决定你不站进去。 */
var DUEL_GRP_NOTE = {
  frame:   { why:'第一个给框架的人。他会天然成为这场的参照系，后面所有人都在他的框架里说话。',
             how:'要么在他的框架上补一条（成本最低），要么另起一个维度做对比（收益最高、风险也最高）。' },
  time:    { why:'盯进度的角色。他存在的意义是让讨论收口，不是挑你的错。',
             how:'别和他抢「什么时候结束」。他要收口时，你补一句「结论我复述一下，确认是不是这个意思」：存在感直接到手。' },
  against: { why:'唱反调的人。他抛的问题往往没有答案，作用是逼别人把理由讲清楚。',
             how:'别反驳他的态度，接他的问题：「如果是这个情况，我建议先做一个小验证」：把反对变成下一步。' },
  quiet:   { why:'话最少的人，但往往手里有一条别人没有的信息。',
             how:'主动点他：「刚才那条口径分两种，具体是哪两种？」把话语权给他，协作分归你。' },
  detail:  { why:'堆细节的人。他会把讨论拽进行程表，容易让主线散掉。',
             how:'等他讲完，替他收一句「所以第一步是 A、第二步是 B，对吗」：你成了那个把细节变结构的人。' }
};

/* 键盘也能点：role=button + tabindex=0 的「假按钮」必须自己处理回车/空格，
   否则看着能聚焦、按下去没反应（无障碍审计会挑这一条）。 */
function duelWire(el){
  if(!el) return;
  el.onkeydown=function(e){
    if(e.key==="Enter" || e.key===" " || e.key==="Spacebar"){ e.preventDefault(); el.click(); }
  };
}

/* 一条鲨鱼 + 名字 + 身份。size 是鲨鱼像素高。 */
function duelFig(o){
  var lk = { skin:o.skin, shape:o.shape, outfit:o.outfit };
  return '<div class="duelfig'+(o.me?" duelme":"")+'"'+(o.act?' data-duel="'+o.act+'" role="button" tabindex="0" aria-label="'+esc(o.aria||o.name)+'"':'')+'>'+
    '<div class="dv">'+avatarSVG(o.code||"TNJA", o.size||92, 0, lk)+'</div>'+
    '<div class="dn">'+esc(o.name)+'</div>'+
    (o.role?'<div class="dr">'+esc(o.role)+'</div>':'')+
  '</div>';
}
/* 你的主形象那一条（名字与身份取自画像，没有画像就叫「未登录的鲨鱼」） */
function duelMeFig(size){
  return duelFig({ me:true, act:"me", code:meCode(), size:size||92,
    skin:(S.skin||"classic"), shape:(S.shape||DEF_SHAPE), outfit:(S.outfit||DEF_OUTFIT),
    name:"你", role:(S.prof&&S.prof.labels&&S.prof.labels.length)? meNick() : "点右边看我该说什么",
    aria:"点一下，看你先开口说什么" });
}

/* ---------------- ① 面试模拟：这一场谁坐对面 ---------------- */
function ivDuelRole(){
  var st=ivState();
  var t=ivTypeOf(st.type)||ivTypeOf(ivRecommend())||IV_TYPES[0];
  return { t:t, d:DUEL_IV[t.id]||DUEL_IV.lead };
}
function ivDuelHTML(){
  if(!document.getElementById("ivTabs")) return "";
  var r=ivDuelRole(), t=r.t, d=r.d;
  var h='<div class="duel" id="ivDuelBox">'+
    '<div class="duel-h"><b>这一场，谁坐对面</b><span class="dueln">点鲨鱼，他们先开口</span></div>'+
    '<div class="duel-row">'+
      duelFig({ act:"peer", code:d.code, size:82, skin:d.skin, shape:d.shape, outfit:d.outfit,
                name:d.name, role:d.role+" · "+t.n, aria:"点一下，看"+d.name+"第一句会问什么" })+
      '<div class="duelvs">对面</div>'+
      duelMeFig(82)+
    '</div>'+
    '<div class="duel-bub" id="ivDuelBub" aria-live="polite">'+
      '面试官是<b>'+esc(d.name)+'（'+esc(t.n)+'）</b>。点左边的鲨鱼，看他第一句会问什么；点右边，看你先开口说什么。'+
    '</div>'+
    '<div class="duel-foot">'+
      '<button class="sm pri" id="ivDuelShare">把这一场发给朋友 · 让他当你的面试官</button>'+
      '<button class="sm" id="ivDuelPrint">看这类的完整应对</button>'+
    '</div>'+
  '</div>';
  return h;
}
function renderIvDuel(){
  var tabs=document.getElementById("ivTabs");
  if(!tabs) return;
  var box=document.getElementById("ivDuelBox");
  if(!box){
    tabs.insertAdjacentHTML("beforebegin", ivDuelHTML());
    box=document.getElementById("ivDuelBox");
    if(!box) return;
  }else{
    box.outerHTML=ivDuelHTML();
    box=document.getElementById("ivDuelBox");
    if(!box) return;
  }
  bindIvDuel(box);
  syncIvDuelVis();
}
/* 开打之后把「这一场谁坐对面」收起来：它属于准备阶段，占着 270px，
   正好把对话区顶到首屏之外。打完（done）再放出来 —— 分享那颗按钮在里面。 */
function syncIvDuelVis(){
  var box=document.getElementById("ivDuelBox");
  if(!box) return;
  box.hidden=!!(S.sess && !S.sess.done);
}
function bindIvDuel(host){
  if(!host) return;
  var r=ivDuelRole(), t=r.t, d=r.d, bub=host.querySelector("#ivDuelBub");
  var peer=host.querySelector('[data-duel="peer"]'), me=host.querySelector('[data-duel="me"]');
  function say(html){ if(bub){ bub.innerHTML=html; } }
  function peerSay(){
    say('<b>'+esc(d.name)+'</b>：「'+esc(t.open||"（这一类不靠开场，直接给活）")+'」'+
        '<div class="bubrow"><i>他真正在看的</i>'+esc(t.watch)+'</div>'+
        '<div class="bubrow no"><i>别踩</i>'+esc(t.trap)+'</div>');
  }
  function meSay(){
    say('<b>你先开口说这句</b><div class="bubsay" id="ivDuelSayv">'+esc(t.tip)+'</div>'+
        '<div class="bubrow"><i>为什么</i>面试模拟里被问到「你负责哪一块」，答不出三件套（动作 → 数字口径 → 谁验证）就会掉分。</div>');
  }
  if(peer) peer.onclick=function(){ trackPush("duel",{k:"iv_peer",role:t.id}); peerSay(); };
  if(me) me.onclick=function(){ trackPush("duel",{k:"iv_me",role:t.id}); meSay(); };
  duelWire(peer); duelWire(me);
  var pr=host.querySelector("#ivDuelPrint");
  if(pr) pr.onclick=function(){
    if(S.ivTab!==0) iv(0);
    var el=document.getElementById("ivSetup");
    if(el&&el.scrollIntoView) el.scrollIntoView({behavior:"smooth",block:"start"});
  };
  var sh=host.querySelector("#ivDuelShare");
  if(sh) sh.onclick=function(){ shareNow("ivmatch"); };
  /* 话术包不再挂在这里：它占 172px，把「对话区」推到了首屏之外。
     现在挂到设置区末尾（renderIvSetup 里）。 */
}

/* ---------------- ② 劳议鲨手：对面那个人 ---------------- */
function renderLawDuel(){
  var h='<div class="duel" id="lawDuelBox">'+
    '<div class="duel-h"><b>对面那个人会怎么说</b><span class="dueln">点鲨鱼，他先开口</span></div>'+
    '<div class="duel-row">'+ lawPeerFig("hr", 96) +'<div class="duelvs">对面</div>'+ duelMeFig(96) +'</div>'+
    '<div class="duel-tabs" id="lawRoleTabs">'+
      ['hr','lead','boss'].map(function(k){
        return '<button data-lawrole="'+k+'"'+(lawRole()===k?' class="on"':'')+'>'+esc(LAW_ROLE_N[k])+'</button>';
      }).join('')+
    '</div>'+
    '<div class="duel-bub" id="lawDuelBub" aria-live="polite">'+
      '选一个对面是谁（'+esc(LAW_ROLE_N[lawRole()])+'），点鲨鱼看他最可能抛哪一句 ： 以及你可以怎么接。'+
    '</div>'+
    '<div class="duel-foot">'+
      '<button class="sm pri" id="lawDuelShare">把这份清单发给能帮的人</button>'+
      '<button class="sm" id="lawDuelCopy">复制我的行动清单</button>'+
    '</div>'+
  '</div>';
  return h;
}
function lawRole(){ return LAW_ROLE_N[disState().role] ? disState().role : "hr"; }
function lawPeerFig(role, size){
  var d=DUEL_LAW[role]||DUEL_LAW.hr;
  return duelFig({ act:"peer", code:d.code, size:size||96, skin:d.skin, shape:d.shape, outfit:d.outfit,
    name:d.name, role:d.role, aria:"点一下，看"+d.name+"最可能说哪一句" });
}
function bindLawDuel(host){
  if(!host) return;
  var box=host.querySelector("#lawDuelBox");
  if(!box) return;
  var bub=box.querySelector("#lawDuelBub");
  function say(html){ if(bub) bub.innerHTML=html; }
  /* 对面这一句：优先取本类争议里对口的谈话卡，按对面是谁换一张，
     没选类型就用通用六句里的第一句。内容全部来自已有数据。 */
  function card(){
    var ty=(typeof disType==="function")?disType():null;
    var role=lawRole(), i=(role==="hr"?0:(role==="lead"?1:2));
    var list=(ty&&ty.talk&&ty.talk.length)?ty.talk:DIS_TALK_COMMON;
    return list[i % list.length];
  }
  var peer=box.querySelector('[data-duel="peer"]');
  if(peer) peer.onclick=function(){
    var c=card(), d=DUEL_LAW[lawRole()]||DUEL_LAW.hr;
    trackPush("duel",{k:"law_peer",role:lawRole()});
    say('<b>'+esc(d.name)+'</b>：「'+esc(c.they)+'」'+
        '<div class="bubrow"><i>潜台词</i>'+esc(c.m)+'</div>'+
        '<div class="bubrow no"><i>别说</i>'+esc(c.dont)+'</div>'+
        '<div class="bubrow yes"><i>可以说</i><span id="lawSayv">'+esc(c.say)+'</span></div>'+
        '<div class="duelacts"><button class="sm" id="lawSayCopy">复制这句话</button></div>');
    var b=box.querySelector("#lawSayCopy");
    if(b) b.onclick=function(){ cp(c.say); toast("这句话已复制"); };
  };
  duelWire(peer);
  var me=box.querySelector('[data-duel="me"]');
  if(me) me.onclick=function(){
    say('<b>你先说这一句</b><div class="bubsay">我想先确认一下：今天这次谈话的结果，公司会以书面或者微信的形式发我一份吗？</div>'+
        '<div class="bubrow"><i>为什么</i>先把「留痕」这一步做掉，后面的说法才不会各说各话。只谈程序与事实，不评价、不表态。</div>'+
        '<div class="bubrow no"><i>记住</i>这个页面不给法律意见、不预测结果、不算金额。</div>');
  };
  duelWire(me);
  Array.prototype.forEach.call(box.querySelectorAll("[data-lawrole]"),function(b){
    b.onclick=function(){
      disState().role=b.dataset.lawrole; save();
      var fig=box.querySelector('[data-duel="peer"]');
      if(fig) fig.outerHTML=lawPeerFig(b.dataset.lawrole,96);
      var np=box.querySelector('[data-duel="peer"]');
      if(np){ np.onclick=peer.onclick; duelWire(np); }   /* 换了人，处理器要重新挂 */
      Array.prototype.forEach.call(box.querySelectorAll("[data-lawrole]"),function(x){
        x.classList.toggle("on", x===b);
      });
      say('已换成 <b>'+esc(LAW_ROLE_N[b.dataset.lawrole])+'</b>。点他，看他最可能抛哪一句。');
      trackPush("law_role",{role:b.dataset.lawrole});
    };
  });
  var sh=box.querySelector("#lawDuelShare");
  if(sh) sh.onclick=function(){ shareNow("dispute"); };
  var cc=box.querySelector("#lawDuelCopy");
  if(cc) cc.onclick=function(){ cp(disText()); toast("清单已复制，粘到备忘录里"); };
}

/* ---------------- ③ 群面：一屋子鲨鱼 ---------------- */
function groupSharkRow(){
  if(typeof GROUP_ROLES==="undefined"||!GROUP_ROLES.length) return "";
  var h='<div class="duel grpsharks">'+
    '<div class="duel-h"><b>这一桌都有谁</b><span class="dueln">点名字，看他刚才那句话什么意思</span></div>'+
    '<div class="grp-row">';
  GROUP_ROLES.forEach(function(r){
    var lk=DUEL_GRP[r.id]||DUEL_GRP.frame;
    h+=duelFig({ act:"npc", code:"TNJA", size:64, skin:lk.skin, shape:lk.shape, outfit:lk.outfit,
      name:r.n, role:"（点一下）", aria:"点一下，看"+r.n+"刚才那句话的意思" });
  });
  h+=duelFig({ me:true, act:"me", code:meCode(), size:64,
      skin:(S.skin||"classic"), shape:(S.shape||DEF_SHAPE), outfit:(S.outfit||DEF_OUTFIT),
      name:"你", role:"这一场的位置由你选", aria:"点一下，看你的位置" });
  h+='</div><div class="duel-bub" id="grpBub" aria-live="polite">'+
     '群面不是答题，是<b>选位置</b>。同一个人在不同轮次说同一句话，效果完全不一样。</div></div>';
  return h;
}
function bindGroupSharks(host){
  var box=host.querySelector(".grpsharks");
  if(!box) return;
  var figs=box.querySelectorAll('[data-duel="npc"]');
  var bub=box.querySelector("#grpBub");
  Array.prototype.forEach.call(figs,function(f,k){
    f.onclick=function(){
      var r=GROUP_ROLES[k], nt=DUEL_GRP_NOTE[(r&&r.id)||""]||null;
      if(!r||!bub) return;
      bub.innerHTML='<b>'+esc(r.n)+'</b>：「'+esc(r.say)+'」'+
        '<div class="bubrow"><i>他在这一场的作用</i>'+esc(nt?nt.why:"推进讨论往前走")+'</div>'+
        '<div class="bubrow yes"><i>你可以怎么接</i>'+esc(nt?nt.how:"接住他的话，往前推一步，而不是重复他。")+'</div>';
      trackPush("grp_shark",{role:r.id});
    };
  });
  duelWire(me);
  var me=box.querySelector('[data-duel="me"]');
  if(me) me.onclick=function(){
    if(!bub) return;
    bub.innerHTML='<b>你在这张桌上</b>选一个动作就是选一个位置：<br>'+
      '抢框架（存在感 +2）· 接话推进（协作 +3）· 补一条别人没有的信息（差异化 +3）· 拉回主线（推进 +3）· 让位做总结（协作 +3）。'+
      '<div class="bubrow"><i>唯一的错</i>整场只说「我同意」。四维里没有一维会给你分。</div>';
  };
  duelWire(me);
  Array.prototype.forEach.call(figs, duelWire);
}

/* ---------------- ④ 进阶话术包：分享解锁（追加内容，不锁原有功能） ---------------- */
var ADV_PACK = {
  ivmatch: {
    n:"面试加压 6 句",
    lead:"面试官加压的时候（分享解锁 · 追加内容，原有功能一个没锁）",
    items:[
      ["这个数是谁统计的？口径是什么？","追问所有权与口径。","答不出三件套（动作 → 数字 → 谁验证）就说明不是自己干的。","这个数是我们组的周报口径，我自己跑的数：分母是当天注册、分子是完成首单，报表在我这儿，会后可以发您。"],
      ["你说的是团队成果吧？","试探你把自己放大了多少。","别硬撑「主要是我」。","对，我负责其中一块：我做的动作是：，团队另外两位做的是：。我可以只讲我那块。"],
      ["如果重做一次你会改什么？","看你有没有真的复盘过。","别说「没什么可改的」。","我会先定口径再动手：这次最大的浪费是前三周做的数据没人用，原因是口径没对齐。"],
      ["你为什么离开上一家？","追三层，看一致性与风险。","别吐槽前公司，也别前后不一致。","组织调整，我这条线并到了另一个部门，岗位内容变了。这个说法我给过 HR，也可以给背调。"],
      ["你的期望薪资是怎么得出来的？","看你有没有依据。","别说「都可以」或者拍一个数。","同岗市场区间是 X—Y，我按现薪 +15% 报 X，理由是这次换岗要多担一块从 0 到 1 的业务。"],
      ["你还有什么想问我的？","看你关不关心这家公司。","别说「没有了」。","我想知道这个岗位前三个月最需要先解决的一件事是什么，以及我进来之后向谁汇报。" ]
    ]
  },
  lawtalk: {
    n:"谈话硬话术 6 张",
    lead:"对方把话说硬的时候（分享解锁 · 追加内容，原有功能一个没锁）",
    items:[
      ["这事我们内部再研究一下，你先等通知","拖时间，时间站在对方那边。","别真的就一直等。","好的。麻烦把今天的结论和下次沟通的时间，用微信发我一份。"],
      ["你要是不满意，走法律途径就行了","赌你不会真的走程序。","别回「那我去告」或者「算了」。","我会先申请劳动仲裁。在那之前，先把该固定的记录固定下来。"],
      ["这个签字今天必须签，签了今天就结清","用「快」换你放弃差额。","别当场签，也别只看总额。","我先看全文。涉及金额和放弃权利的部分，我要核实完再签。"],
      ["公司没跟你签合同，是你不主动","事实相反时的话术试探。","别去争论态度问题。","我们什么时候签、谁提的，沟通记录里都有。我按记录说。"],
      ["你先别跟其他人说","分化处理，避免你们串起来。","别口头答应事后不认。","我只陈述事实，不评价其他人。"],
      ["我们再这样谈下去也没什么意义","准备结束谈话，把压力留给你。","别急着挽回或道歉。","那今天先到这里。麻烦把已经确认的部分整理一条发我，没确认的我们下次再谈。" ]
    ]
  }
};
function advUnlocked(){ return shareCount()>=SHARE_UNLOCK_N; }
function advPackHTML(kind){
  var p=ADV_PACK[kind];
  if(!p) return "";
  var open=advUnlocked();
  var h='<div class="advpack'+(open?" open":"")+'" data-adv="'+kind+'">'+
    '<div class="adv-h"><b>'+esc(p.n)+'</b>'+
    (open?'<span class="advtag on">已解锁</span>':'<span class="advtag">分享 '+SHARE_UNLOCK_N+' 次解锁</span>')+'</div>';
  if(!open){
    h+='<div class="adv-lock">'+esc(p.lead)+
       '<div class="advbar"><i style="width:'+Math.min(100, Math.round(shareCount()/SHARE_UNLOCK_N*100))+'%"></i></div>'+
       '<div class="advp">已分享 '+shareCount()+' / '+SHARE_UNLOCK_N+' 次（本地计数，存在这台设备上）</div>'+
       '<div class="duelacts"><button class="sm pri" data-advshare="'+kind+'">分享一次并解锁</button></div></div>';
    h+='</div>';
    return h;
  }
  h+=ADV_PACK[kind].items.map(function(x){
    return '<div class="advcard"><div class="advq">'+esc(x[0])+'</div>'+
      '<div class="advm">'+esc(x[1])+'</div>'+
      '<div class="advno"><i>别说</i>'+esc(x[2])+'</div>'+
      '<div class="advyes"><i>可以说</i>'+esc(x[3])+'</div>'+
      '<div class="duelacts"><button class="sm" data-advcopy="'+esc(x[3])+'">复制这句</button></div></div>';
  }).join("");
  h+='</div>';
  return h;
}
function bindAdvPack(host, kind){
  var box=host.querySelector('[data-adv="'+kind+'"]');
  if(!box) return;
  var b=box.querySelector("[data-advshare]");
  if(b) b.onclick=function(){ shareNow(kind==="ivmatch"?"ivmatch":"dispute"); };
  Array.prototype.forEach.call(box.querySelectorAll("[data-advcopy]"),function(x){
    x.onclick=function(){ cp(x.getAttribute("data-advcopy")); toast("已复制"); };
  });
}
