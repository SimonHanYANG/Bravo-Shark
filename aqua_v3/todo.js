/* =====================================================================
   待办 · 提醒 · 日程
   ： 放在主内容区最上面，所有视图下都够得着（sticky 一行）。
   提醒分三层，按可靠性排序：
     ① 导出 .ics 到系统日历 ： 唯一在「关掉页面」之后还能提醒你的方式
     ② 页内提醒（到点前 15 分钟 / 到点）： 只在页面开着时有效
     ③ 系统通知 ： 页面开着且有权限时叠加
   ★ 诚实的边界：本地单文件没有后台，关掉页面它不会自己醒过来。
     所以把「真的会响的提醒」交给系统日历，而不是假装能做到。
   ===================================================================== */

function todoState(){
  if(!Array.isArray(S.todo)) S.todo=[];
  if(!S.todoFired||typeof S.todoFired!=="object") S.todoFired={};
  if(typeof S.todoOpen!=="boolean") S.todoOpen=false;
  return S.todo;
}
function pad2(n){ return (n<10?"0":"")+n; }
function fmtLocal(d){
  return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate())+"T"+pad2(d.getHours())+":"+pad2(d.getMinutes());
}
function todoById(id){
  var a=todoState();
  for(var i=0;i<a.length;i++) if(a[i].id===id) return a[i];
  return null;
}

/* ---------- 自然语言抓时间：把「明天 10:00」这类说法从标题里剥出来 ---------- */
function parseTodoInput(s){
  var t=String(s||"").trim(), due="";
  var now=new Date();
  var d=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  var today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  var dm=t.match(/(今天|明天|后天|大后天|(?:这|本|下)?周[一二三四五六日天]|\d{1,2}\s*[月\/]\s*\d{1,2}\s*日?)/);
  var daySaid=false;
  if(dm){
    var w=dm[1].replace(/\s/g,"");
    daySaid=true;
    if(w==="今天"){ /* 不动 */ }
    else if(w==="明天") d.setDate(d.getDate()+1);
    else if(w==="后天") d.setDate(d.getDate()+2);
    else if(w==="大后天") d.setDate(d.getDate()+3);
    else if(/周/.test(w)){
      var map={"一":1,"二":2,"三":3,"四":4,"五":5,"六":6,"日":0,"天":0};
      var target=map[w.charAt(w.length-1)];
      var add=(target-d.getDay()+7)%7;
      if(add===0) add=7;                 /* 说「周三」就按下一个周三算，避免指向过去 */
      if(/^下/.test(w)) add+= 7;
      d.setDate(d.getDate()+add);
    } else {
      var p=w.match(/(\d{1,2})\s*[月\/]\s*(\d{1,2})/);
      if(p){
        d.setMonth(+p[1]-1); d.setDate(+p[2]);
        if(d<today) d.setFullYear(d.getFullYear()+1);
      }
    }
    t=t.replace(dm[1]," ");
  }
  var hm=t.match(/(上午|中午|下午|晚上|早上|凌晨)?\s*(\d{1,2})\s*[:：点时]\s*(\d{1,2})?\s*分?/);
  if(hm){
    var hh=+hm[2], mi=+(hm[3]||0), ap=hm[1]||"";
    if(/下午|晚上|中午/.test(ap)&&hh<12) hh+=12;
    if(/凌晨/.test(ap)&&hh===12) hh=0;
    if(hh>23) hh=23;
    if(mi>59) mi=59;
    d.setHours(hh,mi,0,0);
    t=t.replace(hm[0]," ");
    due=fmtLocal(d);
  } else if(daySaid){
    d.setHours(9,0,0,0);                 /* 只说了哪一天 → 默认上午 9 点 */
    due=fmtLocal(d);
  }
  t=t.replace(/\s+/g," ").trim();
  return { title: t || String(s||"").trim(), due: due };
}

/* ---------- 分组 ---------- */
function todoGroups(){
  var a=todoState().slice();
  var now=new Date(), today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  var tmr=new Date(today.getTime()+86400000), wEnd=new Date(today.getTime()+7*86400000);
  var g={ over:[], today:[], tmr:[], week:[], later:[], none:[], done:[] };
  a.forEach(function(x){
    if(x.done){ g.done.push(x); return; }
    if(!x.due){ g.none.push(x); return; }
    var d=new Date(x.due);
    if(isNaN(d.getTime())){ g.none.push(x); return; }
    if(d<now) g.over.push(x);
    else if(d<tmr) g.today.push(x);
    else if(d<new Date(tmr.getTime()+86400000)) g.tmr.push(x);
    else if(d<wEnd) g.week.push(x);
    else g.later.push(x);
  });
  function byDue(a1,b1){
    if(!a1.due) return 1; if(!b1.due) return -1;
    return new Date(a1.due)-new Date(b1.due);
  }
  g.over.sort(byDue); g.today.sort(byDue); g.tmr.sort(byDue);
  g.week.sort(byDue); g.later.sort(byDue);
  g.done.sort(function(x,y){ return (y.doneAt||0)-(x.doneAt||0); });
  return g;
}
function todoDueText(x){
  if(!x.due) return "随时";
  var d=new Date(x.due);
  if(isNaN(d.getTime())) return "时间格式有问题";
  var now=new Date(), today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  var dd=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  var days=Math.round((dd-today)/86400000);
  var dayTxt = days===0?"今天":(days===1?"明天":(days===-1?"昨天":(days>1&&days<7?"周"+"日一二三四五六".charAt(dd.getDay()):(d.getMonth()+1)+"月"+d.getDate()+"日")));
  var hm=pad2(d.getHours())+":"+pad2(d.getMinutes());
  var ms=d-now, abs=Math.abs(ms), h=Math.round(abs/3600000), m=Math.round(abs/60000);
  var rel = ms<0 ? ("已逾期 "+(abs>=3600000? h+" 小时":m+" 分钟"))
                 : (abs>=86400000 ? ("还有 "+Math.round(abs/86400000)+" 天")
                                  : (abs>=3600000 ? ("还有 "+h+" 小时") : ("还有 "+m+" 分钟")));
  return dayTxt+" "+hm+" · "+rel;
}

/* ---------- 增删改 ---------- */
function todoAdd(raw){
  var txt=String(raw||"").trim();
  if(!txt) return false;
  var p=parseTodoInput(txt);
  if(!p.title) return false;
  todoState().push({ id:"t"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
                     t:p.title, due:p.due, done:false, at:Date.now() });
  save(); renderTodo();
  toast(p.due ? ("加好了 · "+todoDueText({due:p.due})) : "加好了（没写时间，标为随时）");
  return true;
}
function todoToggle(id){
  var x=todoById(id); if(!x) return;
  x.done=!x.done; x.doneAt=x.done?Date.now():0;
  save(); renderTodo();
}
function todoDel(id){
  var a=todoState();
  for(var i=0;i<a.length;i++) if(a[i].id===id){ a.splice(i,1); break; }
  save(); renderTodo(); toast("删掉了");
}
function todoSetTitle(id,v){
  var x=todoById(id); if(!x) return;
  var t=String(v||"").trim();
  if(!t){ toast("不能存空标题"); return; }
  var p=parseTodoInput(t);
  x.t=p.title;
  if(p.due) x.due=p.due;                 /* 改标题时若写了新时间，一并更新 */
  save(); renderTodo(); toast("改好了");
}
function todoClearDone(){
  var a=todoState(), n=a.filter(function(x){return x.done;}).length;
  if(!n){ toast("没有已完成的"); return; }
  S.todo=a.filter(function(x){return !x.done;});
  save(); renderTodo(); toast("清掉了 "+n+" 条");
}

/* ---------- 导出 .ics（真正能落到系统日历的那一步） ---------- */
function icsEsc(s){
  return String(s==null?"":s)
    .replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,")
    .replace(/\r?\n/g,"\\n");
}
function icsStampUTC(){
  var d=new Date();
  return d.getUTCFullYear()+pad2(d.getUTCMonth()+1)+pad2(d.getUTCDate())+"T"+
         pad2(d.getUTCHours())+pad2(d.getUTCMinutes())+pad2(d.getUTCSeconds())+"Z";
}
function downloadText(name, text, mime){
  try{
    var blob=new Blob([text],{type:(mime||"text/plain")+";charset=utf-8"});
    var a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download=name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); },4000);
    return true;
  }catch(e){ return false; }
}
function todoICS(){
  var items=todoState().filter(function(x){ return !x.done && x.due; });
  if(!items.length){ toast("没有带时间的待办：先给某一条写上日期时间"); return; }
  var L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//offerSha//Todo//CN","CALSCALE:GREGORIAN"];
  items.forEach(function(x){
    var dt=x.due.replace(/[-:]/g,"");            /* 2026-09-25T10:00 → 20260925T1000 */
    if(dt.length===13) dt+="00";
    L.push("BEGIN:VEVENT");
    L.push("UID:"+x.id+"@offersha.local");
    L.push("DTSTAMP:"+icsStampUTC());
    /* 用「浮动本地时间」（不带 Z）：由查看方的时区解释，省掉 UTC 换算出错的可能 */
    L.push("DTSTART:"+dt);
    L.push("SUMMARY:"+icsEsc(x.t));
    L.push("DESCRIPTION:"+icsEsc("来自 offer鲨 · 职场鱼塘的待办"));
    L.push("BEGIN:VALARM");
    L.push("TRIGGER:-PT15M");
    L.push("ACTION:DISPLAY");
    L.push("DESCRIPTION:"+icsEsc(x.t));
    L.push("END:VALARM");
    L.push("END:VEVENT");
  });
  L.push("END:VCALENDAR");
  var ok=downloadText("职场待办_"+new Date().toISOString().slice(0,10)+".ics", L.join("\r\n"), "text/calendar");
  toast(ok ? ("导出了 "+items.length+" 条，导入手机日历就会提醒你") : "这个环境不支持下载，请用 Chrome 打开");
}

/* ---------- 提醒引擎 ---------- */
var todoTimer=null;
function todoFire(x, when){
  var msg=when+"："+x.t;
  toast(msg);
  try{
    if(window.Notification && Notification.permission==="granted"){
      new Notification("offer鲨 · 待办提醒", { body: msg });
    }
  }catch(e){}
  var bar=document.getElementById("todoBar");
  if(bar){ bar.classList.add("ring"); setTimeout(function(){ bar.classList.remove("ring"); },3200); }
}
function todoTick(){
  var now=Date.now(), changed=false, a=todoState();
  for(var i=0;i<a.length;i++){
    var x=a[i];
    if(x.done||!x.due) continue;
    var due=new Date(x.due).getTime();
    if(isNaN(due)) continue;
    var preKey=x.id+"|pre", dueKey=x.id+"|due";
    var fresh = (now-due) < 12*3600000;      /* 只对 12 小时内的抓提醒，避免开页时补一串旧提醒 */
    if(now>=due-15*60000 && now<due && !S.todoFired[preKey]){
      S.todoFired[preKey]=1; changed=true;
      if(fresh) todoFire(x,"还有 15 分钟");
    }
    if(now>=due && !S.todoFired[dueKey]){
      S.todoFired[dueKey]=1; changed=true;
      if(fresh) todoFire(x,"到点了");
    }
  }
  if(changed) save();
  var bar=document.getElementById("todoBar");
  if(bar && bar.querySelector(".tbitem.over")) bar.classList.add("hasover");
  renderTodoBadge();
}
function todoNotifyAsk(){
  if(!window.Notification){ toast("这个环境不支持系统通知，用「导出到日历」更稳"); return; }
  try{
    Notification.requestPermission().then(function(p){
      toast(p==="granted"?"系统通知开了（页面开着时才有效）":(p==="denied"?"被浏览器拒绝了":"没开启"));
      renderTodo();
    });
  }catch(e){ toast("申请通知权限失败，用「导出到日历」更稳"); }
}

/* ---------- 渲染 ---------- */
function todoStat(){
  var g=todoGroups();
  return { over:g.over.length, today:g.today.length, all:g.over.length+g.today.length+g.tmr.length+g.week.length+g.later.length+g.none.length };
}
function renderTodoBadge(){
  var st=todoStat(), el=document.getElementById("todoCount");
  if(!el) return;
  var hot=todoGroups().over.length;
  el.textContent = st.all ? String(st.all) : "0";
  el.className = "tbcount"+(hot?" hot":"");
  el.title = hot ? (hot+" 条已逾期") : (st.all? (st.all+" 条未完成") : "没有待办");
}
function todoItemHTML(x, cls){
  var tag = cls? '<span class="tbtag '+cls[0]+'">'+esc(cls[1])+'</span>' : '';
  return '<div class="tbitem'+(x.done?" done":"")+(cls&&cls[0]==="over"?" over":"")+'" data-id="'+esc(x.id)+'">'+
    '<button class="tbchk" data-tg="'+esc(x.id)+'" aria-pressed="'+(x.done?"true":"false")+'" '+
      'aria-label="'+(x.done?"标记为未完成":"标记为完成")+'">'+(x.done?"✓":"")+'</button>'+
    '<div class="tbmain">'+
      '<div class="tbtitle" data-title="'+esc(x.id)+'">'+esc(x.t)+tag+'</div>'+
      '<div class="tbdue">'+esc(todoDueText(x))+'</div>'+
    '</div>'+
    '<div class="tbitems-act">'+
      '<button class="sm" data-edit="'+esc(x.id)+'">改</button>'+
      '<button class="sm" data-del="'+esc(x.id)+'">删</button>'+
    '</div>'+
  '</div>';
}
function renderTodo(){
  todoState();
  var host=document.getElementById("todoList");
  var bar=document.getElementById("todoBar");
  if(!host||!bar) return;
  var g=todoGroups(), h="";
  function block(title, arr, cls){
    if(!arr.length) return "";
    return '<div class="tbgroup"><div class="tbg-h">'+title+' <b>'+arr.length+'</b></div>'+
      arr.map(function(x){ return todoItemHTML(x,cls); }).join("")+'</div>';
  }
  h+=block("已逾期", g.over, ["over","逾期"]);
  h+=block("今天", g.today, null);
  h+=block("明天", g.tmr, null);
  h+=block("本周", g.week, null);
  h+=block("以后", g.later, null);
  h+=block("随时（没写时间）", g.none, null);
  h+=block("已完成", g.done, null);
  if(!h) h='<div class="tbempty">还没有待办。上面那行直接写就行，写「明天 10:00 投 3 家简历」它会自动认出时间。</div>';
  host.innerHTML=h;
  var sum=document.getElementById("todoSummary");
  if(sum){
    var st=todoStat();
    sum.textContent = st.all ? ("未完成 "+st.all+" 条"+(st.over?(" · 其中 "+st.over+" 条逾期"):"")) : "全部完成";
  }
  var panel=document.getElementById("todoPanel");
  if(panel) panel.hidden = !S.todoOpen;
  var tg=document.getElementById("todoToggle");
  if(tg) tg.setAttribute("aria-expanded", S.todoOpen?"true":"false");
  bar.classList.toggle("open", !!S.todoOpen);
  var nb=document.getElementById("todoNotify");
  if(nb){
    var granted = !!(window.Notification && Notification.permission==="granted");
    nb.textContent = granted ? "系统通知已开" : "开启系统通知";
    nb.disabled = granted;
  }
  renderTodoBadge();
}
function bindTodo(){
  todoState();
  var tg=document.getElementById("todoToggle");
  if(tg) tg.onclick=function(){
    S.todoOpen=!S.todoOpen; save(); renderTodo();
    if(S.todoOpen){ var i=document.getElementById("todoInput"); if(i) i.focus(); }
  };
  var inp=document.getElementById("todoInput");
  var add=document.getElementById("todoAddBtn");
  function fireAdd(){
    if(!inp) return;
    if(todoAdd(inp.value)){ inp.value=""; }
  }
  if(add) add.onclick=fireAdd;
  if(inp) inp.addEventListener("keydown",function(e){
    if(e.key==="Enter"){ e.preventDefault(); fireAdd(); }
  });
  var list=document.getElementById("todoList");
  if(list) list.onclick=function(e){
    var t=e.target;
    if(!t||!t.dataset) return;
    if(t.dataset.tg) return todoToggle(t.dataset.tg);
    if(t.dataset.del) return todoDel(t.dataset.del);
    if(t.dataset.edit) return todoEditInline(t.dataset.edit);
  };
  var n=document.getElementById("todoNotify"); if(n) n.onclick=todoNotifyAsk;
  var ic=document.getElementById("todoICS"); if(ic) ic.onclick=todoICS;
  var cd=document.getElementById("todoClearDone"); if(cd) cd.onclick=todoClearDone;
  if(todoTimer) clearInterval(todoTimer);
  todoTimer=setInterval(todoTick, 30000);
  todoTick();
  renderTodo();
}
/* 就地改名：把标题换成输入框，回车保存、Esc 取消 */
function todoEditInline(id){
  var host=document.getElementById("todoList");
  if(!host) return;
  var el=host.querySelector('[data-title="'+id+'"]');
  var x=todoById(id);
  if(!el||!x) return;
  var old=el.innerHTML;
  el.innerHTML='<input class="tbedit" value="'+esc(x.t)+'" aria-label="修改待办">';
  var i=el.querySelector("input");
  i.focus(); i.select();
  function done(commit){
    if(commit) todoSetTitle(id, i.value); else renderTodo();
  }
  i.addEventListener("keydown",function(e){
    if(e.key==="Enter"){ e.preventDefault(); done(true); }
    else if(e.key==="Escape"){ e.preventDefault(); done(false); }
  });
  i.addEventListener("blur",function(){ done(true); });
}
