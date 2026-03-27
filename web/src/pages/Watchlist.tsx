import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Star, ArrowUpRight, ArrowDownRight, Trash2, BrainCircuit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { mockWatchlist } from '@/lib/mockData';

interface WatchlistItem {
  watchlist_item_id: number;
  asset_id: number;
  asset_code: string;
  asset_name: string;
  last_price: number;
  price_change: number;
  price_change_pct: number;
  heat_score: number;
  ai_signal_label: string;
}

export function Watchlist() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) {
        setItems(mockWatchlist);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data: prices, error: pricesError } = await supabase
          .from('v_watchlist_items')
          .select('*')
          .eq('user_id', user.id);

        if (pricesError) throw pricesError;

        if (prices) {
          setItems(prices as unknown as WatchlistItem[]);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        setItems(mockWatchlist);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user]);

  const removeFromWatchlist = async (itemId: number) => {
    try {
      const { error } = await supabase
        .from('user_watchlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      setItems(items.filter(item => item.watchlist_item_id !== itemId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert('移除失败');
    }
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">自选中心</h1>
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center text-center text-text-muted">
            <p className="mb-4">请先登录以查看您的自选列表</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">自选中心</h1>
        <Link to="/quotes" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
          添加资产
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-text-muted">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-sm">加载中...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center text-text-muted">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
                <Star className="w-6 h-6 md:w-8 md:h-8 text-yellow-500/50" />
              </div>
              <p className="text-base md:text-lg font-medium text-text-main mb-2">您的自选列表为空</p>
              <p className="text-xs md:text-sm max-w-md leading-relaxed">
                在行情或资讯页面点击星号，将您关注的资产加入自选。Synaptix AI 将为您持续监控这些资产的异动、资讯和情绪变化。
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                <thead className="bg-surface-hover/50 text-text-muted sticky top-0 z-10">
                  <tr>
                    <th className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm">资产</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm">最新价</th>
                    <th className="hidden md:table-cell px-6 py-4 font-medium text-sm">涨跌额</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm">涨跌幅</th>
                    <th className="hidden md:table-cell px-6 py-4 font-medium text-sm">热度</th>
                    <th className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm">AI 标签</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {items.map((item) => {
                    const isUp = item.price_change >= 0;
                    return (
                      <tr key={item.watchlist_item_id} className="hover:bg-surface-hover/30 transition-colors group">
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
                          <div className="flex items-center justify-end gap-0.5 md:gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 md:p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all active:scale-95" title="AI解读">
                              <BrainCircuit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            <button 
                              className="p-1.5 md:p-2 text-text-muted hover:text-down hover:bg-down/10 rounded-full transition-all active:scale-95" 
                              title="取消自选"
                              onClick={() => removeFromWatchlist(item.watchlist_item_id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
