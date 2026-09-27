/* =====================================================================
   工作状态：文档夹 + 作品与经历 + 简历 + 工作节律/心情曲线 + 能力雷达
   ---------------------------------------------------------------------
   从上到下的顺序，正好是一条「认识自己」的线：
     ① 文档夹     ： 面试材料、复盘、笔记，按文件夹收
     ② 作品与经历 ： 过往作品集、工作经验，可设提醒日期
     ③ 简历       ： 专门一块，默认放这里，随时改，双向同步职场画像
     ④ 工作节律   ： 记工时 + 每天的心情曲线
     ⑤ 能力雷达   ： 技能选择 + 自评 + 雷达图（纵向，不并列）
   ===================================================================== */

/* -------------------- ① 文档夹 -------------------- */
function docsState(){ if(!Array.isArray(S.docs)) S.docs = []; return S.docs; }
function docsFolders(){
  var set = [];
  docsState().forEach(function(d){ if(d.folder && set.indexOf(d.folder) < 0) set.push(d.folder); });
  return set;
}
function renderDocs(){
  var docs = docsState(), folders = docsFolders();
  var cur = S.docFilter || "全部";
  var list = cur==="全部" ? docs : docs.filter(function(d){ return d.folder===cur; });
  var h = '<div class="card"><h3>文档夹</h3>'+
    '<p class="note" style="margin-top:0"><b>只存在这台设备上</b>。点开就改，随时删。</p>'+
    '<div class="docchips">'+["全部"].concat(folders).map(function(f){
      return '<button type="button" class="sm'+(f===cur?" on":"")+'" data-docf="'+esc(f)+'">'+esc(f)+'</button>';
    }).join("")+'<button type="button" class="sm pri" id="docNew">＋ 新建文档</button></div>';
  if(!list.length){
    h += '<div class="evempty">这个夹子还是空的。点「＋ 新建文档」放第一份进来。</div>';
  } else {
    h += '<div class="doclist">'+list.map(function(d){
      return '<div class="docitem" data-docid="'+esc(d.id)+'">'+
        '<div class="docitem-h"><b>'+esc(d.title||"(无标题)")+'</b>'+
        (d.folder?'<span class="doctag">'+esc(d.folder)+'</span>':'')+
        '<span class="docitem-t">'+esc((d.at||"").slice(5,10))+'</span></div>'+
        (d.body?'<p class="note docprev">'+esc(d.body.slice(0,90))+(d.body.length>90?"…":"")+'</p>':'')+
        '<div class="docitem-a"><button class="sm" data-docopen="'+esc(d.id)+'">打开</button>'+
        '<button class="sm" data-docdel="'+esc(d.id)+'">删</button></div></div>';
    }).join("")+'</div>';
  }
  return h + '</div>';
}
function bindDocs(host){
  Array.prototype.forEach.call(host.querySelectorAll("[data-docf]"), function(b){
    b.onclick = function(){ S.docFilter = b.getAttribute("data-docf"); save(); renderStatus(); };
  });
  var nb = host.querySelector("#docNew");
  if(nb) nb.onclick = function(){ openDocEditor(null); };
  Array.prototype.forEach.call(host.querySelectorAll("[data-docopen]"), function(b){
    b.onclick = function(){ var id=b.getAttribute("data-docopen"); docsState().forEach(function(d){ if(d.id===id) openDocEditor(d); }); };
  });
  Array.prototype.forEach.call(host.querySelectorAll("[data-docdel]"), function(b){
    b.onclick = function(){ var id=b.getAttribute("data-docdel"); S.docs=docsState().filter(function(d){return d.id!==id;}); save(); renderStatus(); toast("文档已删"); };
  });
}
function openDocEditor(doc){
  var isNew = !doc;
  doc = doc || { id:"doc"+Date.now().toString(36), folder:"", title:"", body:"", at:today() };
  var h = '<div class="svcform">'+
    '<label class="rvfld"><span>标题</span><input id="docTitle" type="text" value="'+esc(doc.title)+'" placeholder="例：面试复盘 · 某公司二面"></label>'+
    '<label class="rvfld"><span>文件夹（可自由建新夹）</span><input id="docFolder" type="text" value="'+esc(doc.folder||"")+'" placeholder="例：面试材料 / 学习笔记"></label>'+
    '<label class="rvfld"><span>内容</span><textarea id="docBody" style="min-height:170px" placeholder="贴原文、写要点都行。只存在这台设备上。">'+esc(doc.body||"")+'</textarea></label>'+
    '</div>';
  openModal(isNew?"新建文档":"编辑文档", h, [
    {t:"取消", f:closeModal},
    {t:"保存", c:"pri", f:function(){
      doc.title = (document.getElementById("docTitle")||{}).value || "";
      doc.folder = (document.getElementById("docFolder")||{}).value || "";
      doc.body = (document.getElementById("docBody")||{}).value || "";
      doc.at = today();
      if(isNew) docsState().push(doc);
      save(); closeModal(); renderStatus(); toast("文档已保存");
    }}
  ]);
}

/* -------------------- ② 作品与经历 -------------------- */
function worksState(){ if(!Array.isArray(S.works)) S.works = []; return S.works; }
function workDueSoon(remind){
  if(!remind) return false;
  var t = new Date(remind + "T00:00:00").getTime();
  var today0 = new Date(); today0.setHours(0,0,0,0);
  var diff = Math.ceil((t - today0.getTime())/86400000);
  return diff <= 3;   /* 已到期或 3 天内 */
}
function renderWorks(){
  var ws = worksState();
  var wk = S.workFilter || "全部";
  var h = '<div class="card"><h3>作品与经历</h3>'+
    '<p class="note" style="margin-top:0">作品集与经历，<b>面试前翻一翻</b>。'+
    '每条都能设一个提醒日期，临近会在这里亮出来。</p>'+
    '<div class="docchips">'+["全部","作品","经历"].map(function(k){
      return '<button type="button" class="sm'+(k===wk?" on":"")+'" data-workf="'+k+'">'+k+'</button>';
    }).join("")+'<button type="button" class="sm pri" id="workNew">＋ 添加</button></div>';
  var list = wk==="全部" ? ws : ws.filter(function(w){ return w.kind===wk; });
  if(!list.length){
    h += '<div class="evempty">还没有作品或经历。点「＋ 添加」，把做过的事存进来。</div>';
  } else {
    h += '<div class="doclist">'+list.map(function(w){
      var due = workDueSoon(w.remind);
      return '<div class="docitem'+(due?" due":"")+'">'+
        '<div class="docitem-h"><b>'+esc(w.title||"(无标题)")+'</b>'+
        '<span class="doctag '+(w.kind==="经历"?"exp":"")+'">'+esc(w.kind)+'</span>'+
        (w.date?'<span class="docitem-t">'+esc(w.date)+'</span>':'')+
        (due?'<span class="docdue">⏰ '+esc(w.remind)+' 提醒</span>':'')+'</div>'+
        (w.detail?'<p class="note docprev">'+esc(w.detail.slice(0,100))+(w.detail.length>100?"…":"")+'</p>':'')+
        '<div class="docitem-a"><button class="sm" data-workopen="'+esc(w.id)+'">打开</button>'+
        '<button class="sm" data-workdel="'+esc(w.id)+'">删</button></div></div>';
    }).join("")+'</div>';
  }
  return h + '</div>';
}
function bindWorks(host){
  Array.prototype.forEach.call(host.querySelectorAll("[data-workf]"), function(b){
    b.onclick = function(){ S.workFilter = b.getAttribute("data-workf"); save(); renderStatus(); };
  });
  var nb = host.querySelector("#workNew");
  if(nb) nb.onclick = function(){ openWorkEditor(null); };
  Array.prototype.forEach.call(host.querySelectorAll("[data-workopen]"), function(b){
    b.onclick = function(){ var id=b.getAttribute("data-workopen"); worksState().forEach(function(w){ if(w.id===id) openWorkEditor(w); }); };
  });
  Array.prototype.forEach.call(host.querySelectorAll("[data-workdel]"), function(b){
    b.onclick = function(){ var id=b.getAttribute("data-workdel"); S.works=worksState().filter(function(w){return w.id!==id;}); save(); renderStatus(); toast("已删"); };
  });
}
function openWorkEditor(w){
  var isNew = !w;
  w = w || { id:"wk"+Date.now().toString(36), kind:"作品", title:"", detail:"", date:"", remind:"" };
  var h = '<div class="svcform">'+
    '<label class="rvfld"><span>类型</span><select id="workKind">'+
      '<option value="作品"'+(w.kind==="作品"?" selected":"")+'>作品集</option>'+
      '<option value="经历"'+(w.kind==="经历"?" selected":"")+'>工作经验</option></select></label>'+
    '<label class="rvfld"><span>标题</span><input id="workTitle" type="text" value="'+esc(w.title)+'" placeholder="作品名 / 公司 + 职位"></label>'+
    '<label class="rvfld"><span>时间</span><input id="workDate" type="text" value="'+esc(w.date||"")+'" placeholder="例：2024.03 或 2023—2025"></label>'+
    '<label class="rvfld"><span>详情</span><textarea id="workDetail" style="min-height:120px" placeholder="做了什么、拿到什么结果，带数字最好。">'+esc(w.detail||"")+'</textarea></label>'+
    '<label class="rvfld"><span>提醒日期（可选）</span><input id="workRemind" type="date" value="'+esc(w.remind||"")+'"></label>'+
    '</div>';
  openModal(isNew?"添加作品/经历":"编辑", h, [
    {t:"取消", f:closeModal},
    {t:"保存", c:"pri", f:function(){
      w.kind = (document.getElementById("workKind")||{}).value || "作品";
      w.title = (document.getElementById("workTitle")||{}).value || "";
      w.date = (document.getElementById("workDate")||{}).value || "";
      w.detail = (document.getElementById("workDetail")||{}).value || "";
      w.remind = (document.getElementById("workRemind")||{}).value || "";
      if(isNew) worksState().push(w);
      save(); closeModal(); renderStatus(); toast("已保存");
    }}
  ]);
}

/* -------------------- ③ 简历 -------------------- */
function statusResumeCard(){
  var raw = (S.resume && S.resume.raw) || "";
  return '<div class="card"><h3>简历</h3>'+
    '<p class="note" style="margin-top:0"><b>默认放这里</b>，随时能改。'+
    '改完去「职场画像」重新解析，画像会跟着更新。</p>'+
    '<textarea id="statusResume" aria-label="简历内容" '+
    'placeholder="把简历贴在这里。工作经历和项目经历那两段最重要，带数字带动作的最好。">'+
    esc(raw)+'</textarea>'+
    '<div class="acts"><button class="pri" id="statusResumeSave">保存简历</button>'+
    '<button id="statusResumeGo">去职场画像解析 →</button></div></div>';
}
function bindStatus(host){
  var ta = host.querySelector("#statusResume");
  var sv = host.querySelector("#statusResumeSave");
  if(sv && ta) sv.onclick = function(){
    S.resume = S.resume || {};
    S.resume.raw = ta.value.trim();
    save();
    var rr = document.getElementById("resumeRaw");
    if(rr) rr.value = S.resume.raw;
    toast("简历已保存");
  };
  var go = host.querySelector("#statusResumeGo");
  if(go) go.onclick = function(){ view("job"); };
}

/* -------------------- 主渲染 -------------------- */
function renderStatus(){
  var host = document.getElementById("statusOut");
  if(!host) return;
  var h = "";
  h += renderDocs();          /* ① 文档夹（最上面） */
  h += renderWorks();         /* ② 作品与经历 */
  h += statusResumeCard();    /* ③ 简历 */
  h += '<div id="rhythmBox"></div>';   /* ④ 工作节律 + 心情曲线 */
  /* ★ 这里原来也渲染一次能力雷达（和「进化雷达」页各一份）。
     同一块 UI 两个渲染入口，改一处漏一处，而且不报错。
     现在只留一个入口：evolve.js 的 renderEvolve。 */
  h += '<div class="frbox" style="margin-top:12px"><h4>能力雷达在「进化雷达」页</h4>'+
       '<p>同一块雷达原来在这个页面和「进化雷达」页各渲染一次，改一处漏一处。'+
       '现在只保留一个入口，点左侧<b>进化雷达</b>就能看到。</p></div>';
  host.innerHTML = h;
  bindDocs(host);
  bindWorks(host);
  renderRhythm();             /* 填节律（含心情曲线） */
  bindEvolve(host);           /* 雷达拖拽 + 自评 */
  bindStatus(host);           /* 简历保存 */
}
