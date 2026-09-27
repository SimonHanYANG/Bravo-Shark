/* =====================================================================
   栏目概览区 + 纵向区块
   ---------------------------------------------------------------------
   为什么加这一层：
     改版前每个栏目从上到下都是一条「标题 → 说明 → 操作」的长流，
     读到中间就不知道自己走到哪一步了（用户的原话是「阅读不流畅、缺目标感」）。
     现在每个栏目在标题下面都被切成同一套纵向区块：

        ① 概览卡区 ： 四个数字（现状）
        ② 下一步条 ： 一句话说清「现在该做什么」，带一个直接入口
        ③ 主体 ： 各栏目自己的卡片区块（内部再用 .card-sec 纵向分段）

   ★ 数字一律**实时算**，不缓存。缓存过的数字会出现「我已经放鱼了，
     概览还写着 0 条」这种最伤信任的情况。
   ★ 「下一步」只给一条。给两条以上等于没给 ： 人会先跳过它。
   ===================================================================== */

/* 安全取值：任何模块缺失都不该让整个概览炸掉 */
function ovNum(fn, dft){
  try { var v = fn(); return (typeof v === "number" && isFinite(v)) ? v : (dft||0); }
  catch(e){ return dft || 0; }
}
function ovBool(fn){ try { return !!fn(); } catch(e){ return false; } }
function ovStr(fn, dft){ try { var v = fn(); return (v==null||v==="") ? (dft||"") : String(v); } catch(e){ return dft||""; } }

function ovFishToday(){
  var n = 0, t = today();
  (S.fish||[]).forEach(function(f){ if(f.d === t) n++; });
  return n;
}

/* ---------------------------------------------------------------------
   每个栏目：4 个数字 + 一条下一步
   返回 {stats:[...], next:{t:提示 HTML, btn:按钮文字, go:动作名}}
   --------------------------------------------------------------------- */
function ovData(v){
  if(v === "me"){
    var hasProf = ovBool(function(){ return S.prof && S.prof.words && S.prof.words.length; });
    return {
      /* ★ 原来这四个位置给的是鱼的数量、点赞数、已解锁外观、虚拟币 ——
         没有服务器就没有「点赞」，外观与虚拟币属装饰体系，四个位置里三个恒为 0。
         换成真实进度：画像 / 关键词 / 匹配 / 面试轮次。 */
      stats: [
        {value: hasProf ? "已生成" : "还没有", label: "画像", dim: !hasProf},
        {value: (S.sel||[]).length, label: "在意的关键词"},
        {value: (S.match||[]).length, label: "匹配到的岗位"},
        {value: ovNum(function(){ return S.sess && S.sess.turns && S.sess.turns.length; }), label: "面试已答轮次"}
      ],
      next: hasProf
        ? {t: "画像已经有了。去<b>职场画像</b>挑出你最在意的关键词，让 20 类岗位画像来筛你。",
           btn:"去职场画像", go:"job"}
        : {t: "还没有画像。先<b>把简历交出来</b>：画像会自动生成，后面每一栏都要用它。",
           btn:"去交简历", go:"job"}
    };
  }
  if(v === "chatter"){
    var n = (S.fish||[]).length, td = ovFishToday();
    return {
      stats: [
        {value: n, label: "鱼池里的鱼"},
        {value: td, label: "今天我记的"},
        {value: rhythmDaysSafe(), label: "节律记录天数", dim:1}
      ],
      next: td
        ? {t: "今天已经放过一条了。想看看别人的，往下翻鱼池；想记今天的状态，看上面的工作节律。",
           btn:"看看别人的鱼", go:null}
        : {t: "今天还没放。写下<b>现在最想说的那一句</b>，它会变成鱼池里的一条鱼：别人能给它点赞。",
           btn:"写下这一句", go:"#chatIn"}
    };
  }
  if(v === "grow"){
    return null;   /* 进化雷达自己已经有一整套数据面板，再加一层会重复 */
  }
  if(v === "job"){
    var hasRes = ovBool(function(){ return S.resume && S.resume.raw; });
    var selN = (S.sel||[]).length;
    var mN = ovNum(function(){ return S.match && S.match.length; });
    var fct = (S.resume && S.resume.facts) || {};
    /* ★ 空档案时**不渲染仪表盘**：四个 0（未交 / 0 关键词 / 0 岗位 / 0 你的鱼）
       会让人以为「这工具里什么都没有」。改成一句话，配合页面里的
       「先看一份样例画像」卡片（firstrun.js）——先给结果，再要输入。 */
    if(!hasRes){
      return { stats: [],
        next: {t: "还没交简历。可以<b>先看一份样例画像</b> —— 不用先填表，"+
                 "看完再决定要不要换成你自己的。", btn:"", go:null} };
    }
    return {
      stats: [
        {value: (fct.years==null ? "未识别" : fct.years), unit:(fct.years==null ? "" : " 年"),
         label: "识别到的年限", dim: fct.years==null},
        {value: (fct.skills||[]).length, label: "识别到的技能"},
        {value: (fct.nums||0), label: "量化成果"},
        {value: (S.prof && S.prof.labels ? S.prof.labels.length : 0), label: "画像标签"}
      ],
      next: (selN < 3
          ? {t: "简历已解析。接下来<b>挑 3—6 个你最在意的关键词</b>，再排个先后：顺序会影响筛选结果。",
             btn:"去挑关键词", go:"#jobTabs"}
          : (mN ? {t: "已经筛出岗位了。看中哪个就<b>直接进面试模拟</b>，把这一仗先打一遍。",
                   btn:"进面试模拟", go:"interview"}
                 : {t: "关键词有了，去<b>跑一次匹配</b>，看 20 类岗位画像怎么筛你。",
                    btn:"去匹配", go:"#jobTabs"}))
    };
  }
  if(v === "interview"){
    var round = ovNum(function(){ return S.sess && S.sess.turns && S.sess.turns.length; });
    var bk = (S.book||[]).length;
    return {
      stats: [
        {value: round, label: "已答轮次", dim: !round},
        {value: bk, label: "错题集"},
        {value: round >= 4 ? "可看" : ("再答 "+Math.max(0, 4-round)+" 轮"), label: "复盘", dim: round < 4},
        {value: (S.match||[]).length, label: "匹配到的岗位", dim:1}
      ],
      next: !round
        ? {t: "还没开始。<b>点下面的「开始模拟」</b>：答砸的题会自动进错题集，不用怕答错。",
           btn:"开始模拟", go:null}
        : (round < 4
          ? {t: "已经答了 "+round+" 轮。<b>答到第 4 轮</b>就能看复盘：太早看复盘，数据还说明不了什么。",
             btn:"继续答", go:null}
          : (bk
            ? {t: "复盘可以看了。错题集里有 <b>"+bk+" 道</b>：写一遍自己的版本再走，比再模拟十轮有用。",
               btn:"去看复盘", go:null}
            : {t: "四轮答完了，<b>复盘可以看了</b>。错题集是空的，说明这一轮答得挺稳。",
               btn:"去看复盘", go:null}))
    };
  }
  if(v === "dispute"){
    var ty = ovStr(function(){ return disType() && disType().n; });
    var done = ovNum(function(){ return S.dis ? Object.keys(S.dis.ans||{}).length : 0; });
    var dl = ovNum(function(){ return (S.dis && S.dis.date) ? Math.max(0, Math.floor((new Date(S.dis.date).getTime() + 31536000000 - Date.now())/86400000)) : 0; });
    return {
      stats: [
        {value: ty || "未选", label: "你的情况", dim: !ty},
        {value: done, label: "已确认的事实项"},
        {value: (S.dis && S.dis.date) ? dl + " 天" : "—", label: "距时效到期", dim: !(S.dis && S.dis.date)},
        {value: DIS_CASES.length, label: "别人的情况", dim:1}
      ],
      next: !ty
        ? {t: "还没选类型。往下<b>先选一个最接近的</b>：拿不准就选影响最大的那个，选错了也能改。",
           btn:"去选类型", go:null}
        : (done < 3
          ? {t: "已选「"+ty+"」。接下来<b>逐项确认事实</b>：填得越实，后面的清单越准。",
             btn:"去填事实", go:"#disTabs"}
          : {t: "事实确认得差不多了。<b>去「证据清单」</b>看你这一类该固定哪些东西，越早固定越省事。",
             btn:"去证据清单", go:null})
    };
  }
  if(v === "rival"){
    var rn = (S.rival||[]).length;
    var jd = ovBool(function(){ return S.rivalJd; });
    return {
      stats: [
        {value: rn, label: "追踪中的动态"},
        {value: jd ? "已填" : "未填", label: "目标岗位", dim: !jd},
        {value: (S.match||[]).length, label: "匹配到的岗位", dim:1}
      ],
      next: !jd
        ? {t: "先<b>填上你要抢的那个岗位</b>：不填的话，这里给的关键词都是通用的。",
           btn:"去填岗位", go:null}
        : (rn
          ? {t: "已经在追踪 <b>"+rn+" 条</b>了。查回来的东西要记下来，不然下次面试还是同一套说法。",
             btn:"再记一条", go:null}
          : {t: "还没记过。看到行业动态、公司动向、竞品信息，<b>随手记一条</b>：面试时这就是你的信息差。",
             btn:"记第一条", go:null})
    };
  }
  if(v === "tool"){
    return {
      stats: [
        {value: ovNum(function(){ return (typeof BBX!=="undefined" && BBX.length) || 0; }), label: "词库条数"},
        {value: ovBool(function(){ return S.bbxLast; }) ? "翻过" : "还没", label: "用过", dim: !S.bbxLast},
        {value: (typeof DIS_TYPES!=="undefined" ? DIS_TYPES.length : 0), label: "可处置的争议场景"}
      ],
      next: S.bbxLast
        ? {t: "刚翻过一句。**换位想一下**：他为什么这么说？把答案记下来，下次就不会被同一句话噎住。",
           btn:"再翻一句", go:"#bbxIn"}
        : {t: "把领导、HR 或面试官说的<b>那句原话</b>打进来：越接近原话，翻得越准。",
           btn:"去翻一句", go:"#bbxIn"}
    };
  }
  return null;
}

/* 节律记录天数（会员功能，未解锁时返回 0 而不是报错） */
function rhythmDaysSafe(){
  return ovNum(function(){
    var n = 0;
    (S.rhythm||[]).forEach(function(x){ if(x && x.h > 0) n++; });
    return n;
  });
}

/* ---------------------------------------------------------------------
   渲染与挂载
   --------------------------------------------------------------------- */
function ovBtnHTML(nx){
  if(!nx || !nx.btn) return "";
  return '<button type="button" class="ovgo" data-ovgo="'+esc(nx.go||"")+'">'+esc(nx.btn)+' →</button>';
}
function ovHTML(v){
  var d = ovData(v);
  if(!d) return "";
  /* ★ 空数组渲染出来是一个空的仪表盘框 —— 那正是「四个 0」观感的来源。 */
  var h = '<div class="ovwrap">' + ((d.stats && d.stats.length) ? vizStats(d.stats) : '');
  if(d.next){
    h += '<div class="ovnext"><p>下一步：'+d.next.t+'</p>'+ovBtnHTML(d.next)+'</div>';
  }
  return h + '</div>';
}

/* 挂到栏目标题下面。已经挂过就只换内容 ——
   重复插入会让标题下面堆出好几层概览。 */
function mountOverview(v){
  var pane = document.getElementById("v-" + v);
  if(!pane) return null;
  var vh = pane.querySelector(".vhead");
  if(!vh) return null;
  var host = pane.querySelector('[data-ov="' + v + '"]');
  if(!host){
    vh.insertAdjacentHTML("afterend", '<div data-ov="' + v + '"></div>');
    host = pane.querySelector('[data-ov="' + v + '"]');
    if(!host) return null;
  }
  var html = ovHTML(v);
  if(host.getAttribute("data-sig") !== html){
    host.innerHTML = html;
    host.setAttribute("data-sig", html);
    bindOv(host, v);
  }
  return host;
}

function bindOv(host, v){
  var b = host.querySelector("[data-ovgo]");
  if(!b) return;
  b.onclick = function(){
    var go = b.getAttribute("data-ovgo");
    if(!go){ return; }
    if(go.charAt(0) === "#"){                      /* 锚点：滚到该元素并聚焦 */
      var el = document.querySelector(go);
      if(el){
        el.scrollIntoView({behavior:"smooth", block:"center"});
        setTimeout(function(){ try{ el.focus(); }catch(e){} }, 320);
      }
      return;
    }
    if(go === "interview"){ view("interview"); return; }
    view(go);                                       /* 其余按视图名跳 */
  };
}
