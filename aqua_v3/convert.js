/* =====================================================================
   分享 / 付费 的插入点
   ： 原则：只在「他刚拿到一个结果、心里有点波动」的那一刻出现，别在别处打广告。
      五个时刻：画像刚生成 / 复盘刚出分 / 竞品刚出结论 / 劳议鲨手刚出清单 / 黑话刚读懂一句。

   ★ 关于「付费」必须说清楚的三件事：
     ① 这份文件是本地单文件，没有收款能力，我不会做一个假的付费墙骗人点。
     ② 真正的付费点只有一个形态：**文件所有者自己去收钱**。
        所以这里做的是「把联系方式与服务内容的配置位留出来」：
        填了才出现，没填对所有访客完全隐藏（不会出现半成品卡片）。
     ③ 联系方式由文件所有者自己填，我不预设、不代填、不代收。
   ===================================================================== */

function svcState(){
  if(!S.svc || typeof S.svc!=="object")
    S.svc={ on:false, who:"", what:"", price:"", how:"", scope:"" };
  return S.svc;
}
function svcConfigured(){
  var s=svcState();
  return !!(s.on && (s.how||"").trim());
}

/* 五个时刻：每个写清「晒什么」与「为什么要找人」 */
var CONV_SPOTS = {
  prof: {
    n: '画像刚生成',
    share: '把这张画像卡晒出去',
    cap: function(){
      var L=(S.prof&&S.prof.labels)||[];
      if(!L.length) return "";
      var t=L[0].p, q=S.prof.quad;
      return '我是「'+t.t+'」：'+t.aka+'。\n\n'+L.length+' 个主标签：'+
        L.map(function(x){return x.p.t;}).join(' / ')+'。\n'+
        '四维：内核动机 '+q.mot.p+'%→'+q.mot.b+'，认知方式 '+q.cog.p+'%→'+q.cog.b+
        '，行事风格 '+q.sty.p+'%→'+q.sty.b+'，人际取向 '+q.soc.p+'%→'+q.soc.b+'。\n\n'+
        '从简历里自动抓的，附了原句证据（现在这一版把证据收起来了，需要可以自己核对）。\n'+
        '只描述行为倾向，不是心理诊断，也不是永久标签。';
    },
    svc: '画像说的是「你是哪一类人」。要把它变成简历上的具体改法，需要有人看一遍你的原文。'
  },
  report: {
    n: '复盘刚出分',
    share: '把这一场的成绩与短板晒出去',
    cap: function(){
      var s=S.sess||{}, t=s.turns||[];
      if(!t.length) return "";
      var avg=0; DIMS6.forEach(function(k){
        var v=0,n=0; t.forEach(function(x){ if(x.lv[k]!=null){ v+=x.lv[k]; n++; } });
        avg+= n? v/n : 0;
      });
      avg=(avg/6).toFixed(1);
      return '刚用 offer鲨 打了一场 '+t.length+' 轮的模拟面试，六维平均 '+avg+'/4。\n'+
        '掉分最多的是：'+(S.sess.weakest||'（见复盘）')+'。\n\n'+
        '它按六维 rubric 判级（结论先行/数字与口径/归因到人/承压回应/反问质量/岗位契合），'+
        '每维都给了判级依据。\n这不是测评结果，是一次练习记录。';
    },
    svc: '分数能看短板，但改不了表达。有人陪你把最差的那两维当场重讲一遍，比自己再练十场快。'
  },
  rival: {
    n: '竞品刚出结论',
    share: '把「我在跟谁抢」晒出去',
    cap: function(){
      var j=jdById(S.rivalJd||S.jd||"");
      var q=S.prof&&S.prof.quad;
      return '我在跟谁抢「'+(j?j.title:"这个岗位")+'」：\n\n'+
        '我的四维码 '+(q?q.code:"—")+'；同型竞争者 '+
        (q?PERSONA100.filter(function(p){return p.d===q.code;}).length:0)+' 型。\n'+
        '岗位要求我占了 '+(S.rivalNote||'（见页面）')+'。\n\n'+
        '用的是本地数据算的，不是实时招聘数据。';
    },
    svc: '知道自己差哪两条之后，改简历是最花时间的一步。这一步可以外包。'
  },
  dispute: {
    n: '劳议鲨手清单刚生成',
    share: '把这份清单留个档',
    cap: function(){
      var d=(typeof disState==="function")?disState():{};
      var t=(typeof disType==="function")?disType():null;
      var dl=(typeof disDeadline==="function")?disDeadline():null;
      return '劳议鲨手自助清单（'+(t?t.n:'未选类型')+'）\n'+
        (dl? ('参考截止日 '+disFmtDate(dl.end)+'（= 我填的日期 +1 年，不是结论）\n') : '')+
        '本工具不提供法律意见、不预测结果、不计算金额。\n'+
        '它只做三件事：帮我把事实理清、告诉我该固定哪些证据、给我几句能直接说出口的话。';
    },
    svc: '★ 这一条要单独说：本工具不给法律意见、不算金额。如果事情已经涉及金额或已经进入程序，'+
         '该找的是执业律师，不是这个页面。'
  },
  /* 「谁坐对面」这件事本身也值得发出去 —— 请一个朋友当你的面试官，
     比再多讲一遍知识点有用。这是分享里唯一能带出「新的人」的一种。 */
  ivmatch: {
    n: '这一场对阵',
    share: '把这一场发给朋友 · 让他当你的面试官',
    cap: function(){
      var r=(typeof ivDuelRole==="function") ? ivDuelRole() : null;
      if(!r) return "";
      var t=r.t, d=r.d;
      return '我最近要面的这一类岗位，对面大概是「'+d.name+' · '+t.n+'」。\n\n'+
        '他第一句会问：'+(t.open||'（直接给活，不铺垫）')+'\n'+
        '他真正在看的是：'+t.watch+'\n'+
        '我最容易被问穿的地方：'+t.trap+'\n\n'+
        '： 你要是愿意，拿这三句当提纲，当我的面试官问我十分钟。\n'+
        '（这是 offer鲨 · 职场鱼塘「面试模拟」里推出来的对阵，本地跑的，不用登录。）';
    },
    svc: '知道对面是谁，只是把范围缩小。真要说顺，得有个人当场打断你、追问你 ： 这一轮找真人练最快。'
  },
  bbx: {
    n: '黑话刚读懂一句',
    share: '把这句原话 + 解读晒出去',
    cap: function(){
      var t=String(S.bbxLast||"");
      if(!t) return "";
      var hits=(typeof bbxMatch==="function")?bbxMatch(t,1):[];
      var hc=(typeof hcAnalyze==="function")?hcAnalyze(t):null;
      var L=['领导说：「'+t+'」'];
      if(hits.length){
        L.push('', '潜台词：'+hits[0].it.m,
               '可以这么说：'+hits[0].it.b);
      }
      if(hc && hc.hits.length){
        L.push('', '高语境 '+hc.ctxName+' · 阴阳怪气 '+hc.yaName,
               '信号：'+hc.hits.map(function(x){return x.n;}).join('、'),
               '真实意思：'+hc.real);
      }
      L.push('', '（鱼群密语 · 不用登录、不上传、本地跑）');
      return L.join('\n');
    },
    svc: '一句话能翻，整场谈话就得靠练。要练的是「他抛出这一句时你当场怎么接」。'
  }
};

function momentHTML(kind){
  var c=CONV_SPOTS[kind];
  if(!c) return "";
  var h='<div class="moment" data-moment="'+esc(kind)+'">';
  h+='<div class="moment-h"><b>此刻可以做两件事</b><span class="momtag">'+esc(c.n)+'</span></div>';
  h+='<div class="moment-b">';
  /* 分享 */
  h+='<div class="momcol"><div class="momt">① '+esc(c.share)+'</div>'+
     '<div class="momd">'+esc(kind==='prof'?'生成一张竖版或方版的卡片，图里不含任何个人信息。'
       :'复制一段可以直接发的文案，自己改两个字再发。')+'</div>'+
     '<div class="momacts"><button class="sm pri" data-mom="share">'+
     (kind==='prof'?'生成分享卡':'复制配文')+'</button>'+
     (kind==='prof'?'<button class="sm" data-mom="capp">复制配文</button>':'')+
     '</div></div>';
  /* 服务 */
  h+='<div class="momcol"><div class="momt">② 需要人帮的话</div>'+
     '<div class="momd">'+esc(c.svc)+'</div>';
  if(svcConfigured()){
    var s=svcState();
    h+='<div class="svcbox"><b>'+esc(s.who||"（未填是谁）")+'</b>'+
       (s.what?'<span>'+esc(s.what)+'</span>':'')+
       (s.price?'<span class="svcprice">'+esc(s.price)+'</span>':'')+
       (s.how?'<div class="svchow">'+esc(s.how)+'</div>':'')+
       (s.scope?'<small>'+esc(s.scope)+'</small>':'')+
       '</div>';
  }else{
    /* 没配置就对访客完全隐藏，只留一句不带联系的引导 */
    h+='<div class="momd" style="margin-top:6px;color:var(--dim2)">'+
       '这一版没有内置买/卖入口（本地文件收不了钱，我不做假的付费墙）。'+
       '如果你手上有能做这件事的人，把上面那段结果发给他，比在这儿点按钮快。</div>';
  }
  h+='</div></div></div>';
  return h;
}
function bindMoment(host, kind){
  if(!host) return;
  var box=host.querySelector('[data-moment="'+kind+'"]');
  if(!box) return;
  var c=CONV_SPOTS[kind];
  var sh=box.querySelector('[data-mom="share"]');
  if(sh) sh.onclick=function(){
    if(kind==='prof'){ openShareCard('profile'); return; }
    var txt=c.cap();
    if(!txt){ toast("这一页还没有可分享的内容"); return; }
    cp(txt); shareDone(kind); toast("配文已复制，改两个字再发");
  };
  var cpBtn=box.querySelector('[data-mom="capp"]');
  if(cpBtn) cpBtn.onclick=function(){
    var txt=c.cap();
    if(!txt){ toast("还没有内容"); return; }
    cp(txt); toast("配文已复制");
  };
}

/* ---------- 设置里的「我的服务信息」（只有文件所有者会填） ---------- */
function openSvcSet(){
  var s=svcState();
  var h='<div class="svcform">'+
    '<p class="note" style="margin-top:0"><b>给你自己用</b>：填了才会在五个时刻出现，'+
    '展示给拿到这份文件的人。<b>不填就完全隐藏</b>。</p>'+
    '<label class="rvfld"><span>你是谁 / 你的联系方式（微信、闲鱼、邮箱都行）</span>'+
      '<input id="svcWho" type="text" value="'+esc(s.who)+'" placeholder="例：老张 · 微信 zhangsan88"></label>'+
    '<label class="rvfld"><span>你能做什么（一句话）</span>'+
      '<input id="svcWhat" type="text" value="'+esc(s.what)+'" placeholder="例：简历逐段改写 + 30 分钟陪练"></label>'+
    '<label class="rvfld"><span>价格</span>'+
      '<input id="svcPrice" type="text" value="'+esc(s.price)+'" placeholder="例：99 元/份（先看后付）"></label>'+
    '<label class="rvfld"><span>怎么找到你</span>'+
      '<input id="svcHow" type="text" value="'+esc(s.how)+'" placeholder="例：加微信备注「简历」，我发收款码"></label>'+
    '<label class="rvfld"><span>范围与免责（可选）</span>'+
      '<input id="svcScope" type="text" value="'+esc(s.scope)+'" placeholder="例：不接劳动争议代理，不承诺录用结果"></label>'+
    '<label class="ivck" style="margin-top:8px"><input type="checkbox" id="svcOn"'+(s.on?" checked":"")+'> 启用（勾上之后才会出现在各页面）</label>'+
    '</div>';
  openModal("我的服务信息（可选）", h, [
    {t:"保存", c:"pri", f:function(){
      var g=function(id){ var e=document.getElementById(id); return e?String(e.value||"").trim():""; };
      S.svc={ on:!!(document.getElementById("svcOn")&&document.getElementById("svcOn").checked),
              who:g("svcWho"), what:g("svcWhat"), price:g("svcPrice"), how:g("svcHow"), scope:g("svcScope") };
      save(); closeModal();
      toast(svcConfigured() ? "已启用，会在五个时刻出现" : "已保存（未启用，各页面不会显示）");
    }},
    {t:"清空", f:function(){ S.svc={on:false,who:"",what:"",price:"",how:"",scope:""}; save(); closeModal(); toast("已清空"); }},
    {t:"算了", f:closeModal}
  ]);
}

/* 把四个位置的「此刻可以做两件事」按各自的前提渲染出来 */
function renderMoments(){
  var jobs=[['prof','#momProf', function(){ return !!(S.prof&&S.prof.labels&&S.prof.labels.length); }],
            ['bbx', '#momBbx',  function(){ return !!String(S.bbxLast||"").trim(); }]];
  jobs.forEach(function(x){
    var host=document.querySelector(x[1]);
    if(!host) return;
    if(!x[2]()){ host.innerHTML=""; return; }
    host.innerHTML=momentHTML(x[0]);
    bindMoment(host,x[0]);
  });
}
function bindConvert(){
  var b=document.getElementById("btnSvc");
  if(b) b.onclick=openSvcSet;
  renderMoments();
  renderShareFab();
}

/* =====================================================================
   常驻分享入口（右下角那个按钮）
   ： 之前分享只能在各页的「此刻可以做两件事」里找到，要滚到那个位置才看得见。
      这个按钮跟着视图走，永远在同一位置，并且**直接写出它能分享什么**。
      拿不到东西的时候它自己降级成灰态 + 说明原因，不做点了没反应的假按钮。
   ===================================================================== */
function capTarget(kind){
  var c=CONV_SPOTS[kind];
  return { n:c.n, w:"cap", f:function(){
    var t=c.cap();
    if(!t){ toast("这一页还没有可分享的内容"); return; }
    cp(t); shareDone(kind); toast("配文已复制，改两个字再发");
  }};
}
function shareFabTarget(){
  var v=S.view||"me";
  var prof=!!(S.prof&&S.prof.labels&&S.prof.labels.length);
  if(v==="me"||v==="job"){
    if(prof) return { n:"我的画像卡", w:"profile", f:function(){ openShareCard("profile"); } };
    return null;
  }
  if(v==="chatter"){
    var f=fishById(S.pick||"")||(S.fish||[])[0];
    if(f) return { n:"这条鱼", w:"fish", f:function(){ openShareCard("fish", f.id); } };
    return null;
  }
  if(v==="interview"){
    if((S.ivTab||0)===4 && S.sess && (S.sess.turns||[]).length) return capTarget("report");
    /* 「模拟」页：对阵本身就能发出去 —— 请个朋友当面试官（也是唯一能带出新人的分享） */
    if((S.ivTab||0)===0) return capTarget("ivmatch");
    return null;
  }
  if(v==="rival") return capTarget("rival");
  if(v==="dispute"){ return disState().type ? capTarget("dispute") : null; }
  if(v==="tool"){ return String(S.bbxLast||"").trim() ? capTarget("bbx") : null; }
  return null;
}
/* 没东西可分享时，说清楚差哪一步——比一个灰按钮有用 */
function shareFabWhy(){
  var v=S.view||"me";
  if(v==="me"||v==="job") return "先去「职场画像 → 简历」把简历交出来，画像卡才会长出来";
  if(v==="chatter") return "先在蛐蛐里放一条鱼，就能把它变成一张卡";
  if(v==="interview") return "打满一轮模拟，再进「复盘」页，才有成绩可分享";
  if(v==="dispute") return "先选一个争议类型，才会生成可分享的清单";
  if(v==="tool") return "先翻一句黑话，才有内容可分享";
  return "这一页还没有可分享的结果";
}
function renderShareFab(){
  var b=document.getElementById("shareFab");
  if(!b) return;
  var tg=shareFabTarget();
  var tip=document.getElementById("shareFabTip");
  b.classList.toggle("off", !tg);
  b.title=tg ? ("分享"+tg.n) : "这一页还没有可分享的东西";
  if(tip) tip.textContent=tg?tg.n:"还没内容";
  b.onclick=function(){
    var t=shareFabTarget();
    if(!t){ toast(shareFabWhy()); return; }
    t.f();
  };
}
function bindShareFab(){ renderShareFab(); }
