/* 渲染风格：voxel = 体素方块（当前，见下方渲染器）。
   保留这个变量的原因是它出现在构建断言里，改名会让断言失配。 */
var AV_STYLE = "voxel";

/* =====================================================================
   鲨鱼绘制器 v4 ： 块面风格（the blockhead 那一路）
   ---------------------------------------------------------------------
   v3 是「闭合 Catmull-Rom 样条 + 渐变填充」的写实画法。v4 整个换掉：

     ① 低多边形硬边轮廓：每一段都是直线，拐角是 miter 尖角，不用圆角
     ② 内部切三块平面（背板 / 中带 / 腹板），每块**一个纯色**，
        块与块之间画一条硬边线 ： 这是它读起来像 3D 模型的关键：
        不是靠渐变假装体积，是靠平面之间的明暗落差
     ③ 再叠两三条纵向面片缝，模仿 3D 模型的多边形分界
     ④ 鳍（背鳍 / 胸鳍 / 尾叶 / 第二背鳍）全部做成**独立楔形块**，
        受光面 + 背光面两块 ： 块状拼装，和 blockhead 的做法一致
     ⑤ 描边加粗、拐角 miter；牙是梯形不是尖三角；眼是六边形不是圆
     ⑥ 圆底改成上下两块硬分色的水体，并**裁进圆里**（v4 修掉了这里
        早期版本的一个 bug：下半块没裁，画出一个方底）

   ★ 为什么把锚点布局也一起重写：
     v3 的锚点是照写实鲨鱼手放的，靠样条把极值磨圆了。换成直线之后，
     同样的坐标立刻变成「一条胖鱼」： 这是实测截图才看出来的。
     所以布局改成按块面结构手放（吻 / 头 / 背 / 尾柄 / 腹 / 尾叉分开），
     六个品种仍由形状参数驱动，换品种是真的换轮廓。
   ===================================================================== */
var AVN = 0;
var DEF_SHAPE = "mega", DEF_OUTFIT = "sweater";
var DEFSP = {id:"mega",name:"职场巨齿鲨",lx:1,hy:1,dor:1,sn:1,tl:1,bl:1,eye:1,teeth:1,blush:0,brow:1};

function shapeOf(id){
  if(typeof shapeById==="function"){ var s=shapeById(id||DEF_SHAPE); if(s) return s; }
  return DEFSP;
}
function outfitOf(id){
  return (typeof outfitById==="function") ? outfitById(id||DEF_OUTFIT) : null;
}
function normLook(look){
  if(!look) return {skin:null, shape:DEF_SHAPE, outfit:DEF_OUTFIT};
  if(look.body) return {skin:look, shape:DEF_SHAPE, outfit:DEF_OUTFIT};
  return {skin:(typeof skinById==="function" ? skinById(look.skin||"classic") : null),
          shape:look.shape||DEF_SHAPE,
          outfit:look.outfit||DEF_OUTFIT};
}

function R2(n){ return Math.round(n*100)/100; }

/* ---------- 块面布局：由形状参数推出这一条鱼的全部顶点 ---------- */
/* 基准坐标是照「块面鲨鱼」的结构手放的，不是把写实鲨鱼简化得来的。
   鲨鱼朝左（吻在 x 小的一侧），因为池子里的鱼是自右向左游的。 */
var SHARK_BASE = {
  headTop: [46, 33], back1: [62, 30], back2: [90, 35],
  pedT: [106, 45],   pedB: [108, 56],
  belly1: [92, 60],  belly2: [60, 67],
  mouthC: [38, 66],  snoutLo: [26, 61],
  snoutTip: [14, 54], snoutUp: [32, 42],
  /* 背鳍：截顶而不是尖顶 —— 尖顶栅格化后只剩一根 1 格宽的柱子 */
  dorsBase: [[54, 31], [82, 36]],
  dorsTip: [64, 6], dorsTrail: [73, 6], dorsNotch: [71, 26],
  sd: [[86, 38], [92, 27], [98, 41]],
  pect: [[52, 66], [66, 87], [75, 83], [64, 68]],
  anal: [[88, 62], [95, 75], [84, 67]],
  /* 尾叶要厚到栅格化之后还连着：内凹点到外缘的垂距必须 ≥ 2 格。
     原来给的内凹垂距只有 5.8 单位 = 1.3 格，叶身断成两块孤立方块。 */
  tailUp: [128, 14], tailInU: [118, 42], tailNt: [111, 52],
  tailInL: [118, 62], tailLo: [125, 90],
  gillX: [48, 55, 62], gillY: [44, 62],
  eye: [38, 45], eyeR: 5.6,
  mouth: [[17, 58], [27, 65], [38, 66]],
  prop: [39, 21]
};

function sharkPts(sp){
  var cx = 71, cy = 48;
  var X  = function(v){ return cx + (v - cx) * sp.lx; };
  var Y  = function(v){ return cy + (v - cy) * sp.hy; };
  /* 腹线额外乘一个腹深系数：只有肚子变深/变浅，脊线不动 */
  var Yb = function(v){ return cy + (v - cy) * sp.hy * sp.bl; };
  var P  = function(p){ return [X(p[0]), Y(p[1])]; };
  var Pb = function(p){ return [X(p[0]), Yb(p[1])]; };
  var B = SHARK_BASE;

  /* 吻长：从头前缘往前伸。改的是「吻尖相对头的位置」，不是绝对 x，
     否则短吻品种会把吻尖推到肚子里面去。 */
  var headX = X(B.headTop[0]);
  var snoutSpan = (headX - X(B.snoutTip[0])) * sp.sn;
  var snoutTip = [headX - snoutSpan, Y(B.snoutTip[1])];
  var snoutUp  = [headX - snoutSpan * 0.56, Y(B.snoutUp[1])];
  var snoutLo  = [X(B.snoutLo[0]) - (snoutSpan * 0.34 - (X(B.snoutLo[0]) - (headX - snoutSpan)) * 0.34), Yb(B.snoutLo[1])];
  var mouthC   = Pb(B.mouthC);

  /* 尾长：从尾柄往后伸，上下张角不变 */
  var pedX = X(B.pedT[0]);
  var TL = function(v){ return pedX + (X(v) - pedX) * sp.tl; };
  var TAIL = [
    /* ★ 往身体里插 10 个单位（≈2 格）。原来的首点正好落在尾柄点上，
       两点「相接」而不「重叠」，栅格化后中间会空一格 ： 尾巴和身体断开。
       插进去的那段由 voxMat 判成身体材质，接缝就自然消失了。 */
    [pedX - 10, Y(B.pedT[1]) + 1],
    [TL(B.tailUp[0]), Y(B.tailUp[1])],
    [TL(B.tailInU[0]), Y(B.tailInU[1])],
    [TL(B.tailNt[0]), Y(B.tailNt[1])],
    [TL(B.tailInL[0]), Yb(B.tailInL[1])],
    [TL(B.tailLo[0]), Yb(B.tailLo[1])],
    [X(B.pedB[0]) - 10, Yb(B.pedB[1]) - 1]
  ];

  /* 背鳍：高度由 dor 控，底边贴着背线 */
  var dBase = [X(B.dorsBase[0][0]), Y(B.dorsBase[0][1])];
  var dBase2= [X(B.dorsBase[1][0]), Y(B.dorsBase[1][1])];
  var dH    = (Y(B.dorsBase[0][1]) - Y(B.dorsTip[1])) * sp.dor;
  var dTip  = [X(B.dorsTip[0]), Y(B.dorsBase[0][1]) - dH];
  var dTrail= [X(B.dorsTrail[0]), Y(B.dorsBase[0][1]) - dH * 0.86];
  var dNotch= [X(B.dorsNotch[0]), Y(B.dorsBase[0][1]) - dH * 0.28];
  var DORSAL = [dBase, dTip, dTrail, dNotch, dBase2];

  return {
    BODY: [snoutTip, snoutUp, P(B.headTop), P(B.back1), P(B.back2),
           [pedX, Y(B.pedT[1])],
           [X(B.pedB[0]), Yb(B.pedB[1])],
           Pb(B.belly1), Pb(B.belly2), mouthC, snoutLo],
    TAIL: TAIL, DORSAL: DORSAL,
    SD: [P(B.sd[0]), P(B.sd[1]), P(B.sd[2])],
    PECT: [Pb(B.pect[0]), Pb(B.pect[1]), Pb(B.pect[2]), Pb(B.pect[3])],
    ANAL: [Pb(B.anal[0]), Pb(B.anal[1]), Pb(B.anal[2])],
    TOPLINE: [snoutTip, snoutUp, P(B.headTop), P(B.back1), P(B.back2), [pedX, Y(B.pedT[1])]],
    BOTLINE: [[X(B.pedB[0]), Yb(B.pedB[1])], Pb(B.belly1), Pb(B.belly2), mouthC, snoutLo, snoutTip],
    GILL: [X(B.gillX[0]), X(B.gillX[1]), X(B.gillX[2])],
    GILLY: [Y(B.gillY[0]), Y(B.gillY[1])],
    EYE: [X(B.eye[0]), Y(B.eye[1])],
    EYE_R: B.eyeR * sp.eye,
    MOUTH: [[X(B.mouth[0][0]), Yb(B.mouth[0][1])], [X(B.mouth[1][0]), Yb(B.mouth[1][1])], mouthC],
    PROP: [X(B.prop[0]), Y(B.prop[1])],
    PED: pedX
  };
}

/* 顶/底边在第 x 处的 y。必须按该处的实际深度算，
   拿「整体高度百分比」去切会在细长的尾部切穿轮廓。 */
function edgeY(line, x){
  for(var i=0;i<line.length-1;i++){
    var p=line[i], q=line[i+1];
    if(Math.abs(q[0]-p[0])<0.01) continue;
    var t=(x-p[0])/(q[0]-p[0]);
    if(t>=-0.001 && t<=1.001) return p[1]+(q[1]-p[1])*t;
  }
  return null;
}
/* =====================================================================
   体素渲染器 ： Minecraft 那种真立方体堆叠
   ---------------------------------------------------------------------
   图片里的鲨鱼不是「2D 块面」，是**体素方块**：背上那层浅蓝是方块的顶面、
   深蓝是正面、更暗的是侧面。所以这里不再描轮廓，改成两步：

     ① 栅格化 ： 把 sharkPts 算出的多边形（身体 / 尾 / 背鳍 / 胸鳍 /
        臀鳍 / 第二背鳍）采样到一个方块网格上，逐格判材质。眼睛、嘴、
        牙、鳃、腮红、衣服全部映射成**网格材质**，不再是独立矢量图形。
        造型仍然由形状参数驱动 ： 换品种是真的换轮廓。
     ② 渲染 ： 逐格画立方体，只画**暴露的面**：上方无方块才画顶面、
        右方无方块才画侧面。三面三档明暗就是体积感，不靠渐变。

   ★ 为什么保留轮廓几何、而不是手画一张像素图：
     手画像素图无法与 6 个品种参数（吻长 / 背鳍高 / 体长 / 腹深 / 尾长…）
     联动，改一个品种就要重画一张。栅格化是**同一套几何的另一条渲染路径**，
     六个品种、七套皮肤、四段密码都原样继续生效。
   ★ 体积控制：同材质、同行的连续方块合并成一个矩形子路径。
     不合并的话 44 条开屏鱼会各带 600 个 path，产物直接翻倍。
   ===================================================================== */
var VX_BK=1,VX_BE=2,VX_FN=3,VX_GL=4,VX_EY=5,VX_PK=6,VX_MO=7,VX_TH=8,
    VX_CL=9,VX_TR=10,VX_BL=11,VX_CL2=12;
var VOX_DU=0.42, VOX_DV=-0.38;      /* 深度偏移 ÷ 格边长 */

/* 射线法：点是否在多边形内。支持凹多边形。 */
function voxPoly(px,py,poly){
  var inside=false;
  for(var i=0,j=poly.length-1;i<poly.length;j=i++){
    var xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    if(((yi>py)!==(yj>py)) && (px<(xj-xi)*(py-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}
function voxAny(px,py,list){
  for(var i=0;i<list.length;i++) if(voxPoly(px,py,list[i])) return true;
  return false;
}

/* ---------------------------------------------------------------------
   单格材质。判定顺序即优先级，后面的覆盖前面的。
   一律按格子**中心**采样 ： 最不容易出错。
   --------------------------------------------------------------------- */
function voxMat(cx,cy,c,r,u,g,sp,of,J,quad,neck,oid){
  var FIN=[g.DORSAL,g.SD,g.TAIL,g.PECT,g.ANAL];
  var inF=voxAny(cx,cy,FIN), inB=voxPoly(cx,cy,g.BODY);
  if(!inF && !inB) return 0;
  /* 同时落在身体和鳍里 → 用身体材质。
     尾叶是往身体里插了一段来防断缝的，那一段必须被身体盖住。 */
  var m = (inF && !inB) ? VX_FN : VX_BK;
  var ex=g.EYE[0], ey=g.EYE[1], er=g.EYE_R;

  if(inB){
    /* 白肚：腹线以上 50% 起算。必须按该 x 处的实际深度算，
       拿整体高度百分比去切会在细长的尾部切穿轮廓。 */
    var yT=edgeY(g.TOPLINE,cx), yB=edgeY(g.BOTLINE,cx);
    if(yT!=null && yB!=null && cy > yT+(yB-yT)*0.46) m=VX_BE;
    /* 鳃：三条竖缝 */
    for(var gi=0;gi<g.GILL.length;gi++){
      if(Math.abs(cx-g.GILL[gi])<u*0.48 && cy>g.GILLY[0]-u*0.3 && cy<g.GILLY[1]+u*0.3) m=VX_GL;
    }
  }

  /* 嘴与牙。露齿的品种才是「张开的口腔 + 上颚白牙」，
     不露齿的品种压成一条深色闭口线 ： 体素风里画不出折线嘴。 */
  var my=edgeY(g.MOUTH,cx);
  if(inB && my!=null){
    if(sp.teeth>0){
      /* 上唇一条深线 → 一格白牙 → 两格暗红口腔。
         原来牙放在嘴线之外，旁边就是白肚，白压白根本看不出来。 */
      if(cy<=my && cy>my-u*0.9) m=VX_GL;
      else if(cy>my && cy<my+u*1.05) m=VX_TH;
      else if(cy>=my+u*1.05 && cy<my+u*3.1) m=VX_MO;
    }else{
      if(cy>=my-u*0.5 && cy<my+u*0.7) m=VX_GL;
    }
  }

  /* 眼。brow 控制上眼睑压下来的程度 —— 在体素风里这就是
     「把眼眶上半格换成背色」，比画一道眉毛自然得多。 */
  if(inB){
    var d=Math.sqrt((cx-ex)*(cx-ex)+(cy-ey)*(cy-ey));
    if(d<er*1.16){
      m=VX_EY;
      var qx=ex+(J?er*0.34:0), qy=ey+(J?0:er*0.20);
      if(Math.sqrt((cx-qx)*(cx-qx)+(cy-qy)*(cy-qy))<er*0.62) m=VX_PK;
      var lid=(sp.brow==null?0:sp.brow);
      if(lid<0 && cy<ey-er*0.28) m=VX_BK;            /* 摸鱼：上眼睑压下来 */
      else if(lid===2 && cy>ey+er*0.62) m=VX_BK;     /* 秃鲨：眼袋 */
    }
  }

  /* 腮红 */
  if(inB && sp.blush>0){
    if(Math.abs(cx-(ex+er*2.4))<u*1.4 && Math.abs(cy-(ey+er*1.5))<u*0.8) m=VX_BL;
  }

  /* 衣服：与身体求交。直接判整套服装四边形会连身体外面的空气一起涂上。 */
  if(inB && quad && voxPoly(cx,cy,quad)){
    m = (oid==="plaid" && ((c+r)%2===1)) ? VX_CL2 : VX_CL;
    var ly=edgeY(neck,cx);
    if(ly!=null && Math.abs(cy-ly)<u*0.62) m=VX_TR;
  }
  return m;
}

/* ---------------------------------------------------------------------
   栅格化 + 渲染。返回 {front, top, side, box}
   三类面分开输出：正面 → 顶面 → 侧面。这样后画的压在先画的上面，
   而同一格的三面永远不会互相覆盖（它们各自朝不同方向）。
   --------------------------------------------------------------------- */
function voxRender(g,sp,of,J,cols,CM){
  /* ① 包围盒：把全部多边形包进去，四周各留半格 */
  var all=[];
  [g.BODY,g.TAIL,g.DORSAL,g.SD,g.PECT,g.ANAL].forEach(function(p){ all=all.concat(p); });
  var minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  all.forEach(function(p){
    if(p[0]<minX)minX=p[0]; if(p[0]>maxX)maxX=p[0];
    if(p[1]<minY)minY=p[1]; if(p[1]>maxY)maxY=p[1];
  });
  var u=(maxX-minX+2)/cols;
  var rows=Math.max(4,Math.ceil((maxY-minY+2)/u));
  var ox=minX-1, oy=minY-1;
  var du=u*VOX_DU, dv=u*VOX_DV;
  var r,c,m;

  /* ② 服装四边形（由轮廓点推出，跟着品种走） */
  var quad=null, neck=null, oid = of ? of.id : "";
  if(of && oid!=="bare"){
    var mc=g.BODY[9], pb=g.BODY[6];
    var n0=[mc[0]+7, mc[1]-14], n2=[pb[0]+11, pb[1]-18];
    quad=[[n0[0],n0[1]],[n2[0],n2[1]],[n2[0]+30,n2[1]+86],[n0[0]-30,n0[1]+86]];
    neck=[n0,n2];
  }

  /* ③ 采样 */
  var cells=[];
  for(r=0;r<rows;r++){
    var row=[];
    for(c=0;c<cols;c++){
      row.push(voxMat(ox+(c+0.5)*u, oy+(r+0.5)*u, c, r, u, g, sp, of, J, quad, neck, oid));
    }
    cells.push(row);
  }

  function at(cc,rr){ return (rr<0||rr>=rows||cc<0||cc>=cols) ? 0 : cells[rr][cc]; }
  var F={},T={},S={};
  function put(o,k,d){ if(!o[k]) o[k]=[]; o[k].push(d); }

  /* ④ 正面：同行连续同材质 → 合并成一条横矩形 */
  for(r=0;r<rows;r++){
    c=0;
    while(c<cols){
      m=cells[r][c];
      if(!m){ c++; continue; }
      var c2=c;
      while(c2+1<cols && cells[r][c2+1]===m) c2++;
      var fx=ox+c*u, fy=oy+r*u, fw=(c2-c+1)*u;
      put(F,m,"M"+R2(fx)+" "+R2(fy)+"h"+R2(fw)+"v"+R2(u)+"h"+R2(-fw)+"Z");
      c=c2+1;
    }
  }
  /* ⑤ 顶面：上方为空才露出来。同行连续且上方都空 → 合并 */
  for(r=0;r<rows;r++){
    c=0;
    while(c<cols){
      m=cells[r][c];
      if(!m || at(c,r-1)){ c++; continue; }
      var c3=c;
      while(c3+1<cols && cells[r][c3+1] && cells[r][c3+1]===m && !at(c3+1,r-1)) c3++;
      var tx=ox+c*u, ty=oy+r*u, tw=(c3-c+1)*u;
      put(T,m,"M"+R2(tx)+" "+R2(ty)+"l"+R2(du)+" "+R2(dv)+"h"+R2(tw)+"l"+R2(-du)+" "+R2(-dv)+"Z");
      c=c3+1;
    }
  }
  /* ⑥ 侧面：右方为空才露出来。同列连续且右方都空 → 合并 */
  for(c=0;c<cols;c++){
    r=0;
    while(r<rows){
      m=cells[r][c];
      if(!m || at(c+1,r)){ r++; continue; }
      var r2=r;
      while(r2+1<rows && cells[r2+1][c] && cells[r2+1][c]===m && !at(c+1,r2+1)) r2++;
      var sx=ox+(c+1)*u, sy=oy+r*u, sh=(r2-r+1)*u;
      put(S,m,"M"+R2(sx)+" "+R2(sy)+"l"+R2(du)+" "+R2(dv)+"v"+R2(sh)+"l"+R2(-du)+" "+R2(-dv)+"Z");
      r=r2+1;
    }
  }

  function dump(o,key){
    var out="";
    for(var k in o) if(Object.prototype.hasOwnProperty.call(o,k))
      out += '<path d="'+o[k].join("")+'" fill="'+CM[k][key]+'"/>';
    return out;
  }
  return {
    front: dump(F,"f"), top: dump(T,"t"), side: dump(S,"s"),
    w: cols*u, h: rows*u, ox: ox, oy: oy, du: du, dv: dv
  };
}

/* =====================================================================
   绘制
   ===================================================================== */
/* 网格列数：小尺寸用粗网格。同一只鱼在鱼池里和分享卡上列数不同，
   但都是同一套轮廓的栅格化，观感一致；而固定成细网格会让小图变成
   一堆看不见的亚像素方块，输出体积还翻倍。 */
function avCols(size){
  /* ★ 分辨率是被造型反推出来的，不是随手定的：
     16 列时背鳍只剩 1 格宽的柱子、尾叶与身体断开 ： 那些细节比一个格子还小。
     实测 26 列才有多级台阶（背鳍 6 格宽、尾叶两叶各自成块）。
     小尺寸不必给这么细：亚像素方块看不见，只是白烧输出体积。 */
  return size<84 ? 16 : (size<150 ? 22 : 26);
}

function avatarSVG(code,size,seed,look,opts){
  code=String(code||"TNJA").toUpperCase();
  while(code.length<4) code+="A";
  size=size||104; seed=seed||0;
  var T=code[0]==="T", N=code[1]==="N", J=code[2]==="J", A=code[3]==="A";
  var L=normLook(look), sk=L.skin, sp=shapeOf(L.shape), of=outfitOf(L.outfit);
  var sv=((seed%4)+4)%4, uid="av"+(++AVN);
  var g=sharkPts(sp);
  /* bare：开屏用。开屏本身就是水，不需要再给每条鱼套一个圆盘 ——
     否则整屏会变成一片漂着的白盘子（和参考图也不符）。 */
  var bare = !!(opts && opts.bare);

  /* ---------- 调色板 ---------- */
  var pal;
  if(sk){
    pal={b1:sk.body, b2:sk.body2||sk.fin, belly:sk.belly||"#FFF3EE",
         fin:sk.fin, cloth:sk.cloth, trim:sk.trim||"#FFF7F2", bg:sk.bg};
  }else if(T){
    pal={b1:["#E8604E","#D84E3C","#F0705C","#CC4432"][sv],
         b2:["#C43C2C","#B43424","#D24C3A","#A82C1E"][sv],
         belly:["#F7B4A4","#F4A796","#F9C0B2","#F09C8B"][sv],
         fin:["#9E2B22","#8E241C","#AC3328","#7E1E17"][sv],
         cloth:["#96241F","#86201B","#A62C26","#781A15"][sv],
         trim:"#FFF7F2", bg:["#FBEBE7","#F9E4DE","#FCEEE9","#F8DED6"][sv]};
  }else{
    pal={b1:["#EA6E92","#D85C80","#F27EA2","#C85074"][sv],
         b2:["#C74570","#B63C64","#D55280","#A63456"][sv],
         belly:["#F7B4C8","#F4A7BE","#F9C0D2","#F09CB4"][sv],
         fin:["#9E2B4E","#8E2444","#AC3358","#7E1E3C"][sv],
         cloth:["#8E2444","#7E1E3C","#9E2B4E","#701A34"][sv],
         trim:"#FFF5F8", bg:["#FBE9EE","#F9E2E9","#FCEDF1","#F8DBE3"][sv]};
  }

  /* 由基色推三档明暗。体素风格只用纯色，不用渐变 ——
     明暗落差由「哪一面朝光」决定，不由颜色本身决定。 */
  function sh(hex, amt){
    var h=String(hex).replace("#","");
    if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n=parseInt(h,16), R=(n>>16)&255, G=(n>>8)&255, B=n&255;
    var f=function(v){ return Math.max(0,Math.min(255,Math.round(v+255*amt))); };
    return "#"+((1<<24)+(f(R)<<16)+(f(G)<<8)+f(B)).toString(16).slice(1);
  }
  /* 每种材质三面：f 正面 / t 顶面（迎光，提亮）/ s 侧面（背光，压暗） */
  function cmat(f,dt,ds){ return {f:f, t:sh(f,dt), s:sh(f,ds)}; }
  var CM={};
  CM[VX_BK ] = cmat(pal.b1,  0.24, -0.20);
  CM[VX_BE ] = cmat(pal.belly, 0.10, -0.15);
  CM[VX_FN ] = cmat(pal.fin, 0.22, -0.18);
  CM[VX_GL ] = cmat(sh(pal.b2,-0.10), 0.16, -0.16);
  CM[VX_EY ] = cmat("#FFFFFF", 0.00, -0.14);
  CM[VX_PK ] = cmat("#151515", 0.16, -0.02);
  CM[VX_MO ] = cmat("#8E2B2B", 0.14, -0.16);
  CM[VX_TH ] = cmat("#FFFFFF", 0.00, -0.12);
  CM[VX_CL ] = cmat(pal.cloth, 0.18, -0.16);
  CM[VX_CL2] = cmat(sh(pal.cloth,-0.16), 0.16, -0.14);
  CM[VX_TR ] = cmat(pal.trim, 0.02, -0.16);
  CM[VX_BL ] = cmat("#EC8A78", 0.12, -0.12);

  var vr = voxRender(g, sp, of, J, avCols(size), CM);
  var ink = "#101C26";
  var cWater = pal.bg;

  /* ---------- 缩放居中：按栅格包围盒（含深度延伸）算 ---------- */
  var bw = vr.w + Math.abs(vr.du), bh = vr.h + Math.abs(vr.dv);
  var sc = Math.min(100/bw, 100/bh);
  var cx0 = vr.ox + (vr.w + vr.du)/2;
  var cy0 = vr.oy + (vr.h + vr.dv)/2;
  var tx = 60 - sc*cx0, ty = 60 - sc*cy0;
  var cw = uid+"c";
  var ol = uid+"o";

  /* 圆底：三档硬分色的水体 + 一圈水面亮带。
     和方块鲨鱼同一套语言 ： 水也是「层」，不是渐变。 */
  return '<svg viewBox="0 0 120 120" width="'+size+'" height="'+size+'" role="img" '+
    'aria-label="'+(sp.name||"鲨鱼")+' '+code+'" style="display:block">'+
    '<defs><clipPath id="'+cw+'"><circle cx="60" cy="60" r="55.6"/></clipPath>'+
      '<filter id="'+ol+'" x="-25%" y="-25%" width="150%" height="150%">'+
        '<feDropShadow dx="0" dy="1.4" stdDeviation="1.7" flood-color="'+ink+'" flood-opacity=".28"/>'+
      '</filter></defs>'+
    '<g clip-path="url(#'+cw+')">'+
      '<g opacity="'+(bare?".30":"1")+'">'+
      '<rect x="4" y="4" width="112" height="112" fill="'+cWater+'"/>'+
      '<rect x="4" y="30" width="112" height="86" fill="'+sh(cWater,-0.07)+'"/>'+
      '<rect x="4" y="66" width="112" height="50" fill="'+sh(cWater,-0.13)+'"/>'+
      '<rect x="4" y="96" width="112" height="20" fill="'+sh(cWater,-0.19)+'"/>'+
      '<rect x="4" y="4" width="112" height="9" fill="'+sh(cWater,0.30)+'"/>'+
      '</g>'+
    '</g>'+
    (bare ? "" : '<circle cx="60" cy="60" r="55.6" fill="none" stroke="'+ink+'" stroke-width="2.6"/>')+
    '<g transform="translate('+R2(tx)+','+R2(ty)+') scale('+Math.round(sc*1000)/1000+')" filter="url(#'+ol+')">'+
      vr.front + vr.top + vr.side +
    '</g>'+
  '</svg>';
}

/* 外形的一句话说明 */
/* 外形的一句话说明 */
function avatarDesc(code,look){
  code=String(code||"TNJA").toUpperCase();
  var T=code[0]==="T", N=code[1]==="N", J=code[2]==="J", A=code[3]==="A";
  var L=normLook(look), sp=shapeOf(L.shape), of=outfitOf(L.outfit);
  return (sp.name||"职场巨齿鲨")+"（"+(T?"朱红调":"玫红调")+" · "+
    (N?"高尖背鳍":"矮圆背鳍")+" · "+(J?"眼神专注":"眼神活络")+" · "+(A?"露齿":"围巾")+"）"+
    (of?("，穿着一件"+of.name):"");
}
