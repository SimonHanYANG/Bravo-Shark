/* =====================================================================
   群面 · 即时咨询 · 工作节律
   ---------------------------------------------------------------------
   ★ 2026-09-24：**这一版起所有功能免费开放，没有会员锁。**
     原来的实现是「离线授权码」：文件所有者按序号生成码、发给付过钱的人。
     现在门禁分支、解锁弹窗、会员状态判断、销售文案全部移除，
     三个功能对所有使用者直接可用。

   ★ 为什么连 memberGate / openMemberSet 一起删掉，而不是留一个
     恒真的 isMember() 就完事：留下的分支永远不会执行、留下的按钮
     永远点不到，下一个人读到会以为自己漏配了什么。
     要恢复收费的话，改动清单是明确的：
       ① 恢复 isMember() 与三处门禁判断
       ② 恢复会员弹窗（输码 + 按序号生成码）
       ③ 侧栏加回入口按钮
     码算法（MEMBER_SALT / memberMake / memberVerify）保留在下面 ：
     它和 UI 无关，删了以后要重写，留着不产生任何误解。
   ===================================================================== */

var MEMBER_SALT = 'offersha-member-v1';   /* 文件所有者可以改这串盐，改完旧码全部作废 */

/* ---------------------------------------------------------------------
   授权码算法（留档）
   目前**没有任何入口调用它** ： 保留的原因只有一个：以后若要恢复收费，
   不用重写。memberMake(n) 对同一个 n 永远生成同一串码，memberVerify 反向查回序号。
   ★ 取码千万不要手写复刻：`h*16777619` 会超过 float64 精度（约 7.2e16 > 2^53），
     Python 大整数精确复刻算出来的码**全部是错的**。要取码就在真实 JS 环境里调它。
   --------------------------------------------------------------------- */
function memberMake(n){
  var s=MEMBER_SALT+'|'+n, h=2166136261;
  for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=(h*16777619)>>>0; }
  var a=(h>>>0).toString(36).toUpperCase(), b=((n*2654435761)>>>0).toString(36).toUpperCase();
  return (a+b).slice(0,4)+'-'+(a+b).slice(4,8).toUpperCase();
}
function memberVerify(code){
  var c=String(code||"").trim().toUpperCase().replace(/\s/g,"");
  if(!c) return -1;
  for(var n=1;n<=3000;n++) if(memberMake(n)===c) return n;
  return -1;
}

/* =====================================================================
   群面模拟
   ===================================================================== */
var GROUP_CASES = [
  { t:'为「新用户首单转化率」定一个方案：给出三个优先级最高的动作',
    pts:['先定口径：什么叫首单转化、分子分母各是什么','定优先级：只留三个，其余明确说「这次不做」','分工：谁在几天内出什么','风险：最可能失败的地方与退路'] },
  { t:'公司要在三个月内砍掉 20% 成本，你们小组给一个方案',
    pts:['先分「能砍」和「不能砍」，别一上来就砍人头','区分一次性成本与持续成本','给出量化目标与验证方式','明确谁是受损方、怎么沟通'] },
  { t:'线上出了故障，用户投诉在涨：接下来 2 小时怎么安排',
    pts:['先止血再定位，别同时做两件事','明确谁是决策者、谁对外','留一手回滚方案','事后：定级与复盘，不追人只追流程'] },
  { t:'一个老客户要求做超出合同范围的功能，接不接',
    pts:['先算成本与机会成本，再谈关系','区分「这一次」和「成为惯例」','给出置换条件而不是简单拒绝','留出升级路径'] },
  { t:'新产品要选一个主渠道，从三个里挑一个并说明放弃另外两个的理由',
    pts:['先定评价维度再打分，避免凭感觉','把「放弃的理由」说出来，比选谁更重要','给一个小成本验证方案','设一个复核时间点'] },
  { t:'团队两个人明显不和，影响交付，你作为负责人怎么办',
    pts:['先分清是人际问题还是目标不清晰','不站队，但要给规则','把问题落到具体交付上','设一个可观察的改善标准'] },
  { t:'预算不够但目标不变，你打算怎么向上提',
    pts:['先带方案再带问题','给两个选项让上面选，而不是单选项','说清「不批」的后果','要资源同时给出可控的验证点'] },
  { t:'新业务要不要做：给一个 10 分钟的判断',
    pts:['先问「我们要的是增长还是利润」','用现有能力复用的比例做判断','找出一个能快速证伪的假设','给出停止条件'] }
];
var GROUP_ROLES = [
  { id:'frame',  n:'抢框架的人',  say:'我建议我们先定个框架：第一…第二…第三…，大家看行不行？' },
  { id:'time',   n:'盯时间的人',  say:'我们还有 6 分钟，我建议现在收一下，先出一个结论。' },
  { id:'against',n:'唱反调的人',  say:'我觉得这个方案有问题：如果用户根本不是这么想的呢？' },
  { id:'quiet',  n:'很少说话的人',say:'我只补一句：上一轮提到的口径，分两种。' },
  { id:'detail', n:'堆细节的人',  say:'具体执行上，我先说排期：第一天做 A，第二天做 B…' }
];
var GROUP_MOVES = [
  { id:'open',  n:'抢开局：给出讨论框架', d:['存在感 +2','推进 +2','差异化 +1'], tip:'第一个给出框架的人，天然会成为这场的参照系。' },
  { id:'build', n:'接住别人的话并往前推一步', d:['协作 +3','推进 +1'], tip:'「我同意 A，并且在此基础上补一条」：最容易被记住的句式。' },
  { id:'new',   n:'提供别人没说的信息', d:['差异化 +3','存在感 +1'], tip:'群面里唯一不可替代的东西就是别人没有的信息。' },
  { id:'pull',  n:'把跑偏的话题拉回主线', d:['推进 +3','协作 +1'], tip:'拉回主线时先承认对方的价值，再收口。' },
  { id:'yield', n:'让位并替别人做总结', d:['协作 +3','存在感 -1'], tip:'这条只在别人已经很强时用；滥用会被当成没有观点。' }
];
function groupState(){
  if(!S.grp || typeof S.grp!=="object") S.grp={caseIdx:-1,round:0,done:false,log:[],sc:{exist:0,diff:0,push:0,coop:0},moves:[]};
  return S.grp;
}
function groupStart(){
  var g=groupState();
  g.caseIdx=Math.floor(Math.random()*GROUP_CASES.length);
  g.round=0; g.done=false; g.log=[]; g.moves=[];
  g.sc={exist:0,diff:0,push:0,coop:0};
  save(); renderGroup();
}
function groupMove(mid){
  var g=groupState(); if(g.done) return;
  if(g.round>=5){ groupFinish(); return; }
  var mv=null;
  GROUP_MOVES.forEach(function(m){ if(m.id===mid) mv=m; });
  if(!mv) return;
  g.moves.push(mid);
  if(mid==='open'){ g.sc.exist+=2; g.sc.push+=2; g.sc.diff+=1; }
  if(mid==='build'){ g.sc.coop+=3; g.sc.push+=1; }
  if(mid==='new'){ g.sc.diff+=3; g.sc.exist+=1; }
  if(mid==='pull'){ g.sc.push+=3; g.sc.coop+=1; }
  if(mid==='yield'){ g.sc.coop+=3; g.sc.exist=Math.max(0,g.sc.exist-1); }
  /* NPC 发言：每轮 2 条，按角色轮换；抢框架的人只在前两轮出现 */
  var r=g.round, said=[];
  var pool = r<2 ? GROUP_ROLES : GROUP_ROLES.filter(function(x){ return x.id!=='frame'; });
  said.push(pool[(r*2)%pool.length]);
  said.push(pool[(r*2+1)%pool.length]);
  g.log.push({ r:r+1, me:mv.n, npc:said.map(function(x){ return {n:x.n,s:x.say}; }) });
  /* 连续两轮没抢到存在感，会被忽略 */
  g.round++;
  if(g.round>=5) g.done=true;
  save(); renderGroup();
}
function groupFinish(){ var g=groupState(); g.done=true; save(); renderGroup(); }
function groupScore(){
  var g=groupState(), sc=g.sc;
  var pack=function(v){ return Math.max(0,Math.min(4,Math.round(v/3))); };
  return { exist:pack(sc.exist), diff:pack(sc.diff), push:pack(sc.push), coop:pack(sc.coop),
           total:pack(sc.exist)+pack(sc.diff)+pack(sc.push)+pack(sc.coop) };
}
function groupAdvice(){
  var s=groupScore(), out=[];
  if(s.exist<=1) out.push('你说话的次数太少。群面里沉默不会被当成谦虚，只会被当成没想法：至少要有三次「有内容的开口」。');
  if(s.diff<=1) out.push('你给的信息别人也能给。下次准备一个「只有你知道」的数字或案例，那是唯一不可替代的东西。');
  if(s.push<=1) out.push('讨论跑偏时你没有拉回来。群面判分很看「谁让这场有结论」：学会说「我拉回一下」。');
  if(s.coop<=1) out.push('你只顾自己说。接住别人一句话再往前推（「我同意 A，并且补一条」）是最容易被记住的句式。');
  if(!out.length) out.push('这一场四维都在线：有开口、有独占信息、推动了结论、也接住了别人。保持这个节奏。');
  return out;
}
function renderGroup(){
  var host=document.getElementById("grpOut");
  if(!host) return;
  var g=groupState(), h="";
  if(g.caseIdx<0){
    h+='<div class="card hi"><h3>群面模拟 · 5 轮</h3>'+
       '<p class="note" style="margin-top:0">4 个角色，一道题。每轮选一个动作。'+
       '你要在每轮里选一个动作：<b class="hl">不是选对错，是选你在这一场里的位置</b>。'+
       '最后按四维给分：存在感 / 差异化 / 推进力 / 协作。</p>'+
       '<div class="acts"><button class="pri big" id="grpStart">开始一场群面</button></div></div>';
    h+=groupSharkRow();          /* 一桌人先露脸（duel.js） */
    host.innerHTML=h;
    bindGroupSharks(host);
    var b=document.getElementById("grpStart"); if(b) b.onclick=groupStart;
    return;
  }
  var c=GROUP_CASES[g.caseIdx];
  h+='<div class="grpcase"><div class="grpcase-h"><b>议题</b><span>'+esc(c.t)+'</span></div>'+
     '<div class="grppt"><i>这道题真正在看的点</i><ul>'+c.pts.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul></div></div>';
  h+=groupSharkRow();
  h+='<div class="grplog">'+g.log.map(function(x){
    return '<div class="grpr"><div class="grpr-h">第 '+x.r+' 轮 · 你的动作：'+esc(x.me)+'</div>'+
      x.npc.map(function(y){ return '<div class="grpnpc"><b>'+esc(y.n)+'</b>'+esc(y.s)+'</div>'; }).join("")+'</div>';
  }).join("")+'</div>';
  if(!g.done){
    h+='<div class="grpmoves"><div class="grpmoves-h">第 '+(g.round+1)+' 轮，你做什么？</div>'+
       GROUP_MOVES.map(function(m){
         return '<button class="grpmv" data-gm="'+m.id+'"><b>'+esc(m.n)+'</b>'+
           '<span>'+esc(m.tip)+'</span><em>'+m.d.join(' · ')+'</em></button>';
       }).join("")+'</div>';
  }else{
    var s=groupScore();
    h+='<div class="grpres"><div class="grpres-h"><b>这一场 · '+s.total+'/16</b></div>'+
       '<div class="grpdims">'+[['存在感',s.exist],['差异化',s.diff],['推进力',s.push],['协作',s.coop]].map(function(d){
         return '<div class="grpdim"><i>'+d[0]+'</i><u><b style="width:'+(d[1]/4*100)+'%"></b></u><span>'+d[1]+'/4</span></div>';
       }).join("")+'</div>'+
       '<ul class="rvwhy">'+groupAdvice().map(function(x){ return '<li>'+esc(x)+'</li>'; }).join("")+'</ul>'+
       '<p class="note">按你的动作规则评分，不是考官评价。四维里有一项是 0，通常就会被刷。</p>'+
       '<div class="acts"><button class="pri" id="grpAgain">再来一场</button></div></div>';
  }
  host.innerHTML=h;
  bindGroupSharks(host);
  Array.prototype.forEach.call(host.querySelectorAll("[data-gm]"),function(b){
    b.onclick=function(){ groupMove(b.dataset.gm); };
  });
  var a=document.getElementById("grpAgain"); if(a) a.onclick=groupStart;
}

/* =====================================================================
   即时咨询：有模型就即时答，没模型就生成一张「可以发出去」的提问卡
   ===================================================================== */
function renderConsult(){
  var gate=document.getElementById("consGate");
  var form=document.getElementById("consForm");
  if(!gate||!form) return;
  gate.innerHTML="";
  form.style.display="";
  var b=document.getElementById("consGo");
  if(b) b.onclick=consultAsk;
}
function consultAsk(){
  var ta=document.getElementById("consIn");
  var q=ta?String(ta.value||"").trim():"";
  if(q.length<6){ toast("把问题写具体一点，至少一句话"); return; }
  var out=document.getElementById("consOut");
  if(!out) return;
  var j=jdById(S.jd||"");
  var L=(S.prof&&S.prof.labels)||[];
  /* 会员 + 有模型 → 直接问；否则给提问卡 */
  if(typeof llmReady==="function" && llmReady()){
    out.innerHTML='<div class="card"><h3>正在问你的模型…</h3><p class="note" style="margin-top:0">用的是你在「设置」里配的接口。</p></div>';
    var sys='你是一位在中国一线做过招聘与团队管理的顾问。回答要求：① 先给结论再给理由；'+
      '② 不确定就写「不确定」，不编数字、不编公司名、不编法条；③ 给可执行的下一步，不给励志话术；④ 不超过 400 字。';
    var usr='我的问题：'+q+'\n\n背景：目标岗位 '+(j?j.title:'未选')+'；画像标签 '+
      (L.map(function(x){return x.p.t;}).join('、')||'未生成')+'；'+
      '我在意的七件事 '+((S.sel||[]).join(' > ')||'未选');
    llm([{role:'system',content:sys},{role:'user',content:usr}],0.6).then(function(txt){
      out.innerHTML='<div class="card hi"><h3>回答</h3><pre class="rvllmtxt">'+esc(txt)+'</pre>'+
        '<div class="rvllmwarn">★ 这是<b>你自己配的模型</b>写的，知识有截止时间，可能过时或记错。当参考，别当事实。</div>'+
        '<div class="acts"><button id="consCopy">复制</button><button id="consAskAgain">换个问法再问</button></div></div>';
      var c=document.getElementById("consCopy"); if(c) c.onclick=function(){ cp(txt); toast("已复制"); };
      var r=document.getElementById("consAskAgain"); if(r) r.onclick=consultAsk;
    }).catch(function(e){
      out.innerHTML='<div class="card"><h3>模型没答上来</h3><p class="note" style="margin-top:0">'+esc(e.message||"未知错误")+
        '<br>不影响用下面的提问卡：把它发给能回答你的人，效果一样。</p></div>'+
        consultCardHTML(q,j,L);
      bindConsultCard(out,q);
    });
    return;
  }
  out.innerHTML=consultCardHTML(q,j,L);
  bindConsultCard(out,q);
}
function consultCardHTML(q,j,L){
  var s=(typeof svcState==="function")?svcState():null;
  return '<div class="card hi"><h3>提问卡（可以直接发出去）</h3>'+
    '<pre class="consCardTxt" id="consCard">'+esc(consultText(q,j,L))+'</pre>'+
    '<div class="acts"><button class="pri" id="consCopyCard">复制这张卡</button></div>'+
    '<div class="mgate-how">'+(s&&s.on&&s.how?('可以发给 '+esc(s.who||"")+'：'+esc(s.how)):
      '这份文件的主人还没填联系方式：填了之后这里会显示发给谁。')+'</div>'+
    '<p class="tbnote">★ 本地单文件不能替你联系任何人。这张卡的作用是：把问题整理成别人 30 秒就能看懂的形式：'+
    '大多数人问不出有价值的答案，是因为问题本身没写清。</p></div>';
}
function consultText(q,j,L){
  return ['【我的问题】', q, '',
    '【背景】',
    '· 目标岗位：'+((j&&j.title)||'（还没选）'),
    '· 我的年限：'+((S.resume.facts&&S.resume.facts.years!=null)?S.resume.facts.years+' 年':'不清楚'),
    '· 我的画像标签：'+(L.map(function(x){return x.p.t;}).join('、')||'（还没生成）'),
    '· 我最在意的七件事：'+((S.sel||[]).join(' > ')||'（还没选）'), '',
    '【我想知道】',
    '1. 这件事的关键判断点是什么（先给结论）',
    '2. 如果是你，你会先做哪一步',
    '3. 有哪些信息你不掌握：也就是我该自己去核实的', '',
    '（如果你不确定，请直接说不确定，不要编数字或编案例。）'].join('\n');
}
function bindConsultCard(host,q){
  var b=host.querySelector("#consCopyCard");
  if(b) b.onclick=function(){ cp(consultText(q,jdById(S.jd||""),(S.prof&&S.prof.labels)||[])); toast("已复制，直接发出去"); };
}

/* =====================================================================
   工作节律：记录 → 统计 → 建议
   ===================================================================== */
function rhythmState(){
  if(!Array.isArray(S.rhythm)) S.rhythm=[];
  return S.rhythm;
}
function today(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
function rhythmToday(){
  var t=today(), a=rhythmState();
  for(var i=0;i<a.length;i++) if(a[i].d===t) return a[i];
  var x={d:t,h:0,note:"",moods:{}};
  a.push(x); return x;
}
function rhythmSetHours(v){
  var x=rhythmToday(); x.h=Math.max(0,Math.min(18,+v||0)); save(); renderRhythm();
}
function rhythmNote(v){ rhythmToday().note=String(v||"").slice(0,80); save(); renderRhythm(); }
/* 把今天蛐蛐放出去的鱼，按心情计入节律（自动，不用手填） */
function rhythmSyncFromFish(){
  var t=today(), x=rhythmToday();
  x.moods={};
  (S.fish||[]).forEach(function(f){
    var d=new Date(f.at||0);
    var ds=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
    if(ds===t) x.moods[f.mood||"未标"]=(x.moods[f.mood||"未标"]||0)+1;
  });
}
function rhythmStats(days){
  days=days||14;
  var out=[], now=new Date();
  for(var i=days-1;i>=0;i--){
    var d=new Date(now.getTime()-i*86400000);
    var ds=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
    var rec=null;
    rhythmState().forEach(function(x){ if(x.d===ds) rec=x; });
    out.push({d:ds, h:rec?rec.h:0, mood:rec&&rec.moods?Object.keys(rec.moods).sort(function(a,b){return rec.moods[b]-rec.moods[a];})[0]:"", note:rec?rec.note:""});
  }
  return out;
}
function rhythmAdvice(){
  var s=rhythmStats(14).filter(function(x){ return x.h>0; });
  var out=[];
  if(s.length<3) return ['样本还不够（少于 3 天有记录）。先记一周，这里才会给判断：不猜。'];
  var avg=s.reduce(function(a,b){ return a+b.h; },0)/s.length;
  /* 连续超过 9 小时 */
  var run=0,best=0;
  s.forEach(function(x){ if(x.h>9){ run++; best=Math.max(best,run); } else run=0; });
  if(best>=4) out.push('有连续 '+best+' 天超过 9 小时。这个节律通常在第 2–3 周开始掉产出：不是意志问题，是恢复不够。');
  if(avg>9.5) out.push('这 14 天平均每天 '+avg.toFixed(1)+' 小时，已经超出能持续的范围。先砍一件事，比提高效率现实。');
  if(avg>0&&avg<6) out.push('平均 '+avg.toFixed(1)+' 小时偏低。如果这不是淡季，先确认是没活干还是不想干：这两件事的解法完全不同。');
  /* 状态信号：用 moodVal 的显式极性算，而不是拿正则去匹配几个词。
     正则的漏法很具体：用户一加「被甲方反复折磨」这种自定义状态，就完全统计不到。 */
  var bad=0, good=0, all=0, badNames={};
  s.forEach(function(x){
    if(!x.mood) return;
    all++;
    var v=moodVal(x.mood);
    if(v<0){ bad++; badNames[x.mood]=(badNames[x.mood]||0)+1; }
    else if(v>0) good++;
  });
  if(all&&bad/all>0.5){
    var top=Object.keys(badNames).sort(function(a,b){ return badNames[b]-badNames[a]; }).slice(0,3).join('、');
    out.push('有记录的日子里，'+Math.round(bad/all*100)+'% 的状态落在消耗那一侧（'+(top||'—')+'）。'+
      '状态信号通常比工时更早预警：工时还能扛，情绪先崩。');
  }
  if(all>=6&&good/all>=0.5) out.push('有 '+Math.round(good/all*100)+'% 的日子状态是回血的。这在高压期不常见：'+
    '把它记下来，回头能看出是什么条件下你状态好，那比「多休息」有用。');
  /* 周末 */
  var wk=rhythmStats(14).filter(function(x){
    var d=new Date(x.d+'T00:00:00'); return x.h>0&&(d.getDay()===0||d.getDay()===6);
  }).length;
  if(wk>=3) out.push('14 天里有 '+wk+' 个周末有工作记录。如果这已经持续两个月，你需要的不是时间管理，是重新谈边界。');
  if(!out.length) out.push('这 14 天的节律看起来还在可控区间：有记录、有波动、没有连续超载。继续保持记录：数据的价值在连续。');
  return out;
}
/* 把「你放出去的鱼」按状态汇总成统计——不用你手填，
   因为蛐蛐里那个状态本来就是你自己选的，直接复用。 */
function rhythmMoodStats(days){
  days=days||14;
  var now=new Date(), from=new Date(now.getTime()-(days-1)*86400000);
  from.setHours(0,0,0,0);
  var cnt={}, tot=0, val={neg:0,neu:0,pos:0};
  (S.fish||[]).forEach(function(f){
    var d=new Date(f.at||0);
    if(!(d>=from)) return;
    var m=f.mood||"无语";
    cnt[m]=(cnt[m]||0)+1; tot++;
    var v=moodVal(m);
    if(v<0) val.neg++; else if(v>0) val.pos++; else val.neu++;
  });
  return {cnt:cnt, tot:tot, val:val};
}
/* 心情曲线数据：最近 N 天，每天 = 当天放出的鱼的情绪平均值（-1~1）。
   没放鱼的天 value=null，曲线断开。 */
function moodCurveData(days){
  days = days || 14;
  var out = [];
  var now = new Date();
  for(var i=days-1; i>=0; i--){
    var d = new Date(now.getTime() - i*86400000);
    var ds = d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
    var sum = 0, n = 0;
    (S.fish||[]).forEach(function(f){
      var fd = new Date(f.at||0);
      var fds = fd.getFullYear()+"-"+("0"+(fd.getMonth()+1)).slice(-2)+"-"+("0"+fd.getDate()).slice(-2);
      if(fds === ds){ sum += moodVal(f.mood||"无语"); n++; }
    });
    out.push({ label: ds.slice(5), value: n ? +(sum/n).toFixed(2) : null, n: n });
  }
  return out;
}
function renderRhythm(){
  var host=document.getElementById("rhythmBox");
  if(!host) return;
  rhythmSyncFromFish();
  var t=rhythmToday(), st=rhythmStats(14);
  var maxH=Math.max(10, Math.max.apply(null, st.map(function(x){ return x.h; })));
  var h='<div class="rhythm"><div class="rhythm-h"><b>工作节律</b>'+
    '<span class="rhythm-today">今天：'+t.h+' 小时'+(t.note?' · '+esc(t.note):'')+'</span></div>';
  h+='<div class="rhythm-in">'+
     '<label class="rvfld" style="flex:0 0 150px"><span>今天工作了几小时</span>'+
       '<input id="rhH" type="number" min="0" max="18" step="0.5" value="'+(t.h||"")+'"></label>'+
     '<label class="rvfld" style="flex:1;min-width:200px"><span>一句话（今天什么状态）</span>'+
       '<input id="rhN" type="text" value="'+esc(t.note)+'" placeholder="例：上午效率高，下午全在开会"></label>'+
     '<button class="sm" id="rhSave">记下今天</button></div>';
  var moodKeys=Object.keys(t.moods||{});
  h+='<div class="rhythm-mood">今天的情绪信号（从你放出去的鱼自动统计'+(moodKeys.length?('：'+moodKeys.map(function(k){return esc(k)+'×'+t.moods[k];}).join(' · ')):'：还没有')+'）</div>';
  h+='<div class="rhythm-bars">'+st.map(function(x){
    var hp=Math.round(x.h/maxH*100);
    /* 没记录的那天给一条虚线基线，而不是压成一条实线——
       实线会被看成「记录了 0 小时」，虚线才是「没记录」。 */
    var zero=x.h? "":' zero';
    return '<div class="rhb'+zero+'" title="'+x.d+' '+x.h+'h '+(x.mood||"")+'"><u><b style="height:'+hp+'%"></b></u>'+
      '<i>'+x.d.slice(8)+'</i></div>';
  }).join("")+'</div>';

  /* 每天的心情曲线：放出去的鱼的情绪平均值，中线以上偏回血、以下偏消耗 */
  var curve = moodCurveData(14);
  var hasCurve = curve.some(function(x){ return x.value != null; });
  if(hasCurve){
    h += '<div class="rhythm-curve"><div class="rhythm-curve-h"><b>每天的心情曲线</b>'+
      '<span>最近 14 天 · 你放的鱼的情绪平均</span></div>'+
      vizLine(curve, {min:-1, max:1, w:660, h:170})+
      '<p class="tbnote">中线以上 = 那几天整体偏回血；以下 = 偏消耗。没放鱼的日子是断的，不代表那天心情不好。</p></div>';
  }

  /* 状态统计：14 天里你放出去的鱼都带着状态，这里直接汇总，不用你再填一遍 */
  var ms=rhythmMoodStats(14);
  h+='<div class="rhythm-stat"><div class="rhythm-stat-h"><b>这 14 天的状态统计</b>'+
     '<span>样本 '+ms.tot+' 条（来自你放出去的鱼）</span></div>';
  if(!ms.tot){
    h+='<p class="tbnote" style="margin-top:6px">还没有样本。去蛐蛐放一条鱼，选一个状态，这里就会开始统计：'+
      '不用你另外填表。</p>';
  }else{
    var rows=Object.keys(ms.cnt).sort(function(a,b){ return ms.cnt[b]-ms.cnt[a]; }).slice(0,8);
    var mx=ms.cnt[rows[0]]||1;
    h+='<div class="mstatlist">'+rows.map(function(k){
      var v=moodVal(k), cls=v<0?"neg":(v>0?"pos":"neu");
      return '<div class="mstatrow"><span class="mstatn">'+esc(moodIcon(k))+' '+esc(k)+'</span>'+
        '<u class="mstatbar"><b class="'+cls+'" style="width:'+Math.round(ms.cnt[k]/mx*100)+'%"></b></u>'+
        '<em>'+ms.cnt[k]+'</em></div>';
    }).join("")+'</div>';
    var tot=ms.val.neg+ms.val.neu+ms.val.pos;
    h+='<div class="mstatval"><i class="neg" style="flex:'+ms.val.neg+'"></i>'+
       '<i class="neu" style="flex:'+ms.val.neu+'"></i>'+
       '<i class="pos" style="flex:'+ms.val.pos+'"></i></div>'+
       '<div class="mstatlegend">消耗 '+Math.round(ms.val.neg/tot*100)+'% · '+
       '中性 '+Math.round(ms.val.neu/tot*100)+'% · 回血 '+Math.round(ms.val.pos/tot*100)+'%'+
       '<span class="mstatnote">状态按「消耗 / 中性 / 回血」分了三档，自定义的状态也会被归进去。</span></div>';
  }
  h+='</div>';

  h+='<div class="rhythm-adv"><b>这 14 天的判断</b><ul class="rvwhy">'+
     rhythmAdvice().map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')+'</ul>'+
     '<p class="tbnote">★ 这些是<b>按记录做的规则判断</b>，不是诊断。样本少于 3 天时它不会给结论。</p></div>';
  h+='</div>';
  host.innerHTML=h;
  var sv=document.getElementById("rhSave");
  if(sv) sv.onclick=function(){
    var a=document.getElementById("rhH"), b=document.getElementById("rhN");
    var x=rhythmToday(); x.h=Math.max(0,Math.min(18,+((a&&a.value)||0))); x.note=((b&&b.value)||"").slice(0,80);
    save(); renderRhythm(); toast("记下了");
  };
}
