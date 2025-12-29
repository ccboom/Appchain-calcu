// DA 成本常量
export const BLOB_SIZE_BYTES = 128 * 1024;
export const GAS_PER_BLOB = 131072;
export const BLOB_BASE_COST = 8192;
export const BLOB_UTILIZATION_RATE = 0.9; // Blob 打包效率系数 (实际很难 100% 塞满)

// L1 执行成本常量
export const L1_EXECUTION_GAS_PER_TX = 50000; // 单笔交易 Gas (21000基础费 + 状态根更新)

export const CELESTIA_SHARE_SIZE = 500;// 扣除 Namespace 等头部开销后的有效载荷
export const CELESTIA_GAS_PER_SHARE = 80;
export const CELESTIA_FIXED_GAS = 65000;

// 预设场景
export interface Preset {
    id: string;
    name: string;
    description: string;
    dailyTx: number;
    avgGasPrice: number; // USD
    dataSizePerTxKB: number;
    mevRate: number; // 0.01 = 1%
    avgTxValue: number; // USD
}

export const PRESETS: Record<string, Preset> = {
    pancake: {
        id: 'pancake',
        name: 'DeFi Giant',
        description: 'Like PancakeSwap',
        dailyTx: 150000,
        avgGasPrice: 0.10,
        dataSizePerTxKB: 0.8,
        mevRate: 0.0005,
        avgTxValue: 500
    },
    gamefi: {
        id: 'gamefi',
        name: 'On-Chain Game',
        description: 'Like Kamigotchi',
        dailyTx: 2000000,
        avgGasPrice: 0.005,
        dataSizePerTxKB: 0.1,
        mevRate: 0,
        avgTxValue: 1
    },
    perp: {
        id: 'perp',
        name: 'Perp DEX',
        description: 'Like GMX',
        dailyTx: 50000,
        avgGasPrice: 0.50,
        dataSizePerTxKB: 1.2,
        mevRate: 0.001,
        avgTxValue: 2000
    },
    custom: {
        id: 'custom',
        name: 'High Data Volume',
        description: 'For data-intensive apps',
        dailyTx: 5000000,
        avgGasPrice: 0.01,
        dataSizePerTxKB: 2.0,
        mevRate: 0,
        avgTxValue: 50
    }
};
