# Appchain Value Simulator

> "Don't guess. Calculate." — Visualize the economic impact of moving your DApp to an Appchain.

A web-based calculator that helps project founders and crypto investors understand the financial benefits of migrating from traditional Ethereum L2 to a Celestia-based Appchain.

![Project Status](https://img.shields.io/badge/status-active-success)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

## 🎯 Core Value Proposition

1. **Visualize Cost Gaps**: See the dramatic difference between Ethereum DA and Celestia DA costs
2. **Reveal Hidden Revenue**: Calculate often-overlooked MEV and sequencer revenue
3. **Real-Time Data**: Live market prices for ETH, TIA, gas fees, and blob costs
4. **Flexible Analysis**: Switch between daily and annual cost views

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
# Navigate to http://localhost:3000
```

## 📊 Features

### Preset Scenarios
- **DeFi Giant** (e.g., PancakeSwap): High TVL, moderate frequency, competitive MEV
- **On-Chain Game** (e.g., Kamigotchi): Massive volume, micro-transactions, zero MEV
- **Perp DEX** (e.g., GMX): High-frequency oracle updates, liquidation revenue
- **High Data Volume**: Data-intensive applications with high throughput

### Interactive Controls
- Daily transaction volume slider (1K - 5M)
- User gas fee slider ($0.001 - $1.00)
- Data size per transaction (0.1 KB - 10 MB)
- MEV capture toggle
- **Daily/Annual cost view toggle**

### Real-Time Market Data
- Live ETH and TIA prices (multi-source with fallback)
- Real-time ETH base fee from Ethereum mainnet
- Live Celestia gas prices
- Auto-refresh with manual refresh button

### Visual Output
- Real-time profit comparison (L2 vs Appchain)
- DA cost comparison bar chart with daily/annual toggle
- Profit uplift in absolute dollars
- Animated loading screen with background

## 🧮 Calculation Formulas

### Constants

#### Ethereum Blob DA
```typescript
BLOB_SIZE_BYTES = 128 * 1024        // 128 KB per blob
GAS_PER_BLOB = 131,072              // Gas units per blob
BLOB_BASE_COST = 8,192              // Base cost multiplier (EIP-7918)
BLOB_UTILIZATION_RATE = 0.9         // 90% packing efficiency
```

#### Celestia DA
```typescript
CELESTIA_SHARE_SIZE = 500           // Bytes per share (after namespace overhead)
CELESTIA_GAS_PER_SHARE = 80         // Gas units per share
CELESTIA_FIXED_GAS = 65,000         // Fixed gas overhead
```

### Input Variables

| Variable | Description | Unit |
|----------|-------------|------|
| `Tx_Daily` | Daily transaction count | txs/day |
| `Gas_Price_User` | User-paid gas fee per tx | USD |
| `Data_Size_Per_Tx` | Data size per transaction | KB |
| `MEV_Rate` | MEV extraction rate | % of tx value |
| `Avg_Tx_Value` | Average transaction value | USD |
| `Eth_Price` | ETH market price (live) | USD |
| `Tia_Price` | TIA market price (live) | USD |
| `Eth_Base_Fee` | Ethereum base fee (live) | Wei |
| `Blob_Market_Price` | Blob market price | Wei |
| `Tia_Gas_Price` | TIA gas price (live) | uTIA |

### Core Calculations

#### 1. Total Data Volume
```
Total_Data_Bytes = Tx_Daily × Data_Size_Per_Tx × 1024
```

#### 2. Ethereum L2 DA Cost

**Reserve Price Calculation (EIP-7918):**
```
Reserve_Price = floor((BLOB_BASE_COST × Eth_Base_Fee) / GAS_PER_BLOB)
```

**Effective Blob Price:**
```
Effective_Blob_Price = max(Blob_Market_Price, Reserve_Price)
```

**Blob Count (with 90% utilization):**
```
Blob_Count = ceil(Total_Data_Bytes / (BLOB_SIZE_BYTES × 0.9))
```

**Daily Cost (Wei):**
```
Eth_Cost_Wei_Daily = Blob_Count × GAS_PER_BLOB × Effective_Blob_Price
```

**Annual Cost (USD):**
```
Eth_Cost_Eth_Daily = Eth_Cost_Wei_Daily / 10^18
Eth_Cost_USD_Annual = Eth_Cost_Eth_Daily × Eth_Price × 365
```

#### 3. Celestia Appchain DA Cost

**Share Count:**
```
Share_Count = ceil(Total_Data_Bytes / CELESTIA_SHARE_SIZE)
```

**Total Gas:**
```
Celestia_Total_Gas_Daily = Share_Count × CELESTIA_GAS_PER_SHARE + CELESTIA_FIXED_GAS
```

**Daily Cost (uTIA):**
```
Celestia_Cost_Utia_Daily = Celestia_Total_Gas_Daily × Tia_Gas_Price
```

**Annual Cost (USD):**
```
Celestia_Cost_Tia_Daily = Celestia_Cost_Utia_Daily / 1,000,000
Celestia_Cost_USD_Annual = Celestia_Cost_Tia_Daily × Tia_Price × 365
```

#### 4. Revenue Calculations

**Annual Gas Revenue:**
```
Annual_Gas_Revenue = Tx_Daily × Gas_Price_User × 365
```

**Annual MEV Revenue:**
```
Annual_MEV_Revenue = Tx_Daily × Avg_Tx_Value × MEV_Rate × 365
```

#### 5. Profit Comparison

**L2 Scenario:**
```
L2_Revenue = Annual_Gas_Revenue
L2_Settlement_Cost = Annual_Gas_Revenue × 0.2    // 20% L1 settlement cost
L2_Total_Cost = L2_Settlement_Cost + Eth_Cost_USD_Annual
L2_Profit = L2_Revenue - L2_Total_Cost
```

**Appchain Scenario:**
```
Appchain_MEV_Revenue = Annual_MEV_Revenue (if MEV capture enabled, else 0)
Appchain_Revenue = Annual_Gas_Revenue + Appchain_MEV_Revenue
Appchain_Profit = Appchain_Revenue - Celestia_Cost_USD_Annual
```

#### 6. Final Metrics

**Extra Profit:**
```
Extra_Profit = Appchain_Profit - L2_Profit
```

**Uplift Percentage:**
```
Uplift_Percent = (Extra_Profit / L2_Profit) × 100%
```

**DA Savings:**
```
DA_Savings = Eth_Cost_USD_Annual - Celestia_Cost_USD_Annual
```

## 📁 Project Structure

```
celesita-chain/
├── app/
│   ├── api/
│   │   └── market-data/
│   │       └── route.ts        # Real-time market data API
│   ├── layout.tsx              # Root layout with metadata
│   ├── globals.css             # Tailwind + dark theme
│   └── page.tsx                # Main calculator UI
├── lib/
│   ├── constants.ts            # DA constants + presets
│   └── calculations.ts         # Core calculation logic
├── public/
│   └── home.gif                # Loading animation background
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind configuration
└── next.config.js              # Next.js configuration
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Charts**: Recharts 2
- **Icons**: Lucide React
- **Runtime**: React 18

## 📈 Example Scenarios

### DeFi Giant (PancakeSwap-like)
- Daily Txs: 150,000
- Gas Fee: $0.10
- Data Size: 0.8 KB/tx
- MEV Rate: 0.05%
- Avg Tx Value: $500

### On-Chain Game (Kamigotchi-like)
- Daily Txs: 2,000,000
- Gas Fee: $0.005
- Data Size: 0.1 KB/tx
- MEV Rate: 0%
- Avg Tx Value: $1

### Perp DEX (GMX-like)
- Daily Txs: 50,000
- Gas Fee: $0.50
- Data Size: 1.2 KB/tx
- MEV Rate: 0.1%
- Avg Tx Value: $2,000

### High Data Volume
- Daily Txs: 5,000,000
- Gas Fee: $0.01
- Data Size: 2.0 KB/tx
- MEV Rate: 0%
- Avg Tx Value: $50

## 🔍 Key Assumptions

1. **L2 Settlement Cost**: 20% of gas revenue goes to L1 settlement/verification
2. **Appchain Revenue**: 100% of gas fees + MEV (if captured) goes to the project
3. **MEV Capture**: Only available in Appchain mode (full control over sequencing)
4. **Market Prices**: Real-time data from multiple sources (Binance, OKX, Gate.io, KuCoin, CoinCap)
5. **Blob Utilization**: 90% packing efficiency (blobs rarely 100% full)
6. **EIP-7918**: Reserve price ensures blob cost is at least BLOB_BASE_COST execution gas

## ✨ Recent Updates

- ✅ Real-time market data API with multi-source fallback
- ✅ Daily/Annual cost view toggle
- ✅ Animated loading screen with GIF background
- ✅ Updated revenue formula (20% L1 settlement cost)
- ✅ 90% blob utilization rate
- ✅ EIP-7918 compliant reserve price calculation
- ✅ High Data Volume preset scenario
- ✅ Community footer with social links

## 🚧 Future Enhancements

- [ ] Export results as PDF/image
- [ ] Historical comparison charts
- [ ] Token economics modeling
- [ ] Multi-chain support
- [ ] Custom blob utilization rate

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

Made by ccboomer_ in **CelestineSloths** Community

- Twitter: [@CelestineSloths](https://x.com/CelestineSloths)
- Discord: [Join us](https://discord.gg/EfSaAtZH)

---

**Disclaimer**: This tool provides estimates based on current market data and assumptions. Always do your own research (DYOR) before making financial decisions.
