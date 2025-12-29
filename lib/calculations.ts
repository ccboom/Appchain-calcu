import {
    BLOB_SIZE_BYTES,
    GAS_PER_BLOB,
    BLOB_BASE_COST,
    BLOB_UTILIZATION_RATE,
    CELESTIA_SHARE_SIZE,
    CELESTIA_GAS_PER_SHARE,
    CELESTIA_FIXED_GAS,
    L1_EXECUTION_GAS_PER_TX
} from './constants';

export interface MarketData {
    ethPrice: number;
    tiaPrice: number;
    ethBaseFee: number;
    blobMarketPrice: number;
    tiaGasPrice: number;
}

export interface CalculationInputs {
    dailyTx: number;
    avgGasPrice: number;
    dataSizePerTxKB: number;
    mevRate: number;
    avgTxValue: number;
    marketData: MarketData;
    captureMev: boolean;
}

export interface CalculationResult {
    l2: {
        revenue: number;
        costDA: number;
        costExecution: number;
        totalCost: number;
        profit: number;
    };
    appchain: {
        revenueGas: number;
        revenueMev: number;
        costDA: number;
        profit: number;
    };
    comparison: {
        uplift: number;
        upliftPercent: number;
        savingsDA: number;
    };
}

export function calculateAppchainEconomics(inputs: CalculationInputs): CalculationResult {
    const {
        dailyTx,
        avgGasPrice,
        dataSizePerTxKB,
        mevRate,
        avgTxValue,
        marketData,
        captureMev
    } = inputs;

    const totalDataBytes = dailyTx * dataSizePerTxKB * 1024;
    const annualizer = 365;

    // Ethereum L2 Cost (DA)
    const safeEthBaseFee = Math.floor(marketData.ethBaseFee || 0);
    const safeBlobMarketPrice = Math.floor(marketData.blobMarketPrice || 0);

    const reservePrice = Math.floor((BLOB_BASE_COST * safeEthBaseFee) / GAS_PER_BLOB);
    const effectiveBlobPrice = Math.max(safeBlobMarketPrice, reservePrice);

    // 调试信息
    console.log('=== Blob Cost Calculation Debug ===');
    console.log('ETH Base Fee (wei):', safeEthBaseFee);
    console.log('Blob Market Price (wei):', safeBlobMarketPrice);
    console.log('Reserve Price (wei):', reservePrice);
    console.log('Effective Blob Price (wei):', effectiveBlobPrice);
    console.log('Total Data Bytes:', totalDataBytes);

    // 增加 0.9 的打包效率系数 (Blob 实际上很难 100% 塞满)
    const blobCount = Math.ceil(totalDataBytes / (BLOB_SIZE_BYTES * BLOB_UTILIZATION_RATE));
    const ethCostWeiDaily = BigInt(Math.floor(blobCount)) * BigInt(Math.floor(GAS_PER_BLOB)) * BigInt(Math.floor(effectiveBlobPrice));
    const ethCostEthDaily = Number(ethCostWeiDaily) / 1e18;
    const ethCostUsdAnnual = ethCostEthDaily * marketData.ethPrice * annualizer;

    console.log('Blob Count:', blobCount);
    console.log('ETH Cost (wei) Daily:', ethCostWeiDaily.toString());
    console.log('ETH Cost (ETH) Daily:', ethCostEthDaily);
    console.log('ETH Cost (USD) Annual:', ethCostUsdAnnual);
    console.log('===================================');

    // Celestia Appchain Cost (DA)
    const shareCount = Math.ceil(totalDataBytes / CELESTIA_SHARE_SIZE);
    const celestiaTotalGasDaily = shareCount * CELESTIA_GAS_PER_SHARE + CELESTIA_FIXED_GAS;
    const celestiaCostUtiaDaily = celestiaTotalGasDaily * marketData.tiaGasPrice;
    const celestiaCostTiaDaily = celestiaCostUtiaDaily / 1_000_000;
    const celestiaCostUsdAnnual = celestiaCostTiaDaily * marketData.tiaPrice * annualizer;

    // Revenue & Profit
    const annualGasRevenue = dailyTx * avgGasPrice * annualizer;
    const annualMevRevenue = dailyTx * avgTxValue * mevRate * annualizer;

    // L2 Scenario
    // L2 场景:通常无法捕获 MEV(被排序器拿走),且需支付 L1 结算费
    // L2收入 = 年度Gas收入
    // L2支出 = (年度Gas收入 × 0.2) + 以太坊成本USD年度  // 0.2 为 L1 结算验证成本
    const l2Revenue = annualGasRevenue;
    const l2SettlementCost = annualGasRevenue * 0.2; // L1结算验证成本
    const l2TotalCost = l2SettlementCost + ethCostUsdAnnual;
    const l2Profit = l2Revenue - l2TotalCost;

    // Appchain Scenario
    const appchainMevRevenue = captureMev ? annualMevRevenue : 0;
    const appchainRevenue = annualGasRevenue + appchainMevRevenue;
    const appchainProfit = appchainRevenue - celestiaCostUsdAnnual;

    // Comparison
    const uplift = appchainProfit - l2Profit;
    const upliftPercent = l2Profit > 0 ? (uplift / l2Profit) * 100 : 0;
    const savingsDA = ethCostUsdAnnual - celestiaCostUsdAnnual;

    return {
        l2: {
            revenue: l2Revenue,
            costDA: ethCostUsdAnnual,
            costExecution: l2SettlementCost,
            totalCost: l2TotalCost,
            profit: l2Profit
        },
        appchain: {
            revenueGas: annualGasRevenue,
            revenueMev: appchainMevRevenue,
            costDA: celestiaCostUsdAnnual,
            profit: appchainProfit
        },
        comparison: {
            uplift,
            upliftPercent,
            savingsDA
        }
    };
}

export function formatCurrency(val: number): string {
    if (val === 0) return '$0';
    if (Math.abs(val) < 0.01) return `$${val.toFixed(4)}`;
    if (Math.abs(val) < 1) return `$${val.toFixed(2)}`;
    return `$${Math.floor(val).toLocaleString()}`;
}
