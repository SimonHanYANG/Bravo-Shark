/* =====================================================================
   可视化组件 ： 雷达图 / 横向条形 / 进度环
   ---------------------------------------------------------------------
   三条设计约束（不是审美偏好，是产品纪律）：

     ① **零外部依赖**。这个产品有「0 个 script[src] / 0 个 link / 0 个 img
        外链」的硬约束，所以图表一律内联 SVG / CSS 手写，不引图表库。
     ② **不画「假图」**。没有数据的位置就是空的（虚线基线），不拿
        好看的默认值把图填满 ： 一填满，人就会以为自己有进度。
     ③ **图形不承载唯一信息**。每个图都同时给出文字数值，
        色盲、打印、屏幕阅读三种场景下都还能读懂。
   ===================================================================== */

/* ---------------------------------------------------------------------
   雷达图
   labels 轴名数组（3—6 个最合适，超过 7 个读不出来）
   values 与 labels 等长的数值数组
   max    满分
   --------------------------------------------------------------------- */
function vizRadar(labels, values, max, size){
  size = size || 280;
  var n = labels.length;
  /* 少于 3 个轴围不成面。返回 null 让调用方决定给什么替代，
     不要硬画一个「两条线」的东西冒充雷达图。 */
  if(n < 3) return null;
  var cx = size/2, cy = size/2 + 4;
  var R = size * 0.315;
  var rings = 5;
  var i, j, h = "";

  function pt(i, v){
    var a = (-90 + i*360/n) * Math.PI/180;
    var r = R * v/max;
    return [cx + Math.cos(a)*r, cy + Math.sin(a)*r];
  }
  function poly(v){
    var p = [];
    for(i=0;i<n;i++){ var q = pt(i,v); p.push(R2(q[0])+" "+R2(q[1])); }
    return p.join("L");
  }

  h += '<svg class="vz-radar" viewBox="0 0 '+size+' '+size+'" width="100%" role="img" '+
       'aria-label="掌握程度雷达图：'+labels.map(function(l,k){
         return l+' '+values[k]+' 分';
       }).join("，")+'">';

  /* 网格：同心多边形 + 轴线 */
  for(j=1;j<=rings;j++){
    h += '<path d="M'+poly(max*j/rings)+'Z" fill="none" stroke="#D8D2C8" '+
         'stroke-width="'+(j===rings?1.4:1)+'"'+(j===rings?'':' opacity=".7"')+'/>';
  }
  for(i=0;i<n;i++){
    var e = pt(i, max);
    h += '<path d="M'+R2(cx)+' '+R2(cy)+'L'+R2(e[0])+' '+R2(e[1])+
         '" stroke="#D8D2C8" stroke-width="1" opacity=".7"/>';
  }

  /* 数据面：填充 + 描边 + 顶点。填充用珊瑚色低透明度压一层，
     顶点点实心 ： 顶点是「实际值」，网格是「参照」。 */
  var dp = [];
  for(i=0;i<n;i++){ var q = pt(i, values[i]); dp.push(R2(q[0])+" "+R2(q[1])); }
  /* 填充不能太淡：一淡就只剩几个点和网格圈，读不出「面」的形状 */
  h += '<path d="M'+dp.join("L")+'Z" fill="#2D5C86" fill-opacity=".30" '+
       'stroke="#2D5C86" stroke-width="2.2" stroke-linejoin="round"/>';
  for(i=0;i<n;i++){
    var v = pt(i, values[i]);
    h += '<circle cx="'+R2(v[0])+'" cy="'+R2(v[1])+'" r="'+(values[i]>0?3.6:2.4)+
         '" fill="'+(values[i]>0?"#2D5C86":"#FFFFFF")+'" stroke="#2D5C86" stroke-width="1.8"/>';
  }

  /* 轴标签。按角度决定文字锚点，否则标签会压到图上。
     数值直接写在轴名下面 ： 图形不承载唯一信息。 */
  for(i=0;i<n;i++){
    var a = (-90 + i*360/n) * Math.PI/180;
    var lx = cx + Math.cos(a) * (R + 26);
    var ly = cy + Math.sin(a) * (R + 26);
    var cos = Math.cos(a);
    var anchor = Math.abs(cos) < 0.25 ? "middle" : (cos > 0 ? "start" : "end");
    var dy = Math.sin(a) < -0.5 ? -2 : (Math.sin(a) > 0.5 ? 12 : 4);
    /* SVG 的文字是属性不是 CSS —— 放大字号那一轮漏在这里了 */
    h += '<text x="'+R2(lx)+'" y="'+R2(ly+dy)+'" text-anchor="'+anchor+'" '+
         'font-size="13" font-weight="700" fill="#3A4854">'+esc(labels[i])+'</text>';
    h += '<text x="'+R2(lx)+'" y="'+R2(ly+dy+15)+'" text-anchor="'+anchor+'" '+
         'font-size="12" font-weight="600" fill="#4A5147">'+values[i]+' / '+max+'</text>';
  }
  h += '</svg>';
  return h;
}

/* ---------------------------------------------------------------------
   横向条形组
   items: [{label, value, note, color}]
   比竖向柱状更好读的地方：技能名可以长，不用斜排或省略。
   --------------------------------------------------------------------- */
function vizBars(items, opts){
  opts = opts || {};
  var unit = opts.unit || "";
  var max = opts.max || 0;
  var i;
  if(!max){ items.forEach(function(x){ if(x.value > max) max = x.value; }); }
  if(max <= 0) max = 1;
  var h = '<div class="vz-bars">';
  for(i=0;i<items.length;i++){
    var x = items[i];
    var pct = Math.max(0, Math.min(100, x.value/max*100));
    var col = x.color || "linear-gradient(90deg,#4E86B8,#2D5C86)";
    h += '<div class="vz-bar">'+
      '<div class="vz-bar-h"><b>'+esc(x.label)+'</b>'+
      '<span>'+(x.value>0 ? (x.value+unit) : "还没记录")+'</span></div>'+
      /* zero 时画一条虚线基线，而不是一条 0 长度的实条 ——
         实条会被读成「有一点」，虚线才是「空的」 */
      '<div class="vz-bar-t'+(x.value>0?"":" zero")+'">'+
        (x.value>0 ? '<i style="width:'+R2(pct)+'%;background:'+col+'"></i>' : "")+
      '</div>'+
      (x.note ? '<em class="vz-bar-n">'+esc(x.note)+'</em>' : "")+
    '</div>';
  }
  return h + '</div>';
}

/* ---------------------------------------------------------------------
   进度环。pct 传 0—100；传 null 表示「还没有数据」，画成空环 + 提示，
   不要画成 0%（0% 的意思是「做了但一点没完成」，和「还没开始」不是一回事）
   --------------------------------------------------------------------- */
function vizRing(pct, center, label, size){
  size = size || 118;
  var r = size/2 - 9;
  var c = 2 * Math.PI * r;
  var has = (pct !== null && pct !== undefined);
  var v = has ? Math.max(0, Math.min(100, pct)) : 0;
  var h = '<div class="vz-ring" style="width:'+size+'px">'+
    '<svg viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'" role="img" '+
    'aria-label="'+esc(label)+'：'+(has ? Math.round(v)+'%' : '暂无数据')+'">'+
    '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+R2(r)+'" fill="none" '+
      'stroke="#E2DBD1" stroke-width="9"/>'+
    (has && v>0
      ? '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+R2(r)+'" fill="none" '+
        'stroke="#2D5C86" stroke-width="9" stroke-linecap="round" '+
        'stroke-dasharray="'+R2(c*v/100)+' '+R2(c)+'" '+
        'transform="rotate(-90 '+size/2+' '+size/2+')"/>'
      : "")+
    '<text x="'+(size/2)+'" y="'+(size/2+2)+'" text-anchor="middle" '+
      'font-size="25" font-weight="800" fill="'+(has?"#1E3A5F":"#5A544C")+'">'+
      (has ? Math.round(v)+'%' : "—")+'</text>'+
    (center ? '<text x="'+(size/2)+'" y="'+(size/2+19)+'" text-anchor="middle" '+
      'font-size="11" fill="#5A544C">'+esc(center)+'</text>' : '')+
    '</svg><div class="vz-ring-l">'+esc(label)+'</div></div>';
  return h;
}

/* ---------------------------------------------------------------------
   一组数字卡（替代「一行字里塞四五个数字」）
   数字给大字号，单位给小的 ： 扫一眼就能拿到量级
   --------------------------------------------------------------------- */
function vizStats(items){
  return '<div class="vz-stats">'+items.map(function(x){
    return '<div class="vz-stat'+(x.dim?" dim":"")+'">'+
      '<b>'+esc(String(x.value))+(x.unit?'<i>'+esc(x.unit)+'</i>':'')+'</b>'+
      '<span>'+esc(x.label)+'</span></div>';
  }).join("")+'</div>';
}

/* 折线图：每天的心情曲线（-1 ~ +1）。没记录的那天 value=null，断开不连线，
   这样「没放鱼」不会被误读成「心情 0 分」。 */
function vizLine(points, opts){
  opts = opts || {};
  var W = opts.w || 660, H = opts.h || 180;
  var padL = 30, padR = 8, padT = 12, padB = 24;
  var n = points.length;
  if(!n) return "";
  var minV = opts.min!=null ? opts.min : -1, maxV = opts.max!=null ? opts.max : 1;
  var range = (maxV - minV) || 1;
  var iw = W - padL - padR, ih = H - padT - padB;
  function X(i){ return padL + (n===1 ? iw/2 : i*(iw/(n-1))); }
  function Y(v){ return padT + (1-(v-minV)/range)*ih; }
  var h = '<svg class="vz-line" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="每天心情曲线" '+
    'style="display:block;width:100%;max-width:660px;height:auto;overflow:visible">';
  /* 中线 0：分「偏回血」和「偏消耗」两半 */
  if(minV < 0 && maxV > 0){
    h += '<line x1="'+padL+'" y1="'+R2(Y(0))+'" x2="'+(W-padR)+'" y2="'+R2(Y(0))+'" stroke="#B9B2A9" stroke-width="1.4" stroke-dasharray="5 4"/>';
  }
  h += '<text x="'+(padL-6)+'" y="'+R2(Y(maxV)+4)+'" text-anchor="end" font-size="12" fill="#8A837A">'+maxV+'</text>';
  h += '<text x="'+(padL-6)+'" y="'+R2(Y(minV)+4)+'" text-anchor="end" font-size="12" fill="#8A837A">'+minV+'</text>';
  var segs = [], cur = [];
  points.forEach(function(p,i){
    if(p.value == null){ if(cur.length){ segs.push(cur); cur = []; } }
    else cur.push({x:X(i), y:Y(p.value)});
  });
  if(cur.length) segs.push(cur);
  segs.forEach(function(seg){
    if(seg.length === 1){
      h += '<circle cx="'+R2(seg[0].x)+'" cy="'+R2(seg[0].y)+'" r="3.6" fill="#2D5C86"/>';
    } else {
      h += '<path d="M'+seg.map(function(pt){ return R2(pt.x)+' '+R2(pt.y); }).join('L')+
           '" fill="none" stroke="#2D5C86" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    seg.forEach(function(pt){
      h += '<circle cx="'+R2(pt.x)+'" cy="'+R2(pt.y)+'" r="3.2" fill="#2D5C86" stroke="#FFFFFF" stroke-width="1.4"/>';
    });
  });
  var step = Math.ceil(n/7);
  points.forEach(function(p,i){
    if(i % step === 0 || i === n-1){
      h += '<text x="'+R2(X(i))+'" y="'+(H-8)+'" text-anchor="middle" font-size="11.5" fill="#8A837A">'+esc(p.label)+'</text>';
    }
  });
  h += '</svg>';
  return h;
}
