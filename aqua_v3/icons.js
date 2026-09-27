/* =====================================================================
   导航鲨鱼图标 ： 七只块面鲨鱼
   ---------------------------------------------------------------------
   ★ 设计约束来自上一版的实测问题（截图放大 4 倍才看出来的）：
     ① 第一版把「标记」画在身体上，22px 时标记和身体糊成一团黑块
        （尤其「劳议鲨手」的文档、「你的竞品」的第二条鱼，看成了黑污渍）
     ② 描边 2.1 在 34 宽的 viewBox 里，叠了 4—5 层路径之后黑色占了大半
     → 这一版的改法：
        · viewBox 改成 36×38，上半 12 单位**专留给标记**，标记绝不与身体重叠
        · 描边降到 1.7，鳍用「比身体暗一档的同色系」而不是接近黑色
        · 眼放大，嘴缩短，减少细碎笔画
        · 「你的竞品」改成两条鲨鱼鼻对鼻，这是它唯一能被一眼认出的画法
   ★ 与 avatarSVG 同一套块面语言（硬角 miter、平面明暗两档），
     区别只在小尺寸下必须砍掉的细节量。
   ===================================================================== */

/* 鲨鱼本体（朝左）。画在 y 12—36 的带子里，上方 0—11 留给标记。 */
var NV_BODY = "M2.6 27L8.2 21L15.2 18.4L21.4 20.4L25.6 23.4L25.2 27.8L21 30.6L11 31.4L5 29.4Z";
var NV_FIN  = "M11.8 19.2L15.4 13L18.8 19.8Z";
var NV_TAIL = "M25.5 22.6L31 16.6L28.2 23.4L28.6 27.4L30.8 31.8L24.7 28.1Z";
var NV_PECT = "M13.2 30.9L17.2 35.6L20.2 34.4L15.7 31.2Z";

var NAV_ICON_COLORS = {
  job:       ["#3E86C0", "#2B6591"],
  interview: ["#7A66C4", "#5B4A9E"],
  rival:     ["#D9553C", "#AC3F29"],
  chatter:   ["#D6658A", "#AC4A6B"],
  grow:      ["#2E9E7E", "#1F7A61"],
  tool:      ["#C98A2E", "#9E6A1B"],
  dispute:   ["#4E6B86", "#3A5068"],
  /* 付费服务：金棕。九个栏目里唯一的暖色，扫一眼就能在侧栏里找到 */
  pay:       ["#B0763A", "#8A5A28"]
};

/* 只画「一条鲨鱼」的路径组，供 rival 复用（镜像出第二条） */
function nvSharkPaths(c, ink, sw){
  var att = 'stroke="'+ink+'" stroke-width="'+sw+'" stroke-linejoin="miter"';
  return '<path d="'+NV_TAIL+'" fill="'+c[1]+'" '+att+'/>'+
    '<path d="'+NV_FIN+'" fill="'+c[1]+'" '+att+'/>'+
    '<path d="'+NV_BODY+'" fill="'+c[0]+'" '+att+'/>'+
    /* 腹板：一块纯色就是它的体积，不用渐变 */
    '<path d="M5 29.4L11 31.4L21 30.6L25.2 27.8L25.6 25.6L20.4 28.6L11.6 29.2Z" fill="#FFF4EE" opacity=".5"/>'+
    '<path d="'+NV_PECT+'" fill="'+c[1]+'" '+att+'/>'+
    '<circle cx="8.4" cy="24.6" r="2.3" fill="#FFFFFF" stroke="'+ink+'" stroke-width="'+(sw*0.8).toFixed(2)+'"/>'+
    '<circle cx="9" cy="24.8" r="1.2" fill="'+ink+'"/>'+
    '<path d="M4 28.6L8.4 29.8" stroke="'+ink+'" stroke-width="'+(sw*0.75).toFixed(2)+'" stroke-linecap="butt"/>';
}

/* 标记：实心形 + 白色光晕。
   ★ 为什么不用空心描边：22px 下 1.8 单位的描边只有 1.1 像素，
     空心图形直接糊成灰点。实心形 + 白光晕在同样尺寸下清晰得多。 */
function nvMark(kind, ink){
  var f = 'fill="'+ink+'" stroke="#FFFFFF" stroke-width="1.5" paint-order="stroke" stroke-linejoin="round"';
  switch(kind){
    case "job":   /* 放大镜：一个环 + 一根柄（环用粗描边模拟实心感） */
      return '<circle cx="14.4" cy="5.4" r="3.5" fill="none" stroke="#FFFFFF" stroke-width="3.4" paint-order="stroke"/>'+
             '<circle cx="14.4" cy="5.4" r="3.5" fill="none" stroke="'+ink+'" stroke-width="1.9"/>'+
             '<path d="M17 8L20.4 11.4" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" paint-order="stroke"/>'+
             '<path d="M17 8L20.4 11.4" stroke="'+ink+'" stroke-width="2" stroke-linecap="round"/>';
    case "interview": /* 对话泡 + 三点：泡用实心块 */
      return '<path d="M6.6 2.6a2.4 2.4 0 0 1 2.4-2.4h11.4a2.4 2.4 0 0 1 2.4 2.4v5a2.4 2.4 0 0 1-2.4 2.4H13l-3.4 3V9.9H9a2.4 2.4 0 0 1-2.4-2.4Z" '+f+'/>'+
             '<circle cx="11.4" cy="5.2" r="1.15" fill="#FFFFFF"/>'+
             '<circle cx="14.7" cy="5.2" r="1.15" fill="#FFFFFF"/>'+
             '<circle cx="18" cy="5.2" r="1.15" fill="#FFFFFF"/>';
    case "chatter": /* 三个气泡 */
      return '<circle cx="9" cy="4.6" r="3" '+f+'/>'+
             '<circle cx="15.4" cy="2.6" r="2.1" '+f+'/>'+
             '<circle cx="20" cy="5.4" r="1.5" '+f+'/>';
    case "grow":  /* 向上的实心箭头 */
      return '<path d="M16 0.8L21.6 8.4H18.6V11.6H13.4V8.4H10.4Z" '+f+'/>';
    case "tool":  /* 双向实心箭头 */
      return '<path d="M7.6 1.4L12.4 5.4H9.4V7.6H7.6Zm0 0v6.2H5.8V5.4H2.8Z" fill="none"/>'+
             '<path d="M9 2.6L13.6 6H2.4" stroke="#FFFFFF" stroke-width="4.2" stroke-linecap="round" paint-order="stroke"/>'+
             '<path d="M9 2.6L13.6 6H2.4" stroke="'+ink+'" stroke-width="2" stroke-linecap="round"/>'+
             '<path d="M27 9.8L22.4 6.4H33.6" stroke="#FFFFFF" stroke-width="4.2" stroke-linecap="round" paint-order="stroke"/>'+
             '<path d="M27 9.8L22.4 6.4H33.6" stroke="'+ink+'" stroke-width="2" stroke-linecap="round"/>';
    case "dispute": /* 文档：实心块 + 两条白色横线 */
      return '<path d="M11 0.8h9.6l3.8 3.8v9.8H11Z" '+f+'/>'+
             '<path d="M13.8 7.4h7M13.8 10.4h4.6" stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round"/>';
    case "status": /* 节律波形：三根高低不同的柱 */
      return '<path d="M8.5 10h3.4v4.5H8.5z" '+f+'/>'+
             '<path d="M14.3 5.5h3.4v9h-3.4z" '+f+'/>'+
             '<path d="M20.1 2h3.4v12.5h-3.4z" '+f+'/>';
    case "pay":   /* 价签：方块 + 一个白孔（沿用方块拼装语言，不画钱币符号避免歧义） */
      return '<rect x="10.4" y="1.6" width="8.6" height="8.6" rx="1.7" '+f+'/>'+
             '<circle cx="14.7" cy="5.9" r="1.5" fill="#FFFFFF"/>';
    case "school": /* 课程文档 + 三条课程行 */
      return '<path d="M11 0.8h9.6l3.8 3.8v9.8H11Z" '+f+'/>'+
             '<path d="M13.8 5.2h7M13.8 8.2h7M13.8 11.2h4.6" stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round"/>';
  }
  return "";
}

function sharkIcon(kind, size){
  size = size || 30;
  var c = NAV_ICON_COLORS[kind] || NAV_ICON_COLORS.job;
  var ink = "#17130F", sw = 1.7;
  var head = '<svg viewBox="0 0 36 38" width="'+size+'" height="'+size+'" ' +
    'aria-hidden="true" style="display:block;overflow:visible">';

  /* 你的竞品：两条鼻对鼻。镜像变换把同一条鲨鱼翻过来，
     第一条占右侧、第二条占左侧，中间在 x≈17 处对上。 */
  if(kind === "rival"){
    return head +
      '<g transform="translate(18.6,13.6) scale(-0.62,0.62)">'+nvSharkPaths(c, ink, sw/0.62)+'</g>'+
      '<g transform="translate(15.6,13.6) scale(0.62)">'+nvSharkPaths(c, ink, sw/0.62)+'</g>'+
      "" +
    '</svg>';
  }
  /* ★ 不要再包 translate：NV_BODY 的 y 已经设计在 13—36 这条带子里，
     再平移一次会把下半截推出 viewBox，被 SVG 自己的 overflow:hidden 裁掉
     （上一版就是这个 bug，放大 4 倍才看出来）。 */
  return head +
    nvSharkPaths(c, ink, sw) +
    nvMark(kind, c, ink) +
  '</svg>';
}

/* 把侧栏里所有 <i data-ic="xxx"> 填成鲨鱼图标。
   放在 JS 里生成而不是写死在 HTML：图标是参数化的，写死会有七段重复的大 SVG。 */
function fillNavIcons(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-ic]'), function(el){
    el.innerHTML = sharkIcon(el.getAttribute('data-ic'), parseInt(el.getAttribute('data-icsize') || '22', 10));
  });
}
