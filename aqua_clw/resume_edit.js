/* =====================================================================
   resume_edit.js —— 自己编辑简历（结构化编辑器）
   ---------------------------------------------------------------------
   为什么要有它：原来的简历入口只能「整段粘贴 + 靠规则抓」，问题是
     · 简历原件写得乱、抓不准的人，没有任何补救手段 —— 只能改简历原文再贴一遍；
     · 抓错了也没法改，画像就一直是错的，后面岗位匹配全跟着错。
   这一版给的是「分条录入」：公司、职位、起止、做了什么各一格，
   填完自动拼回一段规范文本，再走原来那条解析管线 —— 不重写画像算法，
   画像 / 匹配 / 面试全都跟着更新。

   ★ 两条设计约束
     1. 不重写解析：编辑完只是「把文本写好一点」，仍然交给 extractFacts。
     2. 可逆：结构化数据存 S.resumeEdit，下次打开继续改；
        文本存 S.resume.raw，与手贴的简历完全等价。

   ★ 本文件不改任何样式表：样式随模块注入。原因见「CSS 变量陷阱」——
     样式一旦被子集化切走，界面会静默变白。所以这里的颜色全部带兜底值：
     var(--gold,#1E3A5F) 这样写，取不到也不会失效。
   ===================================================================== */
(function(){

  var SID = "re-style";
  var CSS = [
  "#reWrap{font-size:14px}",
  "#reWrap .re-sec{border:1px solid var(--line,#E4DBCC);border-radius:14px;padding:12px 14px;margin:0 0 12px;background:var(--bg2,#FFFDF9)}",
  "#reWrap .re-h{display:flex;align-items:center;gap:8px;margin:0 0 8px}",
  "#reWrap .re-h b{font-size:13.5px;color:var(--txt,#2B2620)}",
  "#reWrap .re-h em{font-style:normal;font-size:12px;color:var(--dim2,#8A8175);margin-left:auto}",
  "#reWrap .re-h button{font:inherit;font-size:12.5px;font-weight:700;padding:4px 11px;border-radius:999px;cursor:pointer;",
  "  border:1px solid var(--line2,#D6C9B4);background:var(--bg2,#FFFDF9);color:var(--dim,#5C554B)}",
  "#reWrap .re-h button:hover{background:var(--bg3,#F4EEE3);color:var(--txt,#2B2620)}",
  "#reWrap .re-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}",
  "#reWrap .re-row.one{grid-template-columns:1fr}",
  "#reWrap .re-row.three{grid-template-columns:1.2fr 1.2fr .9fr}",
  "#reWrap label{display:block}",
  "#reWrap label span{display:block;font-size:11.5px;font-weight:700;color:var(--dim2,#8A8175);margin-bottom:3px}",
  "#reWrap input,#reWrap textarea{width:100%;font:inherit;font-size:13.5px;padding:7px 10px;border-radius:10px;",
  "  border:1px solid var(--line2,#D6C9B4);background:var(--bg,#FAF7F1);color:var(--txt,#2B2620)}",
  "#reWrap textarea{min-height:72px;line-height:1.7;resize:vertical}",
  "#reWrap input:focus,#reWrap textarea:focus{outline:2px solid var(--gold2,#C9A227);outline-offset:1px}",
  "#reWrap .re-item{border:1px dashed var(--line2,#D6C9B4);border-radius:12px;padding:10px 12px;margin:0 0 9px;background:var(--bg,#FAF7F1)}",
  "#reWrap .re-item>header{display:flex;align-items:center;gap:8px;margin-bottom:7px}",
  "#reWrap .re-item>header b{font-size:12.5px;color:var(--gold2,#8A6D1F)}",
  "#reWrap .re-item>header .x{margin-left:auto;background:none;border:none;font-size:15px;line-height:1;cursor:pointer;color:var(--dim2,#8A8175);padding:0 3px}",
  "#reWrap .re-item>header .x:hover{color:var(--bad,#C9553D)}",
  "#reWrap .re-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}",
  "#reWrap .re-chips button{font:inherit;font-size:12px;padding:3px 9px;border-radius:999px;cursor:pointer;",
  "  border:1px solid var(--line2,#D6C9B4);background:var(--bg2,#FFFDF9);color:var(--dim,#5C554B)}",
  "#reWrap .re-chips button.on{background:var(--gold,#1E3A5F);border-color:var(--gold,#1E3A5F);color:#fff;font-weight:700}",
  "#reWrap .re-warn{margin:8px 0 0;font-size:12.5px;line-height:1.75;padding:8px 11px;border-radius:10px}",
  "#reWrap .re-warn.soft{background:#F6EEE4;color:#7A5230}",
  "#reWrap .re-warn.good{background:#E7F2ED;color:#0B6049}",
  "#reWrap .re-note{font-size:12px;color:var(--dim2,#8A8175);line-height:1.7;margin:6px 0 0}",
  "#reWrap .re-prev{margin-top:8px;font-size:12.5px;line-height:1.8;white-space:pre-wrap;color:var(--dim,#5C554B);",
  "  background:var(--bg3,#F4EEE3);border-radius:10px;padding:9px 12px;max-height:180px;overflow:auto}",
  "#reWrap .re-prev b{color:var(--txt,#2B2620)}"
  ].join("\n");

  function injectCSS(){
    if(document.getElementById(SID)) return;
    var s=document.createElement("style"); s.id=SID; s.textContent=CSS;
    document.head.appendChild(s);
  }
  function A(v){ return (v===undefined||v===null) ? "" : String(v); }
  function esc(v){
    if(typeof window.esc==="function"){ return window.esc(A(v)); }
    return A(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function toast_(m){
    if(typeof window.toast==="function"){ window.toast(m); return; }
    var t=document.getElementById("toast");
    if(!t){ t=document.createElement("div"); t.id="toast";
      t.style.cssText="position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:200;padding:9px 16px;border-radius:999px;background:rgba(28,22,16,.9);color:#fff;font-size:13.5px";
      document.body.appendChild(t); }
    t.textContent=m; t.style.display="block";
    clearTimeout(t._h); t._h=setTimeout(function(){ t.style.display="none"; },2200);
  }
  function save_(){ if(typeof window.save==="function"){ try{ window.save(); }catch(e){} } }

  /* ---------------- 数据模型 ---------------- */
  function blankRow(){ return {co:"",role:"",from:"",to:"",desc:""}; }
  function blankProj(){ return {name:"",role:"",desc:"",result:"",tags:[]}; }
  function blankEdu(){ return {school:"",major:"",degree:"",from:"",to:""}; }
  function blank(){
    return { on:true, name:"",city:"",title:"",years:"",edu:"本科",expect:"",
             skills:"", works:[blankRow()], projs:[], edus:[] };
  }
  function model(){
    if(!window.S) return blank();
    if(!S.resumeEdit || typeof S.resumeEdit!=="object") S.resumeEdit = blank();
    var d=S.resumeEdit;
    if(!Array.isArray(d.works)||!d.works.length) d.works=[blankRow()];
    if(!Array.isArray(d.projs)) d.projs=[];
    /* 老存档的项目没有 tags 字段 —— 不补上的话，勾选那一下会写进 undefined */
    d.projs.forEach(function(p){ if(p && !Array.isArray(p.tags)) p.tags=[]; });
    if(!Array.isArray(d.edus)) d.edus=[];
    ["name","city","title","years","edu","expect","skills"].forEach(function(k){
      if(typeof d[k]!=="string") d[k]=A(d[k]);
    });
    return d;
  }

  /* ---------------- 从已贴的简历里猜一版（并明确告诉用户这是猜的） ---------------- */
  function guessFromRaw(){
    var raw=(window.S && S.resume && S.resume.raw) ? S.resume.raw : "";
    if(!raw) return null;
    var d=blank(), lines=raw.split(/\r?\n/).map(function(x){ return x.trim(); }).filter(Boolean);
    var PERIOD=/(20\d{2})\s*[.\-/年]\s*(\d{1,2})?\s*[.\-/月]?\s*[-—~至到]+\s*(20\d{2}|至今|现在)\s*[.\-/年]?\s*(\d{1,2})?/;
    var cur=null, plain=[];
    lines.forEach(function(ln){
      var m=ln.match(PERIOD);
      if(m && /公司|集团|有限|科技|银行|医院|学院|事务所|中心|厂/.test(ln)){
        if(cur) d.works.push(cur);
        cur=blankRow();
        cur.from=m[1]+"."+(m[2]||"01");
        cur.to=(m[3]==="至今"||m[3]==="现在")?"至今":(m[3]+"."+(m[4]||"06"));
        var rest=ln.replace(PERIOD,"").replace(/[|·｜]/g," ").trim();
        var cm=rest.match(/([\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:公司|集团|银行|医院|学院|事务所|中心|厂))/);
        var sm=rest.match(/[\u4e00-\u9fa5]{0,20}(?:工程师|技术员|经理|主管|专员|设计师|会计|顾问|分析师|运营|销售|技师|助理|总监|总监|研究员|教师)/);
        cur.co = cm ? cm[1] : rest.slice(0,20);
        cur.role = sm ? sm[0] : "";
        return;
      }
      if(cur && /^[·\-•*]/.test(ln)){ cur.desc += (cur.desc?"\n":"") + ln.replace(/^[·\-•*]\s*/,""); return; }
      if(cur && ln.length>8 && !/^(姓名|求职|期望|电话|邮箱|技能|教育|项目)/.test(ln)){ cur.desc += (cur.desc?"\n":"") + ln; return; }
      plain.push(ln);
    });
    if(cur) d.works.push(cur);
    d.works=d.works.filter(function(w){ return w.co||w.role||w.desc; });
    var head=plain.join(" ");
    var nm=head.match(/姓\s*名[:：]?\s*([\u4e00-\u9fa5]{2,4})/);
    if(nm) d.name=nm[1];
    var city=head.match(/现居[:：]?\s*([\u4e00-\u9fa5]{2,8}?)(?:\s|·|·|$)|大连|沈阳|营口|鞍山/);
    if(city) d.city = (city[1]||city[0]).replace(/[市区]$/,"");
    if(!d.city) d.city="";
    var t=head.match(/求职意向[:：]?\s*([^\s，,。;；]{2,16})|期望岗位[:：]?\s*([^\s，,。;；]{2,16})/);
    if(t) d.title = t[1]||t[2]||"";
    if(!d.title && window.S && S.resume && S.resume.facts && S.resume.facts.inds && S.resume.facts.inds.length){
      d.title = "";
    }
    var y=raw.match(/(\d{1,2})\s*年(?:工作|从业|行业)/);
    if(y) d.years=y[1];
    var e=raw.match(/(博士|硕士|研究生|本科|大专|专科|中专|高中)/);
    if(e) d.edu = (e[1]==="研究生"?"硕士":e[1]==="专科"?"大专":e[1]);
    if(window.S && S.resume && S.resume.facts && S.resume.facts.skills && S.resume.facts.skills.length){
      d.skills = S.resume.facts.skills.slice(0,8).join("、");
    }
    if(!d.works.length) d.works=[blankRow()];
    d.on=false;   /* 标记「这是猜的」，用来在界面上提示 */
    return d;
  }

  /* ---------------- 拼回一段规范简历文本 ----------------
     ★ 文本格式不是随便写的：它要能被 extractFacts() 正确解析。
       关键三处：① 要出现「N 年工作」它才认得出年限；
                ② 描述里保留数字（「6 次」「1 次」）才算量化成果；
                ③ 公司名要带「公司/集团/有限」这类后缀才被认出来。 */
  function buildText(d){
    var L=[];
    var head=[d.name,d.city,d.title?("期望岗位："+d.title):"",d.edu].filter(Boolean).join(" · ");
    if(head) L.push(head);
    if(d.years) L.push(d.years+" 年工作经验");
    else if(d.works.length && d.works[0].from) L.push("");
    L.push("");
    L.push("工作经历");
    d.works.forEach(function(w){
      if(!(w.co||w.role||w.desc)) return;
      var period=[w.from,w.to].filter(Boolean).join("—");
      var line=[period,w.co,w.role].filter(Boolean).join("  ");
      L.push(line);
      A(w.desc).split(/\n/).forEach(function(x){ if(x.trim()) L.push("· "+x.trim()); });
      L.push("");
    });
    if(d.projs.length){
      L.push("项目经历");
      d.projs.forEach(function(p){
        if(!(p.name||p.desc||p.result)) return;
        L.push([p.name,p.role].filter(Boolean).join("  "));
        A(p.desc).split(/\n/).forEach(function(x){ if(x.trim()) L.push("· "+x.trim()); });
        if(p.result) L.push("· 结果："+p.result);
        L.push("");
      });
    }
    var edus=d.edus.filter(function(e){ return e.school||e.major; });
    if(edus.length){
      L.push("教育经历");
      edus.forEach(function(e){
        L.push([[e.from,e.to].filter(Boolean).join("—"),e.school,e.major,e.degree].filter(Boolean).join("  "));
      });
      L.push("");
    }
    if(d.skills){
      L.push("技能");
      L.push(d.skills);
    }
    return L.join("\n").replace(/\n{3,}/g,"\n\n").trim();
  }

  /* ---------------- 自检：这一段写清楚了没有 ----------------
     用的是本项目原本就有的判据（模糊词 / 量化数字 / 公司后缀），
     不是我自己另立一套标准。 */
  var VAGUE=/相关工作|等等|参与|协助|支持|负责日常|一定的/;
  function audit(d){
    var txt=buildText(d);
    var chars=txt.replace(/\s/g,"").length;
    var vague=(txt.match(new RegExp(VAGUE.source,"g"))||[]).length;
    var nums=(txt.match(/\d+(?:\.\d+)?\s*(?:%|万|亿|人|个|倍|次|条|家)/g)||[]).length;
    var noPeriod=d.works.filter(function(w){ return (w.co||w.role) && !w.from; }).length;
    return {chars:chars,vague:vague,nums:nums,noPeriod:noPeriod,text:txt};
  }

  /* ---------------- 渲染 ---------------- */
  function itemHTML(kind,i,it){
    var head, body;
    if(kind==="work"){
      head='<b>第 '+(i+1)+' 段</b>';
      body=
        '<div class="re-row three">'+
          '<label><span>起（YYYY.MM）</span><input data-k="from" value="'+esc(it.from)+'" placeholder="2021.07"></label>'+
          '<label><span>止（YYYY.MM 或 至今）</span><input data-k="to" value="'+esc(it.to)+'" placeholder="2025.06"></label>'+
          '<label><span>职位</span><input data-k="role" value="'+esc(it.role)+'" placeholder="电气 / PLC 工程师"></label>'+
        '</div>'+
        '<div class="re-row one"><label><span>单位全名（带「公司 / 集团 / 有限」才认得出）</span>'+
          '<input data-k="co" value="'+esc(it.co)+'" placeholder="大连华隆装备制造有限公司"></label></div>'+
        '<label><span>做了什么（一行一条。带数字的最好）</span>'+
          '<textarea data-k="desc" placeholder="负责产线 PLC 程序维护与改造，把非计划停机从每月 6 次降到 1 次">'+esc(it.desc)+'</textarea></label>';
    } else if(kind==="proj"){
      head='<b>项目 '+(i+1)+'</b>';
      body=
        '<div class="re-row">'+
          '<label><span>项目名</span><input data-k="name" value="'+esc(it.name)+'" placeholder="某产线设备联网改造"></label>'+
          '<label><span>你的角色</span><input data-k="role" value="'+esc(it.role)+'" placeholder="电气主责"></label>'+
        '</div>'+
        '<div class="re-row one"><label><span>做了什么</span><textarea data-k="desc">'+esc(it.desc)+'</textarea></label></div>'+
        '<div class="re-row one"><label><span>结果（数字优先）</span><input data-k="result" value="'+esc(it.result)+'" placeholder="停机时间下降 80%"></label></div>'+
        /* ★ 2026-09-27：项目要能挂「用到哪些能力」。进化雷达的「能力分析」找证据时
           先认这里的标签，再去正文里做关键词匹配 —— 没有标签就只能靠猜，会误判。 */
        '<label><span>用到哪些能力（勾一下，能力分析靠它找证据）</span></label>'+
        projTags(it);
    } else {
      head='<b>教育 '+(i+1)+'</b>';
      body=
        '<div class="re-row three">'+
          '<label><span>起</span><input data-k="from" value="'+esc(it.from)+'" placeholder="2017.09"></label>'+
          '<label><span>止</span><input data-k="to" value="'+esc(it.to)+'" placeholder="2021.06"></label>'+
          '<label><span>学历</span><input data-k="degree" value="'+esc(it.degree)+'" placeholder="本科"></label>'+
        '</div>'+
        '<div class="re-row">'+
          '<label><span>学校</span><input data-k="school" value="'+esc(it.school)+'" placeholder="大连理工大学"></label>'+
          '<label><span>专业</span><input data-k="major" value="'+esc(it.major)+'" placeholder="自动化"></label>'+
        '</div>';
    }
    return '<div class="re-item" data-kind="'+kind+'" data-i="'+i+'"><header>'+head+
           '<button type="button" class="x" data-del="'+kind+'" data-di="'+i+'" aria-label="删掉这一段">✕</button></header>'+body+'</div>';
  }

  /* 项目经历的能力标签。词表直接用进化雷达那一套（EV_SKILLS），
     这样「能力分析」里的四列才对得上同一批名字，不用做第二套映射。 */
  function projTags(it){
    if(typeof EV_SKILLS==="undefined" || !EV_SKILLS.length) return "";
    var have=(it && Array.isArray(it.tags)) ? it.tags : [];
    return '<div class="re-chips">'+EV_SKILLS.map(function(sk){
      var on = have.indexOf(sk.id)>=0;
      var nm = String(sk.n).split(/[／/（(]/)[0].trim();
      return '<button type="button" data-ptag="'+esc(sk.id)+'"'+(on?' class="on"':'')+'>'+esc(nm)+'</button>';
    }).join("")+'</div>';
  }

  function skillChips(cur){
    var pool=[];
    if(typeof window.SKILLDIC!=="undefined" && SKILLDIC){ pool=Object.keys(SKILLDIC); }
    if(!pool.length) pool=["PLC","设备维护","点检标准","数据采集","工艺优化","质量体系","项目管理","Excel 建模","跨部门沟通","排产","成本核算","安全规范"];
    pool=pool.slice(0,28);
    var have=cur||"";
    return '<div class="re-chips">'+pool.map(function(k){
      var on = have.indexOf(k)>=0;
      return '<button type="button" data-skill="'+esc(k)+'"'+(on?' class="on"':'')+'>'+esc(k)+'</button>';
    }).join("")+'</div>';
  }

  function bodyHTML(d){
    var a=audit(d);
    var warn;
    if(a.chars<80) warn='<p class="re-warn soft"><b>还太短（'+a.chars+' 字）。</b>画像至少需要 80 个字才不至于乱猜。</p>';
    else if(a.nums===0) warn='<p class="re-warn soft"><b>一处数字成果都没有。</b>「做了什么」谁都会写，「做到什么程度」才是分水岭 —— 加一句「把 X 从 4 次降到 1 次」这类。</p>';
    else if(a.vague>=3) warn='<p class="re-warn soft"><b>模糊词 '+a.vague+' 处。</b>「参与 / 协助 / 负责日常」会让画像偏保守，换成你亲自做的那个动作。</p>';
    else warn='<p class="re-warn good"><b>可以了。</b>'+a.chars+' 字 · 量化成果 '+a.nums+' 处 · 模糊词 '+a.vague+' 处。</p>';
    if(a.noPeriod) warn+='<p class="re-warn soft">有 '+a.noPeriod+' 段经历没填起始时间 —— 年限算不出来，岗位匹配会缺少时间维度。</p>';

    var h='<div id="reWrap">';
    if(d.on===false) h+='<p class="re-warn soft"><b>下面这些是从你贴的简历里猜的。</b>逐条核对一遍再保存 —— 猜错的字段会让画像跟着错。</p>';
    h+='<div class="re-sec"><div class="re-h"><b>① 基本信息</b></div>'+
       '<div class="re-row three">'+
         '<label><span>姓名</span><input data-f="name" value="'+esc(d.name)+'" placeholder="王雨桐"></label>'+
         '<label><span>城市</span><input data-f="city" value="'+esc(d.city)+'" placeholder="大连"></label>'+
         '<label><span>工作年限</span><input data-f="years" value="'+esc(d.years)+'" placeholder="4"></label>'+
       '</div>'+
       '<div class="re-row three">'+
         '<label><span>最高学历</span><input data-f="edu" value="'+esc(d.edu)+'" placeholder="本科"></label>'+
         '<label><span>期望岗位</span><input data-f="title" value="'+esc(d.title)+'" placeholder="电气 / PLC 工程师"></label>'+
         '<label><span>期望城市</span><input data-f="expect" value="'+esc(d.expect)+'" placeholder="大连"></label>'+
       '</div>'+
       '<label><span>技能（顿号或逗号分开，也可以点下面的词）</span>'+
         '<input data-f="skills" value="'+esc(d.skills)+'" placeholder="PLC、设备维护、数据采集"></label>'+
       skillChips(d.skills)+
       '</div>';

    h+='<div class="re-sec"><div class="re-h"><b>② 工作经历</b><em>'+d.works.length+' 段</em>'+
       '<button type="button" data-add="work">＋ 加一段</button></div>'+
       d.works.map(function(w,i){ return itemHTML("work",i,w); }).join("")+
       '<p class="re-note">没有工作经历就留空，直接保存也行 —— 画像会以「应届 / 转行」的假设来算。</p></div>';

    h+='<div class="re-sec"><div class="re-h"><b>③ 项目经历</b><em>'+d.projs.length+' 项</em>'+
       '<button type="button" data-add="proj">＋ 加一项</button></div>'+
       (d.projs.length ? d.projs.map(function(p,i){ return itemHTML("proj",i,p); }).join("")
                       : '<p class="re-note">还没有。项目经历对「转行」和「跨行业」的人最有用：它证明能力能搬走。</p>')+'</div>';

    h+='<div class="re-sec"><div class="re-h"><b>④ 教育经历</b><em>'+d.edus.length+' 条</em>'+
       '<button type="button" data-add="edu">＋ 加一条</button></div>'+
       (d.edus.length ? d.edus.map(function(e,i){ return itemHTML("edu",i,e); }).join("")
                      : '<p class="re-note">还没有。只填最高学历也够。</p>')+'</div>';

    h+=warn;
    h+='<details class="re-sec"><summary style="cursor:pointer;font-weight:700;color:var(--gold2,#8A6D1F)">看看拼出来的简历长什么样</summary>'+
       '<div class="re-prev">'+esc(a.text||"（还是空的）")+'</div>'+
       '<p class="re-note">保存时写进简历框的就是这一段。它是纯文本，你可以随时复制走、拿去做别的用途。</p></details>';
    h+='</div>';
    return h;
  }

  /* ---------------- 从 DOM 收回数据（每次重绘前先调） ---------------- */
  function collect(d,root){
    if(!root) return d;
    Array.prototype.forEach.call(root.querySelectorAll("[data-f]"),function(el){
      d[el.getAttribute("data-f")]=el.value;
    });
    ["work","proj","edu"].forEach(function(kind){
      var key = kind==="work"?"works":kind==="proj"?"projs":"edus";
      Array.prototype.forEach.call(root.querySelectorAll('.re-item[data-kind="'+kind+'"]'),function(el){
        var i=+el.getAttribute("data-i");
        if(!d[key][i]) return;
        Array.prototype.forEach.call(el.querySelectorAll("[data-k]"),function(inp){
          d[key][i][inp.getAttribute("data-k")]=inp.value;
        });
      });
    });
    return d;
  }

  function open(){
    injectCSS();
    var d=model();
    if(!d.works.filter(function(w){return w.co||w.role||w.desc;}).length && (window.S&&S.resume&&S.resume.raw)){
      var g=guessFromRaw();
      if(g && g.works.filter(function(w){return w.co||w.role||w.desc;}).length){
        g.name=g.name||d.name; g.city=g.city||d.city; g.title=g.title||d.title;
        g.years=g.years||d.years; g.edu=g.edu||d.edu; g.skills=g.skills||d.skills;
        S.resumeEdit=g; d=g;
      }
    }
    if(!d.works.length) d.works=[blankRow()];

    function paint(){
      openModal("自己编辑简历", bodyHTML(d), [
        {t:"保存并重新解析", c:"pri", f:function(){
          collect(d, document.getElementById("mBody"));
          d.on=true;
          var txt=buildText(d);
          if(txt.replace(/\s/g,"").length<80){ toast_("还不到 80 个字，画像会不准 —— 再补两句"); paint(); return; }
          S.resumeEdit=d;
          var ta=document.getElementById("resumeRaw");
          if(ta) ta.value=txt;
          save_();
          var ok=true;
          try{ if(typeof window.doParse==="function") doParse(); }catch(e){ ok=false; toast_("简历已保存，但自动解析这一步报错："+e.message); }
          if(ok) toast_("简历已保存并重新解析");
          closeModal();
        }},
        {t:"复制文本", c:"", f:function(){
          collect(d, document.getElementById("mBody"));
          var txt=buildText(d);
          try{
            if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt); toast_("已复制到剪贴板"); }
            else { toast_("这个浏览器不让自动复制，请展开下面的预览手动选"); }
          }catch(e){ toast_("复制失败，展开下面的预览手动选"); }
        }},
        {t:"取消", c:"", f:function(){ closeModal(); }}
      ]);
    }
    paint();

    var host=document.getElementById("mBody");
    if(!host) return;

    /* 事件：全部走委托。逐个绑会在重绘后失效 —— 这类「点了没反应」最难查。 */
    host.addEventListener("input", function(ev){
      var el=ev.target;
      if(el && el.getAttribute && (el.getAttribute("data-f")||el.getAttribute("data-k"))){
        collect(d, host);
        var dts=host.querySelector("details");
        if(dts && dts.open){ var pv=host.querySelector(".re-prev"); if(pv) pv.textContent=buildText(d)||"（还是空的）"; }
      }
    });
    host.addEventListener("click", function(ev){
      var el=ev.target;
      if(!el || !el.getAttribute) return;
      if(el.getAttribute("data-del")){
        collect(d, host);
        var kind=el.getAttribute("data-del"), i=+el.getAttribute("data-di");
        var key = kind==="work"?"works":kind==="proj"?"projs":"edus";
        d[key].splice(i,1);
        if(kind==="work" && !d.works.length) d.works=[blankRow()];
        S.resumeEdit=d; save_(); paint(); return;
      }
      if(el.getAttribute("data-add")){
        collect(d, host);
        var k2=el.getAttribute("data-add");
        if(k2==="work") d.works.push(blankRow());
        else if(k2==="proj") d.projs.push(blankProj());
        else d.edus.push(blankEdu());
        S.resumeEdit=d; save_(); paint(); return;
      }
      if(el.getAttribute("data-ptag")){
        collect(d, host);
        var pk=el.getAttribute("data-ptag");
        var pe=(el.closest?el.closest(".re-item"):null);
        var pi=pe? +pe.getAttribute("data-i") : -1;
        if(pi>=0 && d.projs[pi]){
          if(!Array.isArray(d.projs[pi].tags)) d.projs[pi].tags=[];
          var arr=d.projs[pi].tags, at2=arr.indexOf(pk);
          if(at2>=0) arr.splice(at2,1); else arr.push(pk);
          S.resumeEdit=d; save_();
          el.classList.toggle("on", at2<0);
        }
        return;
      }
      if(el.getAttribute("data-skill")){
        var w=el.getAttribute("data-skill");
        collect(d, host);
        var cur=d.skills? d.skills.split(/[、,，]/).map(function(x){return x.trim();}).filter(Boolean) : [];
        var at=cur.indexOf(w);
        if(at>=0) cur.splice(at,1); else cur.push(w);
        d.skills=cur.join("、");
        S.resumeEdit=d; save_();
        var inp=host.querySelector('[data-f="skills"]'); if(inp) inp.value=d.skills;
        Array.prototype.forEach.call(host.querySelectorAll("[data-skill]"),function(b){
          b.classList.toggle("on", b.getAttribute("data-skill")===w ? at<0 : b.classList.contains("on"));
        });
        var pv2=host.querySelector(".re-prev"); if(pv2) pv2.textContent=buildText(d)||"（还是空的）";
        return;
      }
    }, true);
  }

  /* ---------------- 把入口挂上去 ----------------
     宿主是 #btnParse（两版都在）。用运行时注入而不是改 body.html：
     两个构建树共用同一个文件，避免「改了一处忘了另一处」。 */
  function ensure(){
    if(!document.getElementById("btnParse")) return false;
    if(document.getElementById("btnEditResume")) return true;
    var b=document.createElement("button");
    b.id="btnEditResume"; b.type="button"; b.textContent="✎ 自己编辑简历";
    b.title="不用整段粘贴：分条填，填完自动拼成简历并更新画像";
    b.onclick=open;
    var anchor=document.getElementById("btnParse");
    anchor.parentNode.insertBefore(b, anchor.nextSibling);
    return true;
  }

  function boot(){
    injectCSS();
    var tries=0;
    (function loop(){
      if(ensure() || tries++>20) return;
      setTimeout(loop,150);
  })();
  /* 切视图后宿主可能被重新渲染，包一层再确认一次 */
  if(typeof window.view==="function" && !window.view._reWrapped){
    var orig=window.view;
    var wrapped=function(v){ var r=orig.apply(this,arguments); try{ ensure(); }catch(e){} return r; };
    wrapped._reWrapped=true;
    window.view=wrapped;
  }
}

if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded",boot); }
else { boot(); }

window.openResumeEditor=open;
window.resumeEditText=function(){ return buildText(model()); };
})();
