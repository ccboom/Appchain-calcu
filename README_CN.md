# Appchain 价值模拟器

> "不要猜测,用数据说话。" —— 可视化展示 DApp 迁移至 Appchain 后的经济影响。

一个基于 Web 的计算器,帮助项目创始人和加密货币投资者理解从传统以太坊 L2 迁移到基于 Celestia 的 Appchain 的财务收益。

![项目状态](https://img.shields.io/badge/状态-运行中-success)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

## 🎯 核心价值

1. **可视化成本差距**: 直观看到以太坊 DA 与 Celestia DA 成本的巨大差异
2. **揭示隐藏收入**: 计算经常被忽视的 MEV 和排序器收入
3. **实时数据**: ETH、TIA、gas 费用和 blob 成本的实时市场价格
4. **灵活分析**: 在每日和每年成本视图之间切换

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 打开浏览器
# 访问 http://localhost:3000
```

## 📊 功能特性

### 预设场景
- **DeFi 巨头** (如 PancakeSwap): 高 TVL,中等频次,竞争性 MEV
- **链上游戏** (如 Kamigotchi): 海量交易,微交易,零 MEV
- **永续 DEX** (如 GMX): 高频预言机更新,清算收入
- **高数据量**: 数据密集型应用,高吞吐量

### 交互控制
- 日交易量滑块 (1K - 5M)
- 用户 Gas 费用滑块 ($0.001 - $1.00)
- 单笔交易数据大小 (0.1 KB - 10 MB)
- MEV 捕获开关
- **每日/每年成本视图切换**

### 实时市场数据
- 实时 ETH 和 TIA 价格 (多源获取,自动降级)
- 以太坊主网实时基础费用
- 实时 Celestia gas 价格
- 自动刷新,支持手动刷新按钮

### 可视化输出
- 实时利润对比 (L2 vs Appchain)
- DA 成本对比柱状图,支持每日/每年切换
- 利润提升显示绝对金额
- 带背景动画的加载界面

## 🧮 计算公式

### 常量定义

#### 以太坊 Blob DA
```typescript
BLOB_SIZE_BYTES = 128 * 1024        // 每个 blob 128 KB
GAS_PER_BLOB = 131,072              // 每个 blob 的 Gas 单位
BLOB_BASE_COST = 8,192              // 基础成本乘数 (EIP-7918)
BLOB_UTILIZATION_RATE = 0.9         // 90% 打包效率
```

#### Celestia DA
```typescript
CELESTIA_SHARE_SIZE = 500           // 每个 share 的字节数 (扣除命名空间开销)
CELESTIA_GAS_PER_SHARE = 80         // 每个 share 的 Gas 单位
CELESTIA_FIXED_GAS = 65,000         // 固定 Gas 开销
```

### 输入变量

| 变量 | 描述 | 单位 |
|------|------|------|
| `Tx_Daily` | 日交易笔数 | 笔/天 |
| `Gas_Price_User` | 用户支付的单笔 Gas 费 | USD |
| `Data_Size_Per_Tx` | 单笔交易数据大小 | KB |
| `MEV_Rate` | MEV 提取率 | 交易额的百分比 |
| `Avg_Tx_Value` | 平均交易金额 | USD |
| `Eth_Price` | ETH 市场价格 (实时) | USD |
| `Tia_Price` | TIA 市场价格 (实时) | USD |
| `Eth_Base_Fee` | 以太坊基础费用 (实时) | Wei |
| `Blob_Market_Price` | Blob 市场价格 | Wei |
| `Tia_Gas_Price` | TIA Gas 价格 (实时) | uTIA |

### 核心计算步骤

#### 1. 总数据量
```
总数据字节数 = 日交易笔数 × 单笔数据大小(KB) × 1024
```

#### 2. 以太坊 L2 DA 成本

**保留价格计算 (EIP-7918):**
```
保留价格 = floor((BLOB_BASE_COST × 以太坊基础费用) / GAS_PER_BLOB)
```

**有效 Blob 价格:**
```
有效Blob价格 = max(Blob市场价格, 保留价格)
```

**Blob 数量 (90% 利用率):**
```
Blob数量 = ceil(总数据字节数 / (BLOB_SIZE_BYTES × 0.9))
```

**每日成本 (Wei):**
```
以太坊成本Wei每日 = Blob数量 × GAS_PER_BLOB × 有效Blob价格
```

**年度成本 (USD):**
```
以太坊成本ETH每日 = 以太坊成本Wei每日 / 10^18
以太坊成本USD年度 = 以太坊成本ETH每日 × ETH价格 × 365
```

#### 3. Celestia Appchain DA 成本

**Share 数量:**
```
Share数量 = ceil(总数据字节数 / CELESTIA_SHARE_SIZE)
```

**总 Gas 消耗:**
```
Celestia总Gas每日 = Share数量 × CELESTIA_GAS_PER_SHARE + CELESTIA_FIXED_GAS
```

**每日成本 (uTIA):**
```
Celestia成本Utia每日 = Celestia总Gas每日 × TIA_Gas价格
```

**年度成本 (USD):**
```
Celestia成本TIA每日 = Celestia成本Utia每日 / 1,000,000
Celestia成本USD年度 = Celestia成本TIA每日 × TIA价格 × 365
```

#### 4. 收入计算

**年度 Gas 收入:**
```
年度Gas收入 = 日交易笔数 × 单笔Gas费 × 365
```

**年度 MEV 收入:**
```
年度MEV收入 = 日交易笔数 × 平均交易金额 × MEV提取率 × 365
```

#### 5. 利润对比

**L2 场景:**
```
L2收入 = 年度Gas收入
L2结算成本 = 年度Gas收入 × 0.2    // 20% L1 结算成本
L2总成本 = L2结算成本 + 以太坊成本USD年度
L2利润 = L2收入 - L2总成本
```

**Appchain 场景:**
```
Appchain_MEV收入 = 年度MEV收入 (如果启用 MEV 捕获,否则为 0)
Appchain收入 = 年度Gas收入 + Appchain_MEV收入
Appchain利润 = Appchain收入 - Celestia成本USD年度
```

#### 6. 最终指标

**额外利润:**
```
额外利润 = Appchain利润 - L2利润
```

**提升百分比:**
```
提升百分比 = (额外利润 / L2利润) × 100%
```

**DA 节省:**
```
DA节省 = 以太坊成本USD年度 - Celestia成本USD年度
```

## 📁 项目结构

```
celesita-chain/
├── app/
│   ├── api/
│   │   └── market-data/
│   │       └── route.ts        # 实时市场数据 API
│   ├── layout.tsx              # 根布局与元数据
│   ├── globals.css             # Tailwind + 深色主题
│   └── page.tsx                # 主计算器 UI
├── lib/
│   ├── constants.ts            # DA 常量 + 预设场景
│   └── calculations.ts         # 核心计算逻辑
├── public/
│   └── home.gif                # 加载动画背景
├── package.json                # 依赖项
├── tailwind.config.js          # Tailwind 配置
└── next.config.js              # Next.js 配置
```

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 3
- **图表**: Recharts 2
- **图标**: Lucide React
- **运行时**: React 18

## 📈 示例场景

### DeFi 巨头 (类似 PancakeSwap)
- 日交易量: 150,000 笔
- Gas 费用: $0.10
- 数据大小: 0.8 KB/笔
- MEV 率: 0.05%
- 平均交易额: $500

### 链上游戏 (类似 Kamigotchi)
- 日交易量: 2,000,000 笔
- Gas 费用: $0.005
- 数据大小: 0.1 KB/笔
- MEV 率: 0%
- 平均交易额: $1

### 永续 DEX (类似 GMX)
- 日交易量: 50,000 笔
- Gas 费用: $0.50
- 数据大小: 1.2 KB/笔
- MEV 率: 0.1%
- 平均交易额: $2,000

### 高数据量
- 日交易量: 5,000,000 笔
- Gas 费用: $0.01
- 数据大小: 2.0 KB/笔
- MEV 率: 0%
- 平均交易额: $50

## 🔍 关键假设

1. **L2 结算成本**: 20% 的 Gas 收入用于 L1 结算/验证
2. **Appchain 收入**: 100% 的 Gas 费用 + MEV (如果捕获) 归项目方所有
3. **MEV 捕获**: 仅在 Appchain 模式下可用 (完全控制排序)
4. **市场价格**: 实时数据来自多个来源 (Binance, OKX, Gate.io, KuCoin, CoinCap)
5. **Blob 利用率**: 90% 打包效率 (blob 很少能 100% 填满)
6. **EIP-7918**: 保留价格确保 blob 成本至少为 BLOB_BASE_COST 执行 gas

## ✨ 最近更新

- ✅ 实时市场数据 API,支持多源降级
- ✅ 每日/每年成本视图切换
- ✅ 带 GIF 背景的加载动画
- ✅ 更新收入公式 (20% L1 结算成本)
- ✅ 90% blob 利用率
- ✅ 符合 EIP-7918 的保留价格计算
- ✅ 高数据量预设场景
- ✅ 社区页脚和社交链接

## 🚧 未来增强

- [ ] 导出结果为 PDF/图片
- [ ] 历史对比图表
- [ ] 代币经济学建模
- [ ] 多链支持
- [ ] 自定义 blob 利用率

## 📝 许可证

MIT

## 🤝 贡献

欢迎贡献!请随时提交 Pull Request。

## 📧 联系方式

由 ccboomer_ 在 **CelestineSloths** 社区制作

- Twitter: [@CelestineSloths](https://x.com/CelestineSloths)
- Discord: [加入我们](https://discord.gg/EfSaAtZH)

---

**免责声明**: 本工具基于当前市场数据和假设提供估算。在做出财务决策之前,请务必自行研究 (DYOR)。
