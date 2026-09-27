/* =====================================================================
   小鱼课堂：各种课程（公开平台链接）+ 别人的工作建议
   ---------------------------------------------------------------------
   ★ 课程是公开的课程平台/搜索，不是我们的服务 ： 这句写在界面上。
   ★ 别人的建议复用 cases.js 的 GROW_CASES（匿名学习经历），不重复造数据。
   ===================================================================== */
var SCHOOL_COURSES = [
  { cat:"办公硬技能", items:[
    { n:"Excel 数据透视与函数", w:"从入门到常用函数、数据透视", u:"https://search.bilibili.com/all?keyword=Excel%E6%95%99%E7%A8%8B" },
    { n:"PPT 汇报与故事化表达", w:"结构化表达 + 版式", u:"https://search.bilibili.com/all?keyword=PPT%E6%B1%87%E6%8A%A5%E6%8A%80%E5%B7%A7" },
    { n:"Python 自动化办公", w:"用脚本省掉重复操作", u:"https://search.bilibili.com/all?keyword=Python%E8%87%AA%E5%8A%A8%E5%8C%96%E5%8A%9E%E5%85%AC" },
  ]},
  { cat:"表达与沟通", items:[
    { n:"向上汇报", w:"怎么把活干成领导听得懂的话", u:"https://search.bilibili.com/all?keyword=%E5%90%91%E4%B8%8A%E6%B1%87%E6%8A%A5" },
    { n:"谈判与争取", w:"谈薪、谈资源、谈边界", u:"https://search.bilibili.com/all?keyword=%E8%81%8C%E5%9C%BA%E8%B0%88%E5%88%A4" },
  ]},
  { cat:"求职与转行", items:[
    { n:"简历怎么写", w:"STAR 法则、量化成果", u:"https://search.bilibili.com/all?keyword=%E7%AE%80%E5%8E%86%E5%86%99%E6%B3%95" },
    { n:"面试常见题", w:"高频题 + 应答结构", u:"https://search.bilibili.com/all?keyword=%E9%9D%A2%E8%AF%95%E5%B8%B8%E8%A7%81%E9%A2%98" },
  ]},
];
function renderSchool(){
  var host = document.getElementById("schoolOut");
  if(!host) return;
  var h = "";
  /* 别人的工作建议 */
  h += '<div class="card"><h3>别人怎么走过来的</h3>'+
    '<p class="note" style="margin-top:0">匿名整理的经验：学什么、卡在哪、后来能做什么。'+
    '不写「学完就能涨薪」。</p>'+
    '<div class="acts"><button class="pri" id="schoolCases">看看 '+GROW_CASES.length+' 条经验 →</button></div></div>';
  /* 各种课程 */
  h += '<div class="card"><h3>能点进去的课程</h3>'+
    '<p class="note" style="margin-top:0"><b class="hl">课程平台是公开的，不是我们的服务。</b>'+
    '链接可能改版；打不开就直接在对应平台搜课程名。</p>';
  SCHOOL_COURSES.forEach(function(g){
    h += '<h2 class="sec" style="margin-top:16px">'+esc(g.cat)+'</h2>';
    h += '<div class="evskillgrid">'+g.items.map(function(c){
      return '<a class="card evskill" href="'+esc(c.u)+'" target="_blank" rel="noopener noreferrer" style="text-decoration:none">'+
        '<div class="evskill-h"><b>'+esc(c.n)+'</b></div>'+
        '<span class="note" style="margin-top:0">'+esc(c.w)+'</span>'+
        '<em style="font-style:normal;color:var(--coral3);font-weight:700;font-size:13px">点进去学 ↗</em></a>';
    }).join("")+'</div>';
  });
  h += '</div>';
  host.innerHTML = h;
  bindSchool(host);
}
function bindSchool(host){
  var b = host.querySelector("#schoolCases");
  if(b) b.onclick = function(){ openCaseBook("grow"); };
}
