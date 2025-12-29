'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { PRESETS, Preset } from '@/lib/constants';
import { calculateAppchainEconomics, formatCurrency, MarketData } from '@/lib/calculations';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, LabelList, Cell } from 'recharts';
import { RefreshCw } from 'lucide-react';

// 默认市场数据
const DEFAULT_MARKET_DATA: MarketData = {
    ethPrice: 3500,
    tiaPrice: 0.4,
    ethBaseFee: 15000000000,
    blobMarketPrice: 1,
    tiaGasPrice: 0.004,
};

// 格式化Gwei
const formatGwei = (wei: number) => (Number(wei) / 1e9).toFixed(2);

export default function Home() {
    // 市场数据
    const [marketData, setMarketData] = useState<MarketData>(DEFAULT_MARKET_DATA);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // 输入参数
    const [dailyTx, setDailyTx] = useState(PRESETS.pancake.dailyTx);
    const [gasPrice, setGasPrice] = useState(PRESETS.pancake.avgGasPrice);
    const [dataSize, setDataSize] = useState(PRESETS.pancake.dataSizePerTxKB);
    const [mevRate, setMevRate] = useState(PRESETS.pancake.mevRate);
    const [avgTxValue, setAvgTxValue] = useState(PRESETS.pancake.avgTxValue);
    const [captureMev, setCaptureMev] = useState(true);
    const [currentPresetId, setCurrentPresetId] = useState('pancake');
    const [timeframe, setTimeframe] = useState<'daily' | 'annual'>('annual'); // 日/年切换

    // 获取市场数据
    const fetchMarketData = useCallback(async (isRefreshBtn = false) => {
        if (isRefreshBtn) {
            setLoading(true);
        }
        try {
            const res = await fetch('/api/market-data');
            if (res.ok) {
                const data = await res.json();
                console.log('=== Market Data Fetched ===');
                console.log('ETH Price:', data.ethPrice);
                console.log('TIA Price:', data.tiaPrice);
                console.log('ETH Base Fee:', data.ethBaseFee, 'wei');
                console.log('TIA Gas Price:', data.tiaGasPrice, 'utia');
                console.log('Last Updated:', data.lastUpdated);
                console.log('===========================');
                setMarketData(data);
            }
        } catch (e) {
            console.error("Failed to fetch market data", e);
        } finally {
            setLoading(false);
            setTimeout(() => setInitialLoading(false), 800);
        }
    }, []);

    useEffect(() => {
        fetchMarketData();
    }, [fetchMarketData]);

    // 预设选择
    const handlePresetSelect = (preset: Preset) => {
        setDailyTx(preset.dailyTx);
        setGasPrice(preset.avgGasPrice);
        setDataSize(preset.dataSizePerTxKB);
        setMevRate(preset.mevRate);
        setAvgTxValue(preset.avgTxValue);
        setCurrentPresetId(preset.id);
    };

    // 计算结果
    const result = useMemo(() => {
        return calculateAppchainEconomics({
            dailyTx,
            avgGasPrice: gasPrice,
            dataSizePerTxKB: dataSize,
            mevRate,
            avgTxValue,
            marketData,
            captureMev
        });
    }, [dailyTx, gasPrice, dataSize, mevRate, avgTxValue, marketData, captureMev]);

    // 图表数据 - 支持日/年切换
    const divisor = timeframe === 'daily' ? 365 : 1; // 每日除以365,每年保持不变
    const l2Cost = result.l2.costDA / divisor;
    const appchainCost = result.appchain.costDA / divisor;
    const maxCost = Math.max(l2Cost, appchainCost);
    const costData = [
        { name: 'L2', cost: l2Cost, color: '#ef4444' },
        { name: 'Appchain', cost: appchainCost, color: '#10b981' }
    ];

    // 自定义标签渲染器
    const renderCustomLabel = (props: any) => {
        const { x, y, width, value } = props;
        return (
            <text
                x={x + width + 10}
                y={y + 12}
                fill="#a8a29e"
                fontSize={12}
                fontWeight="bold"
            >
                {formatCurrency(value)}
            </text>
        );
    };

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 p-4 md:p-8">
            {/* 加载动画 */}
            {initialLoading && (

                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700">
                    {/* 背景图片层 */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src="/home.gif"
                            alt="Background"
                            className="w-full h-full object-cover brightness-[0.25]"
                        />
                    </div>

                    {/* 内容层 */}
                    <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <div className="w-32 h-32 mb-6 rounded-full bg-stone-800/50 backdrop-blur-sm border border-amber-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                            <span className="text-6xl animate-bounce">🦥</span>
                        </div>
                        <h2 className="text-4xl font-bold text-amber-100 tracking-wide drop-shadow-lg">Appchain Simulator By sloths</h2>
                        <div className="mt-4 flex items-center gap-3 text-stone-300 bg-stone-900/40 px-4 py-2 rounded-full backdrop-blur-md border border-stone-700/50">
                            <RefreshCw size={18} className="animate-spin text-amber-500" />
                            <span className="text-sm font-medium tracking-wider">Loading Market Data...</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <header className="mb-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-200 to-orange-500 bg-clip-text text-transparent mb-2">
                            Appchain Value Simulator
                        </h1>
                        <p className="text-stone-400 text-lg">"Don't guess. Calculate."</p>
                    </div>

                    <button
                        onClick={() => fetchMarketData(true)}
                        disabled={loading || initialLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 hover:bg-stone-700 rounded-xl transition-all border border-stone-700 text-sm font-medium text-amber-100/90 hover:text-white hover:border-amber-700/50 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={(loading || initialLoading) ? "animate-spin" : ""} />
                        {(loading || initialLoading) ? "更新中..." : "刷新价格"}
                    </button>
                </header>

                {/* Market Ticker */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    <TickerItem icon="Ξ" color="text-amber-500" label="ETH Price" value={`$${marketData.ethPrice.toLocaleString()}`} />
                    <TickerItem icon="T" color="text-orange-500" label="TIA Price" value={`$${marketData.tiaPrice.toFixed(2)}`} />
                    <TickerItem
                        icon="⛽"
                        label="ETH Base Fee"
                        value={`${formatGwei(marketData.ethBaseFee)} gwei`}
                    />
                    <TickerItem icon="🔥" label="TIA Gas" value={`${marketData.tiaGasPrice} utia`} />
                </div>

                {/* Presets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {Object.values(PRESETS).map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => handlePresetSelect(preset)}
                            className={`p-4 rounded-xl border transition-all ${currentPresetId === preset.id
                                ? 'bg-amber-500/20 border-amber-500 text-amber-100'
                                : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'
                                }`}
                        >
                            <div className="font-bold text-sm">{preset.name}</div>
                            <div className="text-xs opacity-70 mt-1">{preset.description}</div>
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-8">

                    {/* Left: Inputs */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
                            <h2 className="text-xl font-bold mb-6">Configuration</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm text-stone-400 mb-2 block">Daily Txs: {dailyTx.toLocaleString()}</label>
                                    <input
                                        type="range"
                                        min="1000"
                                        max="5000000"
                                        step="1000"
                                        value={dailyTx}
                                        onChange={(e) => setDailyTx(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-stone-400 mb-2 block">Gas Fee: ${gasPrice.toFixed(3)}</label>
                                    <input
                                        type="range"
                                        min="0.001"
                                        max="1"
                                        step="0.001"
                                        value={gasPrice}
                                        onChange={(e) => setGasPrice(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-stone-400 mb-2 block">Data Size: {dataSize >= 1024 ? `${(dataSize / 1024).toFixed(2)} MB` : `${dataSize.toFixed(1)} KB`}/Tx</label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="10240"
                                        step="0.1"
                                        value={dataSize}
                                        onChange={(e) => setDataSize(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                <div className="pt-4 border-t border-stone-800">
                                    <label className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Capture MEV</span>
                                        <input
                                            type="checkbox"
                                            checked={captureMev}
                                            onChange={(e) => setCaptureMev(e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Results */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Results Cards */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-6">
                                <div className="text-xs text-stone-400 uppercase mb-2">L2 Profit</div>
                                <div className="text-2xl font-bold text-stone-300">{formatCurrency(result.l2.profit)}</div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-950/40 to-indigo-950/40 border border-purple-500/30 rounded-xl p-6">
                                <div className="text-xs text-purple-300 uppercase mb-2">Appchain Profit use celestia</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(result.appchain.profit)}</div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-950/40 to-green-950/40 border border-emerald-500/30 rounded-xl p-6">
                                <div className="text-xs text-emerald-400 uppercase mb-2">Profit Uplift</div>
                                <div className="text-2xl font-bold text-emerald-100">{formatCurrency(result.comparison.uplift)}</div>
                                <div className="text-xs text-emerald-400/70 mt-1">+{result.comparison.upliftPercent.toFixed(0)}%</div>
                            </div>
                        </div>

                        {/* Chart - DA Cost Comparison */}
                        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-medium text-stone-400">DA Cost Comparison</h3>

                                {/* 日/年切换按钮 */}
                                <div className="flex bg-stone-800 p-1 rounded-lg border border-stone-700">
                                    <button
                                        onClick={() => setTimeframe('daily')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${timeframe === 'daily' ? 'bg-amber-600 text-white shadow-md' : 'text-stone-400 hover:text-stone-200'
                                            }`}
                                    >
                                        每日
                                    </button>
                                    <button
                                        onClick={() => setTimeframe('annual')}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${timeframe === 'annual' ? 'bg-orange-600 text-white shadow-md' : 'text-stone-400 hover:text-stone-200'
                                            }`}
                                    >
                                        每年
                                    </button>
                                </div>
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={costData} layout="vertical" margin={{ right: 120 }}>
                                        <XAxis type="number" hide domain={[0, maxCost * 1.1]} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: '#a8a29e', fontSize: 12 }} width={70} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #292524', borderRadius: '8px' }}
                                            formatter={(value: number) => [formatCurrency(value), 'Cost']}
                                        />
                                        <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                                            {costData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                            <LabelList dataKey="cost" content={renderCustomLabel} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 w-full flex flex-col md:flex-row items-center justify-center gap-6 py-6 border-t border-stone-800/50">
                    {/* Logo / Name */}
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🦥</span>
                        <span className="text-stone-400 text-sm font-medium tracking-wide">
                            Made by ccboomer_ in <span className="text-amber-500 font-bold">CelestineSloths</span> Community
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-4 bg-stone-700"></div>

                    {/* Social Icons */}
                    <div className="flex items-center gap-4">
                        {/* Twitter (X) Link */}
                        <a
                            href="https://x.com/CelestineSloths"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-500 hover:text-amber-400 transition-colors"
                            aria-label="Twitter"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>

                        {/* Discord Link */}
                        <a
                            href="https://discord.gg/EfSaAtZH"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-500 hover:text-indigo-400 transition-colors"
                            aria-label="Discord"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.46 13.46 0 0 0-.589 1.222 18.375 18.375 0 0 0-5.526 0 13.46 13.46 0 0 0-.59-1.222.074.074 0 0 0-.078-.037 19.782 19.782 0 0 0-4.885 1.515.071.071 0 0 0-.03.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                        </a>
                    </div>
                </footer>

            </div>
        </div>
    );
}

// Ticker组件
function TickerItem({ label, value, icon, color }: any) {
    return (
        <div className="bg-stone-950/50 rounded-2xl p-4 border border-stone-800/50 backdrop-blur-sm hover:bg-stone-900/80 transition-colors flex flex-col gap-1">
            <div className="text-xs text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                {icon && <span className={color}>{icon}</span>}
                {label}
            </div>
            <div className="font-mono text-xl font-bold text-stone-100">{value}</div>
        </div>
    );
}
