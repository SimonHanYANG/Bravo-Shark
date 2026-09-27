/* =====================================================================
   你的竞品 ： 同一岗位的其他人，以及去哪儿看他们的动态
   ★ 关于「同步近期行业信息」：这是一份本地单文件，不联网、也没有后端，
     它无法自己拿到今天的新闻。**我不编造行业数据**。
     所以「同步」在这里的做法是：
       ① 用本地已有的真实数据算清「你在跟谁抢」（画像是本地算的，不是编的）
       ② 把信息入口 + 关键词拼好，点开就是真实且最新的内容（招聘平台/社区/公告）
       ③ 可选：用你自己的模型接口做一次趋势摘要，并强制标注「模型知识会过时」
       ④ 你看回来的东西，存成本地「竞品动态」，还能一键转成待办
     这四条都不假装能自动抓新闻，但每一条都真的能用。
   ===================================================================== */

/* 竞争热度：静态分档，来源是本工具的粗略判断，不是实时招聘数据。
   要改就直接改这张表。 */
var RIVAL_HEAT = {
  "互联网/IT":3, "AI/大模型":3, "金融/保险":3, "消费/零售":2, "制造/工业":2,
  "医疗/健康":2, "教育/培训":3, "文旅/酒店":2, "体制内/国企":3, "公益/非营利":1,
  "法律/合规":2, "咨询/审计":2, "设计/创意":3, "传媒/营销":3, "销售/商务":2,
  "人力/行政":3, "物流/供应链":1, "房地产/建筑":2, "能源/化工":1, "半导体/通信":2,
  "汽车/新能源":2, "航空航天":1, "农业/食品":1, "宠物/本地生活":2,
  "体育/娱乐":2, "美容/医美":2, "跨境电商":2
};
var RIVAL_HEAT_NOTE = {
  1:"口径窄、专业门槛高，能替代你的人少",
  2:"中等：既看专业深度，也看通用能力",
  3:"宽口径高热：跨专业也能投，同岗候选人基数大"
};
var RIVAL_HEAT_NAME = { 1:"偏低", 2:"中等", 3:"偏高" };

function rivalState(){
  if(!Array.isArray(S.rival)) S.rival=[];
  if(typeof S.rivalTab!=="number") S.rivalTab=0;
  if(typeof S.rivalJd!=="string") S.rivalJd="";
  if(typeof S.rivalNote!=="string") S.rivalNote="";
  return S.rival;
}
function rvGrams(s){
  var t=String(s||"").replace(/[\s，,。、；;：:（）()【】\[\]！!？?～~…"'"'《》·—\-]/g,"").toLowerCase();
  var o=[]; for(var i=0;i<t.length-1;i++) o.push(t.slice(i,i+2));
  return o;
}
/* 我手上的"筹码"：七词 + 画像标签（名称/类型名/优势）+ 四维两端词 */
function rivalChips(){
  var out=[];
  (S.sel||[]).forEach(function(w){ out.push(w); });
  var L=(S.prof&&S.prof.labels)||[];
  L.forEach(function(l){
    var p=l.p||{};
    [p.t,p.n,p.aka,p.adv].forEach(function(x){ if(x) out.push(x); });
  });
  var q=S.prof&&S.prof.quad;
  if(q){ [q.mot,q.cog,q.sty,q.soc].forEach(function(o){ if(o){ out.push(o.a); out.push(o.b); } }); }
  return uniq(out.filter(Boolean));
}
/* 一条岗位要求 vs 我的筹码：2-gram 重合度 */
function rivalMatchNeed(need, chips){
  var g=rvGrams(need), seen={}, uniqG=[];
  g.forEach(function(x){ if(!seen[x]){seen[x]=1;uniqG.push(x);} });
  if(!uniqG.length) return {hit:0, ratio:0, by:[]};
  var by=[];
  chips.forEach(function(c){
    var cg=rvGrams(c), n=0;
    cg.forEach(function(x){ if(seen[x]) n++; });
    if(n) by.push({c:c, n:n});
  });
  by.sort(function(a,b){ return b.n-a.n; });
  var got={}; by.forEach(function(x){ rvGrams(x.c).forEach(function(y){ if(seen[y]) got[y]=1; }); });
  var ratio=Object.keys(got).length/uniqG.length;
  return { hit:Math.round(ratio*100), ratio:ratio, by:by.slice(0,3).map(function(x){return x.c;}) };
}
function rivalJd(){
  var id=S.rivalJd||S.jd||"";
  for(var i=0;i<JDS.length;i++) if(JDS[i].id===id) return JDS[i];
  return JDS[0];
}
function rivalIndustry(){
  var f=S.resume.facts||{};
  var ind=(f.inds&&f.inds[0])||"";
  if(ind&&RIVAL_HEAT[ind]!=null) return ind;
  var j=rivalJd();
  for(var k=0;k<(j.tags||[]).length;k++) if(RIVAL_HEAT[j.tags[k]]!=null) return j.tags[k];
  return ind||"互联网/IT";
}
/* 同型 + 相邻型竞争者 */
function rivalPeers(){
  var q=S.prof&&S.prof.quad;
  if(!q) return {same:[], near:[]};
  var code=q.code, same=[], near=[];
  PERSONA100.forEach(function(p){
    if(p.d===code) same.push(p);
    else{
      var d=0; for(var i=0;i<4;i++) if(p.d.charAt(i)!==code.charAt(i)) d++;
      if(d===1) near.push(p);
    }
  });
  return {same:same, near:near};
}

/* ---------------- 渲染 ---------------- */
function rv(i){
  S.rivalTab=i; save();
  if(S.view!=="rival") view("rival"); else applyRival();
}
function applyRival(){
  var i=S.rivalTab||0;
  Array.prototype.forEach.call(document.querySelectorAll(".rvpane"),function(el,k){
    el.style.display=(k===i)?"":"none";
  });
  Array.prototype.forEach.call(document.querySelectorAll("#rvTabs button"),function(b){
    b.classList.toggle("on", (+b.dataset.r)===i);
  });
  if(i===0) renderRivalWho();
  if(i===1) renderRivalWhere();
  if(i===2) renderRivalLog();
}

/* ---------- ① 我在跟谁抢 ---------- */
function renderRivalWho(){
  var host=document.getElementById("r0");
  if(!host) return;
  rivalState();
  var h="";
  h+='<div class="disbanner">这里的数字都来自<b>本地已有数据</b>（20 类岗位画像 + 100 型人格库 + 你的画像），'+
     '是规则估算，<b>不是实时招聘数据</b>。它能帮你把「我在跟谁抢」想清楚，但不能替代你去看真实岗位。</div>';

  if(!S.prof||!S.prof.labels||!S.prof.labels.length){
    h+='<div class="card hi"><h3>先有画像，才能算竞争面</h3>'+
       '<p class="note" style="margin-top:0">先交简历。没有画像，这一页的结果都是猜的。</p>'+
       '<div class="acts"><button class="pri big" id="rvGoJob">去交简历</button></div></div>';
    host.innerHTML=h;
    var g=document.getElementById("rvGoJob"); if(g) g.onclick=function(){ job(0); };
    return;
  }

  /* 选目标岗位 */
  var j=rivalJd();
  h+='<div class="discard"><h3>① 你要抢的是哪个岗位</h3>'+
     '<p class="note" style="margin-top:0">默认用「匹配」页选中的岗位，改这里只影响本页。</p>'+
     '<div class="rvsel"><label for="rvJdSel" class="sr">目标岗位</label>'+
     '<select id="rvJdSel">'+JDS.map(function(x){
       return '<option value="'+esc(x.id)+'"'+(x.id===j.id?" selected":"")+'>'+esc(x.title)+'</option>';
     }).join("")+'</select></div></div>';

  /* 同型竞争者 */
  var pr=rivalPeers();
  h+='<div class="discard"><h3>② 和你同型的人，正在同一个池子里</h3>';
  h+='<p class="note" style="margin-top:0">你的四维码是 <b class="hl">'+esc(S.prof.quad.code)+'</b>。'+
     '同型 <b>'+(pr.same.length||1)+'</b> 型，只差一维 <b>'+pr.near.length+'</b> 型。</p>';
  if(pr.same.length>1){
    h+='<div class="rvgrid">'+pr.same.map(function(p){
      return '<div class="rvcard"><b>'+esc(p.t)+'</b><small>'+esc(p.aka||"")+'</small>'+
        '<span class="rvgood">优势：'+esc(String(p.adv||"").slice(0,40))+'</span>'+
        '<span class="rvbad">盲区：'+esc(String(p.bl||"").slice(0,40))+'</span></div>';
    }).join("")+'</div>';
    h+='<div class="rvconcl">同型不是坏事，但它意味着一件事：<b>你和他们的自述会长得很像</b>。'+
       'HR 一天看几十份简历，「差不多」是不会被记住的：所以你必须要有一样东西是别人抄不走的：'+
       '一个带数字的结果、一段只有你有的经历、或者一个别人不敢给的判断。</div>';
  }else{
    h+='<div class="rvconcl">同型只有你这一型在库里（这一型比较少见）。'+
       '少见在筛选上既是优势也是风险：优势是容易被记住，风险是别人不知道拿你往哪个框里放：'+
       '<b>所以你要主动替 HR 把框画好</b>：一句话说清你是干什么的、适合什么岗位。</div>';
  }
  if(pr.near.length){
    h+='<details class="rvdet"><summary>和你只差一维的 '+(pr.near.length)+' 型（最容易被拿来跟你比）</summary><div class="rvnames">'+
       pr.near.slice(0,12).map(function(p){return '<span class="rvtip" title="'+esc(p.aka||"")+'">'+esc(p.t)+'</span>';}).join("")+
       (pr.near.length>12?'<span class="rvdim">…等 '+pr.near.length+' 型</span>':'')+'</div></details>';
  }
  h+='</div>';

  /* 岗位要求 vs 我的筹码 */
  var chips=rivalChips();
  var needs=(j.needs||[]).slice(0,7);
  var rows=needs.map(function(nd){ return {nd:nd, m:rivalMatchNeed(nd, chips)}; });
  rows.sort(function(a,b){ return a.m.ratio-b.m.ratio; });   /* 最弱的排前面 */
  var weak=rows.filter(function(r){ return r.m.ratio<0.2; });
  h+='<div class="discard"><h3>③ 这个岗位要的东西，你占了几条</h3>'+
     '<p class="note" style="margin-top:0">对照的是「'+esc(j.title)+'」的岗位要求，'+
     '和你的<b class="hl">七词 + 画像标签</b>做词面比对，<b>最弱的排最前</b>。</p>'+
     '<div class="rvneeds">'+rows.map(function(r){
       var tone = r.m.ratio>=0.34?"ok":(r.m.ratio>=0.2?"mid":"low");
       var label = tone==="ok"?"你占了":(tone==="mid"?"说不清":"看上去没占");
       return '<div class="rvneed '+tone+'"><div class="rvneed-h"><span class="rvtag">'+label+'</span>'+
         '<b>'+esc(r.nd)+'</b></div>'+
         (r.m.by.length?'<div class="rvneed-by">对得上：'+esc(r.m.by.join(" · "))+'</div>':
                        '<div class="rvneed-by">你的七词和画像里都找不到对应的说法</div>')+
       '</div>';
     }).join("")+'</div>';
  if(weak.length){
    h+='<div class="rvconcl warn">你最可能被挤掉的地方是：<b>'+esc(weak.slice(0,2).map(function(r){return r.nd.slice(0,26);}).join("；"))+'</b>。'+
       '不是因为你不行，是因为<b>简历里没有让人看见</b>。这两条要么补上证据，要么在面试里主动承认并给出替代方案。</div>';
  }else{
    h+='<div class="rvconcl ok">这一版的七词和画像基本盖住了岗位要求。'+
       '接下来的竞争点不在「有没有」，而在<b>你的证据有没有别人的硬</b>：去复盘页看六维里掉分的那几维。</div>';
  }
  h+='</div>';

  /* 竞争热度 */
  var ind=rivalIndustry();
  var base=RIVAL_HEAT[ind]||2;
  var sameInd=JDS.filter(function(x){ return (x.tags||[]).indexOf(ind)>=0; }).length;
  var lvl=clamp(base + (sameInd>=4?1:0), 1, 3);
  h+='<div class="discard"><h3>④ 这个池子有多挤</h3>'+
     '<div class="rvheat h'+lvl+'"><b>竞争热度：'+RIVAL_HEAT_NAME[lvl]+'</b>'+
     '<span>'+esc(RIVAL_HEAT_NOTE[lvl])+'</span></div>'+
     '<ul class="rvwhy">'+
       '<li>行业：<b>'+esc(ind)+'</b>（本工具里的静态分档 '+(RIVAL_HEAT[ind]||2)+'/3）</li>'+
       '<li>在 20 类岗位画像里，同行业标签的岗位有 <b>'+sameInd+'</b> 类'+
         (sameInd>=4?'：同类岗位多，意味着你的经历很容易被平移比较':'：同类岗位少，你的经历不太容易被直接类比')+'</li>'+
       '<li>你的岗位要求里，多少条是「跨专业也能投」的通用项，决定池子里混进来多少非对口的人</li>'+
     '</ul>'+
     '<div class="rvwhy-note">★ 上面这张分档表是本工具的静态判断，<b>不是实时招聘数据</b>。'+
     '要改成你自己的口径，直接改源码里的 <code>RIVAL_HEAT</code> 那张表。</div></div>';

  /* 岗位自带的风险点：20 类画像里每类都有 2–3 条。
     它和「要求」方向相反 ： 要求是你没占就吃亏，风险点是你把它当优势喊出来才吃亏。 */
  var risks=(j.risks||[]);
  if(risks.length){
    h+='<div class="discard"><h3>⑤ 这个岗位自己承认的坑</h3>'+
       '<p class="note" style="margin-top:0">这些风险来自<b>岗位位置本身</b>，和你个人无关。'+
       '知道它，你在面试里就不会把坑说成优点。</p><div class="rvneeds">';
    risks.forEach(function(rk){
      var m=rivalMatchNeed(rk, S.sel||[]);
      var echo = m.ratio>=0.2;
      h+='<div class="rvneed'+(echo?" low":"")+'">'+
         '<div class="rvneed-h">'+(echo?'<span class="rvtag">你的七词里有相近说法</span>':'')+
         '<b>'+esc(rk)+'</b></div>'+
         (echo?'<div class="rvneed-by">面试时别把它当口号喊：这个词在这个岗位上是<b>风险提示</b>，'+
               '要说就配一个你亲历的具体例子，说清代价和你当时的选择。</div>':'')+
       '</div>';
    });
    h+='</div></div>';
  }

  h+='<div class="disacts"><button class="pri" id="rvToWhere">看该去哪儿盯着 →</button></div>';
  host.innerHTML=h;
  var sel=document.getElementById("rvJdSel");
  if(sel) sel.onchange=function(){ S.rivalJd=sel.value; save(); renderRivalWho(); };
  var tw=document.getElementById("rvToWhere");
  if(tw) tw.onclick=function(){ rv(1); };
  host.insertAdjacentHTML('beforeend', momentHTML('rival'));
  bindMoment(host,'rival');
}

/* ---------- ② 去哪儿看（信息入口 + 关键词） ---------- */
function rivalKeywords(){
  var j=rivalJd(), ind=rivalIndustry();
  var f=S.resume.facts||{};
  var yrs=(f.years==null?"":(f.years+"年"));
  var L=(S.prof&&S.prof.labels)||[];
  var role=(j.title||"").split("·").pop().trim()||j.title||"";
  var kw=[];
  kw.push(ind+" "+role+" 面经");
  kw.push(role+" 简历 要求 2026");
  kw.push(role+" 面试 被问到的问题");
  kw.push(ind+" "+role+" 薪资 行情");
  if(yrs) kw.push(ind+" "+yrs+" 经验 求职 难度");
  /* 从七词里取两个最有区分度的，做一条"我的定位"搜索 */
  if((S.sel||[]).length) kw.push(role+" "+S.sel.slice(0,2).join(" "));
  return uniq(kw).slice(0,6);
}
function rivalSources(kw){
  var q=encodeURIComponent;
  var k0=kw[0]||"", k1=kw[1]||k0, k2=kw[2]||k0;
  return [
    {n:"BOSS直聘", u:"https://www.zhipin.com/web/geek/job?query="+q(k1), w:"看这个岗位现在真实要求的原文，别用你印象里的要求"},
    {n:"猎聘", u:"https://www.liepin.com/zhaopin/?key="+q(k1), w:"中高端岗更多，能看出同一岗位的「高级版」多要什么"},
    {n:"脉脉", u:"https://maimai.cn/search?q="+q(k0), w:"在职的人怎么说这家公司、这个岗（部分内容要登录）"},
    {n:"知乎", u:"https://www.zhihu.com/search?type=content&q="+q(k0), w:"面试经验与行业吐槽，注意区分时效"},
    {n:"小红书", u:"https://www.xiaohongshu.com/search_result?keyword="+q(k0), w:"近期面经密度最高的地方，按「最新」排序看"},
    {n:"微信搜一搜", u:"https://weixin.sogou.com/weixin?type=2&query="+q(k0), w:"公众号里的行业分析，比新闻深一层"},
    {n:"百度资讯", u:"https://www.baidu.com/s?rtt=1&tn=news&word="+q(k2), w:"近期的行业新闻，按时间排序看"},
    {n:"看准网", u:"https://www.kanzhun.com/search/?word="+q(k1), w:"目标公司的评价与薪酬区间"}
  ];
}
function rivalPrompt(){
  var j=rivalJd(), ind=rivalIndustry(), f=S.resume.facts||{};
  var L=(S.prof&&S.prof.labels)||[];
  var role=(j.title||"").split("·").pop().trim()||j.title||"";
  return [
    "你是一位在中国一线做过招聘的行业顾问。我要找的是「"+ind+"」行业的「"+role+"」岗位。",
    "",
    "请按下面四段写，每段都要短、要具体、不要客套：",
    "1. 近两年这个岗位的招聘要求发生了哪些**实际变化**（例如从看重什么，转为看重什么）。",
    "2. 现在筛简历时最常被直接刷掉的三类写法是什么（给反例原句）。",
    "3. 这个岗位的候选人在面试里最常翻车的地方，以及考官真正在验证什么。",
    "4. 如果我只有一段经历能拿出来说，应该挑哪种类型的事实（给一个句式模板）。",
    "",
    "硬性要求：",
    "- 凡是你不确定的，直接写「不确定」，不要编数字、不要编公司名、不要编政策条文。",
    "- 不要给我励志话术，我要能拿去改简历的东西。",
    "- 如果你认为我的前提（行业/岗位）本身有问题，先说这一点。",
    "",
    "我的背景（供你判断，不要复述）：约 "+((f.years==null)?"不清楚":f.years+" 年")+" 经验；"+
      "画像标签："+(L.map(function(x){return x.p.t;}).join("、")||"未生成")+"；"+
      "我最在意的七件事（按权重）："+((S.sel||[]).join(" > ")||"未选")
  ].join("\n");
}
function renderRivalWhere(){
  var host=document.getElementById("r1");
  if(!host) return;
  var kw=rivalKeywords(), src=rivalSources(kw);
  var h="";
  h+='<div class="disbanner"><b>先把话说清楚：</b>这是一份本地单文件，<b>不联网、没有后端</b>，'+
     '它拿不到今天的新闻。我不会为了好看往这里塞假消息。<br>'+
     '所以「同步」在这里是这么做的：<b>把你的行业和岗位拼成关键词，配上真实的信息入口</b>，'+
     '点开就是最新、且可核实的原文。<b>要判断真伪，看原始来源，不要看我的总结。</b></div>';

  h+='<div class="discard"><h3>① 你的关键词（已按你的行业与岗位拼好）</h3>'+
     '<p class="note" style="margin-top:0">下面的入口已经带上了关键词。</p>'+
     '<div class="rvkw">'+kw.map(function(k){
       return '<button class="rvkwbtn" data-kw="'+esc(k)+'">'+esc(k)+'</button>';
     }).join("")+'</div></div>';

  h+='<div class="discard"><h3>② 去哪儿看 ： 按「能看到什么」排的</h3><div class="rvsrc">';
  src.forEach(function(s){
    h+='<a class="rvsrcitem" href="'+esc(s.u)+'" target="_blank" rel="noopener noreferrer">'+
       '<b>'+esc(s.n)+'</b><span>'+esc(s.w)+'</span><i>点开新窗口 →</i></a>';
  });
  h+='</div><p class="tbnote" style="margin-top:10px">这些都是公开搜索入口，链接里只带了关键词，没有带你的任何个人信息。</p></div>';

  h+='<div class="discard"><h3>③ 竞品（人）动态里，该看哪几类信息</h3>'+
     '<ul class="rvwhy">'+
       '<li><b>岗位要求的原文</b>：招聘平台上的 JD 原文。看的是「它现在写什么」，不是你以为它写什么</li>'+
       '<li><b>近期面经</b>：小红书 / 知乎 / 脉脉。重点看最近 3 个月内、且和你的年资接近的</li>'+
       '<li><b>同岗在职的人</b>：脉脉上搜岗位名，看他们自己怎么描述工作内容：这决定你面试时该用什么词</li>'+
       '<li><b>公司侧的变化</b>：目标公司的官网招聘页、财报或公告页。招聘页常年挂着同一个岗位，说明一直在流失或一直在扩</li>'+
       '<li><b>行业侧的变化</b>：微信搜一搜的公众号文章深于新闻，百度资讯能按时间排</li>'+
     '</ul>'+
     '<div class="rvconcl">看回来之后<b>立刻做一件事</b>：把「和我的判断不一样的地方」记到第三页。'+
     '只看不记，一周之后你只会记得「好像挺难的」。</div></div>';

  h+='<div class="disacts"><button class="pri" id="rvPrompt">复制调研提示词（粘到任何模型里）</button>'+
     '<button id="rvLLM">用我的模型做一次趋势摘要</button></div>'+
     '<div id="rvLLMOut"></div>';
  host.innerHTML=h;

  Array.prototype.forEach.call(host.querySelectorAll("[data-kw]"),function(b){
    b.onclick=function(){ cp(b.dataset.kw); toast("关键词已复制"); };
  });
  var pp=document.getElementById("rvPrompt");
  if(pp) pp.onclick=function(){ cp(rivalPrompt()); toast("提示词已复制：粘到任意模型即可"); };
  var lb=document.getElementById("rvLLM");
  if(lb) lb.onclick=rivalLLM;
}
async function rivalLLM(){
  var out=document.getElementById("rvLLMOut");
  if(!out) return;
  if(typeof llmReady!=="function"||!llmReady()){
    out.innerHTML='<div class="card" style="margin-top:12px"><h3>还没配置模型</h3>'+
      '<p class="note" style="margin-top:0">这一步<b>可选</b>。也可以直接点上面的「复制调研提示词」，'+
      '粘到你常用的模型或搜索里，效果一样还不用配置。</p>'+
      '<div class="acts"><button id="rvToSet">去设置模型</button></div></div>';
    var s=document.getElementById("rvToSet"); if(s) s.onclick=function(){ openSet(); };
    return;
  }
  var j=rivalJd(), ind=rivalIndustry();
  var role=(j.title||"").split("·").pop().trim()||j.title||"";
  out.innerHTML='<div class="card" style="margin-top:12px"><h3>正在问你的模型…</h3>'+
    '<p class="note" style="margin-top:0">用的是你自己在「设置」里配的接口，内容只发给那个服务商。</p></div>';
  toast("正在生成趋势摘要…");
  var sys="你在帮一位中国求职者做行业调研。铁律：① 不确定就写「不确定」，绝对不许编数字、公司名、政策条文；"+
          "② 不写励志话术；③ 明确告诉你知识可能已过时；④ 用短句、可执行。";
  var usr="行业："+ind+"。岗位："+role+"。我的年资："+((S.resume.facts&&S.resume.facts.years!=null)?S.resume.facts.years+" 年":"不清楚")+"。\n\n"+
          "请分三段写，每段不超过 5 条：\n"+
          "A. 这个岗位近两年要求上的**实际变化**（如果不确定就直说不确定）。\n"+
          "B. 现在最容易被直接刷掉的简历写法（给反例原句）。\n"+
          "C. 面试里最常翻车的地方，以及考官真正在验证什么。\n\n"+
          "最后单独一行写：以上哪些内容你需要自己去核实。";
  try{
    var txt=await llm([{role:"system",content:sys},{role:"user",content:usr}],0.5);
    out.innerHTML='<div class="card hi rvllm" style="margin-top:12px">'+
      '<div class="rvllmwarn">★ 下面这段是<b>你自己配的那个模型</b>按它自己的知识写的，'+
      '模型的知识有截止时间，<b>可能过时、也可能记错</b>。它适合用来「提醒你该查什么」，'+
      '不能当成事实，更不能写进简历。请到第二页的入口去核实。</div>'+
      '<pre class="rvllmtxt">'+esc(txt)+'</pre>'+
      '<div class="acts"><button id="rvLLMCopy">复制这段</button>'+
      '<button id="rvLLMAgain">再问一次</button></div></div>';
    var c=document.getElementById("rvLLMCopy");
    if(c) c.onclick=function(){ cp(txt); toast("已复制（记得先核实再使用）"); };
    var a=document.getElementById("rvLLMAgain");
    if(a) a.onclick=rivalLLM;
  }catch(e){
    out.innerHTML='<div class="card" style="margin-top:12px"><h3>模型没答上来</h3>'+
      '<p class="note" style="margin-top:0">'+esc(e.message||"未知错误")+
      '<br>不影响用这一页：上面的信息入口和关键词是本地生成的，照样能用。</p></div>';
  }
}


/* ---------- 今日公开动态（2026-09-26）----------
   ★ 这一份文件不联网、没有后端，所以「今日动态」不可能是我们生成的。
     这里只做两件事：把关键词拼好、把公开平台的最新页排好 —— 点开看到的就是今天。
     我们不缓存、不摘要、不转述：一旦转述，假消息就变成了「我们说的」。 */
function rivalTodayHTML(){
  var kw=rivalKeywords(), q=encodeURIComponent;
  var k0=kw[0]||"职场", k1=kw[1]||k0;
  var rows=[
    {n:"脉脉", u:"https://maimai.cn/search?q="+q(k0), w:"在职的人今天在说什么（部分内容要登录）"},
    {n:"BOSS直聘", u:"https://www.zhipin.com/web/geek/job?query="+q(k1), w:"同岗 JD 的原文：它今天要求什么"},
    {n:"小红书", u:"https://www.xiaohongshu.com/search_result?keyword="+q(k0), w:"最新面经，按「最新」排序看"},
    {n:"知乎", u:"https://www.zhihu.com/search?type=content&q="+q(k0), w:"近期面试题与行业吐槽"},
    {n:"微博实时", u:"https://s.weibo.com/weibo?q="+q(k0), w:"按实时：这几小时里在讨论什么"},
    {n:"微信搜一搜", u:"https://weixin.sogou.com/weixin?type=2&query="+q(k0), w:"公众号的行业分析，比新闻深一层"}
  ];
  var h='<div class="discard rvtoday"><h3>今日公开动态</h3>'+
    '<div class="rvtgrid">'+rows.map(function(r){
      return '<a class="rvtitem" href="'+esc(r.u)+'" target="_blank" rel="noopener noreferrer">'+
        '<b>'+esc(r.n)+'</b><span>'+esc(r.w)+'</span><i>点开看今天 →</i></a>';
    }).join("")+'</div>'+
    '<p class="tbnote">这些是公开平台的最新页，<b>不是我们的内容</b>：本文件不联网，不生成、不缓存、不转述任何动态。'+
    '看到的原话归原平台，真假看原始来源。</p>'+
    '<div class="disacts"><button class="pri" id="rvTodayLog">今天看到一条 → 记下来</button></div></div>';
  return h;
}
/* ---------- ③ 竞品动态（看回来的东西，记下来） ---------- */
function rivalAdd(){
  var src=document.getElementById("rvSrc"), body=document.getElementById("rvBody"),
      imp=document.getElementById("rvImp"), nx=document.getElementById("rvNext");
  if(!body||!body.value.trim()){ toast("至少写一句你看到了什么"); return; }
  rivalState().unshift({
    id:"r"+Date.now().toString(36),
    src:(src&&src.value.trim())||"",
    body:body.value.trim(),
    imp:(imp&&imp.value.trim())||"",
    next:(nx&&nx.value.trim())||"",
    at:Date.now()
  });
  save(); renderRivalLog(); toast("记下了");
}
function rivalDel(id){
  var a=rivalState();
  for(var i=0;i<a.length;i++) if(a[i].id===id){ a.splice(i,1); break; }
  save(); renderRivalLog(); toast("删掉了");
}
function rivalToTodo(id){
  var a=rivalState(), x=null;
  for(var i=0;i<a.length;i++) if(a[i].id===id) x=a[i];
  if(!x) return;
  var txt=(x.next||x.body).trim();
  if(!txt){ toast("这条没写「下一步」，先补一句"); return; }
  if(todoAdd(txt)) toast("已加进最上面的待办");
}
function renderRivalLog(){
  var host=document.getElementById("r2");
  if(!host) return;
  var list=rivalState();
  var h=rivalTodayHTML();
  h+='<div class="disbanner">这一页是给你自己用的：把<b>看回来的、和你原来的判断不一样的东西</b>记下来。'+
     '记满一条，就有一次判断更新；只看不记，一周后只会剩下「好像挺难的」。</div>';
  h+='<div class="discard"><h3>记一条</h3>'+
     '<div class="rvform">'+
       '<label class="rvfld"><span>从哪儿看到的</span><input id="rvSrc" type="text" placeholder="例：脉脉 / BOSS直聘某个 JD / 某公众号文章"></label>'+
       '<label class="rvfld"><span>看到了什么（写原话或要点）</span><textarea id="rvBody" placeholder="例：这个岗位现在要求「有跨部门推动经验」，但我那份简历里全是自己扛的活"></textarea></label>'+
       '<label class="rvfld"><span>和我的判断不一样在哪</span><input id="rvImp" type="text" placeholder="例：我以为它更看重数据能力，更看重推得动别人"></label>'+
       '<label class="rvfld"><span>下一步做什么</span><input id="rvNext" type="text" placeholder="例：明天 10:00 把那个跨部门项目重写成一条（会自动带进待办）"></label>'+
     '</div>'+
     '<div class="disacts"><button class="pri" id="rvAddBtn">记下来</button></div></div>';

  if(list.length){
    h+='<div class="discard"><h3>我记过的 · '+list.length+' 条</h3>';
    h+=list.map(function(x){
      return '<div class="rvitem">'+
        '<div class="rvitem-h"><b>'+esc(String(x.body).slice(0,60))+'</b>'+
          '<span class="rvtime">'+new Date(x.at).toLocaleDateString()+'</span></div>'+
        (x.src?'<div class="rvitem-s">来源：'+esc(x.src)+'</div>':'')+
        (x.imp?'<div class="rvitem-i">和我的判断不一样：'+esc(x.imp)+'</div>':'')+
        (x.next?'<div class="rvitem-n">下一步：'+esc(x.next)+'</div>':'')+
        '<div class="rvitem-a"><button class="sm" data-rvtodo="'+esc(x.id)+'">→ 加进待办</button>'+
        '<button class="sm" data-rvdel="'+esc(x.id)+'">删</button></div>'+
      '</div>';
    }).join("");
    h+='</div>';
  }else{
    h+='<div class="card"><h3>还没有记录</h3><p class="note" style="margin-top:0">'+
       '去第二页点开几个入口，看到和你原来想的不一样的，回来记一条。</p>'+
       '<div class="acts"><button class="pri big" id="rvGoWhere">去看该去哪儿盯</button></div></div>';
  }
  host.innerHTML=h;
  var a=document.getElementById("rvAddBtn"); if(a) a.onclick=rivalAdd;
  var w=document.getElementById("rvGoWhere"); if(w) w.onclick=function(){ rv(1); };
  var tg=document.getElementById("rvTodayLog");
  if(tg) tg.onclick=function(){
    var b=document.getElementById("rvBody");
    if(b){ b.focus(); b.scrollIntoView({block:"center",behavior:"smooth"}); }
    toast("写在下面「看到了什么」那一栏");
  };
  Array.prototype.forEach.call(host.querySelectorAll("[data-rvdel]"),function(b){
    b.onclick=function(){ rivalDel(b.dataset.rvdel); };
  });
  Array.prototype.forEach.call(host.querySelectorAll("[data-rvtodo]"),function(b){
    b.onclick=function(){ rivalToTodo(b.dataset.rvtodo); };
  });
}
