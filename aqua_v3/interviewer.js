/* =====================================================================
   面试官分类模拟
   ： 不是凭空分的 6 类：每一类都挂在 JDS[].rounds 里**真实出现的轮次角色**上，
      并按该岗位自带的 hr 对象（类型/为什么/怎么应对）调语气。
   出现的位置：面试模拟 →「模拟」页，**开始之前**。
   理由：这类信息只在开打之前有用；打完再看就只是解释，不是准备。
   ===================================================================== */

var IV_TYPES = [
  { id:'lead', n:'直属 Leader', icon:'◎',
    kws:['直属 Leader','业务面','项目面','技术面','专业面','Pretalk','Case','电话筛','行为面试'],
    how:['拿你简历上的一个项目，从「你负责哪一块」问到「当时为什么这么定」再问到「结果是谁统计的」',
         '中途会插一句「这个数是你自己算的，还是别人给你的？」',
         '最后问「如果重做一次，你会改什么」'],
    watch:'他真正在验的是：这件事到底是不是你干的。他天天干这个，穿帮只需要三个问题。',
    trap:'把团队的成果说成自己的、把「参与」说成「主导」、数字来自记忆而不是口径。',
    tip:'每一句都自带三件套：我做的动作 → 数字与口径 → 谁来验证。答不出来就说不清楚，别硬撑。',
    open:'先说说你最近一个自己主导的项目，我要听细节。',
    tail:'这个数是谁统计的？口径是什么？' },

  { id:'cross', n:'交叉面 · 同级', icon:'⇄',
    kws:['交叉面','面试官面','双线面','业务方 + IT','行为面试','结构化面试'],
    how:['问「你和别人意见不一致的时候怎么办」，然后追问一个具体的旧例子',
         '故意说一句和你相反的观点，看你顺着走还是会顶回来',
         '问「你上家最不喜欢谁，为什么」'],
    watch:'他看的是：你会不会卡在协作上。同级面试官最怕招进来一个推不动或爱起冲突的人。',
    trap:'说「我从来没跟人有过分歧」（不可信），或者把前同事吐槽一遍（风险极高）。',
    tip:'给一个「有分歧但没闹翻」的真实例子，讲清你怎么让事情推进的，而不是你怎么赢的。',
    open:'咱们同级，我就问问合作上的事：你跟人有过分歧吗？说一个具体的。',
    tail:'那次最后是谁让步的？你怎么看这个结果？' },

  { id:'boss', n:'负责人 / 总监', icon:'◭',
    kws:['负责人','总监','VP','高管','分管高层','终面','高层','理事会'],
    how:['不问你做过什么，问「如果这个岗位给你，你前三个月干什么」',
         '问「你觉得我们这个业务最大的问题是什么」',
         '在你回答里挑一个判断，问「你为什么这么判断，万一错了呢」'],
    watch:'他看的是判断力和上限：你能不能在没有标准答案的时候给出一个有依据的答案。',
    trap:'答得太安全（「先学习、先熟悉团队」），或者答得太满（上来就要改架构）。',
    tip:'给一个有取有舍的判断：我会先做 A，先不做 B，因为 … 。有取舍才叫判断。',
    open:'别讲流程。如果你来干这个岗，前三个月你会动哪一件事？',
    tail:'万一你判断错了呢？你怎么发现？' },

  { id:'hr', n:'HR 面', icon:'▤',
    kws:['HR','资格审查','定薪','薪酬','谈薪','结构化面试'],
    how:['「上一份为什么离职」：会连着追三层',
         '「你的期望薪资是多少」，你报完她说「这个可能有点高」',
         '「中间这段空档在做什么」「有没有同时在谈别的」'],
    watch:'她的 KPI 是「招进来别出事」：看履历连续性、离职原因、有没有合规风险、稳定性。',
    trap:'吐槽前公司、离职原因前后不一致、薪资报得太随意（后面很难改口）。',
    tip:'离职原因要中性且一致，薪资给区间 + 依据（市场同岗中位），不要说「都可以」。',
    open:'先聊一下你的经历，然后我们对一下薪资预期。',
    tail:'这个数是怎么得出来的？你上一份的具体构成呢？' },

  { id:'founder', n:'创始人 / 老板', icon:'★',
    kws:['创始人','老板','总经理','长聊','股权','兑现'],
    how:['问你「你为什么选这个方向」，然后追问「那你为什么不去 XX 公司」',
         '聊到一半突然说起公司愿景，看你会不会接',
         '问「你能接受多大的不确定性」'],
    watch:'他看的是价值观和赌注：这个人能不能在没人管、也没有标准答案的时候仍然往前推。',
    trap:'只会附和愿景、把它当口号接。创始人一天要听十个人附和。',
    tip:'接愿景要给代价：我能接受 X，但我不接受 Y。有边界的人比会点头的人可信。',
    open:'先不聊岗位。你为什么要做这一行？',
    tail:'如果半年没有结果，你还会留吗？' },

  { id:'task', n:'实操 / 笔试型', icon:'✎',
    kws:['给个活干','试讲','实操验证','笔试','专业测','书面','异步任务','试用期小项目','Case','实地','走线'],
    how:['直接给一个真实的小任务，限时做，然后讲你的思路',
         '看你做的过程而不只看结果：「你为什么不选另一个方案」',
         '给一个信息不全的题，看你会不会主动问'],
    watch:'他看的只有一件事：你是真会做，还是真会说。这一轮几乎无法靠话术通过。',
    trap:'闷头做完不解释取舍；或者反过来只讲思路不动手（时间不够）。',
    tip:'先问清目标与交付标准（3 分钟），再动手；讲的时候按「取舍—证据—遗留问题」三段说。',
    open:'东西我发你了，先看 5 分钟，然后告诉我你打算怎么做。',
    tail:'你为什么选这个方案，不选另一个？' }
];

function ivState(){
  if(!S.iv || typeof S.iv!=="object") S.iv={ type:"", pressure:0 };
  return S.iv;
}
function ivTypeOf(id){
  for(var i=0;i<IV_TYPES.length;i++) if(IV_TYPES[i].id===id) return IV_TYPES[i];
  return null;
}
/* 从目标岗位的轮次里挑一个类型的锚点说明（真实的、不是编的） */
function ivAnchor(j, t){
  var rounds=(j&&j.rounds)||[];
  for(var i=0;i<rounds.length;i++){
    var n=String(rounds[i].n||"");
    for(var k=0;k<t.kws.length;k++) if(n.indexOf(t.kws[k])>=0) return rounds[i];
  }
  return null;
}
/* 推荐本场面试官：优先 JD 的第一轮角色；没有就按 hr 类型推 */
function ivRecommend(){
  var j=jdById(S.jd||(S.match&&S.match[0]&&S.match[0].id));
  var rounds=(j&&j.rounds)||[];
  if(rounds.length){
    var first=String(rounds[0].n||"");
    for(var k=0;k<IV_TYPES.length;k++){
      for(var m=0;m<IV_TYPES[k].kws.length;m++){
        if(first.indexOf(IV_TYPES[k].kws[m])>=0) return IV_TYPES[k].id;
      }
    }
  }
  var ht=(j&&j.hr&&j.hr.t)||"";
  if(/细节|保守|流程|规范/.test(ht)) return 'hr';
  if(/强势|尖锐|压力|挑刺/.test(ht)) return 'lead';
  return 'lead';
}
function ivPressureAuto(){
  var j=jdById(S.jd||(S.match&&S.match[0]&&S.match[0].id));
  var ht=(j&&j.hr&&j.hr.t)||"";
  return /强势|尖锐|压力|挑刺|抠/.test(ht) ? 1 : 0;
}

/* ---------- 「开始之前」那一块 ---------- */
function renderIvSetup(){
  var host=document.getElementById("ivSetup");
  if(!host) return;
  var st=ivState();
  /* 推荐出来的类型要落进状态：否则界面高亮着一类，S.iv.type 却是空的（我上一版就是这样） */
  if(!st.type) st.type=ivRecommend();
  var t=ivTypeOf(st.type)||ivTypeOf(ivRecommend());
  var j=jdById(S.jd||(S.match&&S.match[0]&&S.match[0].id));
  var anchor=ivAnchor(j,t), h="";

  h+='<div class="ivset">';
  h+='<div class="ivset-h"><b>① 这一场，谁面你</b>'+
     '<span class="ivrec">按你的目标岗位自动推的：'+(j?esc(j.title):"还没选岗位")+'</span></div>';
  h+='<div class="ivgrid">'+IV_TYPES.map(function(x){
      return '<button class="ivbtn'+(x.id===t.id?" on":"")+'" data-ivt="'+x.id+'">'+
        '<i>'+x.icon+'</i><b>'+esc(x.n)+'</b></button>';
    }).join("")+'</div>';

  /* 主按钮放在类型网格正下方：放在卡片后面会被挤到折叠线以下（截图才发现） */
  h+='<div class="ivset-f">'+
     '<button class="pri" id="ivStart">按这位面试官开始模拟</button>'+
     '<label class="ivck"><input type="checkbox" id="ivPress"'+(st.pressure?" checked":"")+'> 压力模式（他会打断、质疑、让你把话说完）</label>'+
     '</div>';
  h+='<div class="ivcard">';
  h+='<div class="ivcard-h"><b>'+esc(t.n)+'</b>'+
     (anchor?'<span class="ivanchor">你这岗位的第一轮：「'+esc(anchor.n)+'」：'+esc(anchor.what||"")+'</span>':'')+'</div>';
  h+='<div class="ivrow"><i>他会怎么问</i><ul>'+t.how.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul></div>';
  h+='<div class="ivrow"><i>他真正在看什么</i><span>'+esc(t.watch)+'</span></div>';
  h+='<div class="ivrow bad"><i>你最容易被问穿</i><span>'+esc(t.trap)+'</span></div>';
  h+='<div class="ivrow good"><i>应对口诀</i><span>'+esc(t.tip)+'</span></div>';
  if(j&&j.hr){
    h+='<div class="ivhr"><b>这个岗位自带的 HR 底色：'+esc(j.hr.t||"")+'</b>'+
       '<span>'+esc(j.hr.why||"")+'</span>'+
       '<em>'+esc(j.hr.how||"")+'</em></div>';
  }
  h+='</div>';
  h+='</div>';
  /* 进阶话术包（分享解锁）挂在设置区末尾：它属于「准备」，不属于「对阵」。 */
  h+='<div class="ivadv" id="ivAdvHost"></div>';
  host.innerHTML=h;
  if(typeof advPackHTML==="function"){
    var ah=document.getElementById("ivAdvHost");
    if(ah){ ah.innerHTML=advPackHTML("ivmatch"); if(typeof bindAdvPack==="function") bindAdvPack(ah,"ivmatch"); }
  }
  /* 没有进行中的模拟时，把对话区的空态占位清掉：
     上面这块已经说清了「从这里开始」，留着那句「回匹配页点…」是重复且指错路 */
  if(!S.sess){ var _m=document.getElementById("msgs"); if(_m) _m.innerHTML=""; }

  Array.prototype.forEach.call(host.querySelectorAll("[data-ivt]"),function(b){
    b.onclick=function(){ ivState().type=b.dataset.ivt; save(); renderIvSetup(); };
  });
  var ck=document.getElementById("ivPress");
  if(ck) ck.onchange=function(){ ivState().pressure=ck.checked?1:0; save(); };
  var sb=document.getElementById("ivStart");
  if(sb) sb.onclick=function(){
    ivState().type=t.id;
    if(st.pressure===undefined) ivState().pressure=ivPressureAuto();
    save(); startSim();
  };
  /* 两条鲨鱼面对面（duel.js）：插在标签栏上方那一格。
     「谁坐对面」只在开打之前有用，所以放在这里；换类型就要换人，
     由本函数统一刷新 ： 不要另找地方再渲染一遍。 */
  renderIvDuel();
}

/* ---------- 开场白 / 追问后缀（让整场模拟真的按类型走） ---------- */
function ivOpeningLine(){
  var t=ivTypeOf(ivState().type)||ivTypeOf(ivRecommend());
  var s=t?t.open:"我们开始吧。";
  if(ivState().pressure) s+="（语速很快）我有 20 分钟，直接进正题。";
  return (t?t.n:"面试官")+"：" + s;
}
function ivTailFor(i){
  var t=ivTypeOf(ivState().type);
  if(!t) return "";
  if(ivState().pressure && i%3===1) return "（打断）先停一下：你刚才那句，证据在哪？";
  if(i%3===2) return t.tail;
  return "";
}

/* ---------- 复盘里加一块：按这类面试官的标准 ---------- */
function ivReportBlock(){
  var t=ivTypeOf(ivState().type);
  if(!t) return "";
  var h='<div class="card ivrep"><h3>按「'+esc(t.n)+'」的标准，你这场的问题在哪</h3>';
  h+='<div class="ivrow"><i>他真正在看什么</i><span>'+esc(t.watch)+'</span></div>';
  h+='<div class="ivrow bad"><i>这一类的典型翻车</i><span>'+esc(t.trap)+'</span></div>';
  h+='<div class="ivrow good"><i>下一场照这句改</i><span>'+esc(t.tip)+'</span></div>';
  h+='<p class="note" style="margin-top:10px"><b>按面试官类型给的通用提示</b>，不评判你的稿子。'+
     '要逐字看，点下面的「让大模型按逐字稿重算一遍」。</p>';
  h+='<div class="ivrep-a"><button class="sm" id="ivSwitch">换一位面试官，只重看这一块</button></div>';
  h+='</div>';
  return h;
}
function bindIvReport(){
  var b=document.getElementById("ivSwitch");
  if(b) b.onclick=function(){
    openModal("换一位面试官", '<p>换完之后，模拟会按新类型出题，但这一场的记录不变。</p>'+
      '<div class="ivgrid">'+IV_TYPES.map(function(x){
        return '<button class="ivbtn" data-ivs="'+x.id+'"><i>'+x.icon+'</i><b>'+esc(x.n)+'</b></button>';
      }).join("")+'</div>', []);
    Array.prototype.forEach.call(document.querySelectorAll("[data-ivs]"),function(x){
      x.onclick=function(){ ivState().type=x.dataset.ivs; save(); closeModal(); renderReport(); toast("已换成："+ivTypeOf(x.dataset.ivs).n); };
    });
  };
}
