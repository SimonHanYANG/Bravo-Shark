/* =====================================================================
   获客与修复层
   ① 隐私与数据说明（2000 样本里最大退出点的解药）
   ② 分享卡导出（画像卡 / 鱼卡 → PNG，9:16 与 1:1）
   ③ 鱼群密语（免注册入口）
   ④ 无障碍与动效修复（自测出来的 6 处真缺陷）
   ===================================================================== */

/* =====================================================================
   ① 隐私与数据说明
   ===================================================================== */
var PRIVACY_HTML =
  '<div class="priv">'+
    '<div class="priv-hero"><b>你的简历不会离开这台设备。</b>'+
      '<span>这不是一句承诺，是这套东西的结构决定的。</span></div>'+
    '<div class="priv-grid">'+
      '<div class="privcard"><i>1</i><b>没有服务器</b>'+
        '<span>整个工具就是一个 HTML 文件，双击打开就运行。它没有后端，也没有任何地方能接收你的简历。</span></div>'+
      '<div class="privcard"><i>2</i><b>简历在本地解析</b>'+
        '<span>上传的 docx / pdf 是由你浏览器里的代码解压、抽文字、算画像的。全过程不产生网络请求。</span></div>'+
      '<div class="privcard"><i>3</i><b>数据存在你浏览器的本地存储里</b>'+
        '<span>用的是 localStorage，存在你这台设备上、这个浏览器里。换设备或换浏览器就看不到，清空浏览器数据也会一并消失。</span></div>'+
      '<div class="privcard"><i>4</i><b>唯一会联网的，是你主动点的那几个按钮</b>'+
        '<span>「让大模型重推画像」「让大模型重写信」这类按钮，才会把你当时那部分内容发给你自己配置的模型服务商。不点，就不发。</span></div>'+
    '</div>'+
    '<div class="priv-warn"><b>有一件事必须说明白</b>'+
      '<span>如果你接了自己的大模型接口，点那几个按钮时，被发送的内容会经过你填的那个服务商：这是你选的，不是这个工具偷偷做的。'+
      '如果简历里有你不希望外发的信息，就先别点那几个按钮。</span></div>'+
    '<div class="priv-acts">'+
      '<button class="pri" id="pvExport">导出我的存档（JSON）</button>'+
      '<button id="pvWipe">清空我的全部数据</button>'+
      '<button id="pvTool">去看鱼群密语（这个不用登录）</button>'+
    '</div>'+
    '<div class="priv-foot">版本里的所有人格库、题库、岗位语料都随文件一起打包，不需要联网获取。'+
    '如果你要把这份文件发给别人，注意：<b>别人拿到的是一份干净的新文件，不包含你的数据</b>。</div>'+
  '</div>';

function openPrivacy(){
  openModal("隐私与数据说明", PRIVACY_HTML, [{t:"知道了", c:"pri", f:closeModal}]);
  var e=document.getElementById("pvExport");
  if(e) e.onclick=function(){ closeModal(); var b=document.getElementById("btnExp"); if(b) b.click(); else toast("导出入口在左侧栏底部"); };
  var w=document.getElementById("pvWipe");
  if(w) w.onclick=confirmWipe;
  var t=document.getElementById("pvTool");
  if(t) t.onclick=function(){ closeModal(); view("tool"); };
}
function confirmWipe(){
  var n=0;
  try{ n=(S.fish||[]).length; }catch(e){}
  var h='<div class="priv">'+
    '<div class="priv-warn"><b>这一步不能撤销</b>'+
    '<span>会删掉存在这个浏览器里的全部内容：简历原文、画像、七词、匹配结果、你放的鱼、点赞、鱼币、装扮、错题集、模拟记录。'+
    '删完之后没有回收站，也没法恢复。</span></div>'+
    '<p class="note" style="margin-top:14px">你目前有 '+n+' 条放出去的鱼、'+((S.book||[]).length)+' 条错题记录。'+
    '如果只是想换台设备用，建议先点<b class="hl">导出存档</b>再清空。</p>'+
    '<div class="priv-acts"><button class="pri" id="pvWipeGo">我确认，全部删掉</button>'+
    '<button id="pvWipeBack">先不清了</button></div></div>';
  openModal("清空我的全部数据", h, []);
  var g=document.getElementById("pvWipeGo");
  if(g) g.onclick=function(){
    try{ localStorage.removeItem(KEY); }catch(e){}
    toast("已清空，正在重载");
    setTimeout(function(){ location.reload(); }, 700);
  };
  var b=document.getElementById("pvWipeBack");
  if(b) b.onclick=closeModal;
}

/* =====================================================================
   ② 分享卡导出（canvas 手绘，不依赖任何库）
   ===================================================================== */
function rrect(ctx, x, y, w, h, r){
  if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}
function cvsFont(w, s, fam){
  return (w||400)+" "+s+'px '+(fam||'"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif');
}
function wrapCJK(ctx, text, maxW){
  var lines=[], cur="";
  var t=String(text||"");
  for(var i=0;i<t.length;i++){
    var ch=t.charAt(i);
    if(ch==="\n"){ lines.push(cur); cur=""; continue; }
    if(ctx.measureText(cur+ch).width>maxW && cur){ lines.push(cur); cur=ch; }
    else cur+=ch;
  }
  if(cur) lines.push(cur);
  return lines;
}
function svgToImg(svg, cb){
  var img=new Image();
  img.onload=function(){ cb(img); };
  img.onerror=function(){ cb(null); };
  /* 关键：作为 data URI 载入时是 XML 解析，缺 xmlns 会直接加载失败（内联进 HTML 才不需要） */
  var s=String(svg).replace(/^<svg /,'<svg xmlns="http://www.w3.org/2000/svg" ');
  img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s);
}

/* 画像卡
   ： 布局必须"先算位置再画"。第一版方版直接沿用竖版的单栏纵向排布，
      结果四维条跑出卡片、标签被裁掉、免责文字压在横条上；而断言只查了
      图片尺寸，1080×1080 照样通过。方版改用左右双栏。 */
function drawProfileCard(fmt, cb){
  var vert = (fmt!=="square");
  var W=1080, H= vert?1920:1080;
  var L=(S.prof&&S.prof.labels)||[], q=S.prof&&S.prof.quad, look=myLook();
  var cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  var c=cv.getContext("2d");

  var vertCard = { cardX:56, pad:100, cardY:300, shark:520, nameS:74, akaS:34,
                   dimS:28, poleS:20, chipS:28, chipH:52, maxRows:1, barrier:340 };
  var sqCard   = { cardX:56, pad:80,  cardY:200, shark:250, nameS:62, akaS:30,
                   dimS:24, poleS:18, chipS:26, chipH:44, maxRows:2, barrier:150 };
  var cfg = vert?vertCard:sqCard;
  var cardW = W - cfg.cardX*2;
  var shark = cfg.shark;
  var textX, textW, rowH, P = {};

  /* —— 第一遍：只算位置，不画。标签的行数要计入卡高，否则会掉出白卡 —— */
  function plan(){
    textX = vert ? (cfg.cardX+cfg.pad) : (cfg.cardX+cfg.pad+shark+50);
    textW = vert ? (cardW-cfg.pad*2) : (cfg.cardX+cardW-cfg.pad-textX);
    rowH  = cfg.dimS + 22 + 26 + cfg.poleS;

    /* 标签排布（用真实测量，不用估算） */
    c.font = cvsFont(600, cfg.chipS);
    P.chips=[]; P.chipRows=1;
    var cx=0, row=1, lastRight=textX;
    for(var k=0; k<L.length; k++){
      var tw = c.measureText(L[k].p.t).width + 38;
      if(cx + tw > textW + 1){
        if(row >= cfg.maxRows) break;
        row++; cx=0;
      }
      P.chips.push({l:L[k], tw:tw});
      cx += tw + 12;
      lastRight = textX + cx - 12;
    }
    P.chipRows = row;
    P.chipRight = lastRight;

    var chipBlock = cfg.chipH*P.chipRows + (P.chipRows-1)*10;
    var y = cfg.cardY + (vert?40:60);
    if(vert) y += shark + 34;
    P.name = y; y += cfg.nameS + 14;
    P.aka = (L.length && L[0].p.aka) ? y : 0;
    if(P.aka) y += cfg.akaS + 26;
    P.dims = [];
    for(var d=0; d<4; d++){ P.dims.push(y); y += rowH; }
    y += 6;
    P.chipLabel = y; y += cfg.dimS + 12;
    P.chipY = y; y += chipBlock;
    P.end = y + 26;
    P.cardH = P.end - cfg.cardY;
  }
  plan();
  /* 真放不下就压鲨鱼（方版会用到这条；收敛很快） */
  var guard=0, limit = H - cfg.barrier;
  while(cfg.cardY + P.cardH > limit && guard++ < 8){
    shark = Math.max(150, shark - 30); plan();
  }
  /* 若压到最小仍放不下，就让标签退成一行 */
  if(cfg.cardY + P.cardH > limit && cfg.maxRows > 1){
    cfg.maxRows = 1; plan();
  }

  /* 底：米色 + 上方一片水 */
  var g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#E7F1FA"); g.addColorStop(0.30,"#F4F8FC"); g.addColorStop(1,"#F8F5F0");
  c.fillStyle=g; c.fillRect(0,0,W,H);
  c.fillStyle="rgba(126,187,224,.22)";
  c.beginPath(); c.moveTo(0,0); c.lineTo(W,0); c.lineTo(W,H*0.20);
  for(var x=W;x>=0;x-=30){ c.lineTo(x, H*0.20+Math.sin(x/95)*22); }
  c.closePath(); c.fill();

  /* 顶部品牌 */
  c.textAlign="left"; c.textBaseline="alphabetic";
  c.fillStyle="#1E3A5F"; c.font=cvsFont(800, vert?34:30);
  c.fillText("offer鲨 · 职场鱼塘", 72, vert?148:104);
  c.fillStyle="#5C6B7A"; c.font=cvsFont(400, vert?26:23);
  c.fillText("从简历里自动抓出来的一份人格画像", 72, vert?196:144);

  /* 主卡 */
  c.save();
  c.shadowColor="rgba(60,45,35,.14)"; c.shadowBlur=40; c.shadowOffsetY=14;
  c.fillStyle="#FFFFFF"; rrect(c,cfg.cardX,cfg.cardY,cardW,P.cardH,44); c.fill();
  c.restore();
  c.strokeStyle="#E3D7C4"; c.lineWidth=3; rrect(c,cfg.cardX,cfg.cardY,cardW,P.cardH,44); c.stroke();

  svgToImg(avatarSVG((q&&q.code)||"TNJA", 560, 0, look), function(img){
    if(img){
      var sx = vert ? (W/2-shark/2) : (cfg.cardX+cfg.pad);
      var sy = vert ? (cfg.cardY+40) : (cfg.cardY+(P.cardH-shark)/2);
      c.drawImage(img, sx, sy, shark, shark);
    }

    /* 类型名 + 写意外号 */
    c.textAlign="left"; c.fillStyle="#1F2A36"; c.font=cvsFont(800, cfg.nameS);
    c.fillText(L.length? L[0].p.t : "还没有画像", textX, P.name);
    if(P.aka){
      c.fillStyle="#D9603A"; c.font=cvsFont(500, cfg.akaS);
      c.fillText("「"+L[0].p.aka+"」", textX, P.aka);
    }

    /* 四维：上一行「维度 …… 落点%」，下面轴 + 游标 + 两端标签 */
    if(q){
      [["内核动机",q.mot],["认知方式",q.cog],["行事风格",q.sty],["人际取向",q.soc]].forEach(function(d,di){
        var o=d[1]; if(!o || P.dims[di]==null) return;
        var ly=P.dims[di];
        c.textAlign="left"; c.fillStyle="#645C53"; c.font=cvsFont(500,cfg.dimS);
        c.fillText(d[0], textX, ly);
        c.textAlign="right"; c.fillStyle="#1E3A5F"; c.font=cvsFont(700,cfg.dimS);
        c.fillText(o.p+"%", textX+textW, ly);

        var by=ly+22, bh=12;
        c.fillStyle="#EDE5DA"; rrect(c,textX,by,textW,bh,6); c.fill();
        c.fillStyle="#A8C2DC"; rrect(c,textX,by,Math.max(bh,textW*(o.p/100)),bh,6); c.fill();
        var kx=Math.max(textX+9, Math.min(textX+textW-9, textX+textW*(o.p/100)));
        c.beginPath(); c.arc(kx, by+bh/2, 15, 0, 6.2832);
        c.fillStyle="#FFFFFF"; c.fill(); c.strokeStyle="#1E3A5F"; c.lineWidth=5; c.stroke();

        var py=by+bh+cfg.poleS+4;
        c.fillStyle="#6F6760"; c.font=cvsFont(400,cfg.poleS);
        c.textAlign="left";  c.fillText(o.a, textX, py);
        c.textAlign="right"; c.fillText(o.b, textX+textW, py);
      });
    }

    /* 主标签：一行放不下才换行，且行数已计入卡高 */
    c.textAlign="left"; c.fillStyle="#645C53"; c.font=cvsFont(500,cfg.dimS);
    var chipLabel = "常驻主标签 · "+L.length+" 个";
    if(P.chips.length < L.length)
      chipLabel = "常驻主标签 · 共 "+L.length+" 个，图上 "+P.chips.length+" 个";
    c.fillText(chipLabel, textX, P.chipLabel);
    var cx2=textX, cy2=P.chipY;
    P.chips.forEach(function(ch){
      if(cx2 + ch.tw > textX + textW + 1){ cx2=textX; cy2+=cfg.chipH+10; }
      c.fillStyle="#F2EDE5"; rrect(c,cx2,cy2,ch.tw,cfg.chipH,cfg.chipH/2); c.fill();
      c.fillStyle="#1F2A36"; c.textAlign="left"; c.font=cvsFont(600,cfg.chipS);
      c.fillText(ch.l.p.t, cx2+19, cy2+cfg.chipH*0.67);
      cx2 += ch.tw + 12;
    });

    /* 卡外说明 + 页脚
       免责必须先算行数、再按底部对齐：第一版直接把第一行放在 cardY+cardH+62，
       方版第二行落到 y=1016 正好压在页脚（y=1008）上。 */
    c.textAlign="left";
    var dl = vert
      ? "画像描述的是行为倾向，不是心理诊断，也不是永久标签。同一个人在不同场景下会切换主导模式。"
      : "画像只描述行为倾向，不是心理诊断，也不是永久标签。";
    var dSize = vert?27:24, lh = vert?42:36;
    c.font = cvsFont(400, dSize);
    var dLines = wrapCJK(c, dl, W-144);
    var fty = H-72;
    var wantTop = cfg.cardY + P.cardH + (vert?62:48);
    var maxTop  = fty - 46 - (dLines.length-1)*lh;
    var fy = Math.min(wantTop, maxTop);
    if(fy < cfg.cardY + P.cardH + 24) fy = cfg.cardY + P.cardH + 24;   /* 再挤也不贴着卡片 */
    c.fillStyle="#5C6B7A";
    dLines.forEach(function(ln,i){ c.fillText(ln, 72, fy+i*lh); });
    c.fillStyle="#1E3A5F"; c.font=cvsFont(700, vert?28:25);
    c.fillText("打开就能用 · 不联网也能跑 · 简历不出本机", 72, fty);

    /* 布局数字暴露给断言：只查图片尺寸查不出溢出（第一版方版就是这么漏的） */
    cv.__layout = { fmt: vert?"9:16":"1:1", cardY: cfg.cardY, cardH: P.cardH,
                    contentEnd: P.end, limit: limit, shark: shark,
                    canvasW: W, canvasH: H, rows: P.dims.length,
                    chips: P.chips.length, labels: L.length, chipRows: P.chipRows,
                    chipRight: P.chipRight, textX: textX, textRight: textX + textW,
                    cardRight: cfg.cardX + cardW,
                    noteTop: fy, noteLines: dLines.length, noteLh: lh, footY: fty,
                    noteLastY: fy + (dLines.length-1)*lh };
    cb(cv);
  });
}

/* 鱼卡：一条吐槽 + 它的鲨鱼 */
function drawFishCard(fid, cb){
  var f=fishById(fid) || (myFish()[0]) || SEED_FISH[0];
  var W=1080,H=1080;
  var cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  var c=cv.getContext("2d");
  var g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#E7F1FA"); g.addColorStop(0.42,"#CBEEFB"); g.addColorStop(1,"#8FC4E4");
  c.fillStyle=g; c.fillRect(0,0,W,H);
  c.fillStyle="rgba(255,255,255,.30)";
  for(var i=0;i<26;i++){
    var bx=(i*137)%W, by=(i*211)%H, br=6+(i%5)*5;
    c.beginPath(); c.arc(bx,by,br,0,6.2832); c.fill();
  }
  svgToImg(avatarSVG(f.code||"TNJA", 520, 2, lookOfFish(f)), function(img){
    if(img) c.drawImage(img, W/2-260, 120, 520, 520);
    c.textAlign="left";
    c.fillStyle="#0E3A5E"; c.font=cvsFont(800,40);
    c.fillText("offer鲨 · 职场鱼塘", 80, 92);

    /* 引号 + 原话 */
    c.fillStyle="rgba(255,255,255,.92)"; rrect(c,64,700,W-128,250,32); c.fill();
    c.fillStyle="#D9603A"; c.font=cvsFont(800,72);
    c.fillText("“", 96, 782);
    c.fillStyle="#173A56"; c.font=cvsFont(500,38);
    wrapCJK(c, f.t, W-192).slice(0,3).forEach(function(ln,i){
      c.fillText(ln, 100, 800+i*48);
    });
    /* 作者 + 心情 */
    c.fillStyle="#2A6490"; c.font=cvsFont(500,28);
    c.fillText((f.by||"我")+(f.mood?" · "+f.mood:""), 100, 920);
    c.textAlign="right"; c.fillStyle="#0E3A5E"; c.font=cvsFont(700,26);
    c.fillText("↑ "+likeCount(f)+" 个赞", W-100, 920);
    c.textAlign="left"; c.fillStyle="#1B4E76"; c.font=cvsFont(400,25);
    c.fillText("把憋着的那句话放出去，它就变成一条鱼", 80, H-52);
    cb(cv);
  });
}

function canvasToPng(cv, name){
  if(cv.toBlob){
    cv.toBlob(function(b){
      var a=document.createElement("a");
      a.href=URL.createObjectURL(b); a.download=name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
    },"image/png");
  }else{
    var a2=document.createElement("a");
    a2.href=cv.toDataURL("image/png"); a2.download=name; a2.click();
  }
}

var SHARE_CAPTION = function(){
  var L=(S.prof&&S.prof.labels)||[];
  if(!L.length) return "还没生成画像：先去「职场画像 → 简历」把简历交出来。";
  var q=S.prof.quad, t=L[0].p;
  return [
    "我是「"+t.t+"」："+t.aka+"。",
    "",
    "除了 MBTI，还有一套专讲职场的四维框架：内核动机（目标利益 / 情感认同）· 认知方式（未来推演 / 细节经验）· 行事风格（规则优先 / 灵活应变）· 人际取向（独立决策 / 依附圈层），一共 100 型。",
    "这份是从简历里自动抓的，四维落点："+
      ["内核动机 "+q.mot.p+"%→"+q.mot.b,"认知方式 "+q.cog.p+"%→"+q.cog.b,
       "行事风格 "+q.sty.p+"%→"+q.sty.b,"人际取向 "+q.soc.p+"%→"+q.soc.b].join("，")+"。",
    "主标签 "+L.length+" 个："+L.map(function(x){return x.p.t;}).join(" / ")+"。",
    "",
    "工具叫 offer鲨 · 职场鱼塘，单文件、离线可用、简历不出本机。",
    "只描述行为倾向，不是心理诊断，也不是永久标签。"
  ].join("\n");
};

function openShareCard(kind, arg){
  var fmt="vert";
  function build(){
    var done=function(cv){
      var url=cv.toDataURL("image/png");
      var nm=(kind==="fish"?"offer鲨_鱼卡_":"offer鲨_画像卡_")+(fmt==="square"?"1x1":"9x16")+".png";
      var h='<div class="sharewrap"><img src="'+url+'" alt="分享卡预览">'+
        '<div class="sharebar">'+
          '<button class="cta" id="shDl">下载这张 PNG（'+(fmt==="square"?"1080×1080":"1080×1920")+'）</button>'+
          '<button id="shSw">换成 '+(fmt==="square"?"9:16":"1:1")+' 的</button>'+
          '<button id="shCap">复制配文</button>'+
        '</div>'+
        '<p class="note" style="margin-top:10px">竖版适合小红书，方版适合微信。图里没有个人信息。</p>'+
      '</div>';
      openModal(kind==="fish"?"分享这张鱼卡":"分享我的画像卡", h, [{t:"关掉", c:"", f:closeModal}]);
      document.getElementById("shDl").onclick=function(){
        canvasToPng(cv, nm);
        shareDone(kind==="fish"?"fish":"prof");   /* 分享奖励：下载也算一次（share.js） */
        toast("已下载");
      };
      document.getElementById("shSw").onclick=function(){ fmt=(fmt==="square"?"vert":"square"); build(); };
      document.getElementById("shCap").onclick=function(){
        cp(kind==="fish"?fishCaption(arg):SHARE_CAPTION());
        shareDone(kind==="fish"?"fish":"prof");
        toast("配文已复制");
      };
    };
    if(kind==="fish") drawFishCard(arg, done); else drawProfileCard(fmt, done);
  }
  if(kind!=="fish" && !(S.prof&&S.prof.labels&&S.prof.labels.length)){
    toast("先去「职场画像 → 简历」生成画像");
    return;
  }
  build();
}
function fishCaption(fid){
  var f=fishById(fid)||SEED_FISH[0];
  return "今天在职场鱼塘里放了一条鱼：\n\n“"+f.t+"”\n\n（"+fishName(f)+" · "+(f.mood||"")+"）\n"+
    "在 offer鲨 · 职场鱼塘里，把憋着的那句话放出去，它就变成一条鲨鱼，游进池子里。";
}

/* =====================================================================
   ③ 鱼群密语
   ===================================================================== */
var BBX_SAMPLES=[
  "公司现在困难，你先提离职，对你以后找工作也好",
  "我们这边节奏比较快，你能接受吗",
  "你很有潜力，就是还需要打磨",
  "我们是弹性工作制，不谈加班费",
  "你先把工作交接了，其他以后再说"
];
function bbxLine(){
  return '<div class="bbxwrap">'+
    '<div class="bbxbadge">不用登录 · 不用交简历 · 不上传任何内容</div>'+
    '<div class="bbxin"><textarea id="bbxIn" aria-label="把领导、HR 或面试官说的那句话原样打进来" placeholder="把领导、HR 或者面试官说的那句话原样打进来。越接近原话，翻得越准。">'+
      esc(S.bbxLast||"")+'</textarea>'+
      '<div class="bbxbar"><span class="cnt">已写 <b id="bbxCnt">'+String((S.bbxLast||"").length)+'</b> 字</span>'+
      '<button id="bbxClr">清空</button>'+
      '<button class="pri" id="bbxRun">翻一下</button></div>'+
    '</div>'+
    '<div class="bbxsamples"><i>没头绪？点一句试试：</i>'+
      BBX_SAMPLES.map(function(s){ return '<button class="bbxs" data-s="'+esc(s)+'">'+esc(s)+'</button>'; }).join("")+
    '</div>'+
    '<div id="bbxOut"></div>'+
    /* 条数从数据算，不写死：写死过一次（写 47，实际 50）——先写文案后算数必错 */
    '<div class="bbxfoot">词库是 '+BBX.length+' 条公开职场语境下的常见表述整理，只做「这句话通常什么意思 + 可以怎么接」的对照，'+
      '不代表任何具体公司的真实意图。听错也不用自责：这类话本来就是为了让你听不准。</div>'+
  '</div>';
}
function renderTool(){
  var host=document.getElementById("toolOut");
  if(!host) return;
  if(!host.querySelector("#bbxIn")){
    host.innerHTML=bbxLine();
    var ta=document.getElementById("bbxIn");
    if(ta) ta.addEventListener("input",function(){
      var c=document.getElementById("bbxCnt"); if(c) c.textContent=ta.value.length;
    });
    var clr=document.getElementById("bbxClr");
    if(clr) clr.onclick=function(){ ta.value=""; var c=document.getElementById("bbxCnt"); if(c)c.textContent="0"; document.getElementById("bbxOut").innerHTML=""; };
    var run=document.getElementById("bbxRun");
    if(run) run.onclick=function(){ bbxRun(ta.value); };
    Array.prototype.forEach.call(host.querySelectorAll(".bbxs"),function(b){
      b.onclick=function(){ ta.value=b.dataset.s; var c=document.getElementById("bbxCnt"); if(c)c.textContent=ta.value.length; bbxRun(ta.value); };
    });
  }
  bbxRun(S.bbxLast||"");
}
function bbxRun(text){
  var host=document.getElementById("bbxOut");
  if(!host) return;
  var t=String(text||"");
  S.bbxLast=t; save();
  if(bbxNorm(t).length<2){
    host.innerHTML='<div class="card"><h3>把原话打进来</h3><p class="note" style="margin-top:0">'+
      '打你记得的那句原话，不用整理，口语更好。</p></div>';
    return;
  }
  var hits=bbxMatch(t,3), hc=hcAnalyze(t), h="";
  if(hits.length){
    h+='<div class="bbxhit">命中 '+hits.length+' 条 · 按接近程度排序</div>';
    hits.forEach(function(x,i){
      var it=x.it, uid2=uid();
      h+='<div class="bbxcard'+(i===0?" best":"")+'">'+
        '<div class="bbxhead"><span class="bbxcat">'+esc(it.c)+'</span>'+
        (i===0?'<span class="bbxtop">最接近</span>':'')+
        (x.hitK.length?'<span class="bbxkw">命中「'+esc(x.hitK.join("、"))+'」</span>':'')+'</div>'+
        '<div class="bbxq">'+esc(it.s)+'</div>'+
        '<div class="bbxrow"><i>潜台词</i><span>'+esc(it.m)+'</span></div>'+
        '<div class="bbxrow yes"><i>可以这么说</i><span data-bbxv="'+uid2+'">'+esc(it.b)+'</span></div>'+
        hcBoxHTML(hc)+
        '<div class="bbxacts"><button class="sm" data-bbxc="'+uid2+'">复制这句话</button></div>'+
      '</div>';
    });
  }else{
    var gs=bbxFallback(t);
    h+='<div class="bbxhit">没匹配到已有条目 · 下面是这类话的通用读法</div>';
    h+='<div class="bbxcard best">';
    gs.forEach(function(g,i){
      h+='<div class="bbxrow'+(i===0?"":" yes")+'"><i>'+(i===0?"通用":"　")+'</i><span>'+esc(g)+'</span></div>';
    });
    h+=hcBoxHTML(hc);
    h+='</div>';
  }
  host.innerHTML=h;
  Array.prototype.forEach.call(host.querySelectorAll("[data-bbxc]"),function(b){
    b.onclick=function(){
      var s=host.querySelector('[data-bbxv="'+b.dataset.bbxc+'"]');
      cp(s?s.textContent:""); toast("已复制，可以直接用了");
    };
  });
}

/* =====================================================================
   ④ 无障碍与动效修复
   ===================================================================== */
/* 标签行：补 tablist/tab/aria-selected + 方向键 + roving tabindex */
function a11yTabs(){
  /* 不再写死 id 清单：新增栏目（如竞品）曾因漏登记而丢掉 tablist 语义与方向键。
     改成遍历所有 .subtabs ： 以后加栏目自动覆盖。 */
  Array.prototype.forEach.call(document.querySelectorAll(".subtabs"),function(box){
    if(!box || box._a11y) return;
    box._a11y=1;
    box.setAttribute("role","tablist");
    if(!box.getAttribute("aria-label")) box.setAttribute("aria-label","子页面切换");
    var sync=function(){
      var bs=box.querySelectorAll("button");
      if(!bs.length) return;
      var on=-1;
      Array.prototype.forEach.call(bs,function(b,i){ if(b.classList.contains("on")) on=i; });
      if(on<0) on=0;
      Array.prototype.forEach.call(bs,function(b,i){
        b.setAttribute("role","tab");
        b.setAttribute("aria-selected", i===on?"true":"false");
        b.setAttribute("tabindex", i===on?"0":"-1");
      });
    };
    sync();
    box.addEventListener("keydown",function(e){
      var bs=Array.prototype.slice.call(box.querySelectorAll("button"));
      if(!bs.length) return;
      var cur=bs.indexOf(document.activeElement);
      if(cur<0){ for(var j=0;j<bs.length;j++) if(bs[j].classList.contains("on")) cur=j; }
      if(cur<0) cur=0;
      var n=-1;
      if(e.key==="ArrowRight"||e.key==="ArrowDown") n=(cur+1)%bs.length;
      else if(e.key==="ArrowLeft"||e.key==="ArrowUp") n=(cur-1+bs.length)%bs.length;
      else if(e.key==="Home") n=0;
      else if(e.key==="End") n=bs.length-1;
      if(n>=0){ e.preventDefault(); bs[n].focus(); bs[n].click(); }
    });
    new MutationObserver(sync).observe(box,{subtree:true,attributes:true,attributeFilter:["class"]});
  });
}
/* 鱼池：40 个 Tab 停靠点 → roving tabindex，用左右键在池子里走 */
function a11yTank(){
  var box=document.getElementById("tankOut");
  if(!box || box._a11y) return;
  box._a11y=1;
  box.setAttribute("role","group");
  box.setAttribute("aria-label","鱼池，可用左右方向键选择鱼");
  var sync=function(){
    var bs=box.querySelectorAll("[data-tf]");
    if(!bs.length) return;
    var sel=-1;
    Array.prototype.forEach.call(bs,function(b,i){ if(b.classList.contains("sel")) sel=i; });
    if(sel<0) sel=0;
    Array.prototype.forEach.call(bs,function(b,i){
      b.setAttribute("tabindex", i===sel?"0":"-1");
      b.setAttribute("aria-pressed", i===sel?"true":"false");
    });
  };
  sync();
  new MutationObserver(sync).observe(box,{subtree:true,attributes:true,attributeFilter:["class"],childList:true});
  box.addEventListener("keydown",function(e){
    var bs=Array.prototype.slice.call(box.querySelectorAll("[data-tf]"));
    if(!bs.length) return;
    var cur=bs.indexOf(document.activeElement);
    if(cur<0) cur=0;
    var n=-1;
    if(e.key==="ArrowRight") n=Math.min(cur+1,bs.length-1);
    else if(e.key==="ArrowLeft") n=Math.max(cur-1,0);
    else if(e.key==="Home") n=0;
    else if(e.key==="End") n=bs.length-1;
    if(n>=0){
      e.preventDefault(); bs[n].focus(); bs[n].click();
      setTimeout(function(){
        var nb=box.querySelectorAll("[data-tf]")[n];
        if(nb) nb.focus();
      },0);
    }
  });
}
function a11yAll(){
  a11yTabs(); a11yTank();
}

/* =====================================================================
   绑定
   ===================================================================== */
function bindGrowth(){
  var b1=document.getElementById("btnTool");
  if(b1) b1.onclick=function(e){ e.stopPropagation(); if(typeof enterApp==="function") enterApp(); view("tool"); };
  /* 侧栏入口已改成导航项（data-v="tool"），高亮与跳转由 bindNav / view() 统一处理，
     所以这里不再单独绑定。硬塞一个 onclick 会盖掉 bindNav 装上的那个。 */
  var b3=document.getElementById("btnPriv");
  if(b3) b3.onclick=openPrivacy;
  var b4=document.getElementById("pvInline");
  if(b4) b4.onclick=function(e){ e.preventDefault(); openPrivacy(); };
  var b5=document.getElementById("btnShareMe");
  if(b5) b5.onclick=function(){ openShareCard("profile"); };
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"){
      var m=document.getElementById("mask");
      if(m&&m.classList.contains("on")) closeModal();
    }
  });
  bindConvert();
  a11yAll();
}

/* =====================================================================
   访问轨迹：只记「去了哪一页、在上一页停了多久」。
   ★ 它不发往任何地方，只进导出存档 ： 用途只有一个：回答「真实用户在哪一步停下来」。
     此前 36 个存档字段里没有任何轨迹与时间，导致发出去也学不到东西。
   ===================================================================== */
function trailPush(v){
  if(!Array.isArray(S.trail)) S.trail=[];
  var now=Date.now();
  var last=S.trail[S.trail.length-1];
  if(last && last.v===v && now-last.t<1500) return;      /* 同一页 1.5 秒内不重复记 */
  S.trail.push({ v:v, t:now, d: last ? (now-last.t) : 0 });
  if(S.trail.length>300) S.trail=S.trail.slice(-300);
}
