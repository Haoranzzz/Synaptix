import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Zap, TrendingUp, TrendingDown, Activity, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { mockSignals } from '@/lib/mockData';

interface SignalEvent {
  id: number;
  signal_type: string;
  signal_title: string;
  signal_description: string;
  signal_time: string;
  heat_score: number;
  assets: { asset_code: string };
}

export function Signals() {
  const [filter, setFilter] = useState('all');
  const [signals, setSignals] = useState<SignalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('signal_events')
          .select(`
            id, signal_type, signal_title, signal_description, signal_time, heat_score,
            assets (asset_code)
          `)
          .order('signal_time', { ascending: false })
          .limit(20);

        if (filter === 'price') {
          query = query.in('signal_type', ['spike_up', 'spike_down', 'breakout']);
        } else if (filter === 'sentiment') {
          query = query.eq('signal_type', 'sentiment_shift');
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setSignals(data as unknown as SignalEvent[]);
        } else {
          let filteredMock = mockSignals;
          if (filter === 'price') {
            filteredMock = mockSignals.filter((s) => ['spike_up', 'spike_down', 'breakout'].includes(s.signal_type));
          } else if (filter === 'sentiment') {
            filteredMock = mockSignals.filter((s) => s.signal_type === 'sentiment_shift');
          }
          setSignals(filteredMock as unknown as SignalEvent[]);
        }
      } catch (error) {
        console.error('Error fetching signals:', error);
        let filteredMock = mockSignals;
        if (filter === 'price') {
          filteredMock = mockSignals.filter((s) => ['spike_up', 'spike_down', 'breakout'].includes(s.signal_type));
        } else if (filter === 'sentiment') {
          filteredMock = mockSignals.filter((s) => s.signal_type === 'sentiment_shift');
        }
        setSignals(filteredMock as unknown as SignalEvent[]);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, [filter]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'spike_up': return <TrendingUp className="w-5 h-5 text-up" />;
      case 'spike_down': return <TrendingDown className="w-5 h-5 text-down" />;
      case 'sentiment_shift': return <Activity className="w-5 h-5 text-yellow-500" />;
      default: return <Zap className="w-5 h-5 text-primary" />;
    }
  };

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhCN });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 px-0 md:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold">信号中心</h1>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar whitespace-nowrap">
          {['all', 'price', 'sentiment'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors capitalize shrink-0",
                filter === f 
                  ? "bg-primary text-white" 
                  : "bg-surface text-text-muted hover:text-text-main border border-border"
              )}
            >
              {f === 'all' ? '全部信号' : f === 'price' ? '价格异动' : '情绪变化'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {loading ? (
          <div className="text-center py-12 text-text-muted">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-sm">加载中...</span>
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm italic">暂无信号</div>
        ) : signals.map(signal => (
          <Card key={signal.id} className="hover:border-primary/50 transition-all cursor-pointer group border-border/50 shadow-sm">
            <CardContent className="p-4 md:p-6 flex items-start gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-surface-hover rounded-xl shrink-0">
                {getIcon(signal.signal_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base md:text-lg leading-tight">{signal.signal_title}</span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-hover text-[10px] md:text-xs font-mono border border-border">
                      ${signal.assets?.asset_code}
                    </span>
                  </div>
                  <div className="text-[10px] md:text-xs text-text-muted">{getRelativeTime(signal.signal_time)}</div>
                </div>
                <p className="text-text-main/90 text-xs md:text-sm mb-3 leading-relaxed">
                  {signal.signal_description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] md:text-xs text-text-muted font-medium">
                    <Flame className="w-3 h-3 text-red-500" />
                    热度 {Math.round(signal.heat_score || 0)}
                  </div>
                  <button className="text-[10px] md:text-xs text-primary font-bold hover:underline opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    AI 详细分析
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
