/* =====================================================================
   鱼（2026-09-26 新版）：一条小丑鱼，长成巨齿鲨
   ---------------------------------------------------------------------
   三件事：
     ① 画一条鱼 ： 圆润、带高光、有鳞色的写实卡通鱼，按「成长阶段」换色换形。
        不引图片、不引库：单文件必须自包含，所以用渐变 + 路径参数化画出来。
     ② 只有一条 → 跟着光标游，后面留三道隐隐的影子（延迟跟随，自然成残影）。
     ③ 成长 ： 小丑鱼 → 蓝纹神仙 → 旗鱼 → 灰鲭鲨 → 巨齿鲨，看「海洋地位」进度。
        不做上下浮动的自漂动画（用户明确说取消浮动）：鱼只在光标动的时候动。
   ★ 硬约束
     · 结构进 fishSVG，配色进 FISH_STAGES：加阶段只加数据，不要在里面写 if。
     · 影子是「延迟跟随」不是「画三份」：同一段 SVG，四个节点依次追前一个。
     · 尊重 data-motion=0：关动效时鱼停在原地，不做 rAF 循环。
   ===================================================================== */

/* 成长阶段：need = 需要多少「海洋地位」*/
var FISH_STAGES = [
  { id:"clown", n:"小丑鱼",     d:"刚下水，先找一块能站住的地方", need:0,
    c:{b1:"#FF7A45", b2:"#F2603A", bel:"#FFF4E6", fin:"#FFB03A", line:"#5A2314", str:"#FFFBF2", str2:"#F2603A", eye:"#1B1409"},
    p:{len:1.00, ht:1.06, dorH:.90, tail:.94, eye:1.05, stripe:2, ped:.34, tailShape:"fan", dorShape:"round", finBig:1} },
  { id:"tang",  n:"蓝纹神仙",   d:"找到方向了，开始有选择",       need:60,
    c:{b1:"#3E9BD8", b2:"#2679BC", bel:"#EAF6FF", fin:"#F7C948", line:"#123A5C", str:"#F7D24E", eye:"#0E2231"},
    p:{len:1.00, ht:1.02, dorH:1.00, tail:.96, eye:1.02, stripe:1, ped:.30, tailShape:"fan", dorShape:"round"} },
  { id:"sail",  n:"旗鱼",       d:"能跑了，投递和面试开始有回音", need:150,
    c:{b1:"#5B7FB8", b2:"#3F63A0", bel:"#EDF4FD", fin:"#2F4E86", line:"#152A4A", eye:"#0C2436"},
    p:{len:1.10, ht:.88, dorH:1.70, tail:1.02, eye:.94, snout:16, x0:12, ped:.22, tailShape:"fork", dorShape:"swept", dorFwd:1} },
  { id:"mako",  n:"灰鲭鲨",     d:"开始挑岗位，不再被岗位挑",     need:300,
    c:{b1:"#8CA5B6", b2:"#64809A", bel:"#F6FBFE", fin:"#4E6A83", line:"#20313D", eye:"#0B1A22"},
    p:{len:1.18, ht:.88, dorH:1.05, tail:1.06, eye:.84, teeth:1, open:1, ped:.20, tailShape:"fork", dorShape:"swept", slits:3} },
  { id:"mega",  n:"巨齿鲨",     d:"这片水里，你说了算",           need:520, king:1,
    c:{b1:"#587089", b2:"#3B5269", bel:"#EEF5FA", fin:"#2C3F52", line:"#111C26", eye:"#070E13"},
    p:{len:1.28, ht:.94, dorH:1.24, tail:1.12, eye:.78, teeth:1.5, open:1, scar:1, jaw:1, ped:.22, tailShape:"fork", dorShape:"swept", slits:3} }
];
/* 海洋地位：能涨的东西都用得上，不设唯一货币 —— 用户用哪个功能都在长大 */
function growScore(){
  var f=(S.fish||[]).length, c=S.coin||0;
  var sh=(typeof shareCount==="function")?shareCount():0;
  var r=(S.sess&&(S.sess.turns||[]).length)||0;
  var d=((S.docs||[]).length+(S.works||[]).length);
  var iv=((S.book||[]).length);
  return Math.round(f*6 + c*0.5 + sh*12 + r*5 + d*4 + iv*3);
}
function stageIdx(){
  var g=growScore(), i=0;
  for(var k=0;k<FISH_STAGES.length;k++) if(g>=FISH_STAGES[k].need) i=k;
  return i;
}
function stageOf(){ return FISH_STAGES[stageIdx()]; }
function stageById(id){ for(var i=0;i<FISH_STAGES.length;i++) if(FISH_STAGES[i].id===id) return FISH_STAGES[i]; return FISH_STAGES[0]; }
function growNext(){
  var i=stageIdx();
  if(i>=FISH_STAGES.length-1) return null;
  var g=growScore(), nx=FISH_STAGES[i+1];
  return { st:nx, need:nx.need-g, pct:Math.max(0,Math.min(100,Math.round((g-FISH_STAGES[i].need)/(nx.need-FISH_STAGES[i].need)*100))) };
}

/* ---------------- 画鱼：一段 SVG，路径全部按参数生成 ----------------
   2026-09-26 第四版 · 换成参考图的画风（粗描边扁平插画）：
     · 一圈很粗的深色描边（3.2/2.0 两级），不再用细线勾轮廓
     · 纯色块：体色 + 浅色腹部 + 对比色鳍，去掉渐变、鳞光、侧线这些写实细节
     · 胖身体（背线高拱、腹线圆鼓），尾柄收细
     · 眼睛是一颗大白圆 + 黑瞳 + 高光，位置在头部上侧
     · 张嘴露牙（上排 3 颗 + 下排 2 颗小三角），闭嘴阶段只画一条笑线
     · 尾鳍扇形带放射鳍条；鲨鱼是带凹口的新月尾
   ★ 加阶段只加数据（FISH_STAGES 的 p / c），不要在这个函数里写 if。 */
function fishSVG(stageId, size, opts){
  var st = (typeof stageId==="string") ? stageById(stageId) : (stageId || FISH_STAGES[0]);
  var p = st.p || {}, c = st.c || {}, uid = "f" + (++AVN);
  var W = 134, H = 90;
  var len=(p.len||1), ht=(p.ht||1), tk=(p.tail||1), dorH=(p.dorH||1);
  var nx = 12 + (p.x0||0) - (p.snout||0)*0.35, cy = 45, hh = 15*ht;
  var tx = nx + (96-nx)*len, d = tx-nx;
  var ink = c.line || "#3A1A24", iw = 3.2, iw2 = 2.0;
  var py = hh*(p.ped==null ? 0.34 : p.ped);
  var eyeK = (p.eye==null ? 1 : p.eye), stripeN = p.stripe||0, slits = p.slits||0;

  /* 身体：胖（背线高拱、腹线圆鼓），尾柄细 */
  var body = "M"+nx+","+cy+
    " C"+(nx+d*0.07)+","+(cy-hh*0.98)+" "+(nx+d*0.30)+","+(cy-hh*1.26)+" "+(nx+d*0.56)+","+(cy-hh*1.14)+
    " C"+(nx+d*0.82)+","+(cy-hh*1.00)+" "+(nx+d*0.95)+","+(cy-hh*0.50)+" "+tx+","+(cy-py)+
    " L"+tx+","+(cy+py)+
    " C"+(nx+d*0.95)+","+(cy+hh*0.66)+" "+(nx+d*0.74)+","+(cy+hh*1.06)+" "+(nx+d*0.42)+","+(cy+hh*1.02)+
    " C"+(nx+d*0.18)+","+(cy+hh*0.98)+" "+(nx+d*0.05)+","+(cy+hh*0.62)+" "+nx+","+cy+" Z";

  /* 浅色腹部：一个大椭圆裁进身体 */
  var belly = '<ellipse cx="'+((nx+tx)/2+hh*0.15).toFixed(1)+'" cy="'+(cy+hh*0.72).toFixed(1)+
    '" rx="'+(d*0.40).toFixed(1)+'" ry="'+(hh*0.52).toFixed(1)+'" fill="'+c.bel+'" clip-path="url(#'+uid+'c)"/>';

  /* 尾鳍 */
  var tx2 = tx-hh*0.12, ex = tx+hh*1.26*tk, ey = hh*1.62*tk;
  var tail, rays = "";
  if (p.tailShape === "fork"){
    var nk = tx+hh*0.56*tk;
    tail = "M"+tx2+","+(cy-py*1.1)+
      " C"+(tx+hh*0.42)+","+(cy-hh*0.86)+" "+(tx+hh*0.92)+","+(cy-ey*0.94)+" "+(ex-hh*0.05)+","+(cy-ey)+
      " C"+(ex-hh*0.55)+","+(cy-ey*0.28)+" "+(nk+hh*0.22)+","+(cy-hh*0.05)+" "+nk+","+cy+
      " C"+(nk+hh*0.22)+","+(cy+hh*0.05)+" "+(ex-hh*0.55)+","+(cy+ey*0.24)+" "+(ex-hh*0.05)+","+(cy+ey*0.62)+
      " C"+(tx+hh*0.86)+","+(cy+ey*0.74)+" "+(tx+hh*0.40)+","+(cy+hh*0.74)+" "+tx2+","+(cy+py*1.1)+" Z";
    rays = '<path d="M'+tx+','+cy+' L'+(ex-hh*0.36).toFixed(1)+','+(cy-ey*0.78).toFixed(1)+
           ' M'+tx+','+cy+' L'+(ex-hh*0.30).toFixed(1)+','+(cy+ey*0.40).toFixed(1)+
           '" stroke="'+ink+'" stroke-width="1.8" opacity=".55" fill="none" stroke-linecap="round"/>';
  } else {
    tail = "M"+tx2+","+(cy-py*1.1)+
      " C"+(tx+hh*0.42)+","+(cy-hh*0.84)+" "+(tx+hh*0.90)+","+(cy-ey*0.96)+" "+(ex-hh*0.16)+","+(cy-ey)+
      " C"+(ex+hh*0.26)+","+(cy-ey*0.40)+" "+(ex+hh*0.26)+","+(cy+ey*0.40)+" "+(ex-hh*0.16)+","+(cy+ey)+
      " C"+(tx+hh*0.90)+","+(cy+ey*0.96)+" "+(tx+hh*0.42)+","+(cy+hh*0.84)+" "+tx2+","+(cy+py*1.1)+" Z";
    rays = '<path d="M'+tx+','+cy+' L'+(ex-hh*0.44).toFixed(1)+','+(cy-ey*0.62).toFixed(1)+
           ' M'+tx+','+cy+' L'+(ex-hh*0.36).toFixed(1)+','+cy+
           ' M'+tx+','+cy+' L'+(ex-hh*0.44).toFixed(1)+','+(cy+ey*0.62).toFixed(1)+
           '" stroke="'+ink+'" stroke-width="1.8" opacity=".55" fill="none" stroke-linecap="round"/>';
  }

  /* 背鳍：小三角（swept = 后掠） */
  var ax = nx+d*(p.dorFwd ? 0.24 : 0.34), aw = d*0.24;
  var dorsal = (p.dorShape==="swept")
    ? "M"+ax+","+(cy-hh*1.02)+" C"+(ax+aw*0.44)+","+(cy-hh*(1.05+1.05*dorH))+" "+(ax+aw*1.42)+","+(cy-hh*(1.02+0.72*dorH))+" "+(ax+aw*2.05)+","+(cy-hh*1.00)+" Z"
    : "M"+ax+","+(cy-hh*1.04)+" C"+(ax+aw*0.22)+","+(cy-hh*(1.05+1.12*dorH))+" "+(ax+aw*1.58)+","+(cy-hh*(1.02+0.92*dorH))+" "+(ax+aw*1.96)+","+(cy-hh*1.02)+" Z";

  /* 臀鳍 */
  var qx = nx+d*0.68;
  var anal = "M"+qx+","+(cy+hh*0.92)+" C"+(qx+d*0.05)+","+(cy+hh*(1.05+0.42*dorH))+" "+(qx+d*0.14)+","+(cy+hh*(1.02+0.38*dorH))+" "+(qx+d*0.17)+","+(cy+hh*0.88)+" Z";

  /* 胸鳍：小水滴 */
  var px = nx+d*0.38, pw2 = (p.finBig ? 1.22 : 1);
  var pect = "M"+px+","+(cy+hh*0.30)+
    " C"+(px+d*0.05*pw2)+","+(cy+hh*0.82*pw2)+" "+(px+d*0.15*pw2)+","+(cy+hh*1.02*pw2)+" "+(px+d*0.22*pw2)+","+(cy+hh*0.62*pw2)+
    " C"+(px+d*0.12*pw2)+","+(cy+hh*0.70*pw2)+" "+(px+d*0.05*pw2)+","+(cy+hh*0.48*pw2)+" "+px+","+(cy+hh*0.30)+" Z";

  /* 背部高光（一条白色弧带，参考图里鱼背上有这种高光） */
  var gloss = '<g clip-path="url(#'+uid+'c)"><path d="M'+(nx+d*0.22)+','+(cy-hh*0.80)+
    ' C'+(nx+d*0.44)+','+(cy-hh*1.06)+' '+(nx+d*0.70)+','+(cy-hh*0.98)+' '+(nx+d*0.86)+','+(cy-hh*0.46)+
    '" fill="none" stroke="#FFFFFF" stroke-width="'+(hh*0.30).toFixed(1)+'" stroke-linecap="round" opacity=".55"/></g>';

  /* 竖带（小丑鱼的白带 / 神仙的黄带）：纯色块 + 同色描边，裁进身体 */
  var stripes = "";
  if (stripeN){
    var pos = (stripeN>=2) ? [0.30, 0.62] : [0.55];
    var bw = d*(stripeN>=2 ? 0.115 : 0.095);
    for (var i=0; i<stripeN; i++){
      var sx = nx+d*pos[i]-bw/2;
      stripes += '<g clip-path="url(#'+uid+'c)">'+
        '<path d="M'+sx.toFixed(1)+','+(cy-hh*1.4)+' C'+(sx+bw*0.30).toFixed(1)+','+(cy-hh*0.5)+' '+(sx+bw*0.30).toFixed(1)+','+(cy+hh*0.5)+' '+sx.toFixed(1)+','+(cy+hh*1.4)+
          ' l'+(bw*1.5).toFixed(1)+',0 C'+(sx+bw*1.9).toFixed(1)+','+(cy+hh*0.5)+' '+(sx+bw*1.9).toFixed(1)+','+(cy-hh*0.5)+' '+(sx+bw*1.5).toFixed(1)+','+(cy-hh*1.4)+' Z" fill="'+c.str+'"/>'+
        '<path d="M'+sx.toFixed(1)+','+(cy-hh*1.4)+' C'+(sx+bw*0.30).toFixed(1)+','+(cy-hh*0.5)+' '+(sx+bw*0.30).toFixed(1)+','+(cy+hh*0.5)+' '+sx.toFixed(1)+','+(cy+hh*1.4)+
          '" fill="none" stroke="'+(c.str2||ink)+'" stroke-width="2" opacity=".85"/>'+
        '<path d="M'+(sx+bw*1.5).toFixed(1)+','+(cy-hh*1.4)+' C'+(sx+bw*1.9).toFixed(1)+','+(cy-hh*0.5)+' '+(sx+bw*1.9).toFixed(1)+','+(cy+hh*0.5)+' '+(sx+bw*1.5).toFixed(1)+','+(cy+hh*1.4)+
          '" fill="none" stroke="'+(c.str2||ink)+'" stroke-width="2" opacity=".85"/>'+
      '</g>';
    }
  }

  /* 鳃：鲨鱼三条竖裂，其他一条鳃盖线 */
  var gill = "";
  if (slits){
    for (var g=0; g<slits; g++){
      var gx = nx+d*(0.30+g*0.045);
      gill += '<path d="M'+gx.toFixed(1)+','+(cy-hh*0.36)+' C'+(gx-d*0.014).toFixed(1)+','+(cy-hh*0.02)+' '+(gx-d*0.014).toFixed(1)+','+(cy+hh*0.20)+' '+gx.toFixed(1)+','+(cy+hh*0.44)+
        '" fill="none" stroke="'+ink+'" stroke-width="2" stroke-linecap="round" opacity=".55"/>';
    }
  } else {
    gill = '<g clip-path="url(#'+uid+'c)"><path d="M'+(nx+d*0.30)+','+(cy-hh*0.70)+' C'+(nx+d*0.25)+','+(cy-hh*0.10)+' '+(nx+d*0.25)+','+(cy+hh*0.34)+' '+(nx+d*0.32)+','+(cy+hh*0.80)+
      '" fill="none" stroke="'+ink+'" stroke-width="2.2" opacity=".5" stroke-linecap="round"/></g>';
  }

  /* 眼：大白圆 + 黑瞳 + 高光 */
  var exx = nx+d*0.185, eyy = cy-hh*(p.open?0.34:0.30), er = hh*0.36*eyeK;
  var eye = '<circle cx="'+exx.toFixed(1)+'" cy="'+eyy.toFixed(1)+'" r="'+(er*1.18).toFixed(1)+'" fill="#FFFFFF" stroke="'+ink+'" stroke-width="2.4"/>'+
    '<circle cx="'+(exx-er*0.10).toFixed(1)+'" cy="'+(eyy+er*0.06).toFixed(1)+'" r="'+(er*0.62).toFixed(1)+'" fill="'+(c.eye||ink)+'"/>'+
    '<circle cx="'+(exx-er*0.40).toFixed(1)+'" cy="'+(eyy-er*0.38).toFixed(1)+'" r="'+(er*0.26).toFixed(1)+'" fill="#FFFFFF"/>';

  /* 口：张嘴（上下两排牙）/ 闭嘴（一条笑线） */
  var mouth = "", teethS = "";
  if (p.open){
    var m0 = nx+d*0.02, m1 = nx+d*0.24, ym = cy+hh*0.30;
    mouth = '<path d="M'+m0.toFixed(1)+','+(ym-hh*0.16).toFixed(1)+
      ' C'+(nx+d*0.07).toFixed(1)+','+(ym+hh*0.30).toFixed(1)+' '+(nx+d*0.18).toFixed(1)+','+(ym+hh*0.30).toFixed(1)+' '+m1.toFixed(1)+','+(ym-hh*0.16).toFixed(1)+
      ' C'+(nx+d*0.17).toFixed(1)+','+(ym+hh*0.06).toFixed(1)+' '+(nx+d*0.07).toFixed(1)+','+(ym+hh*0.06).toFixed(1)+' '+m0.toFixed(1)+','+(ym-hh*0.16).toFixed(1)+' Z" fill="#FFF8F4" stroke="'+ink+'" stroke-width="2"/>';
    var tn = 3, n2 = (p.teeth||1);
    for (var t1=0; t1<tn; t1++){
      var ux = nx+d*(0.045+t1*0.055), us = hh*0.085*n2;
      teethS += '<path d="M'+ux.toFixed(1)+','+(ym-hh*0.14).toFixed(1)+' l'+(us*0.60).toFixed(1)+','+us.toFixed(1)+' l'+(us*0.60).toFixed(1)+','+(-us).toFixed(1)+' Z" fill="#FFFFFF" stroke="'+ink+'" stroke-width="1" stroke-linejoin="round"/>';
    }
    for (var t2=0; t2<2; t2++){
      var lx = nx+d*(0.075+t2*0.065), ls = hh*0.070*n2;
      teethS += '<path d="M'+lx.toFixed(1)+','+(ym+hh*0.16).toFixed(1)+' l'+(ls*0.58).toFixed(1)+','+(-ls).toFixed(1)+' l'+(ls*0.58).toFixed(1)+','+ls.toFixed(1)+' Z" fill="#FFFFFF" stroke="'+ink+'" stroke-width="1" stroke-linejoin="round"/>';
    }
  } else {
    mouth = '<path d="M'+(nx+d*0.03).toFixed(1)+','+(cy+hh*0.28)+' C'+(nx+d*0.08).toFixed(1)+','+(cy+hh*0.50)+' '+(nx+d*0.15).toFixed(1)+','+(cy+hh*0.48)+' '+(nx+d*0.20).toFixed(1)+','+(cy+hh*0.26)+
      '" fill="none" stroke="'+ink+'" stroke-width="2.6" stroke-linecap="round"/>';
  }
  var jaw = p.jaw ? ('<path d="M'+(nx+d*0.05).toFixed(1)+','+(cy+hh*0.62)+' C'+(nx+d*0.24).toFixed(1)+','+(cy+hh*0.84)+' '+(nx+d*0.44).toFixed(1)+','+(cy+hh*0.80)+' '+(nx+d*0.56).toFixed(1)+','+(cy+hh*0.60)+
    '" fill="none" stroke="'+ink+'" stroke-width="1.8" opacity=".45"/>') : "";
  var scar = p.scar ? ('<path d="M'+(nx+d*0.52)+','+(cy-hh*0.72)+' l'+(d*0.07).toFixed(1)+','+(hh*0.20).toFixed(1)+
    ' M'+(nx+d*0.58)+','+(cy-hh*0.78)+' l'+(d*0.05).toFixed(1)+','+(hh*0.24).toFixed(1)+
    '" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round" opacity=".65"/>') : "";

  var aria = (opts && opts.aria) ? opts.aria : (st.n+" 形态的一条鱼");
  return '<svg class="fishv" viewBox="0 0 '+W+' '+H+'" width="'+size+'" height="'+(size*H/W).toFixed(1)+'" '+
      'role="img" aria-label="'+esc(aria)+'" style="display:block;overflow:visible">'+
    '<defs>'+
      '<clipPath id="'+uid+'c"><path d="'+body+'"/></clipPath>'+
      '<linearGradient id="'+uid+'b" x1="0" y1="0" x2="0" y2="1">'+
        '<stop offset="0" stop-color="'+c.b2+'"/><stop offset="1" stop-color="'+c.b1+'"/>'+
      '</linearGradient>'+
      '<linearGradient id="'+uid+'f" x1="0" y1="0" x2="0.4" y2="1">'+
        '<stop offset="0" stop-color="'+c.fin+'"/><stop offset="1" stop-color="'+c.fin+'"/>'+
      '</linearGradient>'+
    '</defs>'+
    '<ellipse cx="'+((nx+tx)/2).toFixed(1)+'" cy="'+(cy+hh*1.42).toFixed(1)+'" rx="'+(d*0.40).toFixed(1)+'" ry="'+(hh*0.13).toFixed(1)+'" fill="#20323F" opacity=".10"/>'+
    '<path d="'+tail+'" fill="url(#'+uid+'f)" stroke="'+ink+'" stroke-width="'+iw+'" stroke-linejoin="round"/>'+ rays +
    '<path d="'+anal+'" fill="url(#'+uid+'f)" stroke="'+ink+'" stroke-width="'+iw2+'" stroke-linejoin="round"/>'+
    '<path d="'+dorsal+'" fill="url(#'+uid+'f)" stroke="'+ink+'" stroke-width="'+iw+'" stroke-linejoin="round"/>'+
    '<path d="'+body+'" fill="url(#'+uid+'b)" stroke="'+ink+'" stroke-width="'+iw+'" stroke-linejoin="round"/>'+
    belly + gloss + stripes + scar + gill +
    '<path d="'+pect+'" fill="url(#'+uid+'f)" stroke="'+ink+'" stroke-width="'+iw2+'" stroke-linejoin="round"/>'+
    eye + mouth + teethS + jaw +
  '</svg>';
}

/* 一条鱼。宿主有两个：开屏（#splashFish）与主界面光标层（#heroFish）。
   ★ 2026-09-26 用户要求去掉残影：不再画三道延迟影子，只留本体一条。 */
function heroFishHTML(stageId, size){
  return '<span class="hf">'+fishSVG(stageId, size, {aria:""})+'</span>';
}
var FLEET = {};
function heroStage(){ return stageOf().id; }
function fishFleet(hostId, stageId, size, base){
  var layer = document.getElementById(hostId);
  if (!layer) return null;
  var f = FLEET[hostId];
  if (!f){
    f = FLEET[hostId] = { id:hostId, els:[], pts:[], tgt:null, raf:0, stage:"" };
    window.addEventListener("pointermove", function(e){
      f.tgt = { x:e.clientX, y:e.clientY };
    }, { passive:true });
  }
  /* ★ 宿主可能被别人清过（buildSplash / 切阶段都会 innerHTML=""），
     只要缓存里的第一个节点已经不在文档里，就必须重画 ： 否则鱼凭空消失（实测踩过）。 */
  var stale = !f.els.length || !layer.contains(f.els[0]);
  if (f.stage!==stageId || stale){
    f.stage = stageId;
    layer.innerHTML = heroFishHTML(stageId, size);
    f.els = [].slice.call(layer.querySelectorAll(".hf"));
    var x = innerWidth*0.74, y = innerHeight*0.38;
    f.pts = f.els.map(function(){ return { x:x, y:y }; });
    f.els.forEach(function(el,i){
      el.__w = el.offsetWidth || 120; el.__h = el.offsetHeight || 80;
      el.style.transform = "translate(" + (x-el.__w/2+i*34) + "px," + (y-el.__h/2+i*16) + "px)";
    });
  }
  if (f.raf || motionOff()) return f;
  (function tick(){
    if (!f.tgt) f.tgt = { x:f.pts[0].x, y:f.pts[0].y };
    var prev = f.tgt;
    for (var i=0;i<f.els.length;i++){
      var p=f.pts[i], k=(i===0 ? base : Math.max(0.045, base-i*0.03));
      var dx=prev.x-p.x, dy=prev.y-p.y;
      p.x += dx*k; p.y += dy*k;
      var el=f.els[i];
      /* 按运动方向轻微倾斜；没有自漂，光标不动它就不动 */
      var rot = Math.max(-14, Math.min(14, dx*0.55 - dy*0.15));
      el.style.transform = "translate(" + (p.x-el.__w/2).toFixed(1) + "px," + (p.y-el.__h/2).toFixed(1) + "px) rotate(" + rot.toFixed(1) + "deg)";
      prev = p;
    }
    f.raf = requestAnimationFrame(tick);
  })();
  return f;
}
function heroSize(){ return Math.min(190, Math.max(120, Math.round(innerWidth*0.13))); }
function mountHeroFish(){ return fishFleet("heroFish", heroStage(), heroSize(), 0.135); }
function mountSplashFish(){
  var size = Math.min(340, Math.max(200, Math.round(Math.min(innerWidth,1300)*0.26)));
  return fishFleet("splashFish", heroStage(), size, 0.10);
}
function motionOff(){
  try{ return document.documentElement.getAttribute("data-motion")==="0"; }catch(e){ return false; }
}

/* ---------------- 我的鱼塘：成长卡 ---------------- */
function renderGrowthCard(){
  var host=document.getElementById("growthCard");
  if(!host) return;
  var st=stageOf(), nx=growNext(), g=growScore();
  var h='<div class="card growcard"><h3>你的鱼 · '+esc(st.n)+'</h3>'+
    '<div class="growrow">'+
      '<div class="growfish">'+fishSVG(st.id, 150, {aria:"你现在是"+st.n})+'</div>'+
      '<div class="growinfo">'+
        '<div class="grownow">'+esc(st.n)+(st.king?' <span class="king">海洋霸主</span>':'')+'</div>'+
        '<div class="growd">'+esc(st.d)+'</div>'+
        '<div class="growbar"><i style="width:'+(nx?nx.pct:100)+'%"></i></div>'+
        (nx ? '<div class="grownxt">再长 <b>'+nx.need+'</b> 点，就是 <b>'+esc(nx.st.n)+'</b>（'+Math.round(g)+' 点）</div>'
            : '<div class="grownxt">已经到顶：这片水里你说了算。</div>')+
      '</div>'+
    '</div>'+
    '<div class="growline">'+FISH_STAGES.map(function(x,i){
      return '<span class="gst'+(i<=stageIdx()?" on":"")+'">'+esc(x.n)+'</span>';
    }).join('<i>→</i>')+'</div>'+
    '<div class="grownote">怎么长大：放鱼 · 攒鱼币 · 分享 · 练面试 · 存文档作品 ： 用哪个功能都在长。</div>'+
  '</div>';
  host.innerHTML=h;
}
