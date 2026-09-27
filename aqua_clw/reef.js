/* =====================================================================
   鱼塘层：三张商品表（配色 / 衣服 / 形状）· 开场景观 · 鱼池 · 商店
   ===================================================================== */

/* ---------------- ① 配色 ---------------- */
var SKINS=[
  {id:"classic",name:"番茄打工人",desc:"最基础的那件红，显眼但不炸",price:0,
   body:"#E25A4A",body2:"#C43C2E",belly:"#F5A08E",fin:"#A32B26",cloth:"#8A201A",trim:"#FFF7F2",bg:"#FBEBE7"},
  {id:"coral",name:"加班橘子汽水",desc:"一看就是熬到很晚的颜色",price:30,
   body:"#F0803F",body2:"#D2641F",belly:"#FABE95",fin:"#B84A26",cloth:"#923316",trim:"#FFF6F0",bg:"#FDEEE7"},
  {id:"rose",name:"蜜桃微醺",desc:"被夸了两句之后的脸",price:50,
   body:"#E0688A",body2:"#C74570",belly:"#F5A8BE",fin:"#A32B4E",cloth:"#7E1E3A",trim:"#FFF5F8",bg:"#FBE9EE"},
  {id:"mint",name:"冷静薄荷",desc:"蛐蛐完，自己先降温",price:60,
   body:"#3FBFA0",body2:"#24967D",belly:"#9EDCCB",fin:"#1E7D66",cloth:"#125C4B",trim:"#F2FFFB",bg:"#E6F6F1"},
  {id:"ocean",name:"深海社恐",desc:"和主色同调，站在角落里",price:80,
   body:"#4489C4",body2:"#2C68A0",belly:"#A8C9E6",fin:"#1E4E7A",cloth:"#123354",trim:"#F0F7FF",bg:"#E7F1FA"},
  {id:"grape",name:"紫气东来",desc:"升职前兆，也可能是幻觉",price:100,
   body:"#9280D4",body2:"#7059BC",belly:"#C3B6EE",fin:"#5A4699",cloth:"#3E2E72",trim:"#F6F3FF",bg:"#EFEAF9"},
  {id:"gold",name:"鎏金年终奖",desc:"全塘最亮，也最先被点名",price:180,
   body:"#E0B03F",body2:"#C4921F",belly:"#F3D68C",fin:"#A87A16",cloth:"#7C590C",trim:"#FFFDF2",bg:"#FBF3DE"},
  {id:"ghost",name:"老板看不见",desc:"透明处理，只在描边里存在",price:260,
   body:"#F6F3EE",body2:"#E3DCD2",belly:"#FFFFFF",fin:"#CFC8BE",cloth:"#CFC7BB",trim:"#FFFFFF",bg:"#F7F5F2"}
];

/* ---------------- ② 衣服 ---------------- */
var OUTFITS=[
  {id:"sweater",name:"经典红毛衣",desc:"入职第一天穿的那件",price:0},
  {id:"plaid",  name:"格子衬衫",  desc:"程序员限定皮肤",price:70},
  {id:"suit",   name:"面试小西装",desc:"领带好像打歪了",price:110},
  {id:"hoodie", name:"大厂卫衣",  desc:"帽子里装得下所有需求变更",price:140},
  {id:"vest",   name:"工牌马甲",  desc:"挂绳已经磨白了",price:180},
  {id:"bare",   name:"裸着（自信）",desc:"什么也不穿，亮肚皮",price:220}
];

/* ---------------- ③ 形状（品种） ----------------
   w/h 身体宽高 · snout 吻部长度 · dorsal 背鳍倍率 · eye 眼睛大小
   teeth 牙齿 · blush 腮红 · brow 神色（1 正常 / 0 无眉 / -1 半闭 / 2 八字）· tail 尾鳍 */
var SHAPES=[
  {id:"mega",name:"职场巨齿鲨",desc:"标准款 · 修长、能扛、牙口好",price:0,
   lx:1.00,hy:1.00,dor:1.00,sn:1.00,tl:1.00,bl:1.00,eye:1.00,teeth:1.00,blush:0,brow:1},
  {id:"meng",name:"萌纳丽鲨",  desc:"圆成一坨 · 看着人畜无害",price:60,
   lx:0.90,hy:1.10,dor:0.46,sn:0.72,tl:0.80,bl:1.08,eye:1.32,teeth:0.00,blush:1,brow:0},
  {id:"moyu",name:"摸鱼佛鲨",  desc:"半闭着眼 · 谁急谁上",price:90,
   lx:1.03,hy:0.84,dor:0.32,sn:0.92,tl:1.06,bl:0.94,eye:1.02,teeth:0.00,blush:0,brow:-1},
  {id:"tou",name:"加班秃鲨",  desc:"瘦长 · 吻很尖、发际线告急",price:130,
   lx:0.86,hy:1.02,dor:1.20,sn:1.22,tl:1.04,bl:0.98,eye:0.82,teeth:0.80,blush:0,brow:2},
  {id:"guo", name:"甩锅扁鲨",  desc:"扁而宽 · 嘴抿成一条线",price:170,
   lx:1.12,hy:0.70,dor:0.24,sn:0.86,tl:0.92,bl:0.86,eye:1.06,teeth:0.00,blush:0,brow:0},
  {id:"bing",name:"画饼巨口鲨",desc:"头钝嘴大 · 特别会说",price:210,
   lx:0.99,hy:1.03,dor:0.92,sn:0.66,tl:0.86,bl:1.02,eye:1.18,teeth:1.30,blush:1,brow:1}
];

function skinById(id){for(var i=0;i<SKINS.length;i++) if(SKINS[i].id===id) return SKINS[i];return SKINS[0];}
function shapeById(id){for(var i=0;i<SHAPES.length;i++) if(SHAPES[i].id===id) return SHAPES[i];return SHAPES[0];}
function outfitById(id){for(var i=0;i<OUTFITS.length;i++) if(OUTFITS[i].id===id) return OUTFITS[i];return OUTFITS[0];}
function curSkin(){return skinById(S.skin||"classic");}
/* 我现在的样子（配色 + 衣服 + 形状） */
function myLook(){return {skin:S.skin||"classic",shape:S.shape||DEF_SHAPE,outfit:S.outfit||DEF_OUTFIT};}
/* 某条鱼的样子 */
function lookOfFish(f){return {skin:(f&&f.skin)||"classic",shape:(f&&f.shape)||DEF_SHAPE,outfit:(f&&f.outfit)||DEF_OUTFIT};}

/* ---------------- 状态标签 ----------------
   一个状态同时决定三件事：
     ① 鱼的样子（c → 四维码，喂给 avatarSVG 决定配色与轮廓）
     ② 标签上的图标（e）
     ③ 工作节律里的情绪信号（v：-1 消耗 / 0 中性 / +1 回血）
   之所以把 v 做成数据而不是拿正则去匹配「想跑|累了|不服」：
   用户一加自定义状态，正则就漏，而 v 是显式的，漏不掉。 */
var MOOD_LIB=[
  {t:"无语",     e:"😑", c:"FNPA", v:0},
  {t:"想骂人",   e:"🤬", c:"TNPG", v:-1},
  {t:"有点爽",   e:"😎", c:"TNJA", v:1},
  {t:"累了",     e:"🥱", c:"FSPG", v:-1},
  {t:"想跑",     e:"🏃", c:"TNPA", v:-1},
  {t:"不服",     e:"😤", c:"TNJG", v:-1},
  {t:"苦笑",     e:"🙂", c:"FSPA", v:0},
  {t:"认真",     e:"🧐", c:"TSJA", v:1},
  {t:"被画饼",   e:"🥞", c:"FNJG", v:-1},
  {t:"被甩锅",   e:"🍳", c:"TNPG", v:-1},
  {t:"在摸鱼",   e:"🐟", c:"FNPA", v:1},
  {t:"开会到麻木",e:"😵", c:"FSPA", v:-1},
  {t:"被夸到心虚",e:"🫠", c:"FSJA", v:0},
  {t:"被表扬了", e:"😊", c:"TSJA", v:1},
  {t:"想提离职", e:"✍️", c:"TNPA", v:0},
  {t:"在等消息", e:"⏳", c:"FNPA", v:-1},
  {t:"有点慌",   e:"😰", c:"FSPG", v:-1},
  {t:"被 PUA 了",e:"🕳", c:"FSPG", v:-1},
  {t:"偷偷开心", e:"🤭", c:"TSJA", v:1},
  {t:"摆烂中",   e:"🛋", c:"FNPA", v:0},
  {t:"还在加班", e:"🌙", c:"FSPG", v:-1},
  {t:"刚下班",   e:"🚪", c:"TNJA", v:1},
  {t:"拿到 offer",e:"🎉",c:"TSJA", v:1},
  {t:"被否了",   e:"💢", c:"TNPG", v:-1}
];
var MOODS=MOOD_LIB.map(function(x){ return x.t; });
var MOOD_CODE={}, MOOD_ICON={}, MOOD_VAL={};
MOOD_LIB.forEach(function(x){ MOOD_CODE[x.t]=x.c; MOOD_ICON[x.t]=x.e; MOOD_VAL[x.t]=x.v; });

/* ---------- 自定义状态：存在存档里，跟着你走 ---------------- */
function customMoods(){
  if(!Array.isArray(S.customMoods)) S.customMoods=[];
  return S.customMoods;
}
function moodsAll(){ return MOODS.concat(customMoods()); }
function isCustomMood(m){ return customMoods().indexOf(m)>=0; }
function moodIcon(m){ return MOOD_ICON[m]||"🏷"; }
function moodVal(m){ return (MOOD_VAL[m]==null)?0:MOOD_VAL[m]; }
/* 自定义状态也要有码，否则那条鱼会退化成默认配色。
   按名字做确定性哈希：同一个名字永远得到同一个码，重启也不变。 */
function moodCode(m){
  if(MOOD_CODE[m]) return MOOD_CODE[m];
  var s=String(m||""), h=2166136261;
  for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=(h*16777619)>>>0; }
  return (h&1?"T":"F")+((h>>1)&1?"N":"S")+((h>>2)&1?"J":"P")+((h>>3)&1?"A":"G");
}
function moodAdd(name){
  /* 8 个字：够写「被甲方反复折磨」这种真会用的说法；6 字会把它切成半截话 */
  var n=String(name||"").trim().slice(0,8);
  if(!n){ toast("先给这个状态起个名字"); return false; }
  if(moodsAll().indexOf(n)>=0){ S.mood=n; save(); toast("已经有这个状态了，直接用"); return true; }
  if(customMoods().length>=12){ toast("自定义状态最多 12 个，删一个再加"); return false; }
  customMoods().push(n); S.mood=n; save();
  toast("加了「"+n+"」，以后随时能选");
  return true;
}
function moodDel(name){
  var a=customMoods(), i=a.indexOf(name);
  if(i<0) return;
  a.splice(i,1);
  if(S.mood===name) S.mood="无语";
  save(); toast("删掉了「"+name+"」");
}

/* ---------------- 开场：水里游的鲨鱼 ---------------- */
/* 开场：一开始只有几条，停得越久鱼越多，最后把整片水占满。
   注意 #splashFish/#splashBub 是 .splash（flex 容器）里的绝对定位层，
   否则它们会变成 flex item，把居中的文案挤偏。 */
var SPLASH_CODES = ["TNJA","FNPG","TNPG","FSPG","TSJA","FNPA","TNJG","FSPA","TNPA","FNJG","TSPG","FNJA"];
var SPLASH_LANES = 9;      /* 泳道数：决定纵向铺开的密度 */
var SPLASH_START = 10;     /* 一进来就有几条 */
var SPLASH_MAX   = 44;     /* 上限：再多人眼也分不出来，只是白烧帧 */
var SPLASH_EVERY = 1400;   /* 每 1.4 秒加 2 条 → 约 21 秒铺满 */

var splashN = 0, splashTimer = null;

function splashStill(){
  /* 「不动」有两种：应用里的开关，和系统级偏好。两者都要一次放满，
     因为动画被按住时「慢慢出现」是看不出来的。 */
  var byApp = document.documentElement.getAttribute("data-motion") === "0";
  var byOS = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  return byApp || byOS;
}
function splashFishHTML(i){
  var lane = i % SPLASH_LANES;
  var top = 3 + lane * (94 / SPLASH_LANES) + (i % 3) * 1.8;
  var sz  = 0.32 + ((i * 37) % 62) / 100;               /* 0.32–0.94 */
  var dur = 22 + ((i * 13) % 34);                        /* 22–56 秒横穿 */
  /* 负 delay 的进度必须按「循环长度」打散，不能按「第几条 / 上限」算：
     后者在鱼还没加满时只铺满路径的前一段，整屏会半边空半边挤（第一版就长这样，
     截图才看出来）。乘 7 与 12 互质，能均匀轮遍 12 个偏移。 */
  var del = -(dur * (0.06 + 0.88 * (((i * 7) % 12) / 12)));
  var look = {
    skin:   SKINS[i % SKINS.length].id,
    shape:  SHAPES[(i * 3) % SHAPES.length].id,
    outfit: OUTFITS[i % OUTFITS.length].id
  };
  return '<div class="sw" style="top:' + top.toFixed(1) + '%;animation-duration:' + dur +
    's;animation-delay:' + del.toFixed(1) + 's">' +
    '<div style="animation-duration:' + (3.2 + sz * 2.4).toFixed(1) +
    's;animation-delay:-' + (i * 0.7).toFixed(1) + 's">' +
    avatarSVG(SPLASH_CODES[i % SPLASH_CODES.length], Math.round(150 * sz), 1 + (i % 3), look, {bare:true}) +
    '</div></div>';
}
function splashAddFish(n){
  var host = document.getElementById("splashFish");
  if (!host) return;
  var h = "";
  for (var k = 0; k < n && splashN < SPLASH_MAX; k++){ h += splashFishHTML(splashN); splashN++; }
  if (h) host.insertAdjacentHTML("beforeend", h);
}
function splashAddBub(n){
  var bub = document.getElementById("splashBub");
  if (!bub) return;
  var h = "";
  for (var i = 0; i < n; i++){
    var sz = 4 + Math.round(Math.random() * 11);
    h += '<span class="bub" style="left:' + (Math.random() * 98).toFixed(1) + '%;width:' + sz +
      'px;height:' + sz + 'px;animation-duration:' + (9 + Math.random() * 11).toFixed(1) +
      's;animation-delay:-' + (Math.random() * 16).toFixed(1) + 's"></span>';
  }
  bub.insertAdjacentHTML("beforeend", h);
}
/* ---------------------------------------------------------------------
   海底方块地形
   ---------------------------------------------------------------------
   全部严格对齐方块网格，和鲨鱼同一套语言。
   三层远近 + 礁石 + 珊瑚丛 ： 远层浅、近层深，这是大气透视，
   缺了它整片海底会像一张贴纸贴在页面底部。
   ★ 起伏用三组正弦叠加，不用随机数：既有自然感又完全可复现，
     构建产物才能被断言比对。
   --------------------------------------------------------------------- */
var SFL_U = 20;                      /* 方块边长（SVG 单位） */
var SFL_W = 1400, SFL_H = 300;
function sflAmp(c, seed){
  return Math.sin(c*0.21 + seed)*0.52 +
         Math.sin(c*0.072 + seed*2.3)*0.31 +
         Math.sin(c*0.53 + seed*1.7)*0.17;
}
/* 一层沙丘：一条起伏的方块天际线，从顶往下填到底 */
function sflLayer(baseY, minH, maxH, fill, seed, op){
  var cols = Math.ceil(SFL_W/SFL_U), out = '<g fill="'+fill+'"'+(op?' opacity="'+op+'"':'')+'>';
  for(var c=0;c<cols;c++){
    var hh = minH + (sflAmp(c,seed)*0.5+0.5)*(maxH-minH);
    var y  = baseY - Math.round(hh/SFL_U)*SFL_U;
    out += '<rect x="'+(c*SFL_U)+'" y="'+y+'" width="'+SFL_U+'" height="'+(SFL_H-y)+'"/>';
  }
  return out+'</g>';
}
/* 礁石：一垛方块，上宽下窄，看起来是「堆」出来的 */
function sflRock(x, baseY, w, hgt, fill){
  var out='<g fill="'+fill+'">';
  for(var i=0;i<hgt;i++){
    var shrink = Math.floor(i/2);
    var ww = Math.max(1, w-shrink);
    out += '<rect x="'+(x+shrink*SFL_U/2)+'" y="'+(baseY-(i+1)*SFL_U)+
           '" width="'+(ww*SFL_U)+'" height="'+SFL_U+'"/>';
  }
  return out+'</g>';
}
/* 珊瑚丛：一根主干 + 两根分支，最多 5 格高 */
function sflCoral(x, baseY, hgt, fill){
  var out='<g fill="'+fill+'">', i;
  for(i=0;i<hgt;i++)
    out += '<rect x="'+x+'" y="'+(baseY-(i+1)*SFL_U)+'" width="'+SFL_U+'" height="'+SFL_U+'"/>';
  out += '<rect x="'+(x-SFL_U)+'" y="'+(baseY-(hgt-1)*SFL_U)+'" width="'+SFL_U+'" height="'+SFL_U+'"/>';
  if(hgt>2)
    out += '<rect x="'+(x+SFL_U)+'" y="'+(baseY-(hgt-2)*SFL_U)+'" width="'+SFL_U+'" height="'+SFL_U+'"/>';
  return out+'</g>';
}
/* 海草：两根细长的竖直方块 */
function sflWeed(x, baseY, hgt, fill){
  return '<g fill="'+fill+'">'+
    '<rect x="'+x+'" y="'+(baseY-hgt*SFL_U)+'" width="'+(SFL_U*0.5)+'" height="'+(hgt*SFL_U)+'"/>'+
    '<rect x="'+(x+SFL_U*0.9)+'" y="'+(baseY-(hgt-1)*SFL_U)+'" width="'+(SFL_U*0.5)+'" height="'+((hgt-1)*SFL_U)+'"/>'+
    '</g>';
}
function splashBuildFloor(){
  var host = document.getElementById("sfloor");
  if(!host) return;
  var h = "";
  /* 远层：最浅最淡，几乎沉进水里 */
  h += sflLayer(186, 16, 46, "#8FB6C8", 0.4, ".52");
  h += sflRock(150, 190, 3, 3, "#6E9CB2");
  h += sflRock(980, 188, 4, 4, "#6E9CB2");
  /* 中层 */
  h += sflLayer(232, 22, 62, "#5E8CA4", 1.9, ".82");
  h += sflRock(420, 236, 4, 4, "#2E5A72");
  h += sflRock(1180, 234, 5, 5, "#2E5A72");
  h += sflWeed(300, 232, 5, "#3E7A63");
  h += sflWeed(1060, 230, 6, "#3E7A63");
  /* 珊瑚丛：颜色错开，别排成一排 */
  h += sflCoral(210, 234, 4, "#C4553F");
  h += sflCoral(560, 238, 3, "#D4803A");
  h += sflCoral(760, 232, 5, "#4E8A6A");
  h += sflCoral(1120, 236, 3, "#C9A83A");
  h += sflCoral(1310, 234, 4, "#B8546A");
  /* 近层是沙地，比中层**亮**：近处的沙反光，远处的礁石才沉进水里。
     原来这里给的是 #1B4055（很深的蓝），看起来像深渊而不是海底。 */
  h += sflLayer(300, 30, 88, "#7FA6B8", 3.2, "1");
  /* 最底压一条深色，把整个底部收住（否则海底会浮起来） */
  h += '<rect x="0" y="284" width="1400" height="16" fill="#16374B"/>';
  h += sflRock(80, 300, 5, 4, "#122E3F");
  h += sflRock(880, 300, 6, 5, "#122E3F");
  h += sflWeed(640, 300, 7, "#2E5F4E");
  h += sflWeed(1240, 300, 6, "#2E5F4E");
  h += sflCoral(460, 300, 5, "#A8452F");
  h += sflCoral(1000, 300, 4, "#3E7057");
  host.innerHTML = h;
}

/* 浮游颗粒（marine snow）：真实水里一定有，而且它让「深度」变得可感 ——
   远处的颗粒更小更暗，和景深是一回事。 */
function splashAddSnow(n){
  var host = document.getElementById("splashSnow");
  if(!host) return;
  var h = "";
  for(var i=0;i<n;i++){
    var sz = 1 + Math.random()*3.2;
    h += '<span class="snp" style="left:'+(Math.random()*100).toFixed(1)+'%;'+
      'top:'+(Math.random()*100).toFixed(1)+'%;width:'+sz.toFixed(1)+'px;height:'+sz.toFixed(1)+'px;'+
      'opacity:'+(0.16+Math.random()*0.42).toFixed(2)+';'+
      'animation-duration:'+(11+Math.random()*17).toFixed(1)+'s;'+
      'animation-delay:-'+(Math.random()*20).toFixed(1)+'s"></span>';
  }
  host.insertAdjacentHTML("beforeend", h);
}
function stopSplashGrowth(){
  if (splashTimer){ clearInterval(splashTimer); splashTimer = null; }
}
function buildSplash(){
  var host = document.getElementById("splashFish");
  if (!host) return;
  host.innerHTML = ""; splashN = 0;
  var bub = document.getElementById("splashBub");
  if (bub) bub.innerHTML = "";
  stopSplashGrowth();
  splashBuildFloor();
  splashAddBub(24); splashAddSnow(30);
  /* ★ 开屏只有一条鱼（后面三道影子）：不再越游越多 ——
     鱼群是「鱼池」里的事，开屏只交代「你是谁、会长成什么样」。 */
  mountSplashFish();   /* 开屏这条鱼也追光标（四条：本体 + 三道影子） */
}

function enterApp(){
  stopSplashGrowth();
  var sp=document.getElementById("splash");
  if(sp) sp.classList.add("gone");
  var sh=document.getElementById("shell");
  if(sh) sh.classList.remove("hidden");
  /* 延时隐藏要能被「马上又回主界面」撤销：只在自己还带着 gone 时才收屏 */
  if(sp){
    clearTimeout(sp.__t);
    sp.__t=setTimeout(function(){ if(sp&&sp.classList.contains("gone")) sp.style.display="none"; },820);
  }
}
/* 回主界面（开屏）。开屏就是选通道的地方，所以「切通道」和「回主界面」是同一颗按钮。 */
function backToSplash(){
  var sp=document.getElementById("splash"), sh=document.getElementById("shell");
  if(!sp) return;
  if(sp.__t) clearTimeout(sp.__t);
  sp.style.display="";
  sp.classList.remove("gone");
  if(sh) sh.classList.add("hidden");
  buildSplash();                 /* 开屏那条鱼在进入时被清过，回来要重画 */
  mountSplashFish();
  if(typeof trackPush==="function") trackPush("nav_home",{from:S.view||""});
  if(typeof toast==="function") toast("回到主界面 · 可以重新选通道");
}

/* ---------------- 鱼池 ---------------- */
/* 预置的「别人放的鱼」。单文件应用没有真后端，这些是本地示例，
   页面上会明确标出来，不假装是真实用户。 */
var SEED_FISH=[
  {id:"s1", by:"隔壁工位的阿May",code:"FNPA",mood:"无语",  likes:34,skin:"rose",   shape:"meng",outfit:"plaid",  t:"周报写到第三版，领导说还是第一版好。"},
  {id:"s2", by:"后端老周",       code:"TNPG",mood:"想骂人",likes:52,skin:"classic",shape:"tou", outfit:"hoodie", t:"需求改了 11 次，最后一次改回第一次的样子。"},
  {id:"s3", by:"实习生小林",     code:"FSPA",mood:"苦笑",  likes:18,skin:"mint",   shape:"meng",outfit:"sweater",t:"群里 @ 我三次，我回了「好的」，根本没看懂。"},
  {id:"s4", by:"前同事阿哲",     code:"TNJA",mood:"不服",  likes:41,skin:"coral",  shape:"bing",outfit:"vest",   t:"我做的方案被念成了别人的名字，PPT 上连标点都没改。"},
  {id:"s5", by:"楼下咖啡师",     code:"FNPG",mood:"累了",  likes:27,skin:"ocean",  shape:"moyu",outfit:"bare",   t:"每天通勤三小时，到工位第一件事是发呆十分钟。"},
  {id:"s6", by:"匿名鲨",         code:"FSPG",mood:"想跑",  likes:63,skin:"grape",  shape:"guo", outfit:"hoodie", t:"绩效面谈说「你很稳」，我听完就知道今年没有我。"},
  {id:"s7", by:"产品小张",       code:"TNJA",mood:"认真",  likes:22,skin:"gold",   shape:"bing",outfit:"suit",   t:"甲方说「要高级一点」，我问具体指什么，他说「你懂的」。"},
  {id:"s8", by:"财务阿姐",       code:"TSJA",mood:"无语",  likes:15,skin:"ghost",  shape:"mega",outfit:"vest",   t:"报销单被退了四次，理由每次都不一样。"},
  {id:"s9", by:"刚离职的老王",   code:"TNPA",mood:"有点爽",likes:88,skin:"coral",  shape:"mega",outfit:"bare",   t:"递完辞职信那天，我把三年的待办清单全删了。"},
  {id:"s10",by:"运营阿May",      code:"FNJG",mood:"不服",  likes:31,skin:"mint",   shape:"meng",outfit:"plaid",  t:"别人做砸的盘子塞给我，做起来是他指导有方。"},
  {id:"s11",by:"测试小李",       code:"FSPA",mood:"累了",  likes:19,skin:"ocean",  shape:"moyu",outfit:"sweater",t:"上线前一晚提的 bug，被说「这个不影响体验」，结果第二天炸了。"},
  {id:"s12",by:"隔壁部门领导",   code:"TNJG",mood:"认真",  likes:12,skin:"classic",shape:"bing",outfit:"suit",   t:"开会两小时，结论是「下次再议」。"},
  {id:"s13",by:"应届生小陈",     code:"FNPA",mood:"苦笑",  likes:24,skin:"rose",   shape:"meng",outfit:"sweater",t:"面试问「你能接受加班吗」，我说能，我不知道不能会怎样。"},
  {id:"s14",by:"外包阿强",       code:"TSPG",mood:"想骂人",likes:44,skin:"grape",  shape:"guo", outfit:"hoodie", t:"同一个活，正式员工做叫「参与」，我们做叫「交付」。"},
  {id:"s15",by:"前 HR 阿May",    code:"FNJG",mood:"无语",  likes:29,skin:"ghost",  shape:"mega",outfit:"vest",   t:"「我们这边节奏比较快」翻译过来就是，今晚别走。"},
  {id:"s16",by:"设计阿元",       code:"FNPA",mood:"不服",  likes:37,skin:"gold",   shape:"bing",outfit:"plaid",  t:"改到我第八版，客户说还是第一版，我笑了两分钟。"},
  {id:"s17",by:"销售老赵",       code:"TNPG",mood:"有点爽",likes:33,skin:"coral",  shape:"mega",outfit:"suit",   t:"签下来那一刻挺爽，回款那天更爽。"},
  {id:"s18",by:"运维老吴",       code:"TSJA",mood:"累了",  likes:21,skin:"ocean",  shape:"tou", outfit:"hoodie", t:"凌晨两点被电话叫起来，问题在别处，但先叫我起来。"},
  {id:"s19",by:"同组小周",       code:"FSPG",mood:"想跑",  likes:47,skin:"mint",   shape:"moyu",outfit:"bare",   t:"我已经能在会议室里，一边点头一边想晚饭吃什么了。"},
  {id:"s20",by:"已经上岸的鲨",   code:"TNJA",mood:"认真",  likes:96,skin:"gold",   shape:"mega",outfit:"vest",   t:"找工作那三个月，我唯一的进步是学会了不解释。"}
];

function myFish(){ return S.fish||[]; }
function allFish(){
  var mine=myFish().map(function(f){ return f; });
  return mine.concat(SEED_FISH);
}
function fishById(id){
  var a=allFish();
  for(var i=0;i<a.length;i++) if(a[i].id===id) return a[i];
  return null;
}
function likeCount(f){
  var extra=(S.likes&&S.likes[f.id])||0;          // 自己点的（最多 1）
  var bonus=(S.likeBonus&&S.likeBonus[f.id])||0;  // 别人点的（模拟）
  return (f.likes||0)+extra+bonus;
}
function isLiked(id){ return !!(S.likes&&S.likes[id]); }
function fishName(f){ return shapeById((f&&f.shape)||DEF_SHAPE).name; }

/* ---------------- 会游动的鱼池 ---------------- */
var TANK_MAX=22;
function tankList(){
  var list=allFish().slice(0);
  list.sort(function(a,b){ return likeCount(b)-likeCount(a); });
  return list.slice(0,TANK_MAX);
}
function renderTank(){
  var host=document.getElementById("tankOut");
  if(!host) return;
  var list=tankList();
  if(!list.length){ host.innerHTML='<div class="tempty">池子还是空的。上面写一句，让它变成鲨鱼。</div>'; renderTankDetail(); return; }
  var lanes=7;
  host.innerHTML=list.map(function(f,i){
    var lane=i%lanes;
    var top=6+lane*(86/lanes);
    var dur=(21+(i%5)*4.6);
    var del=(-(i*1.9))%dur;
    var dir=(lane%2===0)?"r":"l";
    var size=[68,82,60,92,74,86][i%6];
    var sel=(S.pick===f.id)?" sel":"";
    return '<button type="button" class="tf '+dir+sel+'" data-tf="'+f.id+'" title="'+esc(f.t)+'" '+
      'aria-label="'+esc(fishName(f)+"，"+((f.by||"我"))+"："+f.t)+'" '+
      'style="top:'+top.toFixed(1)+'%;animation-duration:'+dur.toFixed(1)+'s;animation-delay:'+del.toFixed(1)+'s">'+
      '<span class="tsw" style="animation-duration:'+(3.1+(i%4)*0.7).toFixed(1)+'s;animation-delay:(-'+(i*0.6).toFixed(1)+'s)">'+
      avatarSVG(f.code||"TNJA",size,2,lookOfFish(f))+'</span></button>';
  }).join("");
  renderTankDetail();
}
/* 池子下面的「选中那条鱼」详情 */
function renderTankDetail(){
  var host=document.getElementById("tankDetail");
  if(!host) return;
  var list=tankList();
  if(!list.length){ host.innerHTML=""; return; }
  var f=fishById(S.pick);
  if(!f||list.indexOf(f)<0) f=list[0];
  var liked=isLiked(f.id);
  host.innerHTML='<div class="tdcard">'+
    '<div class="tdav">'+avatarSVG(f.code||"TNJA",84,2,lookOfFish(f))+'</div>'+
    (f.img?'<div class="tdimg"><img src="'+f.img+'" alt="这条鱼配的图"></div>':'')+
    '<div class="tdmain">'+
      '<div class="tdhead"><b>'+esc(fishName(f))+'</b><span class="tdwho">'+esc(f.by||"我")+'</span>'+
        (f.mood?'<span class="tag">'+esc(f.mood)+'</span>':'')+
        (f.img?'<img class="pthumb" src="'+f.img+'" alt="这条鱼配的图" loading="lazy">':'')+'</div>'+
      '<div class="tdt">'+esc(f.t)+'</div>'+
      '<div class="tdfoot"><span class="tdtip">点池子里任意一条鱼，这里会换成它</span>'+
        '<button class="lk'+(liked?" on":"")+'" data-lk="'+f.id+'">'+likeCount(f)+'</button></div>'+
    '</div></div>';
  var lk=host.querySelector("[data-lk]");
  if(lk) lk.onclick=function(){ likeFish(f.id); };
}
/* =====================================================================
   配图：本地压缩为 dataURL 存进存档
   ---------------------------------------------------------------------
   ★ 为什么必须压缩、而且必须给预算上限：
     存档存在 localStorage，浏览器通常只给 5MB 左右。一张手机原图
     3—8MB，直接 base64 存进去，第二条就把配额撑爆 ：
     表现是「存档失败：本地存储已满」，而且会连累其他数据一起存不进去。
     所以：长边压到 720、JPEG 0.72，并且整份存档的图片总量封顶 2.2MB。
   ★ 这是**离线存储**，不是上传。图片不会离开这台设备 ： 这也是它能
     用「不用注册」换来的代价：换设备要靠导出存档把图一起搬过去。
   ===================================================================== */
var IMG_CAP = 2.2 * 1024 * 1024;    /* 整份存档里图片的总预算 */
var IMG_MAX_EDGE = 720;             /* 长边上限 */
var IMG_Q = 0.72;                   /* JPEG 质量 */

function imgUsed(){
  var n = 0;
  (S.fish||[]).forEach(function(f){ if(f.img) n += f.img.length; });
  if(S.pendingImg) n += S.pendingImg.length;
  return n;
}
function imgKb(n){ return Math.round((n||0)/1024); }
function imgNote(){
  var used = imgUsed();
  return '已用 '+imgKb(used)+' KB / 上限 '+imgKb(IMG_CAP)+' KB';
}
/* 等比缩到长边 <= IMG_MAX_EDGE，再转 JPEG。只在本机做，不联网。 */
function imgShrink(file, cb){
  var rd = new FileReader();
  rd.onload = function(){
    var im = new Image();
    im.onload = function(){
      var w = im.width, h = im.height;
      var k = Math.min(1, IMG_MAX_EDGE / Math.max(w, h));
      var cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(w * k));
      cv.height = Math.max(1, Math.round(h * k));
      var cx = cv.getContext("2d");
      /* 先铺白底：透明 PNG 直接转 JPEG 会变成黑底 */
      cx.fillStyle = "#FFFFFF"; cx.fillRect(0, 0, cv.width, cv.height);
      cx.drawImage(im, 0, 0, cv.width, cv.height);
      var url;
      try { url = cv.toDataURL("image/jpeg", IMG_Q); }
      catch(e){ cb("这个图片读不出来（可能是格式不支持）"); return; }
      cb(null, url);
    };
    im.onerror = function(){ cb("这个文件不是能识别的图片"); };
    im.src = String(rd.result);
  };
  rd.onerror = function(){ cb("读文件失败"); };
  rd.readAsDataURL(file);
}
function fishPicPick(){
  var inp = document.getElementById("fishPic");
  if(!inp) return;
  inp.value = "";
  inp.onchange = function(){
    var f = inp.files && inp.files[0];
    if(!f) return;
    imgShrink(f, function(err, url){
      if(err){ toast(err); return; }
      if(imgUsed() + url.length > IMG_CAP){
        toast("图片预算不够了（"+imgKb(IMG_CAP)+" KB 上限）。删掉几条带图的鱼再加");
        return;
      }
      S.pendingImg = url; save(); renderPicPrev();
      toast("图配好了，点「放出去」一起发");
    });
  };
  inp.click();
}
function renderPicPrev(){
  var host = document.getElementById("picPrev");
  if(!host) return;
  var note = document.getElementById("picNote");
  if(note){
    note.textContent = S.pendingImg ? "这条鱼会带上这张图 · " + imgNote()
                                    : "可选。图只在这台设备上，不会上传；会让存档变大";
  }
  host.innerHTML = S.pendingImg
    ? '<div class="picbox"><img src="'+S.pendingImg+'" alt="这条鱼的配图"><button type="button" id="picDel" aria-label="去掉这张图">✕</button></div>'
    : "";
  var d = document.getElementById("picDel");
  if(d) d.onclick = function(){ S.pendingImg = ""; save(); renderPicPrev(); toast("去掉了"); };
}
function pickFish(id){
  S.pick=id; save();
  /* 只切换高亮和详情，不整块重绘 —— 否则池里的鱼会被打回起点 */
  var host=document.getElementById("tankOut");
  if(host){
    Array.prototype.forEach.call(host.querySelectorAll("[data-tf]"),function(el){
      el.classList.toggle("sel", el.dataset.tf===id);
    });
  }
  renderTankDetail();
  /* 选中哪条鱼，右下角那个分享按钮就跟着变成哪条 —— 不然它永远停在上一次的状态 */
  if(typeof renderShareFab==="function") renderShareFab();
}

/* ---------------- 鱼池名册（卡片） ---------------- */
function renderPool(){
  var host=document.getElementById("poolOut");
  if(!host) return;
  var mode=(S.poolMode||"all");
  var list=allFish();
  if(mode==="mine") list=myFish();
  else if(mode==="liked") list=list.filter(function(f){ return isLiked(f.id); });
  if(!list.length){
    host.innerHTML='<div class="empty" style="grid-column:1/-1">'+(mode==="mine"?"你还没放过鱼。上面写一句，让它变成鲨鱼。":(mode==="liked"?"还没给谁点过赞。去大家的鱼塘转一圈。":"这里是空的。"))+'</div>';
    return;
  }
  list.sort(function(a,b){ return likeCount(b)-likeCount(a); });
  host.innerHTML=list.map(function(f){
    var mine=!!f.mine;
    var liked=isLiked(f.id);
    return '<div class="fish'+(mine?" mine":"")+(f.fresh?" fresh":"")+'">'+
      (mine?'<button class="del" data-del="'+f.id+'" title="收回来">✕</button>':'')+
      '<div class="fv">'+avatarSVG(f.code||"TNJA",92,2,lookOfFish(f))+'</div>'+
      '<div class="fspec">'+esc(fishName(f))+'</div>'+
      '<div class="ft">'+esc(f.t)+'</div>'+
      '<div class="fm"><span class="who">'+esc(f.by||"我")+'</span>'+
        '<span class="tag">'+esc(f.mood||"无语")+'</span>'+
        '<span class="lk'+(liked?" on":"")+'" data-lk="'+f.id+'">'+likeCount(f)+'</span></div>'+
    '</div>';
  }).join("");
  Array.prototype.forEach.call(host.querySelectorAll("[data-lk]"),function(el){
    el.onclick=function(){ likeFish(el.dataset.lk); };
  });
  Array.prototype.forEach.call(host.querySelectorAll("[data-del]"),function(el){
    el.onclick=function(){ delFish(el.dataset.del); };
  });
  var badge=document.getElementById("navBadge");
  if(badge){
    var n=myFish().filter(function(f){return !isLiked(f.id);}).length;
    badge.textContent=n; badge.style.display=n?"":"none";
  }
}
function likeFish(id){
  S.likes=S.likes||{};
  if(S.likes[id]){ delete S.likes[id]; }
  else { S.likes[id]=1; addCoin(2,"给别人点了赞"); }
  save(); renderPool(); renderTank(); renderMe();
}
function delFish(id){
  S.fish=(S.fish||[]).filter(function(f){ return f.id!==id; });
  save(); renderPool(); renderTank(); renderMe(); toast("收回来了");
}
function postFish(text,mood){
  text=String(text||"").trim();
  if(text.length<4){ toast("太短了，多写几个字"); return false; }
  if(text.length>120) text=text.slice(0,120);
  trackPush("fish_post");   /* 埋点：放了一条鱼 */
  var f={
    id:"m"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    by:"我", mine:true, t:text, mood:mood||"无语",
    code:moodCode(mood||"无语"), img:S.pendingImg||"",
    skin:S.skin||"classic", shape:S.shape||DEF_SHAPE, outfit:S.outfit||DEF_OUTFIT,
    likes:0, at:Date.now(), fresh:true
  };
  S.fish=(S.fish||[]); S.fish.unshift(f);
  S.pick=f.id;
  addCoin(5,"放出一条鱼");
  S.pendingImg=""; renderPicPrev();
  save();
  // 飞入动画：从输入框飞到鱼池第一条的位置
  flyToPool(f).then(function(){
    setTimeout(function(){ f.fresh=false; renderPool(); renderTank(); },900);
  });
  renderMe();
  return true;
}

/* 让新鱼从输入框“游”进鱼池 */
function flyToPool(f){
  return new Promise(function(res){
    var src=document.getElementById("chatIn");
    var host=document.getElementById("tankOut")||document.getElementById("poolOut");
    if(!src||!host){ renderPool(); renderTank(); res(); return; }
    var a=src.getBoundingClientRect();
    var box=document.createElement("div");
    box.className="flyer";
    box.innerHTML=avatarSVG(f.code,72,2,lookOfFish(f));
    box.style.left=(a.left+a.width/2-36)+"px";
    box.style.top=(a.top-10)+"px";
    document.body.appendChild(box);
    var b=host.getBoundingClientRect();
    var tx=b.left+Math.min(b.width-40,90)-a.left-a.width/2+36;
    var ty=Math.max(b.top+40,a.top)-a.top;
    requestAnimationFrame(function(){
      box.style.transform="translate("+tx+"px,"+ty+"px) scale(.55) rotate(-16deg)";
      box.style.opacity="0.15";
    });
    setTimeout(function(){ box.remove(); renderPool(); renderTank(); res(); },880);
  });
}

/* ---------------- 商店（三个货架） ---------------- */
function catalogOf(type){
  if(type==="outfit") return OUTFITS;
  if(type==="shape") return SHAPES;
  return SKINS;
}
function ownOf(type){
  if(type==="outfit") return S.ownOutfit||[DEF_OUTFIT];
  if(type==="shape") return S.ownShape||[DEF_SHAPE];
  return S.own||["classic"];
}
function setOwn(type,arr){
  if(type==="outfit") S.ownOutfit=arr;
  else if(type==="shape") S.ownShape=arr;
  else S.own=arr;
}
function curOf(type){
  if(type==="outfit") return S.outfit||DEF_OUTFIT;
  if(type==="shape") return S.shape||DEF_SHAPE;
  return S.skin||"classic";
}
function setCur(type,id){
  if(type==="outfit") S.outfit=id;
  else if(type==="shape") S.shape=id;
  else S.skin=id;
}
/* 预览：把这一件套在当前的装扮上 */
function previewLook(type,id){
  var L=myLook();
  if(type==="outfit") L.outfit=id;
  else if(type==="shape") L.shape=id;
  else L.skin=id;
  return L;
}
function renderShop(){
  var host=document.getElementById("shopOut");
  if(!host) return;
  var type=S.shopTab||"skin";
  var cat=catalogOf(type), own=ownOf(type), cur=curOf(type);
  host.innerHTML=cat.map(function(it){
    var has=own.indexOf(it.id)>=0, on=(cur===it.id);
    /* 分享限定件（share.js 里 push 进来的）：只能用分享攒出来，鱼币买不到 ——
       否则「分享限定」四个字就成了假的。 */
    var need=it.share||0, gotShare=(typeof shareCount==="function")?shareCount():0;
    var tag = need ? ('分享 '+need+' 次可得') : (it.price===0 ? "免费" : it.price+" 鱼币");
    var buy;
    if(has) buy = on ? '<button disabled>正在用</button>' : '<button class="pri" data-use="'+type+':'+it.id+'">换上它</button>';
    else if(need) buy = '<button disabled>'+(gotShare>=need?"去「我的鱼塘」领取":"还差 "+(need-gotShare)+" 次分享")+'</button>';
    else buy = '<button '+(S.coin>=it.price?"":"disabled")+' data-buy="'+type+':'+it.id+'">'+(S.coin>=it.price?"买下":"鱼币不够")+'</button>';
    return '<div class="skin'+(on?" on":"")+(need?" shareonly":"")+'">'+
      (has?'<span class="owned">已拥有</span>':'')+
      (need&&!has?'<span class="sharebz">分享限定</span>':'')+
      '<div class="sv">'+avatarSVG("TNJA",88,1,previewLook(type,it.id))+'</div>'+
      '<div class="sn">'+esc(it.name)+'</div>'+
      '<div class="sd">'+esc(it.desc||"")+'</div>'+
      '<div class="sp'+(it.price===0&&!need?" free":"")+'">'+esc(tag)+'</div>'+
      '<div class="sb">'+buy+'</div></div>';
  }).join("");
  Array.prototype.forEach.call(host.querySelectorAll("[data-buy]"),function(el){
    el.onclick=function(){ var a=el.dataset.buy.split(":"); buyItem(a[0],a[1]); };
  });
  Array.prototype.forEach.call(host.querySelectorAll("[data-use]"),function(el){
    el.onclick=function(){ var a=el.dataset.use.split(":"); useItem(a[0],a[1]); };
  });
  var tabs=document.getElementById("shopTabs");
  if(tabs){
    Array.prototype.forEach.call(tabs.querySelectorAll("button"),function(b){
      b.classList.toggle("on", b.dataset.shopshelf===type);
    });
  }
  var cn=document.getElementById("shopCoin");
  if(cn) cn.textContent=(S.coin||0);
}
function itemName(type,id){
  if(type==="outfit") return outfitById(id).name;
  if(type==="shape") return shapeById(id).name;
  return skinById(id).name;
}
function buyItem(type,id){
  var it=null,cat=catalogOf(type);
  for(var i=0;i<cat.length;i++) if(cat[i].id===id) it=cat[i];
  if(!it) return;
  var own=ownOf(type).slice(0);
  if(own.indexOf(id)>=0){ useItem(type,id); return; }
  if(S.coin<it.price){ toast("鱼币不够，先去放几条鱼"); return; }
  S.coin-=it.price;
  own.push(id); setOwn(type,own); setCur(type,id);
  save(); renderShop(); renderMe(); renderPool(); renderTank();
  toast("买下了「"+it.name+"」，已经换上");
}
function useItem(type,id){
  if(ownOf(type).indexOf(id)<0) return;
  setCur(type,id);
  save(); renderShop(); renderMe(); renderPool(); renderTank();
  toast("换上了「"+itemName(type,id)+"」");
}
/* 旧调用点兼容 */
function buySkin(id){ buyItem("skin",id); }
function useSkin(id){ useItem("skin",id); }
function shapeName(id){ return shapeById(id).name; }
function outfitName(id){ return outfitById(id).name; }
function addCoin(n,why){
  S.coin=(S.coin||0)+n;
  if(why) S.log=(S.log||[]).concat([{t:why,n:n,at:Date.now()}]).slice(-40);
}
/* 新手礼包：只在第一次发，之后不再补 */
function grantGift(){
  if(S.gift) return;
  S.gift=1; addCoin(120,"新手礼包");
}

/* ---------------- 职场画像：画像确定后跳出来的鱼 ---------------- */
function renderProfFish(animate){
  var host=document.getElementById("profFish");
  if(!host) return;
  if(!S.prof||!S.prof.labels||!S.prof.labels.length){ host.innerHTML=""; return; }
  var q=S.prof.quad, L=S.prof.labels, look=myLook();
  var sp=shapeById(look.shape), of=outfitById(look.outfit);
  host.innerHTML='<div class="leapwrap" id="leapWrap">'+
    '<div class="leapfish"><span class="splashring"></span>'+avatarSVG(q.code,150,0,look)+'</div>'+
    '<div class="leaptxt">'+
      '<div class="leyebrow">画像确定 · 你的鱼跳出来了</div>'+
      '<h3>'+esc(sp.name)+'</h3>'+
      '<div class="leapaka">'+esc(sp.desc||"")+'</div>'+
      '<p>四维 <b>'+esc(q.code)+'</b> · 主标签 <b class="hl">'+esc(L[0].p.t)+'</b>'+
        (L[0].p.aka?'（'+esc(L[0].p.aka)+'）':'')+'</p>'+
      '<div class="leapmeta">穿着「'+esc(of.name)+'」，配色「'+esc(curSkin().name)+'」 · 共 '+L.length+' 个常驻标签</div>'+
      '<div class="acts"><button class="pri" id="btnProfNext">下一步：挑关键词 →</button>'+
      '<button id="btnProfDress">去给它换身衣服</button></div>'+
    '</div></div>';
  if(animate){
    var w=document.getElementById("leapWrap");
    if(w){ w.classList.remove("on"); void w.offsetWidth; w.classList.add("on"); }
  }
  var n=document.getElementById("btnProfNext");
  if(n) n.onclick=function(){ job(1); };
  var d=document.getElementById("btnProfDress");
  if(d) d.onclick=function(){ S.shopTab="outfit"; save(); view("chatter"); openChatTab("shop"); };
}
