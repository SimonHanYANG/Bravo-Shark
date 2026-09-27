# CLAUDE.md — 《offer鲨 · 职场鱼塘》项目指南

> 每次对话开始之前都要叫我「涵哥」。
> 不要自己去看图片、视频等多模态内容。
> 每次回答结束之后主动监控上下文占用，如果感觉对话已经很长（超过 80%），立即告知涵哥需要执行 `/compact`。
> 新对话启动时，检查 `.claude/scheduled_tasks.json` 是否已有上下文监控 cron；如果没有或已过期，立即用 CronCreate 创建一个（每 8 分钟、recurring、durable），提醒自己监控上下文。

---

## 项目概览

**offer鲨 · 职场鱼塘** — 面向中国大陆求职者的纯离线、单文件职场自助工具。

- **技术栈：** 纯 vanilla HTML + CSS + JS，Python 3 构建脚本拼接为单个 HTML 文件
- **存储：** 全部在浏览器 `localStorage`（key: `offersha_v1`），无服务器、无账号
- **LLM 接入：** 可选（智谱 GLM / SiliconFlow / DeepSeek / Moonshot / OpenAI / 本地代理），不接也能离线使用
- **PDF 简历导入：** 可选，通过 CDN 加载 pdfjs

---

## 目录结构

```
Shark_Bravo/
├── 构建说明.txt              ← 唯一文档（中文，91 行）
├── aqua_clw/                 ← 沧澜湾风格版（交付物，37 个文件）
│   ├── build.py              ← 构建入口（1118 行，365 条断言）
│   ├── style.html            ← <head> + 全部 CSS（皮肤追加在末尾）
│   ├── body.html             ← DOM 骨架（splash、nav、12 个 view pane）
│   ├── data_jd.js            ← 20 类岗位 JD 数据库（维度 + 面试细节）
│   ├── data_persona.js       ← 100 种四维人格类型
│   ├── data_roles.js         ← 100 种职场人格画像
│   ├── data_hr.js            ← 跨行业 HR 题库（30 行业 / 10 模块 / 100 题）
│   ├── prompt.js             ← "五层调教协议" LLM 提示词系统
│   ├── app.js                ← 主逻辑（139 KB：状态、路由、简历解析、面试）
│   ├── avatar.js             ← 鲨鱼渲染器（体素风格，参数化生成）
│   ├── icons.js              ← 图标系统
│   ├── fish3d.js             ← 3D 鱼池渲染
│   ├── viz.js                ← 可视化组件（雷达/条形/环/数字卡，内联 SVG）
│   ├── reef.js               ← 海底场景
│   ├── navpin.js             ← 导航置顶系统
│   ├── duel.js               ← 群面模拟
│   ├── interviewer.js        ← 面试官类型系统（6 类原型）
│   ├── overview.js           ← 概览面板
│   ├── dispute.js            ← 劳议鲨手（主场景）
│   ├── dispute_more.js       ← 劳议鲨手（扩展：在职阶段场景）
│   ├── blackbox.js           ← 鱼群密语（企业黑话解码器）
│   ├── rival.js              ← 竞品分析
│   ├── evolve.js             ← 进化雷达（能力测评 + 技能进化）
│   ├── lab.js                ← 小测 + 项目经历 + 能力分析
│   ├── status.js             ← 工作状态（计时、文档夹、心情曲线）
│   ├── school.js             ← 小鱼课堂
│   ├── growth.js             ← 成长系统（小丑鱼 → 巨齿鲨 5 阶段）
│   ├── share.js              ← 分享系统（画像卡/分享卡/PNG 导出）
│   ├── todo.js               ← 待办系统（自然语言时间解析 + .ics 导出）
│   ├── resume_edit.js        ← 简历编辑器
│   ├── convert.js            ← 分享转化 + 联系方式配置
│   ├── member.js             ← 会员系统（已移除门禁，保留存档）
│   ├── pay.js                ← 付费服务目录
│   ├── cases.js              ← 实战案例
│   ├── campus.js             ← 院校版（高校就业办场景）
│   ├── firstrun.js           ← 首次运行引导
│   └── track.js              ← 访问轨迹（只进存档，不外发）
├── aqua_v3/                  ← 双通道原版（37 个文件）— 构建断言需要的基线
│   └── （文件名相同；仅 style.html、build.py 和少数 .js 时间戳不同）
```

每个目录约 1.2 MB。已是 git 仓库（见下方「GitHub 仓库与协作规则」）。

---

## 构建与运行

### 构建

```bash
cd /Users/simon.yang/Desktop/Shark_Bravo/aqua_clw
env -u NODE_OPTIONS python3 build.py
```

- `env -u NODE_OPTIONS` 是必须的：`NODE_OPTIONS=--use-system-ca` 会导致 node 拒绝启动
- 构建器将 `style.html` + `body.html`（JS 文件拼接进 `<!--MERGE_JS-->` 注释位置）合并为单个 HTML
- 运行 365 条断言，**任何断言失败则拒绝写入输出**（实际会写但 exit 1）
- 输出路径：`/Users/simon.yang/Desktop/职场鱼塘_沧澜湾风格版.html`（约 1107 KB）

### 运行

直接用浏览器打开生成的 HTML 文件。无需服务器。

### 公网部署（Netlify）

- **公网地址：** https://shark-bravo.netlify.app/
- **站点名：** `shark-bravo`
- **Access Token：** 存放在仓库根目录 `.netlify_token`（已在 `.gitignore` 中，**绝不入库、绝不出现在任何要推送的文件里**）。部署时从该文件读取。

每次构建完成后，如果涵哥要求部署更新，执行以下流程：

```bash
# 1. 构建
cd /Users/simon.yang/Desktop/Shark_Bravo/aqua_clw
env -u NODE_OPTIONS python3 build.py

# 2. 复制产物到部署目录
cp /Users/simon.yang/Desktop/职场鱼塘_沧澜湾风格版.html /tmp/shark-deploy/index.html

# 3. 部署到 Netlify（token 从本地文件读取，不要写进任何代码或文档）
export NETLIFY_AUTH_TOKEN="$(cat /Users/simon.yang/Desktop/Shark_Bravo/.netlify_token)"
npx netlify-cli deploy --prod --dir=/tmp/shark-deploy --site-name shark-bravo
```

- 部署完成后公网地址自动更新，无需额外操作
- 部署目录 `/tmp/shark-deploy/` 需要包含 `index.html`

---

## GitHub 仓库与协作规则（GitHub Flow）

- **仓库：** `git@github.com:SimonHanYANG/Bravo-Shark.git`（网页：https://github.com/SimonHanYANG/Bravo-Shark）
- **注意：该仓库是公开的（Public）。任何密钥（Netlify token 等）严禁进入 git 历史。**

### 分支纪律（必须遵守）

1. **`main` 只作为稳定版**：当前代码已经放上 `main`（初始提交）。
2. **开发不直接改 `main`**：任何新功能、修改、试验，一律从 `main` 拉分支开发（命名如 `feat/xxx`、`fix/xxx`、`exp/xxx`），在分支上提交。
3. **合并进 `main` 必须等涵哥发话**：只有涵哥明确说「merge 到 main」/「合到 main」时，才把分支合入 `main` 并 push。没说就停在分支上，不要自作主张合并。
4. **push 前先构建验证**：`env -u NODE_OPTIONS python3 build.py` 365 条断言必须全过才提交。
5. **改功能要同步两个目录**：`aqua_clw/` 与 `aqua_v3/` 的非 `style.html` 文件必须字节一致，改一处就同步另一处。

### 常用命令

```bash
# 开发前拉分支
git checkout -b feat/xxx

# 提交（push 前先跑构建）
cd /Users/simon.yang/Desktop/Shark_Bravo/aqua_clw && env -u NODE_OPTIONS python3 build.py
cd /Users/simon.yang/Desktop/Shark_Bravo && git add -A && git commit -m "feat: xxx" && git push -u origin feat/xxx

# 只有涵哥说 merge 之后才执行：
git checkout main && git merge feat/xxx && git push origin main
```

---

## 10 个功能模块

### 1. 职场画像（job）
- 简历粘贴/编辑 → 解析 → 人设匹配 → JD 对接
- 14 个维度（价值/行业/报酬/成长/稳定性/强度/团队/地域/话语权/性质/氛围/能力/价值来源/企业阶段）
- 20 类岗位 JD 数据库，含面试流程、HR 画像、薪资结构
- 结论标来源性质（五类），自陈没有统计口径
- 样例画像一键可看，先给结果再要输入

### 2. 面试模拟（interview）
- 6 类面试官原型：流程型/压力型/亲和型/技术型/业务型/高管型
- 错题集 + 复盘（满 4 轮可看复盘 + 预测）
- 群面模拟：8 道议题 + 5 个动作 + 四维评分（规则评分，不冒充考官）
- 即时咨询：有模型就答，没模型给可发出去的提问卡
- 输入条排进面试页内（不再是底部 fixed 悬浮条）
- 对面的鲨鱼形象挂在标签栏上方，只在「模拟」子页显示

### 3. 你的竞品（rival）
- 三子页：岗位画像 / 你的差距 / 行业动态
- 用本地真实数据算竞争面，不编造行业数据
- 「今日公开动态」只给公开入口，不生成内容
- 竞争热度标明是静态分档
- 调研提示词可复制、且要求模型不编数字
- 20 类岗位各带 2-3 条风险点

### 4. 小鱼课堂（school）
- 学习资源 + 实战案例
- 案例可点开看详情（列表 → 单条）
- 不声称是用户数据（产品还没有用户）

### 5. 劳议鲨手（dispute）
- 17 类场景：10 类主场景 + 7 类在职阶段
- 在职阶段：乱罚款/霸凌/监控/休假/三期/性骚扰/离职卡证
- 分组：「还在职 / 已经出事」两组
- 三条硬边界：不提供法律意见、不计算金额、不预测结果
- 时效倒计时 + 需求分层（规则判定）
- 三类谈话卡四段俱全
- 清单可复制导出
- 法条引用都在，12348/12333 真实公共渠道保留
- 对面那个人会怎么说 + 换人（HR / 直属主管 / 老板）

### 6. 工作状态（status）
- 计时长 + 状态统计 + 规则建议
- 文档夹（文件夹 + 文档，本地存储）
- 作品与经历（可设提醒日期）
- 每天心情曲线（折线图，-1~1）
- 状态判断用显式极性，不用正则匹配词
- 样本不足时不给结论

### 7. 进化雷达（grow）
- 能力雷达 + 小测（36 道情境题）+ 项目经历 + 能力分析
- 四列：自评 / 小测 / 证据 / 投入
- 技能可多选（上限 6），掌握程度自评 0-5（用「能做什么」描述）
- 拖拽 + 点击加入（手机兼容）
- 不给总分、不排名、不预测
- 证据只做索引、不做判断
- 「别人的情况」是次要按钮

### 8. 吐槽蛐蛐（chatter）
- 吐槽输入 → 心情标签 → 放出去 → 鱼池
- 鱼池可游动、可点选、点赞、飞入动画
- 商店：配色 8 款 / 衣服 6 件 / 形状 6 种
- 鱼币系统 + 分享限定装扮
- 防刷：同源 20 秒只算一次 + 鱼币每天最多 3 次
- 鱼池预设 20 条他人的鱼

### 9. 鱼群密语（tool）
- 企业黑话解码器，50 条，七大类
- 不依赖画像：开屏就能进
- 没命中时给通用读法

### 10. 付费服务（pay）
- 四种类型：会员福利 / 材料包 / 咨询 / 代做
- 不预设价格，空值渲染成「待填」
- 联系方式只有一处配置（复用 convert.js 的 svcState）
- 获取方式是「复制」不是「跳转」（离线文件不该把人带出页面）
- 会员锁已移除，三项功能直接可用
- 价格与入口的配置能导出

### 院校版（campus）
- 入口在侧栏底部，不进导航（不属于任何学生动线）
- 四条纪律：不做假 B 端 / 算不出来的指标不许编 / 试点成果字段一律待填 / 学生导出只含计数不含内容原文
- 报告里只列名目、不给数字、不给「估算值」
- 授权锁如实说明挡不住复制

---

## 技术要点

### 构建纪律
- `aqua_clw/build.py` 字节比对全部 35 个非 `style.html` 文件与 `../aqua_v3/` 的一致性
- 证明「只换皮，功能一行未改」：改功能必须同步改两个目录
- 皮肤层是 `style.html` 末尾的追加层（在最后一个 `</style>` 处插入），只碰配色与纹理
- 不含脚本或结构标签

### 鲨鱼渲染
- 体素风格（AV_STYLE=voxel），两步：栅格化 + 只画暴露面
- 三面三档明暗（正面/顶面/侧面）
- 轮廓几何保留，品种参数驱动造型
- 体素分辨率由造型反推

### 可视化
- 全部内联 SVG，零依赖
- 雷达/条形/环/数字卡
- 雷达图少于 3 个轴不硬画
- 没有数据的条形画虚线基线

### 成长系统
- 五个阶段：小丑鱼 → 蓝纹神仙 → 旗鱼 → 灰鲭鲨 → 巨齿鲨
- 看「海洋地位」：放鱼/鱼币/分享/练面试/文档作品都算分
- 到顶写「海洋霸主」

### 待办系统
- 自然语言抓时间
- 按时间分组：逾期/今天/明天/本周/以后/随时/已完成
- 提醒：到点前 15 分钟 + 到点
- 导出 .ics

### 分享系统
- 分享有回执：加鱼币/得装扮/攒次数解锁
- 解锁的是追加内容，原有功能一个不锁
- 本机计数、没有服务器核对
- 分享卡用 canvas 手绘，两种版式 9:16 与 1:1

### 状态管理
- 初始 S 声明在 app.js 中，所有新状态键必须在此声明（否则 load() 逐键还原会漏掉）
- 存档带人能读的轨迹摘要
- 轨迹有上限，不会无限长

### 无障碍
- toast 会被屏幕阅读器播报
- 标签行补了 tablist 语义
- 标签行支持方向键
- 鱼池用 roving tabindex
- 接入了系统级减动效偏好
- 所有字号 ≥ 11.5px
- 焦点环规则写在 outline:none 之后
- 输入控件都有可访问名称（placeholder 不算标签）

### 样式
- 沧澜湾风格：白底 / 斜向蓝纹 / 两组同心水纹 / 浮雕两色 / 标题竖条 / 主按钮压印
- 磨砂玻璃：面板用 backdrop-filter
- 输入框不跟着半透（光标与选区在模糊底上看不清）
- CTA 渐变两端都压暗到白字 ≥4.5:1
- 新模块样式限定在各自容器内，类名带前缀