import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Star, BrainCircuit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { mockQuotes } from '@/lib/mockData';

interface AssetOverview {
  id: number;
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

const TABS = ['全部', '美股', '加密货币', 'A股', '外汇'];

export function Quotes() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [assets, setAssets] = useState<AssetOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        let query = supabase.from('v_asset_overview').select('*');
        
        if (activeTab !== '全部') {
          const marketMap: Record<string, string> = {
            '美股': 'stock', // assuming stock means US stock here for simplicity, can map better based on actual DB
            '加密货币': 'crypto',
            'A股': 'stock', // You might need a more specific way to filter A股 vs 美股
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
        setLoading(false);
      }
    };

    fetchAssets();
  }, [activeTab]);

  const addToWatchlist = async (assetId: number) => {
    if (!user) {
      alert("请先登录");
      return;
    }

    try {
      // Get user's default watchlist
      const { data: watchlists, error: watchlistError } = await supabase
        .from('user_watchlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (watchlistError) throw watchlistError;

      // Add item to watchlist
      const { error: insertError } = await supabase
        .from('user_watchlist_items')
        .insert({
          watchlist_id: watchlists.id,
          asset_id: assetId
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

  const formatVolume = (vol: number) => {
    if (!vol) return '0';
    if (vol >= 1000000000) return (vol / 1000000000).toFixed(2) + 'B';
    if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
    if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
    return vol.toString();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold">实时行情</h1>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto custom-scrollbar no-scrollbar whitespace-nowrap">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0",
                activeTab === tab 
                  ? "bg-primary text-white" 
                  : "bg-surface text-text-muted hover:text-text-main border border-border"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
              <thead className="bg-surface-hover/50 text-text-muted sticky top-0 z-10">
                <tr>
                  <th className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm">资产</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm">最新价</th>
                  <th className="hidden md:table-cell px-6 py-4 font-medium text-sm">涨跌额</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm">涨跌幅</th>
                  <th className="hidden lg:table-cell px-6 py-4 font-medium text-sm">成交量</th>
                  <th className="hidden md:table-cell px-6 py-4 font-medium text-sm">热度</th>
                  <th className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm">AI 信号</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs md:text-sm">加载中...</span>
                      </div>
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-text-muted text-xs md:text-sm italic">暂无数据</td>
                  </tr>
                ) : assets.map((item) => {
                  const isUp = (item.price_change || 0) >= 0;
                  return (
                    <tr key={item.id} className="hover:bg-surface-hover/30 transition-colors group">
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="font-semibold text-text-main text-sm md:text-base leading-tight">{item.asset_code}</div>
                        <div className="text-[10px] md:text-xs text-text-muted truncate max-w-[80px] md:max-w-none">{item.asset_name}</div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 font-mono font-medium text-xs md:text-sm">
                        {item.last_price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '-'}
                      </td>
                      <td className={cn("hidden md:table-cell px-6 py-4 font-mono text-sm", isUp ? "text-up" : "text-down")}>
                        {isUp ? '+' : ''}{item.price_change?.toFixed(2) || '-'}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className={cn(
                          "inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded font-mono text-[10px] md:text-xs font-bold",
                          isUp ? "bg-up/10 text-up" : "bg-down/10 text-down"
                        )}>
                          {isUp ? <ArrowUpRight className="w-2.5 h-2.5 md:w-3 h-3" /> : <ArrowDownRight className="w-2.5 h-2.5 md:w-3 h-3" />}
                          {Math.abs(item.price_change_pct || 0).toFixed(2)}%
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 font-mono text-text-muted text-sm">{formatVolume(item.volume)}</td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 md:w-16 h-1 bg-surface-hover rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${Math.min(item.heat_score || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] md:text-xs text-text-muted font-mono">{Math.round(item.heat_score || 0)}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4">
                        <span className={cn(
                          "px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-medium",
                          item.ai_signal_label === 'bullish' && "bg-up/20 text-up",
                          item.ai_signal_label === 'bearish' && "bg-down/20 text-down",
                          item.ai_signal_label === 'neutral' && "bg-surface-hover text-text-muted"
                        )}>
                          {item.ai_signal_label === 'bullish' ? '看涨' : item.ai_signal_label === 'bearish' ? '看跌' : '震荡'}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                        <div className="flex items-center justify-end gap-0.5 md:gap-1">
                          <button className="p-1.5 md:p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all active:scale-95" title="AI解读">
                            <BrainCircuit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                          <button 
                            className="p-1.5 md:p-2 text-text-muted hover:text-yellow-500 hover:bg-yellow-500/10 rounded-full transition-all active:scale-95" 
                            title="加入自选"
                            onClick={() => addToWatchlist(item.id)}
                          >
                            <Star className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
