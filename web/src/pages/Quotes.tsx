import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Star, BrainCircuit, Activity, RefreshCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { mockQuotes } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { zhituApi } from '@/lib/zhitu';

interface AssetOverview {
  id: string | number;
  market_name: string;
  asset_code: string;
  asset_name: string;
  last_price: number;
  price_change: number;
  price_change_pct: number;
  volume: number;
  heat_score: number;
  ai_signal_label: string;
}

const TABS = ['全部', 'A股', '美股', '加密货币', '外汇'];

export function Quotes() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [assets, setAssets] = useState<AssetOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuthStore();

  const fetchAssets = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (activeTab === 'A股') {
        // Fetch real data from Zhitu API for A-shares
        const stocks = await zhituApi.getStockList();
        // Zhitu API /hs/list/all returns basic list, we need market data
        // For demonstration, we'll take first 20 and get their realtime quotes
        const topStocks = stocks.slice(0, 20);
        const quotes = await zhituApi.getRealtimeQuotes(topStocks.map(s => s.dm));
        
        const mappedAssets: AssetOverview[] = quotes.map(q => ({
          id: q.dm,
          market_name: 'A股',
          asset_code: q.dm,
          asset_name: q.mc,
          last_price: q.p,
          price_change: q.zde,
          price_change_pct: q.zdf,
          volume: q.ze, // 成交额
          heat_score: Math.floor(Math.random() * 30) + 70, // 智兔接口若无热度，暂用随机数模拟高热度
          ai_signal_label: q.zdf > 2 ? 'bullish' : q.zdf < -2 ? 'bearish' : 'neutral'
        }));
        setAssets(mappedAssets);
        return;
      }

      // Default Supabase query for other tabs
      let query = supabase.from('v_asset_overview').select('*');
      
      if (activeTab !== '全部') {
        const marketMap: Record<string, string> = {
          '美股': 'stock',
          '加密货币': 'crypto',
          '外汇': 'forex'
        };
        query = query.eq('market_code', marketMap[activeTab]);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setAssets(data);
      } else {
        // Use mock data if database is empty
        let filteredMock = mockQuotes;
        if (activeTab !== '全部') {
          filteredMock = mockQuotes.filter((q) => q.market_name === activeTab);
        }
        setAssets(filteredMock as unknown as AssetOverview[]);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      let filteredMock = mockQuotes;
      if (activeTab !== '全部') {
        filteredMock = mockQuotes.filter((q) => q.market_name === activeTab);
      }
      setAssets(filteredMock as unknown as AssetOverview[]);
    } finally {
      if (showLoading) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [activeTab]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAssets(false);
  };

  const addToWatchlist = async (assetId: string | number) => {
    if (!user) {
      alert("请先登录");
      return;
    }

    try {
      // For Zhitu A-shares, we might need to handle the asset mapping if it's not in our DB yet
      // For now, assume we're adding by ID
      
      const { data: watchlists, error: watchlistError } = await supabase
        .from('user_watchlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (watchlistError) throw watchlistError;

      let watchlistId;
      if (!watchlists) {
        // Create a default watchlist if none exists
        const { data: newWatchlist, error: createError } = await supabase
          .from('user_watchlists')
          .insert({ user_id: user.id, name: '我的自选', is_default: true })
          .select('id')
          .single();
        if (createError) throw createError;
        watchlistId = newWatchlist.id;
      } else {
        watchlistId = watchlists.id;
      }

      // Add item to watchlist
      // If assetId is string (Zhitu), we need to ensure it's mapped in assets table
      // This is a complex part of real integration. For now, let's use it as is
      // and assume the DB can handle the asset_id (or we need to find/create the asset first)
      
      let finalAssetId: number;
      
      if (typeof assetId === 'string') {
        // Try to find the asset in our assets table by code
        const { data: existingAsset } = await supabase
          .from('assets')
          .select('id')
          .eq('asset_code', assetId)
          .maybeSingle();
          
        if (existingAsset) {
          finalAssetId = existingAsset.id;
        } else {
          // If not exists, we might need to create it. For now, just alert
          alert('该资产暂不支持添加到数据库自选（需要先在资产表同步）');
          return;
        }
      } else {
        finalAssetId = assetId;
      }

      const { error: insertError } = await supabase
        .from('user_watchlist_items')
        .insert({
          watchlist_id: watchlistId,
          asset_id: finalAssetId
        });

      if (insertError) {
        if (insertError.code === '23505') {
          alert('已经在自选中了');
        } else {
          throw insertError;
        }
      } else {
        alert('添加成功');
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      alert('添加失败');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">行情中心</h1>
          <p className="text-text-muted">全市场实时行情与 AI 信号预警</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(
            "p-2.5 bg-surface border border-border rounded-xl text-text-muted hover:text-primary hover:border-primary/50 transition-all active:scale-95",
            isRefreshing && "animate-spin text-primary border-primary/50"
          )}
          title="刷新数据"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab 
                ? "bg-primary text-white" 
                : "bg-surface text-text-muted hover:text-text-main hover:bg-surface-hover"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {assets.map((asset, index) => {
          const isUp = asset.price_change_pct >= 0;
          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
            >
              <Card className="hover:border-primary/50 transition-colors group cursor-pointer relative overflow-hidden">
                <div className={cn(
                  "absolute top-0 right-0 w-16 h-16 blur-2xl rounded-full -mr-8 -mt-8 opacity-20 group-hover:opacity-50 transition-opacity",
                  isUp ? "bg-up" : "bg-down"
                )}></div>
                <CardContent className="p-4 md:p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xs text-text-muted mb-1 flex items-center gap-2">
                        {asset.market_name}
                        {asset.ai_signal_label === 'buy' && <span className="text-[10px] text-up bg-up/10 px-1 rounded flex items-center"><Activity className="w-3 h-3 mr-0.5"/>看多</span>}
                        {asset.ai_signal_label === 'sell' && <span className="text-[10px] text-down bg-down/10 px-1 rounded flex items-center"><Activity className="w-3 h-3 mr-0.5"/>看空</span>}
                      </div>
                      <div className="font-bold text-lg">{asset.asset_name}</div>
                      <div className="text-sm text-text-muted font-mono">{asset.asset_code}</div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToWatchlist(asset.id); }}
                      className="p-2 text-text-muted hover:text-warning hover:bg-warning/10 rounded-full transition-colors"
                      title="添加到自选"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-mono font-bold mb-1">
                        {asset.last_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className={cn("flex items-center text-sm font-medium", isUp ? "text-up" : "text-down")}>
                        {isUp ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                        {Math.abs(asset.price_change_pct).toFixed(2)}%
                      </div>
                    </div>
                    {asset.heat_score && (
                      <div className="text-right">
                        <div className="text-xs text-text-muted mb-1">AI 热度</div>
                        <div className="text-sm font-bold text-primary flex items-center justify-end">
                          <BrainCircuit className="w-3 h-3 mr-1" />
                          {asset.heat_score}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      
      {!loading && assets.length === 0 && (
        <div className="text-center py-20 text-text-muted">
          没有找到相关的行情数据
        </div>
      )}
    </motion.div>
  );
}
