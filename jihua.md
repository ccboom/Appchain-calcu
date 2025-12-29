项目文档：Appchain Value Simulator (应用链价值模拟器)
项目名称： Appchainify (暂定)
核心理念： "Don't guess, Calculate." —— 直观展示 DApp 迁移至 Appchain (基于 Celestia) 后的经济模型变化。
目标用户： 项目创始人、加密货币投资者、DeFi/GameFi 社区研究员。

1. 产品概述 (Product Overview)
这是一个 Web 端的可视化计算器。用户选择或输入一个 DApp 的关键运营数据（交易量、客单价等），系统通过对比“以太坊 L2 模式”与“Appchain (Initia/Celestia) 模式”的成本与收入结构，计算出潜在的额外年化利润 (Annual Uplift)。

核心价值主张
可视化差距： 这一眼就能看出的成本差异（Ethereum DA vs Celestia DA）。
隐形收入显性化： 计算通常被忽视的 MEV 和排序器收入。
传播性： 生成“震惊体”数据图表，便于在 Twitter 传播。
2. 功能需求 (Functional Requirements)
2.1 预设场景选择 (Presets)
用户刚进来时不需要从零填数，提供一键填充功能：

DeFi Giant (e.g., PancakeSwap): 高 TVL，中等频次，高 MEV。
On-Chain Game (e.g., Kamigotchi): 极高频次，极低 Gas，零 MEV。
Perp DEX (e.g., GMX): 高频预言机更新，高清算收入。
Custom (自定义): 空白画板。
2.2 输入参数控制 (The Inputs)
提供滑动条 (Slider) 和开关 (Toggle) 进行微调：

Daily Transactions (日交易笔数): 范围 1k - 10M。
User Gas Fee (用户愿付 Gas): 范围 $0.001 - $1.00。
Average Transaction Value (平均交易额): 用于估算 MEV。
Toggle: Capture MEV? (开启后，利润增加)。
Toggle: Token as Gas? (开启后，增加代币买盘估算)。
2.3 数据输出与图表 (The Outputs)
仪表盘核心数字：
当前预估年净利 (Current L2 Profit)
Appchain 预估年净利 (Appchain Profit)
利润提升百分比 (Profit Uplift %) —— 这是最关键的营销数字
图表 1：成本结构对比 (Bar Chart)
L2 Cost (Settlement + ETH DA) vs. Appchain Cost (Celestia DA)。
图表 2：收入构成饼图 (Pie Chart)
Gas 收入 vs. MEV 收入。
3. 数学逻辑模型 (The Math Logic)
这是后端计算的核心公式，你需要将其转换为 JavaScript 函数。

变量定义
Tx_Daily: 日交易量
Gas_Price_User: 用户支付的单笔 Gas ($)
Data_Size_Per_Tx: 单笔交易数据大小 (KB) —— DeFi 约 0.5KB, 游戏约 0.1KB
Cost_Eth_DA_Per_KB: 以太坊 Blob 存储成本 (假设 $0.05/KB，随市场波动)
Cost_Celestia_Per_KB: Celestia 存储成本 (假设 $0.0001/KB)
MEV_Rate: MEV 提取率 (DeFi 设为交易额的 0.02%，游戏为 0)
计算公式
A. 传统 L2 模式 (Scenario A)

收入A = Tx_Daily * Gas_Price_User * 0.8 (假设20%分给L1验证者)
成本A (DA) = Tx_Daily * Data_Size_Per_Tx * Cost_Eth_DA_Per_KB
利润A = 收入A - 成本A
B. Appchain 模式 (Scenario B)

收入B (Gas) = Tx_Daily * Gas_Price_User (100% 归项目方)
收入B (MEV) = 总交易额 * MEV_Rate (如果是 Appchain，这部分全吃)
成本B (DA) = Tx_Daily * Data_Size_Per_Tx * Cost_Celestia_Per_KB
利润B = 收入B (Gas) + 收入B (MEV) - 成本B (DA)
C. 最终结果

Extra_Profit (额外收益) = 利润B - 利润A
4. 技术栈选型 (Tech Stack)
前端框架: Next.js 14 (App Router)
编程语言: TypeScript (必须用，防止数学计算类型出错)
UI 组件库: shadcn/ui (极简、美观、复制粘贴即可用)
样式: Tailwind CSS
图表库: Recharts (适合 React 的轻量级图表)
图标: Lucide React
部署: Vercel
5. 项目结构 (Project Structure)
text

appchain-simulator/
├── app/
│   ├── page.tsx        # 主页面 (包含布局)
│   ├── layout.tsx      # 全局样式
├── components/
│   ├── calculator/
│   │   ├── inputs.tsx  # 滑块和开关组件
│   │   ├── results.tsx # 结果数字大屏
│   │   ├── charts.tsx  # Recharts 图表
│   │   └── preset-selector.tsx # 预设下拉菜单
│   ├── ui/             # shadcn 的基础组件 (button, slider, card...)
├── lib/
│   ├── constants.ts    # 常量 (ETH DA 价格, 默认预设数据)
│   ├── calculations.ts # 核心数学逻辑函数
│   └── utils.ts        # 格式化货币 ($1,000,000) 的工具函数
6. 开发路线图 (Development Roadmap)
Phase 1: 核心逻辑 (1-2 天)
创建一个 calculations.ts 文件。
实现上述数学公式。
写简单的测试用例（比如：如果日交易 100 万笔，结果是不是正数？）。
Phase 2: UI 骨架 (2-3 天)
使用 npx create-next-app 初始化项目。
安装 shadcn/ui: npx shadcn-ui@latest init。
添加组件: npx shadcn-ui@latest add slider switch card select button。
搭建左右分栏布局：左边放 Inputs，右边放 Results。
Phase 3: 交互与状态 (2-3 天)
在主页面使用 React useState 定义所有变量。
将 state 传递给 Input 组件进行修改。
将 state 传递给 calculateProfit 函数，并将结果传递给 Result 组件展示。
接入 Recharts，画出对比柱状图。
Phase 4: 美化与发布 (1-2 天)
调整配色，建议使用深色模式（Dark Mode），配合 Celestia 的紫色/粉色风格。
添加 "Share on X" 按钮，点击后自动复制一段带数据的文案。
部署到 Vercel，绑定域名。
7. 预设数据参考 (Config Data)
为了让你的计算器看起来真实，你需要一些基准数据（放在 constants.ts 中）：

TypeScript

export const PRESETS = {
  pancake: {
    name: "DEX Giant (Like Pancake)",
    dailyTx: 150000,
    avgGasPrice: 0.05, // $
    avgMevCapture: 0.05, // $ per tx estimated
    daCostRatio: 0.001 // Celestia is 1/1000th of Eth
  },
  gamefi: {
    name: "On-Chain Game (Like Kamigotchi)",
    dailyTx: 2000000, // 2M txs
    avgGasPrice: 0.01,
    avgMevCapture: 0,
    daCostRatio: 0.001
  }
};
8. 下一步行动 (Action Plan)
现在： 确认你是否安装了 Node.js 环境。
第一步： 在终端运行 npx create-next-app@latest appchain-calc --typescript --tailwind --eslint。
第二步： 按照这个文档，先去写 lib/calculations.ts。
你需要我提供 calculations.ts 的具体代码作为开始吗？