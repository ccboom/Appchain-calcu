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
        ethBaseFee: 15000000000, // 默认 15 gwei (wei 单位)
        blobMarketPrice: 1000000000, // 默认 1 gwei (wei 单位)
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

    // 2.5 获取 Blob Base Fee (实时价格)
    try {
        console.log('📊 Fetching blob base fee...');

        // 方法1: 尝试直接获取 blobBaseFee (某些 RPC 支持)
        const blobFeeRes = await fetch('https://eth.llamarpc.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                method: "eth_blobBaseFee",
                params: []
            }),
            signal: AbortSignal.timeout(3000)
        });

        if (blobFeeRes.ok) {
            const blobJson = await blobFeeRes.json();
            console.log(blobJson);
            if (blobJson.result) {
                const blobBaseFeeWei = parseInt(blobJson.result, 16);
                marketData.blobMarketPrice = blobBaseFeeWei; // 保持 wei 单位
                console.log(`   ✅ Blob base fee: ${blobBaseFeeWei} wei (${(blobBaseFeeWei / 1e9).toFixed(2)} gwei)`);
            }
            else {
                console.log(`   ⚠️ Blob base fee not found`);
            }
        } else {
            // 方法2: 从区块头计算 blob base fee (fallback)
            // 通过 excessBlobGas 计算（EIP-4844 公式）
            const blockRes = await fetch('https://eth.llamarpc.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 3,
                    method: "eth_getBlockByNumber",
                    params: ["latest", false]
                }),
                signal: AbortSignal.timeout(3000)
            });

            if (blockRes.ok) {
                const blockJson = await blockRes.json();
                if (blockJson.result?.excessBlobGas) {
                    console.log(blockJson.result);
                    // EIP-4844 blob base fee 计算公式:
                    // blob_base_fee = MIN_BLOB_BASE_FEE * e^(excess_blob_gas / BLOB_BASE_FEE_UPDATE_FRACTION)
                    const MIN_BLOB_BASE_FEE = 1; // wei
                    const BLOB_BASE_FEE_UPDATE_FRACTION = 3338477;
                    const excessBlobGas = parseInt(blockJson.result.excessBlobGas, 16);

                    const blobBaseFeeWei = Math.floor(
                        MIN_BLOB_BASE_FEE * Math.exp(excessBlobGas / BLOB_BASE_FEE_UPDATE_FRACTION)
                    );
                    marketData.blobMarketPrice = blobBaseFeeWei; // 保持 wei 单位
                    console.log(`   ✅ Blob base fee (calculated): ${blobBaseFeeWei} wei (${(blobBaseFeeWei / 1e9).toFixed(2)} gwei)`);
                }
            }
        }
    } catch (e) {
        console.error("Server: Blob fee fetch failed, using default", e);
        // 保持默认值 1 gwei (已在初始化中设置)
    }

    // 3. 获取 Celestia Gas
    try {
        const celestiaRes = await fetch('https://api-mainnet.celenium.io/v1/gas/price', {
            signal: AbortSignal.timeout(3000)
        });
        if (celestiaRes.ok) {
            const celestiaJson = await celestiaRes.json();
            const parsedGasPrice = parseFloat(celestiaJson.slow || celestiaJson.median || '0.004');
            // 防止 NaN，确保使用有效默认值
            marketData.tiaGasPrice = isNaN(parsedGasPrice) ? 0.004 : parsedGasPrice;
        }
    } catch (e) {
        console.error("Server: Celestia API failed", e);
        // 发生异常时也要确保有默认值
        marketData.tiaGasPrice = 0.004;
    }


    console.log(marketData);

    // 返回最终数据
    return NextResponse.json(marketData, {
        status: 200,
        headers: {
            // public: 允许任何人缓存
            // max-age=60: 告诉浏览器，60秒内别再请求这个接口了，直接用本地的！
            // s-maxage=60: 告诉 Vercel 的 CDN 服务器缓存 60秒
            // stale-while-revalidate=59: 允许稍微过期一点点的数据先显示，后台偷偷更新
            'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=59',
        },
    });
}
