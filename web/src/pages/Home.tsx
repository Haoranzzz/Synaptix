import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowUpRight, ArrowDownRight, BrainCircuit, Activity, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { mockMarketOverview, mockAiInsight, mockHotTopics, mockRecentSignals, mockChartData } from '@/lib/mockData';
import { ChartWidget } from '@/components/ui/ChartWidget';
import { motion } from 'framer-motion';

interface MarketOverview {
  asset_code: string;
  asset_name: string;
  last_price: number;
  price_change_pct: number;
}


interface AIInsight {
  title: string;
  summary: string;
  evidence_items: string[];
  risk_items: string[];
}

interface HotTopic {
  title: string;
  summary: string;
  heat_score: number;
}

interface SignalEvent {
  id: number;
  signal_title: string;
  signal_description: string;
  signal_time: string;
  direction_label: string;
}

export function Home() {
  const [marketOverview, setMarketOverview] = useState<MarketOverview[]>([]);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [recentSignals, setRecentSignals] = useState<SignalEvent[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Fetch Market Overview (Top Indices/Assets)
      const { data: markets } = await supabase
        .from('v_asset_overview')
        .select('asset_code, asset_name, last_price, price_change_pct')
        .in('asset_code', ['000001.SH', 'SPX', 'BTCUSDT', 'XAUUSD']) // Adjust codes based on your seed data
        .limit(4);
      
      if (markets && markets.length > 0) {
        setMarketOverview(markets);
      } else {
        setMarketOverview(mockMarketOverview);
      }

      // 2. Fetch latest AI Market Summary
      try {
        const { data: insights, error: insightsError } = await supabase
          .from('ai_insights')
          .select('title, summary, evidence_items, risk_items')
          .eq('insight_type', 'market_summary')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (insightsError) {
          console.error('Supabase AI Insights Error:', insightsError);
        }

        if (insights && insights.length > 0) {
          const insight = insights[0];
          setAiInsight({
            title: insight.title,
            summary: insight.summary,
            evidence_items: Array.isArray(insight.evidence_items) ? insight.evidence_items : [],
            risk_items: Array.isArray(insight.risk_items) ? insight.risk_items : []
          });
        } else {
          setAiInsight(mockAiInsight);
        }
      } catch (e) {
        console.error('Error fetching AI insights:', e);
        setAiInsight(mockAiInsight);
      }

      // 3. Fetch Hot Topics (Using news with highest heat)
      const { data: topics } = await supabase
        .from('news_articles')
        .select('title, summary, heat_score')
        .order('heat_score', { ascending: false })
        .limit(3);
        
      if (topics && topics.length > 0) {
        setHotTopics(topics);
      } else {
        setHotTopics(mockHotTopics);
      }

      // 4. Fetch Recent Signals
      const { data: signals } = await supabase
        .from('signal_events')
        .select('id, signal_title, signal_description, signal_time, direction_label')
        .order('signal_time', { ascending: false })
        .limit(3);
        
      if (signals && signals.length > 0) {
        setRecentSignals(signals);
      } else {
        setRecentSignals(mockRecentSignals);
      }
    };

    fetchDashboardData();
  }, []);

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhCN });
    } catch {
      return dateString;
    }
  };
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Synaptix AI 工作台</h1>
          <p className="text-text-muted">您的直觉式金融洞察引擎</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-muted">上次更新</p>
          <p className="font-mono">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* AI Market Summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 via-surface to-surface border-primary/20 overflow-hidden relative shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-shadow">
          <div className="absolute top-0 right-0 p-1 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider rounded-bl-lg md:hidden">
            AI INSIGHT
          </div>
          <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start">
            <div className="p-3 bg-primary/20 rounded-xl text-primary shrink-0 animate-pulse">
              <BrainCircuit className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="flex-1 space-y-3 md:space-y-4 min-w-0">
              <h2 className="text-lg md:text-xl font-semibold leading-tight">{aiInsight?.title || '今日市场神经简报'}</h2>
              <p className="text-base md:text-lg text-text-main leading-relaxed">
                {aiInsight?.summary || '大盘整体呈现震荡上行趋势，科技板块受多重利好消息刺激领涨。'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs md:text-sm">
                {aiInsight && aiInsight.evidence_items && aiInsight.evidence_items.length > 0 ? aiInsight.evidence_items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-text-muted bg-surface-hover px-2 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-up shrink-0 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                    <span className="truncate max-w-[150px] md:max-w-none">逻辑：{item}</span>
                  </div>
                )) : (
                  <div className="flex items-center gap-2 text-text-muted bg-surface-hover px-2 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-up shrink-0"></span>
                    <span>逻辑：多空情绪平衡</span>
                  </div>
                )}
                {aiInsight && aiInsight.risk_items && aiInsight.risk_items.length > 0 && aiInsight.risk_items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-text-muted bg-surface-hover px-2 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-down shrink-0 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                    <span className="truncate max-w-[150px] md:max-w-none">风险：{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Chart Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-2 md:pb-4 border-b border-border/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg md:text-xl">大盘情绪走势</CardTitle>
              <div className="flex items-center gap-2 text-xs font-medium text-up bg-up/10 px-2 py-1 rounded">
                <Activity className="w-3 h-3" />
                +2.45%
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <ChartWidget data={mockChartData} height={250} />
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Market Overview */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-lg md:text-xl">核心标的概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {marketOverview.map((market, i) => {
                const isUp = market.price_change_pct >= 0;
                return (
                  <motion.div 
                    key={market.asset_code}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-3 md:p-4 rounded-lg bg-surface-hover border border-border transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                  >
                    <div className="text-text-muted text-xs md:text-sm mb-1 md:mb-2 truncate">{market.asset_name}</div>
                    <div className="text-lg md:text-xl font-mono mb-1">{market.last_price?.toLocaleString() || '-'}</div>
                    <div className={cn("flex items-center text-xs md:text-sm font-medium", isUp ? "text-up" : "text-down")}>
                      {isUp ? <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" /> : <ArrowDownRight className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />}
                      {Math.abs(market.price_change_pct || 0).toFixed(2)}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Neural Pulse */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 md:pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-xl">神经脉冲指数</CardTitle>
              <Activity className="w-5 h-5 text-primary animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4 md:py-6">
            <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center group">
              <svg className="w-full h-full -rotate-90 transition-transform duration-700 group-hover:rotate-0" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-hover" />
                <motion.circle 
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 70 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" className="text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400"
                >
                  75
                </motion.span>
                <span className="text-[10px] md:text-xs text-text-muted">偏热</span>
              </div>
            </div>
            <div className="mt-4 md:mt-6 w-full space-y-3">
              <div className="flex justify-between text-xs md:text-sm items-center">
                <span className="text-text-muted">市场情绪分</span>
                <div className="flex-1 mx-3 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ delay: 0.8, duration: 1 }} className="h-full bg-up"></motion.div>
                </div>
                <span className="font-mono text-up">82</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm items-center">
                <span className="text-text-muted">资金动量分</span>
                <div className="flex-1 mx-3 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '68%' }} transition={{ delay: 1, duration: 1 }} className="h-full bg-primary"></motion.div>
                </div>
                <span className="font-mono text-primary">68</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Hot Topics */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-lg md:text-xl">今日热点挖掘</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {hotTopics.map((item, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center justify-between p-2.5 md:p-3 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer border border-transparent hover:border-border group"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="font-medium text-sm md:text-base mb-0.5 md:mb-1 truncate group-hover:text-primary transition-colors">{item.title}</div>
                    <div className="text-xs md:text-sm text-text-muted truncate">{item.summary}</div>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[10px] md:text-xs text-primary bg-primary/10 px-2 py-1 rounded font-medium border border-primary/20">热度 {Math.round(item.heat_score || 0)}</span>
                  </div>
                </motion.div>
              ))}
              {hotTopics.length === 0 && (
                <div className="text-center py-6 text-text-muted text-sm italic">暂无热点数据</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Changes since last visit */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-lg md:text-xl">AI 实时信号预警</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 md:space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-border">
              {recentSignals.map((signal, index) => (
                <motion.li 
                  key={signal.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex gap-4 p-1 relative z-10"
                >
                  <div className={cn(
                    "mt-1.5 w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)] border-2 border-surface bg-surface",
                    signal.direction_label === 'buy' ? 'bg-up border-up' : 
                    signal.direction_label === 'sell' ? 'bg-down border-down' : 'bg-primary border-primary'
                  )} />
                  <div className="bg-surface-hover p-3 rounded-lg flex-1 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                    <p className="text-sm">
                      <span className={cn(
                        "font-bold mr-2 px-1.5 py-0.5 rounded text-[10px]",
                        signal.direction_label === 'buy' ? 'bg-up/10 text-up' : 
                        signal.direction_label === 'sell' ? 'bg-down/10 text-down' : 'bg-primary/10 text-primary'
                      )}>{signal.signal_title}</span>
                      {signal.signal_description}
                    </p>
                    <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                      <History className="w-3 h-3" />
                      {getRelativeTime(signal.signal_time)}
                    </p>
                  </div>
                </motion.li>
              ))}
              {recentSignals.length === 0 && (
                <div className="text-center py-4 text-text-muted bg-surface z-10 relative">暂无预警信号</div>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

