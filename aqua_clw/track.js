/* =====================================================================
   行为埋点（通读版）
   ---------------------------------------------------------------------
   ★ 只在本机记录，不上传。记录「去了哪几页、用了哪些功能」，
     帮团队看懂用户卡在哪一步 ： 而不是凭感觉迭代。
   ★ 保存用节流：每个动作都 save 太重（localStorage 全量写），
     改成「标记脏 + 定时刷 + 导出前强制刷」。
   ===================================================================== */
var TRACK_MAX = 5000;
var trackDirty = false;
function trackPush(evt, meta){
  try{
    var t = Array.isArray(S.track) ? S.track : [];
    t.push({ e:evt, m:meta||{}, at:Date.now(), v:S.view||"" });
    if(t.length > TRACK_MAX) t = t.slice(t.length - TRACK_MAX);
    S.track = t;
    trackDirty = true;
  }catch(e){}
}
function trackFlush(){
  if(!trackDirty) return;
  trackDirty = false;
  try{ save(); }catch(e){}
}
setInterval(trackFlush, 6000);
function trackExport(){
  trackFlush();
  var t = Array.isArray(S.track) ? S.track : [];
  if(!t.length){ toast("还没有行为记录：先随便点几页"); return; }
  var d = new Date();
  var ds = d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
  var out = {
    _meta:{ product:"职场鱼塘", exportAt:d.toLocaleString(),
            note:"本地行为日志（脱敏、不上传、不含任何内容原文）", events:t.length },
    events:t
  };
  downloadText("职场鱼塘_行为日志_"+ds+".json", JSON.stringify(out,null,1), "application/json");
  toast("已导出 "+t.length+" 条行为记录");
}
function trackClear(){
  S.track = []; trackDirty = false; save(); toast("行为日志已清空");
}
