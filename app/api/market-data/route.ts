import { NextResponse } from 'next/server';

// 缓存 120 秒 (2分钟)，避免频繁触发这些 API
export const revalidate = 120;

// ============================================
// 核心工具函数：五重价格获取策略
// ============================================
async function getTokenPrices() {
    console.log('📊 Fetching token prices...');

    // 设置一个短超时 (3秒)，防止某个 API 卡死导致整个接口超时
    const fetchOptions = { signal: AbortSignal.timeout(30000) };

    // ====== 方法1: Binance API (最稳定，无需 Key) ======
    try {
        console.log('   🔄 Trying Binance API...');
        const [ethRes, tiaRes] = await Promise.all([
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', fetchOptions),
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=TIAUSDT', fetchOptions)
        ]);

        if (ethRes.ok && tiaRes.ok) {
            const ethData = await ethRes.json();
            const tiaData = await tiaRes.json();
            console.log('   ✅ Binance API success');
            return {
                ethPrice: parseFloat(ethData.price),
                tiaPrice: parseFloat(tiaData.price),
                source: 'Binance'
            };
        }
    } catch (e) {
        console.log(`   ⚠️ Binance failed: ${(e as Error).message}`);
    }

    // ====== 方法2: OKX API ======
    try {
        console.log('   🔄 Trying OKX API...');
        const [ethRes, tiaRes] = await Promise.all([
            fetch('https://www.okx.com/api/v5/market/ticker?instId=ETH-USDT', fetchOptions),
            fetch('https://www.okx.com/api/v5/market/ticker?instId=TIA-USDT', fetchOptions)
        ]);

        if (ethRes.ok && tiaRes.ok) {
            const ethData = await ethRes.json();
            const tiaData = await tiaRes.json();

            if (ethData.data?.[0] && tiaData.data?.[0]) {
                console.log('   ✅ OKX API success');
                return {
                    ethPrice: parseFloat(ethData.data[0].last),
                    tiaPrice: parseFloat(tiaData.data[0].last),
                    source: 'OKX'
                };
            }
        }
    } catch (e) {
        console.log(`   ⚠️ OKX failed: ${(e as Error).message}`);
    }

    // ====== 方法3: Gate.io API ======
    try {
        console.log('   🔄 Trying Gate.io API...');
        const [ethRes, tiaRes] = await Promise.all([
            fetch('https://api.gateio.ws/api/v4/spot/tickers?currency_pair=ETH_USDT', fetchOptions),
            fetch('https://api.gateio.ws/api/v4/spot/tickers?currency_pair=TIA_USDT', fetchOptions)
        ]);

        if (ethRes.ok && tiaRes.ok) {
            const ethData = await ethRes.json();
            const tiaData = await tiaRes.json();

            if (ethData[0] && tiaData[0]) {
                console.log('   ✅ Gate.io API success');
                return {
                    ethPrice: parseFloat(ethData[0].last),
                    tiaPrice: parseFloat(tiaData[0].last),
                    source: 'Gate.io'
                };
            }
        }
    } catch (e) {
        console.log(`   ⚠️ Gate.io failed: ${(e as Error).message}`);
    }

    // ====== 方法4: KuCoin API ======
    try {
        console.log('   🔄 Trying KuCoin API...');
        const [ethRes, tiaRes] = await Promise.all([
            fetch('https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=ETH-USDT', fetchOptions),
            fetch('https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=TIA-USDT', fetchOptions)
        ]);

        if (ethRes.ok && tiaRes.ok) {
            const ethData = await ethRes.json();
            const tiaData = await tiaRes.json();

            if (ethData.data && tiaData.data) {
                console.log('   ✅ KuCoin API success');
                return {
                    ethPrice: parseFloat(ethData.data.price),
                    tiaPrice: parseFloat(tiaData.data.price),
                    source: 'KuCoin'
                };
            }
        }
    } catch (e) {
        console.log(`   ⚠️ KuCoin failed: ${(e as Error).message}`);
    }

    // ====== 方法5: CoinCap (无需Key的备用) ======
    try {
        console.log('   🔄 Trying CoinCap API...');
        const [ethRes, tiaRes] = await Promise.all([
            fetch('https://api.coincap.io/v2/assets/ethereum', fetchOptions),
            fetch('https://api.coincap.io/v2/assets/celestia', fetchOptions)
        ]);

        if (ethRes.ok && tiaRes.ok) {
            const ethData = await ethRes.json();
            const tiaData = await tiaRes.json();
            console.log('   ✅ CoinCap API success');
            return {
                ethPrice: parseFloat(ethData.data.priceUsd),
                tiaPrice: parseFloat(tiaData.data.priceUsd),
                source: 'CoinCap'
            };
        }
    } catch (e) {
        console.log(`   ⚠️ CoinCap failed: ${(e as Error).message}`);
    }

    // ====== 终极兜底 ======
    console.log('   ⚠️ All APIs failed, using fallback prices');
    return {
        ethPrice: 3500,
        tiaPrice: 5.0,
        source: 'Fallback (Final)'
    };
}

// ============================================
// 主处理函数 (GET)
// ============================================
export async function GET() {

    // 1. 获取币价 (执行上面的五重备份逻辑)
    const priceData = await getTokenPrices();

    // 初始化最终数据结构
    let marketData = {
        ...priceData, // 展开 ethPrice, tiaPrice, source
        ethBaseFee: 15000000000, // 默认 15 gwei
        blobMarketPrice: 1,
        tiaGasPrice: 0.004,
        lastUpdated: new Date().toISOString(),
    };

    // 2. 获取 ETH Base Fee (RPC)
    try {
        const ethRes = await fetch('https://eth.llamarpc.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_getBlockByNumber",
                params: ["latest", false]
            }),
            signal: AbortSignal.timeout(3000)
        });

        if (ethRes.ok) {
            const ethJson = await ethRes.json();
            if (ethJson.result) {
                marketData.ethBaseFee = parseInt(ethJson.result.baseFeePerGas, 16);
            }
        }
    } catch (e) {
        console.error("Server: ETH RPC failed", e);
    }

    // 3. 获取 Celestia Gas
    try {
        const celestiaRes = await fetch('https://api-mainnet.celenium.io/v1/gas/price', {
            signal: AbortSignal.timeout(3000)
        });
        if (celestiaRes.ok) {
            const celestiaJson = await celestiaRes.json();
            marketData.tiaGasPrice = parseFloat(celestiaJson.slow || celestiaJson.median || '0.004');
        }
    } catch (e) {
        console.error("Server: Celestia API failed", e);
    }

    // 返回最终数据
    return NextResponse.json(marketData, {
        status: 200,
        headers: {
            // public: 允许任何人缓存
            // max-age=120: 告诉浏览器，120秒内别再请求这个接口了，直接用本地的！
            // s-maxage=120: 告诉 Vercel 的 CDN 服务器缓存 120秒
            // stale-while-revalidate=59: 允许稍微过期一点点的数据先显示，后台偷偷更新
            'Cache-Control': 'public, max-age=120, s-maxage=120, stale-while-revalidate=59',
        },
    });
}
