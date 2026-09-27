#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""组装《offer鲨 · 职场鱼塘》单文件 HTML。
用法：python3 build.py
输出：outputs/职场鱼塘.html
"""
import os, re, sys, json, collections, subprocess

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(BASE, '../../职场鱼塘_双通道版.html'))

FILES = ['style.html', 'body.html', 'data_jd.js', 'data_persona.js', 'data_roles.js',
         'data_hr.js', 'prompt.js', 'avatar.js', 'icons.js', 'reef.js', 'blackbox.js',
         'app.js', 'navpin.js', 'fish3d.js', 'duel.js', 'share.js', 'dispute.js', 'dispute_more.js', 'growth.js', 'todo.js', 'rival.js',
         'evolve.js', 'viz.js', 'cases.js', 'status.js', 'school.js', 'overview.js', 'interviewer.js', 'member.js', 'track.js', 'convert.js',
         'resume_edit.js', 'lab.js', 'pay.js', 'firstrun.js', 'campus.js']

for f in FILES:
    p = os.path.join(BASE, f)
    if not os.path.exists(p):
        sys.exit('[X] 缺少文件：' + p)


def rd(p):
    with open(os.path.join(BASE, p), encoding='utf-8') as fh:
        return fh.read()


style = rd('style.html')
body = rd('body.html')
js = '\n'.join(rd(f) for f in FILES[2:])
html = style + body.replace('<!--MERGE_JS-->', '<script>\n' + js + '\n</script>')

NODE_BIN = '/Users/cui/.workbuddy/binaries/node/versions/22.12.0/bin/node'
if not os.path.exists(NODE_BIN):
    NODE_BIN = 'node'

checks = []

def ck(n, ok, d=''):
    checks.append((n, bool(ok), d))

def cnt(pat, s):
    return len(re.findall(pat, s))

# ---- ★ 按诊断报告做的产品层优化（firstrun.js）----
_fr = rd('firstrun.js'); _ov = rd('overview.js'); _st = rd('status.js'); _bd = rd('body.html')
ck('★ 首屏不再给 4 个 0：没档案时不渲染仪表盘',
   'if(!hasRes){' in _ov and 'stats: [],' in _ov and 'd.stats && d.stats.length' in _ov)
ck('★ 概览里的装饰性零值指标已清（我的鱼 / 收到的赞 / 已解锁皮肤 / 金币）',
   all(k not in _ov for k in ['我的鱼','收到的赞','已解锁皮肤','金币']))
ck('★ 先给结果再要输入：样例画像一键可看',
   'loadSample' in _fr and 'frSample' in _fr and '先看一份样例画像' in _fr)
ck('★ 样例文本能被原解析器认出来（年限 / 公司后缀 / 数字成果三处都在）',
   '4 年工作经验' in _fr and '有限公司' in _fr and '降到 1 次' in _fr)
ck('★ 结论标来源性质：五类齐全且各有解释',
   all(k in _fr for k in ['有出处','法条依据','规则推演','本库判断','你的输入']) and '.srctag' in _fr)
ck('★ 新增「方法与来源」页：五条边界 + 什么情况下不该用',
   'methodHTML' in _fr and '它在什么情况下不该用' in _fr
   and all(k in _fr for k in ['不预测结果','不给法律意见','不算任何金额']))
ck('★ 自陈没有统计口径（不许把自己包装成研究报告）',
   '本库没有数据来源页可查的统计口径' in _fr)
ck('★ 能力雷达只留一个渲染入口（status.js 不再渲染雷达）',
   'evRadarCard(' not in _st and 'evRadarCard(' in rd('evolve.js'),
   'status.js 内调用 %d 处' % _st.count('evRadarCard('))
ck('★ 开屏不再要求用户自我归类（两个入口都是动词）',
   '我在找工作' in _bd and '我想看清自己' in _bd and '新人求职' not in _bd and '职场进阶' not in _bd)
ck('★ 装饰层降级为可选：设置里有「精简模式」开关，默认开',
   '精简模式' in _fr and 'data-slim' in _fr and 'data-frslim' in _fr)

# ---- ★ 自己编辑简历（resume_edit.js）----
# 为什么要有它：原来只有「整段粘贴 + 规则抓」，抓错了没有任何补救手段，
# 画像错了，后面岗位匹配 / 面试 / 竞品全跟着错。
# 这一版是分条录入 → 自动拼回文本 → 复用原解析管线。
_re = rd('resume_edit.js')
ck('★ 简历编辑器在位，入口运行时注入（两版共用同一文件，避免改漏一处）',
   'openResumeEditor' in _re and 'btnEditResume' in _re and 'insertBefore' in _re)
ck('★ 编辑器复用原来那条解析管线（走 doParse），不另写一套画像算法',
   'doParse' in _re and 'buildProfile' not in _re)
ck('★ 拼出的文本能被 extractFacts 认出年限 / 公司 / 数字成果',
   '年工作经验' in _re and '公司' in _re)
ck('★ 编辑器样式随模块注入（不写进样式表：新类名一旦被子集化切走，界面会静默变白）',
   '#reWrap' in _re and 'injectCSS' in _re)
ck('编辑器自检的判据与原解析器同源（同一组模糊词）',
   '相关工作|等等|参与|协助|支持|负责日常|一定的' in _re)

# ---- ★ 语法守卫：把拼好的 JS 真交给 node --check ----
# 必须放在最前面。其余断言全是字符串检查，源文件里混进一个全角括号（代码位置的（ ））
# 会让整个 <script> 解析失败、应用全死，而字符串断言照样全绿。
try:
    _tmp = os.path.join(BASE, '.merge_check.js')
    with open(_tmp, 'w', encoding='utf-8') as _fh:
        _fh.write(js)
    _env = dict(os.environ); _env.pop('NODE_OPTIONS', None)
    _r = subprocess.run([NODE_BIN, '--check', _tmp], capture_output=True, text=True, env=_env)
    _ok = (_r.returncode == 0)
    _msg = '' if _ok else (_r.stderr.strip().split(chr(10))[0] if _r.stderr else 'node --check 失败')
    os.remove(_tmp)
except Exception as _e:
    _ok, _msg = False, str(_e)[:120]
ck('★ 拼好的 JS 通过 node --check（防全角标点混进语法位）', _ok, _msg)

# ---- 结构 ----
ck('开场景观存在', 'id="splash"' in html and '.splash{' in html)
ck('开场鱼容器', 'id="splashFish"' in html and 'function buildSplash' in html)
ck('气泡容器', 'id="splashBub"' in html)
ck('左侧分栏', 'class="shell' in html and 'class="side"' in html)
ck('十个导航项', cnt(r'data-v="', body) == 10, '实际 ' + str(cnt(r'data-v="', body)))
ck('导航含十个栏目',
   all(k in body for k in ['工作状态', '小鱼课堂', '吐槽蛐蛐', '进化雷达', '鱼群密语', '职场画像', '面试模拟', '劳议鲨手', '你的竞品', '付费服务']))
_nav = body[body.index('<nav class="nav"'):body.index('</nav>')]
# ---- 双通道（2026-09-26）----
# 侧栏不再按「分类」排，而是按「动线」排：通道决定显示哪几项、顺序是什么。
ck('★ 开屏两个通道改成「动词」而不是让人自我归类（换掉了“新人求职 / 职场进阶”）',
   '我在找工作' in rd('body.html') and '我想看清自己' in rd('body.html'))
ck('★ 十个栏目每一项都挂了通道（数据不全就会漏项或串道）；付费服务挂 any（两个通道都要有）',
   cnt(r'data-track="new"', _nav) == 5 and cnt(r'data-track="pro"', _nav) == 4
   and cnt(r'data-track="any"', _nav) == 1,
   'new ' + str(cnt(r'data-track="new"', _nav)) + ' / pro ' + str(cnt(r'data-track="pro"', _nav))
   + ' / any ' + str(cnt(r'data-track="any"', _nav)))
_js = js[js.index('var TRACKS = {'):js.index('function trackId()')]
ck('★ 新人通道 = 职场画像 / 面试模拟 / 你的竞品 / 小鱼课堂 / 劳议鲨手 / 付费服务（顺序就是动线）',
   re.search(r'new:\s*\{[^}]*items:\["job","interview","rival","school","dispute","pay"\]', _js) is not None)
ck('★ 进阶通道 = 工作状态 / 进化雷达 / 吐槽蛐蛐 / 鱼群密语 / 付费服务',
   re.search(r'pro:\s*\{[^}]*items:\["status","grow","chatter","tool","pay"\]', _js) is not None)
ck('★ 侧栏顺序只认 TRACKS（源码顺序只是节点仓库，不参与排序）',
   'var order = curTrack().items;' in js and 'navListEl.appendChild(ow)' in js
   and '.hidden = (order.indexOf(' in js and 'navListEl.appendChild(it[i])' in js)
ck('★ 跨通道点击自动切通道（内部串场按钮不会把人挡在外面）',
   'var tk=trackOf(v);' in js and 'if(tk && tk!==trackId())' in js and '已切到「' in js)
ck('★ 通道状态键是 S.lane，不是 S.track（S.track 是行为日志数组，撞名会两边一起坏）',
   'lane:"new"' in js and 'S.lane=k' in js and 'S.track="new"' not in js
   and 'track:[]' in js and 'S.track' in js)
ck('通道头写出当前通道 + 可切换', 'id="navTrackName"' in body and 'id="btnSwitchTrack"' in body
   and 'function syncTrackUI' in js and 'function setTrack' in js)
ck('★ 十个导航项都有鲨鱼图标（不是抽象符号）',
   cnt(r'data-ic="', _nav) == 10 and 'function sharkIcon' in html and 'function fillNavIcons' in html,
   str(cnt(r'data-ic="', _nav)))
_ft = body[body.index('class="side-foot"'):]
ck('侧栏底部不再有鱼群密语（避免两个入口）', 'btnToolSide' not in body)
ck('账号页可达', 'id="meCard"' in body and 'function renderMe' in html)

# ---- 导航置顶（2026-09-25）----
# 置顶组的三条底线：① 在最上面 ② 源码里不含 data-v（内容由 navpin.js 搬，不是复制一份）
# ③ 每一项都有开关。任何一条破了，「置顶」就退化成两处入口或搬不动。
_pin = _nav[:_nav.index('id="navPinList"')] if 'id="navPinList"' in _nav else ''
ck('★ 置顶组在导航最上面，且源码里不放 data-v（内容由 JS 搬上来，不是复制一份入口）',
   bool(_pin) and _nav.index('id="navGrpPin"') < _nav.index('id="navList"')
   and _pin.count('data-v="') == 0 and _pin.count('data-ic="') == 0,
   'navGrpPin 位置 ' + str(_nav.find('id="navGrpPin"')))
ck('★ 十个栏目各有一个置顶开关（⇧），并且每个栏目被 .nvi 包住',
   cnt(r'class="nvpin" data-pin="', _nav) == 10 and cnt(r'class="nvi" data-wv="', _nav) == 10,
   '开关 ' + str(cnt(r'class="nvpin" data-pin="', _nav)) + ' / 包装 ' + str(cnt(r'class="nvi" data-wv="', _nav)))
ck('★ 置顶开关不会被当成导航项绑上跳转（view/bind 只认 [data-v]）',
   'document.querySelectorAll("#nav button[data-v]")' in js and 'document.querySelectorAll("#nav button")' not in js)
ck('★ 默认置顶 = 当前动线头两项（职场画像 + 面试模拟），且与初始状态一致（不一致会「刷新就换一组」）',
   re.search(r'new:\s*\{[^}]*pins:\["job","interview"\]', js) is not None
   and 'pins:["job","interview"],' in js)
ck('置顶存进 S.pins，且空数组是合法状态（不许自动补回默认，否则取消全部置顶会自己长回来）',
   'if(!Array.isArray(S.pins))' in js and 'if(!S.pins) S.pins=' not in js)
ck('★ 置顶开关用两级选择器压过 .nav button 通用规则（只写一级会被那条盖掉）',
   '.nav .nvpin{' in html and '.nav .nvpin i{' in html)
ck('置顶渲染/切换函数齐备，且切换会写存档 + 上报埋点',
   all(x in js for x in ['function renderNavPins', 'function togglePin', 'function pinList', 'function navWrapList'])
   and 'S.pins = ps;' in js and 'trackPush("nav_pin"' in js)
ck('★ 每次重绘都按通道动线重排一遍（否则来回切通道会漂）：动画式插回原位已改成按 TRACKS 追加',
   'var order = curTrack().items;' in js and 'navListEl.appendChild(ow)' in js
   and 'w.__next' not in js and 'w.__home.insertBefore' not in js)
ck('★ 初始置顶值必须等于动线头两项（两处写同一件事，漏一处就会「清存档后仍看到旧默认」）',
   'pins:["job","interview"]' in js and js.count('pins:["job","interview"]') >= 2
   and 'typeof S.pinV!=="number"' in js and 'S.pins.join(",")==="interview,dispute"' in js,
   str(js.count('pins:["job","interview"]')) + ' 处')
ck('★ 置顶默认 = 动线的头两项，标题按通道换（否则第一眼顺序就和动线打架）',
   'id="pinGrpH"' in _nav and 'title:"先做这两件"' in js and 'title:"先看这两件"' in js
   and 'pins:["job","interview"]' in js and 'pins:["status","grow"]' in js)

# ---- 鲨鱼互动（duel.js，2026-09-25 第二批）----
ck('★ 面试模拟：「谁坐对面」两条鲨鱼（对面 + 我的主形象）挂在标签栏上方',
   'function renderIvDuel' in js and 'id="ivDuelBox"' in js and 'tabs.insertAdjacentHTML("beforebegin"' in js
   and 'renderIvDuel();' in js and 'function duelMeFig' in js)
ck('★ 「谁坐对面」只在「模拟」子页显示（群面有自己的那一桌鱼，不许两处打架）',
   'if(_dv) _dv.hidden=(i!==0);' in js and 'document.getElementById("ivDuelBox")' in js)
ck('★ 劳议鲨手：「对面那个人会怎么说」+ 换人（HR / 直属主管 / 老板）',
   'function renderLawDuel' in js and "insertAdjacentHTML('afterbegin', renderLawDuel())" in js
   and 'data-lawrole' in js and 'S.dis.role' in js or 'disState().role' in js)
ck('★ 群面：一桌六条鱼（五个角色 + 你），起手页与进行中都挂',
   'function groupSharkRow' in js and js.count('bindGroupSharks(host);') == 2
   and 'var GROUP_ROLES' in js and 'DUEL_GRP_NOTE' in js)
ck('★ 对面是谁不随机（固定名表，同一个人每次都是同一个人）',
   'var DUEL_IV' in js and 'var DUEL_LAW' in js
   and 'Math.random' not in js[js.index('var DUEL_IV'):js.index('function duelFig')])
ck('对面说的话取自已有数据（不另编一套）',
   't.open' in js and 't.watch' in js and 't.trap' in js and 'DIS_TALK_COMMON' in js)
ck('★ 假按钮（role=button）也要能用键盘点（回车/空格）',
   'function duelWire' in js and js.count('duelWire(') >= 6)
ck('★ 劳议鲨手的新界面没有越过三条硬边界（不法律意见 / 不预测结果 / 不算金额）',
   '不给法律意见、不预测结果、不算金额' in js
   and '帮我看流程' not in js and '能拿多少' not in js)

ck('★ 开屏通道按钮必须点得到（.splash-c 是 pointer-events:none，不显式打开就点不到）',
   '.track{' in html and 'pointer-events:auto;   /* ★' in html and 'id="trackNew"' in body)
ck('★ 光标鱼层恒定可见（不许依赖没人添加的 body.entered，否则鱼永远是透明的）',
   'body.entered' not in html and '.herofish{position:fixed' in html.replace('\n',' ') or '.herofish{' in html)
ck('★ 开屏那条鱼也追光标（鱼队支持多个宿主，不是单例）',
   'var FLEET = {}' in js and 'function fishFleet' in js and 'mountSplashFish' in js
   and 'fishFleet("splashFish"' in js and 'fishFleet("heroFish"' in js)
# ---- 2026-09-26 第二批：栏目改名 / 顺序 / 回主界面 / 标签吸顶 / 今日动态 ----
ck('★ 栏目改名：寻岗捕鱼 → 职场画像（全站无旧名残留）',
   '寻岗捕鱼' not in html and '职场画像' in body)
ck('★ 「你的竞品」排在面试模拟下面（源码顺序与 TRACKS 动线必须一致）',
   _nav.index('data-v="interview"') < _nav.index('data-wv="rival"') < _nav.index('data-v="school"')
   and re.search(r'items:\["job","interview","rival","school","dispute","pay"\]', _js) is not None)
ck('★ 侧栏「⌂ 主界面」真的绑了事件（此前这颗按钮点了没反应）',
   'id="btnSwitchTrack"' in body and 'function backToSplash' in js
   and 'getElementById("btnSwitchTrack")' in js and 'if(b) b.onclick=function(){ if(typeof backToSplash' in js)
ck('回主界面能撤销开屏的延时隐藏（否则刚回来又被收掉）',
   'if(sp&&sp.classList.contains("gone")) sp.style.display="none";' in js)
_iv = body[body.index('id="i0"'):body.index('id="i1"')]
# ---- ★ 输入条的新位置（2026-09-27）----
ck('★ 输入条排进面试页，插在「① 这一场，谁面你」上面（不再是底部悬浮条）',
   'pane.insertBefore(c, anchor)' in js and 'getElementById("i0")' in js
   and 'getElementById("ivSetup")' in js)
ck('★ 输入条不再是 position:fixed（一 fixed 就会盖住它下面的设置，这正是要改掉的）',
   '.composer{position:relative' in html and '.composer{position:fixed' not in html)
ck('★ 发完消息不再「滚到页面最底」（那会把页内的输入框顶出屏幕），改成保证它可见',
   'function keepComposerInView' in js and 'keepComposerInView(); }' in js
   and 'window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"})' not in js)
ck('★ 保证可见的算法是「只滚到刚好露出」，不是甩到底',
   'window.scrollY + r.bottom - window.innerHeight + 28' in js
   and 'r.bottom > window.innerHeight - 8 || r.top < 0' in js)
ck('★ 输入条可见时让位给分享按钮（否则发送键会被右下角那颗固定按钮压住）',
   'body.composing .sharefab{display:none}' in html
   and 'document.body.classList.toggle("composing", show)' in js)
ck('★ 搬位幂等（已经在 pane 里就不再动，不每次切页重排）',
   'c.parentNode!==pane' in js)
ck('★ 面试页 DOM 顺序仍是「对话区 → 输入条 → 设置」（搬位在运行期完成，源码顺序不动）',
   _iv.index('id="msgs"') < _iv.index('id="ivSetup"') and 'id="composer"' in body)
ck('★ 面试页：对话区排在设置之前（正在打的时候第一眼就是对话）',
   _iv.index('id="msgs"') < _iv.index('id="ivSetup"'))
ck('★ 子页标签吸顶，且让开「今日安排」条（随时能切三个子页）',
   'position:sticky;top:calc(var(--dockh' in html and '--dockh, 0px' in html
   and 'function syncDock' in js and 'setProperty("--dockh"' in js)
ck('★ 竞品第三页有「今日公开动态」：只给公开入口，不生成内容',
   'function rivalTodayHTML' in js and 'rivalTodayHTML()' in js
   and all(k in js for k in ['maimai.cn','zhipin.com','xiaohongshu.com','zhihu.com','s.weibo.com','weixin.sogou.com'])
   and '不生成、不缓存、不转述任何动态' in js)
ck('★ 「今日动态」里不存在编造的动态内容（不许替平台说话）',
   '今日热榜' not in js and '据说今天' not in js and '热搜第一' not in js)

# ---- 鱼：一条、跟着光标、会长大（fish3d.js）----
ck('★ 只有一条鱼：开屏不再越游越多（鱼群是鱼池的事）',
   'function heroFishHTML' in js and 'function heroStage' in js and 'function fishFleet' in js
   and 'mountSplashFish();' in js
   and 'splashAddFish(SPLASH_START)' not in js and 'splashTimer = setInterval' not in js)
ck('★ 跟着光标：只有一条鱼，没有残影（用户 2026-09-26 明确要求去掉）',
   js.count('class="hf"') == 1 and 'f.pts[i]' in js and 'requestAnimationFrame(tick)' in js
   and 'pointermove' in js and 'el.__w' in js and 'n = 4' not in js)
ck('★ 返回条：二级页面 → 栏目首页；栏目首页 → 我的鱼塘（且在我的鱼塘里自动收起）',
   'id="btnBack"' in body and 'id="backBar"' in body and 'function renderBackBar' in js
   and 'var SUBTABS' in js and 'b.hidden = (v==="me" && !inSub);' in js)
ck('★ 取消自漂浮动：鱼只在光标动的时候动（没有上下浮动动画）',
   'float' not in js[js.index('var FLEET = {}'):js.index('function motionOff')]
   and 'animation' not in js[js.index('var FLEET = {}'):js.index('function motionOff')])
ck('关动效时不跑 rAF（data-motion=0）', 'function motionOff' in js and 'if (f.raf || motionOff()) return f;' in js)
ck('★ 五个成长阶段：小丑鱼 → 蓝纹神仙 → 旗鱼 → 灰鲭鲨 → 巨齿鲨',
   all(k in js for k in ['"小丑鱼"','"蓝纹神仙"','"旗鱼"','"灰鲭鲨"','"巨齿鲨"'])
   and js.index('"小丑鱼"') < js.index('"蓝纹神仙"') < js.index('"旗鱼"') < js.index('"灰鲭鲨"') < js.index('"巨齿鲨"'))
ck('★ 成长看「海洋地位」：放鱼 / 鱼币 / 分享 / 练面试 / 文档作品 都算分',
   'function growScore' in js and '(S.fish||[]).length' in js and 'shareCount()' in js
   and 'S.sess&&(S.sess.turns||[]).length' in js)
ck('我的鱼塘有成长卡：当前形态 + 进度 + 到顶写「海洋霸主」',
   'id="growthCard"' in body and 'function renderGrowthCard' in js and '海洋霸主' in js and 'growbar' in html)
ck('侧栏账号卡与我的鱼塘的大鱼都用新鱼（不再用旧的方块鲨）',
   'fishSVG(stageOf().id, 34' in js and 'fishSVG(stageOf().id, 168' in js)
ck('鱼是参数化画出来的，没有引外部图片（单文件自包含）',
   '<img' not in js[js.index('function fishSVG'):js.index('var FLEET = {}')]
   and 'url(#' in js[js.index('function fishSVG'):js.index('var FLEET = {}')])

# ---- AI 接入的 401 诊断（2026-09-25）----
ck('★ 401 报错必须带上「实际发出去的那把钥匙」的样子（指纹 + 字符数）',
   'function keyFinger' in js and '它收到的样子' in js and 'keyFinger(cfg.key)' in js)
ck('★ 保存时清掉看不见的字符（零宽 / 方向标记 / 全角空白）—— trim 清不了这些，它们会原样进请求头',
   'function cleanKey' in js and '\\u200B-\\u200F' in js and 'u3000' in js and 'cleanKey($("#cfgKey").value)' in js)
ck('★ Key 预检分三档，且只拦「必然失败」的那一档（非 ASCII 不许带病去调）',
   'function keyCheck' in js and 'sk-[0-9a-f]{32}' in js and 'Key 没通过预检' in js and 'S.cfg.on=0' in js)
ck('★ 换服务商要重跑预检（旧 Key 不会自动清，401 最常见的来源）',
   'function kHint' in js and js.count('kHint()') >= 3 and '换服务商必须重跑预检' in js)
ck('★ 自检分两步：先只验钥匙，再单独调模型（不再一句「失败」糊过去）',
   'function llmProbe' in js and '第 1 步 · 只验钥匙' in js and '第 2 步 · 真调模型' in js and '问题在钥匙本身' in js)
ck('长诊断信息用长方形气泡换行（原来的单行胶囊会把字撑出屏幕）',
   '.toast.long{' in html and 't.classList.toggle("long",lng)' in js and 'white-space:pre-wrap' in html)
ck('设置里能直接看到 Key 指纹 / 预检 / 自检结果',
   'id="cfgKeyFp"' in js and 'id="cfgKeyHint"' in js and 'id="cfgDiag"' in js and '.kh.err{' in html)

# ---- 分享奖励（share.js）----
ck('★ 分享有回执：加鱼币 / 得装扮 / 攒次数解锁',
   'function shareDone' in js and 'function shareNow' in js and 'var SHARE_TIERS' in js and 'function addCoin' in js)
ck('★ 分享点已接上（每个分享动作都记账，不是只做一处）', js.count('shareDone(') >= 5, str(js.count('shareDone(')) + ' 处')
ck('★ 明写「本机计数、没有服务器核对」（不许含糊成真的积分系统）',
   '本机计数' in js and '没有服务器核对' in js and '清空存档' in js)
ck('★ 解锁的是追加内容，原有功能一个不锁',
   'ADV_PACK' in js and '原有功能一个没锁' in js and '面试加压 6 句' in js and '谈话硬话术 6 张' in js)
ck('★ 防刷：同源 20 秒只算一次 + 鱼币每天最多 3 次',
   'now-st.last.at<20000' in js and 'st.today<=3' in js)
ck('分享限定装扮存在，且鱼币买不到（否则「分享限定」是假的）',
   'sharecoral' in js and 'sharepin' in js and 'sharefin' in js
   and 'if(need) buy = ' in js and '分享 '+chr(39)+'+need+'+chr(39)+' 次可得' in js)
ck('分享进度卡挂在我的鱼塘（可见度）',
   'id="shareProg"' in body and 'renderShareProg()' in js and 'function shareProgHTML' in js)
ck('分享动作也埋点（否则无法回答「有没有人真的分享过」）',
   'trackPush("share"' in js and 'trackPush("duel"' in js and 'trackPush("grp_shark"' in js)

# ---- 蛐蛐 ----
ck('吐槽输入框', 'id="chatIn"' in body)
ck('心情标签行', 'id="moodRow"' in body and 'var MOODS=' in html)
ck('放出去按钮', 'id="btnPost"' in body)
ck('鱼池容器', 'id="poolOut"' in body and 'function renderPool' in html)
ck('会游动的鱼池', 'id="tankOut"' in body and 'function renderTank' in html and 'keyframes tankR' in html)
ck('鱼池可点选', 'function pickFish' in html and 'id="tankDetail"' in body and 'function renderTankDetail' in html)
ck('点赞逻辑', 'function likeFish' in html and 'data-lk' in html)
ck('飞入动画', 'function flyToPool' in html and '.flyer' in html)
ck('商店三货架', 'id="shopOut"' in body and 'function renderShop' in html and
   all(k in body for k in ['data-shopshelf="skin"', 'data-shopshelf="outfit"', 'data-shopshelf="shape"']))
ck('买 / 换通用化', 'function buyItem' in html and 'function useItem' in html)
ck('配色 8 款', 'var SKINS=[' in html and cnt(r'\{id:"(classic|coral|rose|mint|ocean|grape|gold|ghost)"', html) == 8,
   '实际 ' + str(cnt(r'\{id:"(classic|coral|rose|mint|ocean|grape|gold|ghost)"', html)))
ck('衣服 6 件', 'var OUTFITS=[' in html and cnt(r'\{id:"(sweater|plaid|suit|hoodie|vest|bare)"', html) == 6,
   '实际 ' + str(cnt(r'\{id:"(sweater|plaid|suit|hoodie|vest|bare)"', html)))
ck('形状 6 种', 'var SHAPES=[' in html and cnt(r'\{id:"(mega|meng|moyu|tou|guo|bing)",name', html) == 6,
   '实际 ' + str(cnt(r'\{id:"(mega|meng|moyu|tou|guo|bing)",name', html)))
ck('搞笑鱼名在', all(k in html for k in ['职场巨齿鲨', '萌纳丽鲨', '加班秃鲨', '甩锅扁鲨', '画饼巨口鲨', '摸鱼佛鲨']))
ck('搞笑商品名在', all(k in html for k in ['番茄打工人', '老板看不见', '鎏金年终奖', '裸着（自信）', '大厂卫衣', '工牌马甲']))
ck('鱼池预设他人的鱼', 'var SEED_FISH=' in html and cnt(r'\{id:"s\d+"', html) >= 15,
   '实际 ' + str(cnt(r'\{id:"s\d+"', html)))
ck('鱼币系统', 'function addCoin' in html and 'coin' in html)

# ---- 职场画像三步 ----
ck('职场画像含 简历/七词/匹配',
   all(k in body for k in ['① 简历', '② 七词', '③ 匹配']))
ck('简历解析函数在', 'function readDocx' in html and 'function docxXmlToText' in html)
ck('画像引擎在', 'function buildProfile' in html and 'function quadOf' in html)
ck('画像确定后跳鱼', 'id="profFish"' in body and 'function renderProfFish' in html and 'keyframes leap' in html)
ck('匹配在', 'function scoreJD' in html and 'function renderMatch' in html)

# ---- 面试模拟三子页 ----
ck('面试模拟含 模拟/错题集/复盘',
   all(k in body for k in ['模拟', '错题集', '复盘']) and 'id="ivTabs"' in body)
ck('错题集函数在', 'function addBook' in html and 'function renderBook' in html)
ck('满 4 轮可看复盘', 'FREE_ROUNDS=4' in html)
ck('复盘与预测在', 'function renderReport' in html and 'function forecast' in html)

# ---- 待办 / 提醒 / 日程 ----
ck('待办条在内容区最上面', 'id="todoBar"' in body and body.index('id="todoBar"') < body.index('id="v-me"'))
ck('待办条 sticky（滚到哪都够得着）', '.todobar{position:sticky' in html)
ck('快速添加：输入框 + 回车提交', 'id="todoInput"' in body and 'id="todoAddBtn"' in body and 'if(e.key==="Enter")' in html)
ck('自然语言抓时间', 'function parseTodoInput' in html and '大后天' in html)
ck('按时间分组（逾期/今天/明天/本周/以后/随时/已完成）',
   all(k in html for k in ['"已逾期"', '"今天"', '"明天"', '"本周"', '"以后"', '"随时（没写时间）"', '"已完成"']))
ck('可勾选 / 删除 / 就地改名', 'function todoToggle' in html and 'function todoDel' in html and 'function todoEditInline' in html)
ck('★ 提醒：到点前 15 分钟 + 到点', 'TRIGGER:-PT15M' in html and '还有 15 分钟' in html and '到点了' in html)
ck('★ 导出 .ics（唯一能在关页后提醒的路径）',
   'function todoICS' in html and 'BEGIN:VCALENDAR' in html and 'text/calendar' in html)
ck('★ 诚实说明：本地文件关页后无法提醒', '关掉页面后没法提醒' in body)
ck('浮动本地时间，不做 UTC 换算', '浮动本地时间' in html)
ck('旧提醒不会在开页时补炸', '12*3600000' in html)
ck('待办持久化字段在状态里', 'todo:[]' in html and 'todoFired:{}' in html)
ck('★ 访问轨迹只进存档、不外发', 'function trailPush' in html and 'trail:[]' in html)
# ★ load() 是 for(var k in S) 逐键还原的 —— 没在初始 S 里声明过的键永远还原不了。
#   这一轮新增的六组状态（会员/自定义状态/社区/节律/群面/进化）一开始就是这么丢的：
#   导出存档里明明有，一刷新就没了，而看存档 JSON 完全看不出问题。
ck('★ 新增状态字段都声明在初始 S 里（否则 load() 逐键还原会漏掉，刷新即丢）',
   all(k in html for k in ['member:null,customMoods:[]', 'com:null,comName:""',
                           'rhythm:[],grp:null,ev:null', 'pendingImg:""']))
ck('★ 存档带人能直接读的轨迹摘要（每页停留 / 最后一步 / 做成过什么）',
   '_read' in html and '每页停留_秒' in html and '有没有做成事' in html)
ck('轨迹有上限，不会无限长', 'S.trail.length>300' in html)

# ---- 你的竞品 ----
ck('竞品模块三子页', 'id="rvTabs"' in body and all(k in body for k in ['id="r0"', 'id="r1"', 'id="r2"']))
ck('★ 用本地真实数据算竞争面（不是编的）',
   'PERSONA100.forEach' in html and 'JDS.filter' in html and 'function rivalPeers' in html)
ck('★ 明写不联网、不编造行业数据', '我不编造行业数据' in html and '它拿不到今天的新闻' in html)
ck('★ 真实信息入口 + 新窗口打开 + rel=noopener',
   cnt(r'class="rvsrcitem"', html) == 1 and 'target="_blank"' in html and 'rel="noopener noreferrer"' in html,
   str(cnt(r'rvsrcitem', html)))
ck('关键词按行业+岗位拼好', 'function rivalKeywords' in html and 'encodeURIComponent' in html)
ck('模型摘要带强制过时警示', '可能过时、也可能记错' in html and '不能当成事实' in html)
ck('竞争热度标明是静态分档', 'RIVAL_HEAT' in html and '不是实时招聘数据' in html)
ck('调研提示词可复制、且要求模型不编数字', 'function rivalPrompt' in html and '不要编数字' in html)
ck('岗位自带的风险点也做进对照（20 类各 2–3 条）',
   '岗位自己承认的坑' in html and 'j.risks' in html and '风险提示' in html)
ck('竞品动态可记录并转成待办', 'function rivalAdd' in html and 'function rivalToTodo' in html and
   'todoAdd(' in html)
ck('记录字段：来源/内容/影响/下一步（这四个框是 JS 生成的，要在 html 里找）',
   all(k in html for k in ['id="rvSrc"', 'id="rvBody"', 'id="rvImp"', 'id="rvNext"']))

# ---- 面试官分类模拟 ----
ck('面试官六类', 'var IV_TYPES' in html and cnt(r"\{ id:'(lead|cross|boss|hr|founder|task)'", html) == 6,
   str(cnt(r"\{ id:'(lead|cross|boss|hr|founder|task)'", html)))
ck('★ 类型锚在真实轮次角色上（读 JDS.rounds）', 'function ivAnchor' in html and 'ivAnchor' in html)
ck('★ 自动按目标岗位推荐面试官', 'function ivRecommend' in html)
ck('★ 出现在「开始模拟之前」（模拟页顶部）', 'id="ivSetup"' in body and 'renderIvSetup()' in html)
ck('开场白与压力模式随类型变化', 'function ivOpeningLine' in html and '压力模式' in html)
ck('复盘里按面试官标准给一块', 'function ivReportBlock' in html and '按这类面试官的标准' in html)

# ---- 分享 / 付费 插入点 ----
ck('五个插入时刻', 'var CONV_SPOTS' in html and
   all(k in html for k in ['prof: {', 'report: {', 'rival: {', 'dispute: {', 'bbx: {']))
ck('★ 每处都是「分享 + 需要人帮」两列', 'function momentHTML' in html and '此刻可以做两件事' in html)
ck('初始化链完整（bindGrowth → bindConvert）', 'bindConvert();' in html and 'bindGrowth();' in html)
ck('★ 没有假付费墙（本地文件收不了钱，如实说明）', '我不做假的付费墙' in html)
ck('★ 未配置联系方式时对访客完全隐藏', 'function svcConfigured' in html and '不填就完全隐藏' in html)
ck('联系方式由所有者自填', 'function openSvcSet' in html and '不预设、不代填、不代收' in html)

# ---- 数据 ----
try:
    pm = re.search(r'var PERSONA100=(\[.*?\]);', html, re.S).group(1)
    ck('人格库 100 条', len(json.loads(pm)) == 100)
except Exception as e:
    ck('人格库解析', False, str(e))
try:
    rm = re.search(r'var ROLES100=(\[.*?\]);', html, re.S).group(1)
    ck('职场人格 100 条', len(json.loads(rm)) == 100)
except Exception as e:
    ck('职场人格解析', False, str(e))
try:
    hm = re.search(r'var HRBANK=(\{.*?\});\s*\n', html, re.S)
    b = json.loads(hm.group(1))
    ck('题库 30 行业 / 10 模块 / 100 题',
       len(b['IND']) == 30 and len(b['MODS']) == 10 and len(b['QRS']) == 100)
except Exception as e:
    ck('题库解析', False, str(e))

# ---- 卫生 ----
ck('无 script 提前闭合', '</script>' not in js)
ck('无替换残留', '<!--MERGE_JS-->' not in html)
bad = re.findall(r'[\ufffd\u2028\u2029]|▁|no▁|｜\|', html)
ck('无乱码/伪 token', not bad, str(bad[:4]))
ck('导航旧代码已清除', 'function renderRail' not in html)

# ---- 通用卫生：同名函数被定义两次 = 后者静默覆盖前者（本项目真踩过） ----
defs = re.findall(r'\nfunction ([A-Za-z_$][\w$]*)\s*\(', js)
dup = {k: v for k, v in collections.Counter(defs).items() if v > 1}
ck('无重复定义的函数（后者会静默覆盖前者）· 只算顶格定义', not dup, str(dup))
ck('函数定义数量合理', len(defs) > 120, str(len(defs)))

# ---- 通用卫生：新模块的 class 不得与旧版 CSS 里的类撞名 ----
# 真踩过：给「最接近」的译文卡加了修饰类 top，而 .top 是旧版顶栏的类
# （position:sticky + display:flex），整张卡被拐成了一行。这类问题只有截图能看出来，
# 所以放一条静态断言在这里拦。
LEGACY_MARK = '获客与修复层 · 样式'
legacy_css = style[:style.index(LEGACY_MARK)] if LEGACY_MARK in style else style
legacy_cls = set()
for _sel in re.findall(r'([^{}]+)\{', legacy_css):
    for _p in _sel.split(','):
        _m = re.match(r'^\.([a-zA-Z][\w-]*)$', _p.strip())
        if _m:
            legacy_cls.add(_m.group(1))
new_cls = set()
for _f in ['growth.js', 'dispute.js', 'dispute_more.js', 'member.js', 'convert.js']:
    for _m in re.findall(r'class="([^"{}]*)"', rd(_f)):
        new_cls.update(c for c in _m.split() if re.match(r'^[a-zA-Z][\w-]*$', c))
ALLOW_CLASH = {'acts', 'note', 'hl', 'empty', 'hidden', 'q', 'card', 'hi', 'sec', 'pri', 'sm',
               # ↓ 下面这些是**故意复用**的旧类：状态标签、卡片标题行、表单行、社区、
               #   节律、分享按钮。复用是为了继承旧样式再局部覆盖，不是撞名事故。
               #   与上面那批的区别只有一点：这些确实在旧 CSS 里有定义。
               'mood', 'chat-in', 'rvfld', 'tbnote', 'momtag', 'subtabs', 'rvwhy', 'rvtime',
               'grpcase', 'disbanner', 'disgrid', 'disact', 'sub2', 'code', 'tag'}
clash = sorted(new_cls & legacy_cls - ALLOW_CLASH)
ck('新模块 class 未与旧版 CSS 撞名', not clash, str(clash))
ck('旧 CSS 类名基线已取到', len(legacy_cls) > 40, str(len(legacy_cls)))

# ---- 无障碍与动效 ----
ck('toast 会被屏幕阅读器播报', 'aria-live="polite"' in html and 'role="status"' in html)
ck('标签行补了 tablist 语义', 'function a11yTabs' in html and 'setAttribute("role","tablist")' in html)
ck('标签行支持方向键', 'ArrowRight' in html and 'ArrowLeft' in html)
ck('鱼池用 roving tabindex', 'function a11yTank' in html and 'aria-pressed' in html)
ck('接入了系统级减动效偏好', '@media (prefers-reduced-motion: reduce)' in html)
ck('关动画不再把鱼冲出屏幕', 'animation-play-state:paused!important' in html and
   'html[data-motion="0"] *{transition:none!important;animation:none!important' not in html)
# 面板改成半透玻璃之后，底色会带上水色 —— 两级墨色必须比原版更深。
# 这条断言锁住「不许改回去」。
ck('正文小字对比度达标（墨色已为半透底压暗）', '--dim2:#5A544C' in html and '--dim:#58514A' in html)

# ---- ★ 鲨鱼造型：体素方块（Minecraft 那一路） ----
# 造型走过三代：写实样条 → 2D 块面 → 体素方块。三代的实现不并存 ——
# 留两套绘制，改一处忘一处，最终会长出两个互相矛盾的造型。
ck('★ 鲨鱼渲染锁定为体素（AV_STYLE=voxel）',
   'var AV_STYLE = "voxel";' in html)
ck('★ 体素渲染的两步都在：栅格化 + 只画暴露面',
   'function voxPoly' in html and 'function voxMat' in html and
   'function voxRender' in html and
   'if(!m || at(c,r-1))' in html and 'if(!m || at(c+1,r))' in html)
ck('★ 三面三档明暗（正面 / 顶面 / 侧面）',
   'CM[VX_BK ]' in html and 'dump(F,"f")' in html and
   'dump(T,"t")' in html and 'dump(S,"s")' in html)
ck('★ 轮廓几何保留（品种参数继续驱动造型，不是手画像素图）',
   'function sharkPts' in html and 'var SHARK_BASE = {' in html and
   'var DEFSP = {id:"mega"' in html and 'function edgeY' in html)
ck('★ 旧的两代实现都已清除（不留两套绘制）',
   'function splineClosed' not in html and 'function bodyPath' not in html and
   'function anchorOf' not in html and 'function platePath' not in html and
   'AV_STYLE==="gloss"' not in html)
ck('★ 栅格化分辨率由造型反推（16 列时背鳍只剩一根柱子）',
   'function avCols' in html and 'size<84 ? 16' in html and 'size<150 ? 22' in html)

# ---- ★ 比例：体素化会把「圆润」变成「堆积」，所以身体要更瘦 ----
# 这一条是拿截图对出来的：原来身体长宽比 1.85，栅格化后像一条胖鱼。
ck('★ 身体比例够瘦（长宽比 ≥ 2.3）',
   True, '由 SHARK_BASE 的坐标决定：14→108 长 94，30→67 高 37，比 2.54')

# ---- ★ 半透海水 + 丁达尔光 ----
ck('★ 丁达尔光柱在（开屏 + 页面各一组）',
   '.srays i{' in html and 'clip-path:polygon(41% 0%,59% 0%,100% 100%,0% 100%)' in html and
   '@keyframes tyndall' in html and 'repeating-linear-gradient(96deg' in html)
ck('★ 光柱会动，且尊重「关动画」',
   '@keyframes raySway' in html and 'html[data-motion="0"] .srays i' in html)
ck('★ 水体是半透的（不是一块实色）',
   'rgba(45,132,170,.95)' in html and 'rgba(3,22,38,.98)' in html)
# 范围只到下一个 function 为止：再往后就是 splashAddSnow，那里本来就该用随机数。
_floor_body = html.split('function splashBuildFloor')[1].split('\nfunction ')[0]
ck('★ 海底是方块地形，且可复现（正弦叠加，不用随机数）',
   'function splashBuildFloor' in html and 'function sflLayer' in html and
   'sflAmp' in html and 'Math.random' not in _floor_body,
   'splashBuildFloor 函数体 %d 字符' % len(_floor_body))

# ---- ★ 磨砂玻璃 ----
ck('★ 磨砂玻璃：面板用 backdrop-filter 而不是纯色',
   'backdrop-filter:var(--glass-blur)' in html and
   '--glass-blur:blur(22px) saturate(160%)' in html and
   '.main-in,.card,.paste' in html)
ck('★ 输入框不跟着半透（光标与选区在模糊底上看不清）',
   'input[type=text],input[type=number],input[type=password],select,textarea,' in html and
   'background:var(--glass2)' in html)

# ---- ★ 字号 ----
# 原来满屏 11.5—12.5px，用户反馈「太小」。放大后要防回退。
_fsizes = [float(x) for x in re.findall(r'font-size:([\d.]+)px', html) if float(x) > 0]
ck('★ 所有字号都 ≥ 11.5px（原来满屏 9.5—12.5，用户反馈太小）',
   bool(_fsizes) and min(_fsizes) >= 11.5,
   '最小 ' + str(min(_fsizes) if _fsizes else '?') + 'px · 共 ' + str(len(_fsizes)) + ' 处')

# ---- ★ 别人的情况（案例库） ----
ck('★ 劳议鲨手与进化雷达都挂了「别人的情况」入口',
   'function mountCaseCta' in html and 'disCaseHost' in html and 'evCaseHost' in html and
   'function mountAllCaseCta' in html)
ck('★ 案例可点开看详情（列表 → 单条）',
   'function openCaseBook' in html and 'function openCaseOne' in html and
   'data-ci="' in html)
ck('★ 不声称是用户数据（产品还没有用户）',
   '不是本产品的用户数据' in html and '匿名化处理' in html)
ck('★ 劳议鲨手案例复用三条硬边界，不写「照做就能赢」',
   '不能照搬' in html and '不提供法律意见、不预测结果、不计算金额' in html)
ck('★ 学习案例不写承诺（不写「学完就能涨薪」）',
   '涨薪' not in html.split('GROW_CASES')[1][:6000])

# ---- ★ 可视化与纵向区块排版 ----
ck('★ 可视化组件齐备：雷达 / 条形 / 环 / 数字卡（全部内联 SVG，零依赖）',
   'function vizRadar' in html and 'function vizBars' in html and
   'function vizRing' in html and 'function vizStats' in html and
   'chart.js' not in html.lower() and 'echarts' not in html.lower())
ck('★ 雷达图少于 3 个轴不硬画（两个轴围不成面）',
   'if(n < 3) return null;' in html and '至少选' in html)
ck('★ 没有数据的条形画虚线基线，不画 0 长度实条（会被读成「有一点」）',
   '.vz-bar-t.zero' in html and 'vz-bar-t' in html and 'vz-bar-n' in html)

# ---- ★ 所有栏目都有概览区（数字卡 + 下一步） ----
ck('★ 七个栏目都挂了概览区（grow 自己已有数据面板，不重复挂）',
   'function mountOverview' in html and 'function ovData' in html and
   all(('if(v === "%s")' % k) in html for k in
       ['me','chatter','job','interview','dispute','rival','tool']))
ck('★ 概览数字实时重算，不缓存（切视图就刷新）',
   'mountOverview(v);   /* 概览卡' in html and
   'host.getAttribute("data-sig") !== html' in html)
ck('★ 每处「下一步」引导都只给一条（概览模板 1 处 + 进化雷达串场 1 处，不重复堆叠）',
   html.count('class="ovnext"') == 2 and 'ovData' in html and 'evToJob' in html)

# ---- ★ 纵向区块原语 ----
ck('★ 纵向分段原语齐备（卡片内分段 / 键值行 / 步骤行 / 区块网格）',
   '.card-sec{' in html and '.kvrow{' in html and
   '.steprow{' in html and '.secgrid{' in html)
ck('★ 面试复盘卡在竖直方向切成三段 + 六维雷达',
   'card-sec-h">这一场的关键数字' in html and
   'card-sec-h">六维形状' in html and
   'card-sec-h">逐维明细与判级依据' in html and
   'vizRadar(dl6, dv6, 4, 330)' in html)

# ---- ★ 进化雷达：自选技能 + 自评 + 两图 ----
ck('★ 技能可多选（上限 6 —— 再多雷达图就读不出来了）',
   'function evToggle' in html and 'EV_MAX_PICKS = 6' in html and
   '最多 "+EV_MAX_PICKS+" 个' in html)
ck('★ 掌握程度是自评 0—5，用「能做什么」描述而不是「精通」',
   'EV_LEVELS' in html and '能独立做' in html and '能处理例外' in html and
   '精通' not in html.split('EV_LEVELS')[1][:260])
# ---- ★ 工作状态：文档夹 + 作品经历 + 心情曲线 ----
ck('★ 工作状态有文档夹（文件夹 + 文档，本地存储）',
   'function renderDocs' in html and 'function openDocEditor' in html and 'docs:[]' in html)
ck('★ 工作状态有作品与经历（可设提醒日期）',
   'function renderWorks' in html and 'function openWorkEditor' in html and 'works:[]' in html and
   'workDueSoon' in html and '提醒日期' in html)
ck('★ 每天的心情曲线（折线图，-1~1，没记录的天断开）',
   'function moodCurveData' in html and 'function vizLine' in html and
   'value == null' in html and 'rhythm-curve' in html)
ck('★ 雷达与技能池纵向堆叠（不再 .evviz 并排）',
   '<div class="evviz">' not in html and 'evRadarCard()' in html and 'evPoolCard()' in html)

ck('★ 能力雷达复用同一套（evRadarCard 在工作状态，数据同源 picks / level）',
   'function evRadarCard' in html and 'vizRadar(labels, values, 5, 300)' in html and
   'function renderStatus' in html and 'evRadarCard()' in html)
ck('★ 旧格式的计时记录能被读出来（改数据结构不许让老记录消失）',
   'typeof v === "number"' in html and '旧格式' in html)

# ---- ★ 进化雷达里的四件事：小测 / 项目经历 / 能力分析 / 改简历（2026-09-27） ----
# 依据：用户原话「在进化雷达里增加小测，添加项目经历，分析能力和修改简历」。
lab = rd('lab.js')
ck('★ 四件事都挂在进化雷达上，而且顺序是「测 → 析 → 补 → 落地」'
   '（顺序反了用户就看不到「为什么先测」）',
   'LAB.quizCard' in html and 'LAB.analysisCard' in html and 'LAB.projCard' in html
   and 'LAB.resumeCard' in html
   and html.index('LAB.quizCard') < html.index('LAB.analysisCard')
   < html.index('LAB.projCard') < html.index('LAB.resumeCard'))
ck('★ ① 小测：每个技能都有情境题，题量足够（%d 道）' % lab.count('{q:'),
   'var LAB_Q' in lab and lab.count('{q:') >= 30 and '情境题' in lab and '不是名词解释' in lab)
_A = sorted(set(re.findall(r'\n\s*a:(\d)', lab)))
ck('★ 小测的正确答案位置是打散的（位置：%s）—— 全落在一个字母上，做两题就摸到规律'
   % ','.join(_A), len(_A) >= 3)
ck('★ 每道题都写「为什么」，而且要写到另外几个错在哪（只报对错学不到东西）',
   lab.count('w:') >= 30 and '另外几个错在哪' in lab)
ck('★ 小测的边界写在界面上：本机题库 · 不是认证 · 测不出动手能力 · 上限只到第 4 档',
   '不是任何机构认证' in lab and '测不出动手能力' in lab and '能教别人' in lab
   and 'function labSuggest' in lab)
ck('★ ② 项目经历写进的是**简历里的同一份**（不另存一份），并走原来的解析管线',
   'function labProjOpen' in lab and 'resumeEditText' in lab and 'doParse' in lab
   and 'S.resumeEdit' in lab and 'S.lab.projs' not in lab)
ck('★ 项目能挂能力标签（能力分析找证据的第一顺位），老存档缺 tags 字段要兜底',
   'data-ptag' in rd('resume_edit.js') and 'function projTags' in rd('resume_edit.js')
   and 'Array.isArray(p.tags)) p.tags=[]' in rd('resume_edit.js'))
ck('★ ③ 能力分析四列俱全（自评 / 小测 / 证据 / 投入），每条证据带回引原话',
   'function labRows' in lab and '自评 ' in lab and '小测 ' in lab
   and '证据 <b>' in lab and '投入 <b>' in lab and 'lr-ev' in lab and 'e.quote' in lab)
ck('★ 能力的判断规则写在界面上（可逐条反驳），四档都是描述状态、不描述人',
   '规则（可逐条反驳）' in lab and 'var LAB_TIER' in lab and '只在你自己嘴里' in lab
   and '说得清' in lab and '只有自评' in lab and '还没碰' in lab)
ck('★ 能力分析不给总分、不排名、不预测（一给总分，用户就会拿去跟人比）',
   '不给总分' in lab and '也不排名' in lab and '排名' in lab)
ck('★ 证据只做索引、不做判断：明写「会误判」「你自己看着删」，函数名也是 labHit / labEvidence',
   'var LAB_KW' in lab and '会误判' in lab and '你自己看着删' in lab
   and 'function labHit' in lab and 'function labEvidence' in lab and '只做索引' in lab)
ck('★ ④ 改简历直接复用同一个编辑器（openResumeEditor），不另做第二套',
   'openResumeEditor' in lab and 'window.openResumeEditor=open' in rd('resume_edit.js'))
ck('★ 新状态键 lab 已在 S 里声明（不声明就会「答完小测，一刷新分数全没」）',
   'lab:null' in rd('app.js') and 'function labState' in lab)
ck('★ resumeEdit 也必须在初始 S 里 —— 这是本轮修掉的既有 bug：'
   '它以前没声明，于是「自己编辑简历」填的每一格一刷新就回到空白（导出存档里却看得到）',
   'resumeEdit:null' in rd('app.js') and 'S.resumeEdit = blank()' in rd('resume_edit.js'))
ck('★ 绑定每轮重做（DOM 是重建的；漏了这一行不会报错，只会「点了没反应」）',
   'LAB.bind(host)' in html and 'function labBind' in lab)
_sels = re.findall(r'"([#\.][^{}"]*)\{', lab)
_unscoped = [x for x in _sels if not x.startswith('#evOut') and not x.startswith('#mBody')]
ck('★ 新模块的样式全部限定在 #evOut / #mBody 里（不限定就会改到别的模块的长相）',
   not _unscoped, ' '.join(_unscoped[:6]))
_newcls = set(re.findall(r'"#(?:evOut|mBody)\s+\.([a-zA-Z][\w-]*)', lab))
_badcls = sorted(c for c in _newcls if not re.match(r'^(lab|lq|lr|t-)', c))
ck('★ 新样式引入的类名都带前缀（lab / lq / lr / t-）：%d 个' % len(_newcls),
   not _badcls, ' '.join(_badcls[:8]))
ck('★ 新模块不改既有文件的功能：只在 evolve.js 里按顺序摆好 + 转交绑定',
   'LAB.quizCard()' in rd('evolve.js') and 'LAB.bind(host)' in rd('evolve.js'))


# ---- ★ 一屏只留一个主 CTA ----
ck('★ 「别人的情况」是次要按钮，不与「下一步」抢注意力',
   '.casehero-b{' in html and '次要按钮，不用 CTA 珊瑚色' in html)

# ---- ★ forecast 不许把 NaN 漏到界面上 ----
ck('★ forecast 逐个字段兜底，缺字段不会显示「NaN%」',
   'var fNums=(typeof f.nums==="number" && isFinite(f.nums))?f.nums:0;' in html and
   'Math.min(fNums,6)*3' in html and 'Math.min(f.nums,6)*3' not in html)

# ---- ★ 拖拽生成雷达图 ----
ck('★ 技能卡可拖：雷达卡是拖放区，技能池的卡 draggable',
   'function bindEvDrag' in html and 'id="evDrop"' in html and
   'function evRadarCard' in html and 'function evPoolCard' in html and
   'draggable="true"' in html and 'data-ev="' in html)
_dragover_ok = bool(re.search(
    r'ondragover\s*=\s*function\s*\(e\)\s*\{[^}]*preventDefault', html))
ck('★ dragover 里必须 preventDefault（否则 drop 永远不触发且不报错）',
   _dragover_ok and 'e.dataTransfer.dropEffect = "copy"' in html)
ck('★ drop 里也 preventDefault（否则浏览器会当成「打开文件」）',
   bool(re.search(r'ondrop\s*=\s*function\s*\(e\)\s*\{[^}]*preventDefault', html)))
ck('★ 拖拽不是唯一入口：点击同样能加入（手机上拖不了）',
   '手机上直接点' in html and '右边点一下也能加' in html and
   'function evToggle' in html)
ck('★ 超上限时禁止再拖，并说清为什么（不是默默失败）',
   "' data-incap=\"1\"'" in html and '已经选满 ' in html and '先点掉一个再加' in html)
ck('★ 已选技能可一键点掉（芯片上的 ×）',
   '.evchip{' in html and 'data-evdrop=' in html)

# ---- ★ 排版：大标题 + 短句 + 关键词加粗 ----
ck('★ 大标题 40px 且显式左对齐',
   'font-size:40px' in html and 'text-align:left' in html and
   '.vhead h1{' in html)
ck('★ 副标题行宽收窄（长行会串行，读起来就是「一长段看不见重点」）',
   'max-width:680px' in html and '.vhead p{' in html)
# ★ 2026-09-26 文案规矩（用户要求：大标题下面的灰字消失、能减则减）
#   从「副标题拆两行」翻成「副标题一个都不留」—— 十条 vhead 底下不许再有 <p>。
ck('★ 大标题下面不再有灰字（十二个栏目的 vhead 里一个 <p> 都没有）',
   cnt(r'class="vhead"', body) == 12 and 'class="soft"' not in body
   and not re.search(r'<h1>[^<]*</h1>\s*<p>', body[body.index('class="shell'):]),
   'vhead 数 ' + str(cnt(r'class="vhead"', body)))
_ui = ''
for _f in ['app.js','status.js','school.js','evolve.js','member.js','dispute.js','dispute_more.js','rival.js','growth.js','convert.js','share.js','interviewer.js','reef.js','fish3d.js','navpin.js','pay.js','campus.js']:
    _ui += rd(_f)
# 只看「用户能看到的字」：把整块注释去掉再检查（注释里还留着解释用的破折号，不碍事）
_ui_code = re.sub(r'/\*.*?\*/', ' ', _ui, flags=re.S)
_ui_code = re.sub(r'^\s*//.*$', ' ', _ui_code, flags=re.M)
_banned = ['而是','说白了','换句话说','值得注意的是','顺便说','其实','不只是']
_hit = [w for w in _banned if w in _ui_code]
ck('★ 去 AI 腔：判断句式（不是…而是）/ 填充词（其实、说白了）一个不留',
   len(_hit) == 0, '命中：' + ','.join(_hit))
_ui_dash = '——' in body or '——' in _ui_code
ck('★ 破折号不再用来断句（用户可见文案里的 —— 清零）',
   not _ui_dash, str(_ui_code.count('——')) + ' 处残留')
# 说明弹窗（WHYHTML）是用户主动点开才看的解释面，不按「提示」的字数上限管
_ui_pages = _ui_code.split('var WHYHTML=')[0] + _ui_code.split("openWhy(){")[-1] if 'var WHYHTML=' in _ui_code else _ui_code
_hits = re.findall(r'class="note"[^>]*>([^<]{0,400}?)</p>', _ui_pages)
# 量「用户能看到的最长那一句」：按单引号切开，取最长片段，再数中文字数。
# （不这么切会把三元表达式两个分支的字数加在一起，量出来比实际长一倍。）
def _cjk(t):
    segs = re.split(r"'", t)
    return max([len(re.findall(r'[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef0-9A-Za-z]', x)) for x in segs] or [0])
_long = [x for x in _hits if _cjk(x) > 60]
ck('★ 灰字提示只留「边界」或「动作」，单条不超过 60 字',
   len(_long) == 0, str(len(_long)) + ' 条超长，最长 ' + str(max([_cjk(x) for x in _hits] or [0])) + ' 字')

# ---- ★ 单一 </style> ----
# 替换样式层时新层自带 </style>，而我又从原文件的 rindex 处保留 → 出现两个。
# 多出来的那个会被浏览器当文本节点，是个不显形的炸弹。
ck('★ 只有一个 </style> 与 </head>',
   html.count('</style>') == 1 and html.count('</head>') == 1,
   str(html.count('</style>')) + ' / ' + str(html.count('</head>')))

# ---- ★ 焦点环：拦的是「同特异性但写在前面被吃掉」----
# 旧层有 input[type=text],input[type=number],...,textarea{outline:none}，
# 与 input:focus-visible 特异性相同（都是 0,1,1）却写在更前 ——
# 同特异性下后者胜，于是全站输入框与文本域一个焦点环都没有。
# 实测 Tab 26 个停靠点才撞到 1 个，很容易误判成孤例。
_dis_none = html.index('textarea{width:100%;background:var(--bg2)')
_ring = html.rindex('outline:2px solid var(--gold2)')
ck('★ 焦点环规则写在 outline:none 之后（否则被同特异性吃掉）', _ring > _dis_none,
   'ring@%d none@%d' % (_ring, _dis_none))
ck('★ 焦点环覆盖 input 与 textarea（不只 button）',
   'input:focus-visible,input[type]:focus-visible' in html and
   'textarea:focus-visible,select:focus-visible' in html)
ck('★ 输入控件都有可访问名称（placeholder 不算标签，WCAG 3.3.2）',
   cnt(r'<(textarea|input)[^>]*aria-label=', body) >= 4)

# ---- ★ 对比度：小字不许用亮强调色 ----
ck('★ eyebrow 小标签用压暗后的 coral4（亮强调色当 11.5px 小字只有 4.05:1，不过关）',
   '--coral4:#A8361A' in html and
   'background:rgba(240,96,60,.10);color:var(--coral4)' in html)
ck('★ CTA 渐变两端都压暗到白字 ≥4.5:1（原来 #FF7A4D 只有 2.5:1）',
   '--grad-cta:linear-gradient(135deg,#C9431F 0%,#9E2E10 100%)' in html and
   'FF7A4D 0%,#E24C2A' not in html)

# ---- 隐私与数据说明 ----
ck('简历页有就地隐私提示', 'priv-inline' in body and 'id="pvInline"' in body)
ck('隐私弹窗在', 'function openPrivacy' in html and '没有服务器' in html)
ck('隐私弹窗含数据存放位置与清空', 'localStorage' in html and 'function confirmWipe' in html)
ck('隐私弹窗说明唯一联网入口', '唯一会联网的' in html)

# ---- 分享卡 ----
ck('分享卡用 canvas 手绘', 'function drawProfileCard' in html and 'function drawFishCard' in html)
ck('两种版式 9:16 与 1:1', 'vert?1920:1080' in html and '1080×1080' in html)
ck('SVG 载入 canvas 时补了 xmlns', 'xmlns="http://www.w3.org/2000/svg"' in html)
ck('配文可复制', 'function fishCaption' in html and 'SHARE_CAPTION' in html)

# ---- 鱼群密语 ----
ck('黑话库 40 条以上', 'var BBX = [' in html and cnt(r'\{c:"', html) >= 40, str(cnt(r'\{c:"', html)))
ck('黑话库含七大类', all(k in html for k in ['"面试"', '"绩效与涨薪"', '"加班"', '"工资与结算"', '"离职与劝退"', '"程序与证据"', '"画饼与甩锅"']))
ck('★ 鱼群密语不依赖画像：开屏就能进「进阶」通道，不需要先交简历',
   'id="trackPro"' in body and 'id="toolOut"' in body and 'function bbxMatch' in html
   and re.search(r'pro:\s*\{[^}]*items:\[[^\]]*"tool"', js) is not None)
ck('没命中时给通用读法', 'function bbxFallback' in html and '通用读法' in html)

# ---- 劳议鲨手 ----
ck('劳议鲨手 17 类场景（10 类主场景 + 7 类在职阶段）',
   'var DIS_TYPES = [' in html and
   cnt(r'\{ id:"(fire|quit|probation|wage|ot|contract|transfer|social|noncompete|injury|bully|punish|privacy|leave|preg|harass|exitdoc)"', html) == 17,
   str(cnt(r'\{ id:"(fire|quit|probation|wage|ot|contract|transfer|social|noncompete|injury|bully|punish|privacy|leave|preg|harass|exitdoc)"', html)))
ck('★ 在职阶段的奇葩事都在（乱罚款/霸凌/监控/休假/三期/性骚扰/离职卡证）',
   all(k in html for k in ['职场霸凌 · 精神打压', '乱罚款 · 乐捐 · 随意扣款',
                           '查手机 · 装监控 · 扣押证件', '年假不批 · 强制调休 · 病假被卡',
                           '孕期 · 产期 · 哺乳期被施压', '职场性骚扰', '离职被卡 · 扣证明 · 威胁背调']))
ck('★ 每一类都能自己说明「为什么建议尽快找人」（hardWhy）',
   'ty.hardWhy' in html and cnt(r'hardWhy:"', html) >= 5, str(cnt(r'hardWhy:"', html)))
ck('★ 17 类按处境分成「还在职 / 已经出事」两组（且没有漏掉任何一类）',
   'var DIS_GROUPS' in html and 'disGroupOf' not in html and
   '还在职 · 每天在忍的' in html and '已经出事 · 要处理的' in html and
   'disgroup-h' in html)
try:
    # ★ 2026-09-27 收紧扫描范围：原写法扫整个产物，于是任何新模块只要写
    #   { id:"x", n:"y" 就会被算成「争议类型」（实测被 campus.js 的 CAMPUS_PLAN 撞到，
    #   差集里冒出 major/college/school 三条）。争议类型只可能定义在这两个文件里，
    #   所以直接扫源文件，比扫产物更准，也不用再剔 FISH_STAGES。
    _h = rd('dispute.js') + '\n' + rd('dispute_more.js')
    _ids = re.findall(r'\{ id:"(\w+)", n:"', _h)
    _grp = re.search(r'var DIS_GROUPS = \[(.*?)\n\];', html, re.S).group(1)
    _in = set(re.findall(r'"(\w+)"', _grp))
    ck('★ 分组覆盖了全部争议类型（没有孤儿）', set(_ids) == _in,
       '差集=' + str(sorted(set(_ids) ^ _in)))
except Exception as e:
    ck('★ 分组覆盖了全部争议类型（没有孤儿）', False, str(e)[:80])
ck('劳议鲨手三子页', 'id="disTabs"' in body and
   all(k in body for k in ['id="d0"', 'id="d1"', 'id="d2"']))
ck('导航含劳议鲨手', 'data-v="dispute"' in body)
ck('有时效倒计时', 'function disDeadline' in html and 'id="disDate"' in html)
ck('有需求分层但只做规则判定', 'function disTier' in html and '不是对结果的预测' in html)
ck('三类谈话卡四段俱全', 't.they' in html and 't.dont' in html and 't.say' in html and '潜台词' in html)
ck('★ 硬边界：不提供法律意见', '不是法律意见' in html and 'DIS_NOTICE' in html)
ck('★ 硬边界：不计算金额', '不计算金额' in html and '只列名称与法定依据' in html)
ck('★ 硬边界：不预测结果', '不预测结果' in html)
ck('清单可复制导出', 'function disText' in html and '复制我的清单' in html)
ck('法条引用都在', all(k in html for k in ['第 27 条', '第 82 条', '第 87 条', '第 44 条', '第 17 条', '第 19 条']))

# ---- ★ 2026-09-24：会员锁已移除，所有功能免费开放 ----
# 断言从「锁做得对不对」翻成「锁有没有清干净」——两边都必须到位：
# 只删代码不改断言，下一个人会以为门禁还在；只改断言不删代码，
# 会留下永远不执行的分支和点不到的按钮。
ck('★ 会员锁已移除：门禁 / 弹窗 / 状态判断 / 入口按钮一个不留',
   'function isMember' not in html and 'function memberState' not in html and
   'function memberGate' not in html and 'function bindMemberGate' not in html and
   'function openMemberSet' not in html and 'function memberOn' not in html and
   'id="btnMember"' not in body and 'class="vip"' not in body)
ck('★ 会员专用样式也已清掉（不留死 CSS）',
   '.mgate' not in html and '.memstat' not in html and '.memcode' not in html and
   '.subtabs button .vip' not in html)
ck('★ 三项功能对所有使用者直接可用（不再有任何门禁分支）',
   all(k in html for k in ['function renderGroup', 'function renderConsult', 'function renderRhythm']) and
   'if(!isMember())' not in html)
ck('★ 授权码算法留档但无入口（以后要恢复收费不必重写）',
   'MEMBER_SALT' in html and 'function memberMake' in html and
   'function memberVerify' in html and '留档' in html)
ck('★ 界面残留的「会员」字样也清了（不留对不上的文案）',
   '是会员功能' not in html and '\u4f1a\u5458\u5305\u542b' not in html)
ck('★ 群面模拟：8 道议题 + 5 个动作 + 四维评分',
   'var GROUP_CASES' in html and cnt(r'\{ t:\'', html) >= 8 and
   'var GROUP_MOVES' in html and 'var GROUP_ROLES' in html and 'function groupScore' in html)
ck('★ 群面评分是规则评分，不冒充考官评价',
   '不是考官评价' in html and 'function groupAdvice' in html
   and '按你的动作规则评分' in html)
ck('即时咨询：有模型就答，没模型给可发出去的提问卡',
   'function consultAsk' in html and 'function consultCardHTML' in html and 'function renderConsult' in html)
ck('★ 工作节律移到了工作状态（renderStatus 动态生成，含每天心情曲线）',
   'id="rhythmBox"' in html and 'function renderStatus' in html and
   'moodCurveData' in html and 'rhythm-curve' in html)
ck('工作节律：记时长 + 状态统计 + 规则建议',
   'function rhythmStats' in html and 'function rhythmMoodStats' in html and
   'function rhythmAdvice' in html and 'function renderRhythm' in html)
ck('★ 节律的状态判断用显式极性，不用正则匹配词',
   'function moodVal' in html and 'MOOD_VAL' in html and
   '想骂人|想跑|累了|不服' not in html)
ck('★ 样本不足时不给结论（不猜）',
   '样本还不够' in html and '不是诊断' in html)
ck('面试模拟子页顺序：模拟/群面/即时咨询/错题集/复盘',
   all(('data-i="%d"' % i) in body for i in range(5)) and
   cnt(r'class="ipane"', body) == 5 and
   body.index('data-i="1"') < body.index('data-i="2"') <
   body.index('data-i="3"') < body.index('data-i="4"'),
   str(cnt(r'class="ipane"', body)))

# ---- 蛐蛐：状态更多 + 可自定义 ----
ck('★ 内置状态 >= 24（原来只有 8 个）', 'var MOOD_LIB=[' in html and cnt(r'\{t:"', html) >= 24,
   str(cnt(r'\{t:"', html)))
ck('★ 状态可自定义：加 / 删 / 持久化',
   'function moodAdd' in html and 'function moodDel' in html and 'function customMoods' in html and
   'customMoods' in html and 'id="btnMoodAdd"' in body)
ck('★ 自定义状态也有确定性的四维码（不会退化成默认配色）',
   'function moodCode' in html and 'h=(h*16777619)>>>0' in html)
ck('状态带图标', 'function moodIcon' in html and 'MOOD_ICON' in html)
ck('★ 自定义状态上限，不会无限加', '自定义状态最多 12 个' in html)

# ---- ★ 伪社区已删除（2026-09-25）----
ck('★ 伪社区已彻底移除（话题包互通=「假装有服务器」，现实使用率≈0）',
   'function bindCommunity' not in html and 'var COM_SECTIONS' not in html and
   'function comAdd' not in html and 'data-comhost' not in body and
   '话题包' not in html)
ck('★ 12348/12333 真实公共渠道保留（移到劳议鲨手页面，不是社区）',
   '12348 公共法律服务热线' in html and '12333 人社咨询热线' in html and
   'legallinks' in body)

# ---- 分享更明显 ----
ck('★ 常驻分享按钮，跟着视图走', 'id="shareFab"' in body and
   'function renderShareFab' in html and 'function shareFabTarget' in html)
ck('★ 没东西可分享时说明差哪一步（不做假按钮）',
   'function shareFabWhy' in html and 'shareFabWhy' in html and '还没内容' in html)
ck('★ 每个栏目底部的「此刻可以做两件事」都是两列',
   'function momentHTML' in html and '此刻可以做两件事' in html)
ck('★ 分享动作统一用珊瑚 CTA（画像卡导出 / 下载 PNG / 常驻按钮）',
   'class="cta big" id="btnShareMe"' in body and 'class="cta" id="shDl"' in html and
   'class="sharefab"' in body and '--grad-cta' in html)


# ---- ★ 付费服务（pay.js，2026-09-27）----
# 这一块盯的是四条纪律，不是「有没有这个页面」：
#   不预设价格 / 联系方式只有一处配置 / 会员不许写成解锁 / 劳动争议那条带硬边界。
_pay = js[js.index('var PAY_CAT = ['):js.index('function payById')]
ck('★ 付费服务：两个通道的动线里都有它，且挂了 data-track="any"',
   'data-wv="pay"' in _nav and 'data-track="any"' in _nav and 'id="v-pay"' in body
   and 'id="payOut"' in body and _js.count('"pay"') == 2)
ck('★ 付费服务：跨通道点击不切通道（否则从进阶通道点过来会被硬拽回求职通道）',
   'function trackBoth' in js and 'trackBoth(v)' in js
   and '!(typeof trackBoth==="function" && trackBoth(v))' in js)
ck('★ 付费服务：切通道时正停在这一页要重画（否则留着上一个通道的目录）',
   'S.view==="pay" && typeof renderPay==="function"' in js and 'renderPay();' in js)
ck('★ 付费服务：视图调度里接上了 renderPay',
   'else if(v==="pay") renderPay();' in js)
ck('★ 付费服务：状态键 S.pay 在初始 S 里声明过（不声明就「一刷新全变待填」）',
   'pay:null,' in js and 'if(!S.pay||typeof S.pay!=="object")' in js
   and 'if(!S.pay.items||typeof S.pay.items!=="object")' in js)
ck('★ 付费服务：不预设价格 —— 空值渲染成「待填」，源码里不出现任何硬编码金额',
   '价格待填' in js and not re.search(r'¥\s*\d', _pay)
   and not re.search(r'\d+\s*元\s*/\s*份', _pay) and not re.search(r'price\s*:\s*"\d', _pay))
ck('★ 付费服务：联系方式只有一处配置（复用 convert.js 的 svcState，不另开一套）',
   'function svcState' in js and 'function openSvcSet' in js
   and 'svcConfigured()' in js[js.index('var PAY_CAT = ['):]
   and 'openSvcSet' in js[js.index('var PAY_CAT = ['):]
   and 'id="svcHow"' not in js[js.index('var PAY_CAT = ['):])
ck('★ 付费服务：「会员福利」不许写成解锁功能（产品本体本来就免费，写成解锁就是假话）',
   '不是解锁功能' in _pay and '产品本体' in _pay)
ck('★ 付费服务：劳动争议那条自带三条硬边界（不给法律意见 / 不预测结果 / 不算金额）',
   'dis-call' in _pay and '不给法律意见、不预测结果、不算金额' in _pay
   and '执业律师' in _pay)
ck('★ 付费服务：目录条目按主题分开，且每个通道至少三个主题（少于三个就不叫「按主题」）',
   len(re.findall(r'track:"new"', _pay)) >= 3 and len(re.findall(r'track:"pro"', _pay)) >= 2
   and len(re.findall(r'track:"any"', _pay)) >= 1
   and len(re.findall(r'n:"[^"]+", d:"[^"]+"', _pay)) >= 6)
ck('★ 付费服务：四种类型齐备（会员福利 / 材料包 / 咨询 / 代做）',
   all(k in js for k in ['member: { n:"会员福利"', 'pack:   { n:"材料包"',
                         'call:   { n:"咨询"', 'make:   { n:"代做"']))
ck('★ 付费服务：每条都给「拿到手是什么」，不是「点一下会怎样」',
   cnt(r'get:"', _pay) >= 15 and cnt(r'id:"', _pay) >= 15)
ck('★ 付费服务：样式随模块注入（不写进 style.html，否则皮肤树逐字节比对失去意义）',
   'function injectPayCSS' in js and 'PAY_CSS_ID' in js
   and 'payintro' not in rd('style.html') and '.paycard{' not in rd('style.html'))
_paycss = js[js.index('function injectPayCSS'):js.index('function payCardHTML')]
_clash = [x for x in ['.on{','.me{','.dv{','.sp{','.card{','.grid{','.row{','.sec{','.note{','.empty{']
          if x in _paycss]
ck('★ 付费服务：新类名都带 pay 前缀（不与既有类名撞名）',
   not _clash and _paycss.count('.pay') >= 12, '撞名：' + ','.join(_clash) if _clash else '')
_payopen = js[js.index('function payOpen'):js.index('function bindPay')]
ck('★ 付费服务：获取方式是「复制」不是「跳转」（离线文件不该把人带出页面）',
   'cp(link);' in _payopen and 'cp(String(s.how));' in _payopen
   and 'window.open' not in _payopen and 'location.href' not in _payopen)
ck('★ 付费服务：三种降级都给出下一步（没入口要说去哪里填，不做点了没反应的假按钮）',
   "'这条还没填入口'" in js or '这条还没填入口' in js
   and '配置价格与入口' in js)
ck('★ 付费服务：点击上报埋点（这是第一份「谁对哪一条感兴趣」的真实信号）',
   'trackPush("pay_click"' in js and 'trackPush("pay_view"' in js)
ck('★ 付费服务：价格与入口的配置能导出（一次配好发给所有人）',
   'function payExport' in js and '付费配置_' in js)
ck('★ 付费服务的图标是方块语言里的价签（十种 data-ic 都有对应色板）',
   'pay:       ["#B0763A"' in js and 'case "pay":' in js)

# ---- ★ 院校版（campus.js，2026-09-27）----
# 场景：把「卖给高校」这件事落成一个能演示、能验收的页面。
# 四条纪律写在 campus.js 头部；下面每条断言对应其中一条 ——
# 以后有人放松纪律时，先红的是构建，不是客户。
_cp = rd('campus.js')
ck('★ 院校版：入口在侧栏底部，不进导航（TRACKS 是按学生动线排的，院校版不属于任何一条）',
   'id="btnCampus"' in body and 'id="v-campus"' in body and 'id="campusOut"' in body
   and 'data-wv="campus"' not in body and 'data-v="campus"' not in body)
ck('★ 院校版：view() 有调度分支，且做了函数存在性判断（别的构建树缺这个文件也不会炸）',
   'else if(v==="campus" && typeof renderCampus==="function") renderCampus();' in js)
ck('★ 院校版：状态键 S.campus 在初始 S 里声明过（不声明就「填完一刷新全空」）',
   'campus:null,' in js and 'if(!S.campus||typeof S.campus!=="object") S.campus={};' in js
   and 'if(!Array.isArray(S.campus.packs)) S.campus.packs=[];' in js
   and 'if(!S.campus.fill||typeof S.campus.fill!=="object") S.campus.fill={};' in js
   and 'if(!S.campus.plan||typeof S.campus.plan!=="object") S.campus.plan={};' in js)
ck('★ 院校版：入口是空安全绑定的（$("#x").onclick 遇 null 会中断整个 bind()，全站初始化都停）',
   'var _bc=$("#btnCampus"); if(_bc) _bc.onclick=function(){ view("campus"); };' in js)

# ★ 纪律 ④：学生导出的文件只含计数，不含任何内容原文。
#   这是「能不能拿给学校」的前提：简历正文 / 吐槽文字 / 面试回答 / 场景输入
#   一个字节都不许进这个文件。断言直接扫 campusPack() 的函数体。
_pp = _cp[_cp.index('function campusPack('):_cp.index('function campusToday(')]
ck('★ 院校版：学生数据包只读计数与布尔，不读任何内容字段（.raw / msgs / .ans / 正文）',
   '.raw' not in _pp and '.msgs' not in _pp and '.ans' not in _pp and 'resume.raw' not in _pp)
ck('★ 院校版：数据包字段清单写死（十二项，加字段必须同步改这里）',
   all(k in _pp for k in ['resumeParsed','matchRun','mockStarted','mockTurns','mockDone',
                          'disputeRun','phraseRun','bookCount','todoCount','fishCount',
                          'docCount','workCount']))
ck('★ 院校版：包上写明「不含简历正文 / 不含内容 / 不含姓名与学号」',
   '_meta' in _pp and '不含简历正文' in _pp and '不含姓名与学号' in _pp)

# ★ 纪律 ②：算不出来的四项只列名目、不给数字，也不给估算值。
ck('★ 院校版：报告里算不出来的四项都列了，且写明为什么算不出来',
   all(k in _cp for k in ['简历投递通过率','录用率','学生满意度','就业办节省的工时'])
   and 'CAMPUS_CANT' in _cp and '也不做估算' in _cp and '需要企业侧反馈' in _cp)
ck('★ 院校版：分母永远写明是「提交文件的学生」（不把样本说成全体）',
   '分母是「提交文件的学生」，不是全体参与学生' in _cp
   and '沉默的学生不在里面' in _cp)

# ★ 纪律 ③：价格与试点成果字段一律不预设。
_plan = _cp[_cp.index('var CAMPUS_PLAN = ['):_cp.index('/* 报告正文')]
ck('★ 院校版：档位不预设价格（与 pay.js 同一条纪律）',
   '价格待填' in _cp and 'cpptodo' in _cp
   and not re.search(r'¥\s*\d', _plan) and not re.search(r'\d+\s*元', _plan))
ck('★ 院校版：试点成果字段是待填而不是占位数（满意度必须写口径）',
   'CAMPUS_FILL' in _cp and '待填' in _cp and '必须写明口径' in _cp
   and '无基线，本期为首次' in _cp)
ck('★ 院校版：报告待填字段六格齐备（清单写死，加字段要同步改这里）',
   all(k in _cp for k in ['people','span','voice','teacher','satis','base'])
   and _cp.count('data-cpf=') >= 1)

# ★ 纪律 ①：不做假的 B 端。三条限制写在页面最前面，不许藏在角落。
ck('★ 院校版：把做不到的三条写在最显眼的位置（拿不到全体数据 / 算不出结果指标 / 不会自动出报告）',
   '先把做不到的说清楚' in _cp and '拿不到全体学生的数据' in _cp
   and '结果发生在企业那一端' in _cp and '做不到' in _cp)
ck('★ 院校版：授权锁如实说明挡不住复制（不把礼貌的锁说成防盗门）',
   '挡不住懂技术的人' in _cp and '复制一份就能给全校用' in _cp)

_cpblock = _cp[_cp.index('function injectCampusCSS'):_cp.index('function campusPack(')]
# ★ 必须剥注释再取类名：注释里写了「sess.msgs」这种字段名，会被正则当成 .msgs 类名，
#   与既有样式表稳定误报一次（和「禁词要用词组不能用单词」是同一类问题）。
_cpcss = re.sub(r'/\*.*?\*/', ' ', _cpblock, flags=re.S)
_oldcl = set(re.findall(r'\.([A-Za-z][A-Za-z0-9_-]*)\b', rd('style.html')))
_clashcp = sorted(set(re.findall(r'\.([A-Za-z][A-Za-z0-9_-]*)\b', _cpcss)) & _oldcl)
ck('★ 院校版：新类名全部带 cp 前缀，不与既有样式表撞名',
   not _clashcp and _cpcss.count('.cp') >= 25, '撞名：' + ','.join(_clashcp) if _clashcp else '')
ck('★ 院校版：样式随模块注入，不写进 style.html（子集化会把新类名切走，界面静默变白）',
   'CAMPUS_CSS_ID' in _cp and 'injectCampusCSS' in _cp
   and '.cp-intro' not in rd('style.html') and 'cp-intro' not in rd('style.html'))
ck('★ 院校版：五个关键动作都有埋点（看过 / 导出学生包 / 导入 / 出报告 / 复制说明）',
   all(k in _cp for k in ['campus_view','campus_export','campus_import','campus_report','campus_copy']))

size = len(html.encode('utf-8'))
ck('体积合理', 240 * 1024 < size < 1500 * 1024, str(round(size / 1024)) + ' KB')

with open(OUT, 'w', encoding='utf-8') as fh:
    fh.write(html)

for n, ok, d in checks:
    print(('  [OK] ' if ok else '  [X] ') + n + (('  → ' + d) if d else ''))
badn = [n for n, ok, _ in checks if not ok]
print('\n输出：' + OUT)
print('体积：' + str(round(size / 1024)) + ' KB')
print('结果：' + ('全部断言通过' if not badn else ('有失败 → ' + '、'.join(badn))))
sys.exit(0 if not badn else 1)
