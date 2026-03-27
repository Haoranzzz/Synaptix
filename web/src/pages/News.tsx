import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { BrainCircuit, Clock, ExternalLink, Bookmark, Share2, RefreshCcw, Zap, ChevronDown, ChevronUp, Sparkles, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { mockNews } from '@/lib/mockData';

interface NewsArticle {
  id: string | number;
  title: string;
  summary: string;
  ai_summary: string;
  published_at: string;
  sentiment_label: string;
  heat_score: number;
  article_url: string;
  news_sources: { source_name: string };
  news_article_assets: { assets: { asset_code: string } }[];
}

export function News() {
  const [filter, setFilter] = useState('all');
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string | number>>(new Set());

  const toggleExpand = useCallback((id: string | number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const cleanContent = (content: string) => {
    if (!content) return '';
    return content
      .replace(/\*\*\[第 \d+\/\d+ 批次\]\*\*/g, '')
      .replace(/📊 \*\*热点词汇统计\*\*.*?\n/g, '')
      .replace(/📰 \*\*RSS 订阅统计\*\*.*?\n/g, '')
      .replace(/📈 \[\d+\/\d+\] \*\*.*?\*\* : \*\*\d+\*\* 条/g, '')
      .replace(/📌 \[\d+\/\d+\] \*\*.*?\*\* : \d+ 条/g, '')
      .replace(/⚠️ AI 分析失败:.*?\n/g, '')
      .replace(/> 更新时间：.*?\n/g, '')
      .replace(/【\d+】/g, '') // 移除可能的引索
      .replace(/原文链接：.*?\n/g, '') // 移除原文链接行（已有按钮）
      .trim();
  };

  const fetchNews = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      let query = supabase
        .from('news_articles')
        .select(`
          id, title, summary, ai_summary, published_at, sentiment_label, heat_score, article_url,
          news_sources!inner (source_name),
          news_article_assets (
            assets (asset_code)
          )
        `)
        .order('published_at', { ascending: false })
        .limit(30);

      if (filter === 'trendradar') {
        query = query.eq('news_sources.source_name', 'TrendRadar');
      } else if (filter !== 'all') {
        query = query.eq('sentiment_label', filter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setNewsList(data as unknown as NewsArticle[]);
      } else {
        let filteredMock = mockNews;
        if (filter !== 'all') {
          filteredMock = mockNews.filter((n) => n.sentiment_label === filter);
        }
        setNewsList(filteredMock as unknown as NewsArticle[]);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      let filteredMock = mockNews;
      if (filter !== 'all') {
        filteredMock = mockNews.filter((n) => n.sentiment_label === filter);
      }
      setNewsList(filteredMock as unknown as NewsArticle[]);
    } finally {
      if (showLoading) setLoading(false);
      setIsRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNews(false);
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
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-4 md:py-8">
      {/* Header & Filter Bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl -mx-4 px-4 pb-4 pt-2 border-b border-border/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-text-main">情报中心</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded uppercase tracking-widest border border-primary/20">
              <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
              Live
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "p-1.5 text-text-muted hover:text-primary transition-all active:scale-90 rounded-lg hover:bg-primary/5",
                isRefreshing && "animate-spin text-primary"
              )}
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-surface/80 border border-border/40 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'all', label: '全部', icon: Filter },
              { id: 'trendradar', label: 'TrendRadar', icon: Zap },
              { id: 'positive', label: '利多', color: 'text-up' },
              { id: 'negative', label: '利空', color: 'text-down' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all shrink-0 flex items-center gap-1.5",
                  filter === f.id 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-text-muted hover:text-text-main hover:bg-white/5"
                )}
              >
                {f.icon && <f.icon className={cn("w-3.5 h-3.5", filter === f.id ? "text-white" : "text-primary")} />}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-text-muted bg-surface/20 rounded-3xl border border-dashed border-border/40">
            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold tracking-widest uppercase opacity-60">正在同步全球情报...</p>
          </div>
        ) : newsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-text-muted bg-surface/20 rounded-3xl border border-dashed border-border/40">
            <Zap className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-sm font-medium italic opacity-60">暂无相关情报，请尝试切换筛选条件</p>
          </div>
        ) : newsList.map(news => (
          <Card 
            key={news.id} 
            className={cn(
              "group overflow-hidden transition-all border-border/40 bg-surface/40 hover:bg-surface/60 hover:border-border/80 hover:shadow-xl hover:shadow-black/20",
              news.sentiment_label === 'positive' ? "border-l-2 border-l-up/50" : 
              news.sentiment_label === 'negative' ? "border-l-2 border-l-down/50" : 
              "border-l-2 border-l-primary/20"
            )}
          >
            <CardContent className="p-4 md:p-6">
              {/* Card Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3 text-[11px] md:text-[12px] font-bold text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 opacity-60" />
                    {getRelativeTime(news.published_at)}
                  </div>
                  <div className="w-1 h-1 bg-border rounded-full" />
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      news.news_sources?.source_name === 'TrendRadar' ? "bg-primary animate-pulse" : "bg-text-muted/30"
                    )} />
                    <span className={cn(
                      "tracking-wide uppercase",
                      news.news_sources?.source_name === 'TrendRadar' ? "text-primary" : "text-text-muted"
                    )}>
                      {news.news_sources?.source_name || '未知来源'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-lg md:text-xl font-bold mb-3 text-text-main group-hover:text-primary transition-colors leading-snug tracking-tight">
                {news.title}
              </h2>
              
              {/* Summary */}
              <div className="relative mb-5">
                <p className={cn(
                  "text-[14px] md:text-[15px] text-text-muted leading-relaxed whitespace-pre-wrap",
                  !expandedItems.has(news.id) && "line-clamp-3 overflow-hidden"
                )}>
                  {cleanContent(news.summary)}
                </p>
                
                {news.summary && news.summary.length > 150 && (
                  <button 
                    onClick={() => toggleExpand(news.id)}
                    className="mt-2 flex items-center gap-1 text-[12px] text-primary font-bold hover:underline transition-all"
                  >
                    {expandedItems.has(news.id) ? (
                      <>收起内容 <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>阅读全文 <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                )}
              </div>

              {/* AI Insight Section */}
              {news.ai_summary && (
                <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden group/ai">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/ai:opacity-20 transition-opacity">
                    <Sparkles className="w-12 h-12 text-primary" />
                  </div>
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <div className="p-1.5 bg-primary/10 rounded-lg">
                        <BrainCircuit className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">AI 深度分析</span>
                        <div className="h-px flex-1 bg-primary/10" />
                      </div>
                      <p className="text-[13px] md:text-[14px] text-text-main leading-relaxed font-medium">
                        {news.ai_summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Footer */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/20">
                <div className="flex flex-wrap gap-2">
                  {news.news_article_assets?.map((item, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-surface-hover text-[10px] font-black font-mono text-text-muted border border-border/40 hover:border-primary/40 hover:text-primary transition-all cursor-pointer">
                      ${item.assets?.asset_code}
                    </span>
                  ))}
                  
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shadow-sm",
                    news.sentiment_label === 'positive' ? "bg-up/10 text-up border-up/20" : 
                    news.sentiment_label === 'negative' ? "bg-down/10 text-down border-down/20" : 
                    "bg-surface-hover text-text-muted border-border"
                  )}>
                    <span className={cn(
                      "w-1 h-1 rounded-full",
                      news.sentiment_label === 'positive' ? "bg-up" : 
                      news.sentiment_label === 'negative' ? "bg-down" : "bg-text-muted"
                    )} />
                    {news.sentiment_label === 'positive' ? '利多' : news.sentiment_label === 'negative' ? '利空' : '中性'}
                  </div>

                  {news.heat_score > 80 && (
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider border border-red-500/20">
                      <Zap className="w-3 h-3 fill-current" /> 热度
                    </div>
                  )}
                </div>
                
                {news.article_url && (
                  <a 
                    href={news.article_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-[12px] text-primary hover:bg-primary hover:text-white transition-all font-bold group/link"
                  >
                    原文
                    <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
