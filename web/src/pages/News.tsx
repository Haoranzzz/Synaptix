import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { BrainCircuit, Clock, ExternalLink, Bookmark, Share2, RefreshCcw, Zap, ChevronDown, ChevronUp, Sparkles, Filter, Check, Copy } from 'lucide-react';
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
  crawled_at: string;
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
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string | number>>(new Set());

  const toggleExpand = useCallback((id: string | number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleBookmark = (id: string | number) => {
    setBookmarkedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyLink = (url: string, id: string | number) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (title: string, url: string) => {
    if (navigator.share && url) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      handleCopyLink(url, 'share');
    }
  };

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
      .replace(/来源：.*?，发布时间：.*?(?=\n|$)/g, '') // 移除多余的来源回退文本，如果后续有的话
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除 Markdown 加粗
      .replace(/\*(.*?)\*/g, '$1') // 移除 Markdown 斜体
      .replace(/#{1,6}\s?/g, '') // 移除 Markdown 标题
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除 Markdown 链接保留文本
      .replace(/\n{3,}/g, '\n\n') // 将连续 3 个以上换行替换为 2 个
      .trim();
  };

  const fetchNews = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      let query = supabase
        .from('news_articles')
        .select(`
          id, title, summary, ai_summary, published_at, crawled_at, sentiment_label, heat_score, article_url,
          news_sources!inner (source_name),
          news_article_assets (
            assets (asset_code)
          )
        `)
        .order('published_at', { ascending: false })
        .order('crawled_at', { ascending: false })
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
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '时间未知';
      return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
    } catch {
      return '时间未知';
    }
  };

  const formatExactTime = (dateString: string) => {
    if (!dateString) return '未知时间';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '未知时间';
      return d.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return '未知时间';
    }
  };

  const NewsSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-border/40 bg-surface/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-20 h-4 bg-border/40 rounded-full" />
                <div className="w-1 h-1 bg-border rounded-full" />
                <div className="w-24 h-4 bg-border/40 rounded-full" />
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-border/40 rounded-lg" />
                <div className="w-6 h-6 bg-border/40 rounded-lg" />
              </div>
            </div>
            <div className="w-3/4 h-6 md:h-7 bg-border/40 rounded-lg mb-4" />
            <div className="space-y-2 mb-5">
              <div className="w-full h-4 bg-border/30 rounded-lg" />
              <div className="w-full h-4 bg-border/30 rounded-lg" />
              <div className="w-2/3 h-4 bg-border/30 rounded-lg" />
            </div>
            <div className="flex gap-2 pt-4 border-t border-border/20">
              <div className="w-12 h-5 bg-border/40 rounded" />
              <div className="w-12 h-5 bg-border/40 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-4 md:py-8">
      {/* Header & Filter Bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl -mx-4 px-4 pb-4 pt-2 border-b border-border/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-text-main">情报中心</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded uppercase tracking-widest border border-primary/20">
              <span className={cn("w-1 h-1 bg-primary rounded-full", isRefreshing ? "animate-pulse" : "")} />
              Live
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "p-1.5 text-text-muted hover:text-primary transition-all active:scale-90 rounded-lg hover:bg-primary/5",
                isRefreshing && "animate-spin text-primary"
              )}
              title="刷新数据"
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
      <div className="space-y-4 min-h-[50vh]">
        {loading ? (
          <NewsSkeleton />
        ) : newsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-text-muted bg-surface/20 rounded-3xl border border-dashed border-border/40 transition-all duration-500 hover:bg-surface/40">
            <div className="p-4 bg-surface rounded-full mb-4 shadow-sm border border-border/50">
              <Zap className="w-8 h-8 opacity-40 text-primary" />
            </div>
            <p className="text-[15px] font-bold tracking-wide text-text-main mb-1">未发现相关情报</p>
            <p className="text-sm font-medium opacity-60">请尝试切换或清除筛选条件</p>
          </div>
        ) : newsList.map(news => {
          const cleanedSummary = cleanContent(news.summary);
          const cleanedAiSummary = cleanContent(news.ai_summary);
          const hasSummary = cleanedSummary.length > 0;
          const isExpanded = expandedItems.has(news.id);
          const isBookmarked = bookmarkedItems.has(news.id);
          const sourceName = news.news_sources?.source_name || '未知来源';
          const validAssets = news.news_article_assets?.filter(item => item.assets?.asset_code) || [];
          const maxAssets = 3;
          const displayAssets = validAssets.slice(0, maxAssets);
          const remainingAssets = validAssets.length - maxAssets;
          const sentiment = (news.sentiment_label || 'neutral').toLowerCase();
          const needsExpand = cleanedSummary.length > 100 || (news.title?.length || 0) > 40 || cleanedAiSummary.length > 80;
          
          return (
            <Card 
              key={news.id} 
              className={cn(
                "group overflow-hidden transition-all duration-300 border-border/40 bg-surface/40 hover:bg-surface/80 hover:border-border/80 hover:shadow-xl hover:shadow-black/20",
                sentiment === 'positive' ? "border-l-[3px] border-l-up/60 hover:border-l-up" : 
                sentiment === 'negative' ? "border-l-[3px] border-l-down/60 hover:border-l-down" : 
                "border-l-[3px] border-l-primary/30 hover:border-l-primary/60"
              )}
            >
              <CardContent className="p-4 md:p-6">
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] md:text-[12px] font-bold text-text-muted">
                    <div 
                      className="flex items-center gap-1.5 cursor-help hover:text-text-main transition-colors"
                      title={formatExactTime(news.published_at)}
                    >
                      <Clock className="w-3.5 h-3.5 opacity-60" />
                      {getRelativeTime(news.published_at)}
                    </div>
                    <div className="w-1 h-1 bg-border rounded-full hidden sm:block" />
                    <div 
                      className="flex items-center gap-1.5 cursor-default bg-surface/50 px-2 py-0.5 rounded-md border border-border/40 hover:bg-surface hover:border-border/80 transition-colors"
                      title={`来源: ${sourceName}`}
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        sourceName === 'TrendRadar' ? "bg-primary animate-pulse" : "bg-text-muted/50"
                      )} />
                      <span className={cn(
                        "tracking-wide uppercase truncate max-w-[120px]",
                        sourceName === 'TrendRadar' ? "text-primary" : "text-text-muted"
                      )}>
                        {sourceName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button 
                      onClick={() => handleShare(news.title, news.article_url)}
                      className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="分享"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => toggleBookmark(news.id)}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        isBookmarked ? "text-primary bg-primary/10" : "text-text-muted hover:text-primary hover:bg-primary/10"
                      )}
                      title={isBookmarked ? "取消收藏" : "收藏"}
                    >
                      <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                    </button>
                    {news.article_url && (
                      <button 
                        onClick={() => handleCopyLink(news.article_url, news.id)}
                        className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="复制链接"
                      >
                        {copiedId === news.id ? <Check className="w-4 h-4 text-up" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className={cn(
                  "text-lg md:text-xl font-bold mb-3 text-text-main group-hover:text-primary transition-colors leading-snug tracking-tight break-words",
                  !isExpanded && "line-clamp-2"
                )}>
                  {news.title || '无标题'}
                </h2>
                
                {/* Summary */}
                {hasSummary && (
                  <div className={cn(
                    "text-[14px] md:text-[15px] text-text-muted leading-relaxed whitespace-pre-wrap break-words mb-5",
                    !isExpanded && "line-clamp-3"
                  )}>
                    {cleanedSummary}
                  </div>
                )}

                {/* AI Insight Section */}
                {cleanedAiSummary && (
                  <div className="mb-5 p-4 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden group/ai transition-all hover:bg-primary/10 hover:border-primary/20">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/ai:opacity-20 transition-opacity transform group-hover/ai:scale-110 group-hover/ai:rotate-12 duration-500">
                      <Sparkles className="w-16 h-16 text-primary" />
                    </div>
                    <div className="flex gap-3 relative z-10">
                      <div className="shrink-0 mt-0.5">
                        <div className="p-1.5 bg-primary/10 rounded-lg shadow-sm border border-primary/20">
                          <BrainCircuit className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">AI 深度分析</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                        </div>
                        <p className={cn(
                          "text-[13px] md:text-[14px] text-text-main leading-relaxed font-medium break-words",
                          !isExpanded && "line-clamp-3"
                        )}>
                          {cleanedAiSummary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expand Toggle */}
                {needsExpand && (
                  <div className="flex justify-center mb-5">
                    <button 
                      onClick={() => toggleExpand(news.id)}
                      className="flex items-center gap-1.5 text-[12px] text-text-muted font-bold hover:text-primary transition-all bg-surface hover:bg-primary/5 px-4 py-1.5 rounded-full border border-border/50 hover:border-primary/30 shadow-sm"
                    >
                      {isExpanded ? (
                        <>收起全文 <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>展开全文 <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                )}

                {/* Card Footer */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/30">
                  <div className="flex flex-wrap gap-2 items-center">
                    {displayAssets.map((item, idx) => (
                      <span 
                        key={item.assets.asset_code || idx} 
                        className="px-2 py-0.5 rounded-md bg-surface-hover text-[10px] font-black font-mono text-text-muted border border-border/50 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer shadow-sm"
                        title={`相关资产: ${item.assets.asset_code}`}
                      >
                        ${item.assets.asset_code}
                      </span>
                    ))}
                    {remainingAssets > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-surface-hover text-[10px] font-black font-mono text-text-muted border border-border/50 shadow-sm" title={`还有 ${remainingAssets} 个相关资产`}>
                        +{remainingAssets}
                      </span>
                    )}
                    
                    <div className={cn(
                      "flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm transition-colors",
                      sentiment === 'positive' ? "bg-up/10 text-up border-up/20" : 
                      sentiment === 'negative' ? "bg-down/10 text-down border-down/20" : 
                      "bg-surface-hover text-text-muted border-border/50"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shadow-sm",
                        sentiment === 'positive' ? "bg-up shadow-up/50" : 
                        sentiment === 'negative' ? "bg-down shadow-down/50" : "bg-text-muted"
                      )} />
                      {sentiment === 'positive' ? '利多' : sentiment === 'negative' ? '利空' : '中性'}
                    </div>

                    {(news.heat_score ?? 0) > 0 && (
                      <div 
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm",
                          news.heat_score > 80 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                        )}
                        title={`热度评分: ${news.heat_score}`}
                      >
                        <Zap className="w-3 h-3 fill-current" /> 
                        {news.heat_score > 80 ? '高热度' : '热度'}
                      </div>
                    )}
                  </div>
                  
                  {news.article_url && (
                    <a 
                      href={news.article_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-primary text-[12px] text-text-muted hover:text-white border border-border/50 hover:border-primary transition-all font-bold group/link shadow-sm"
                      title="在新标签页中打开原文"
                    >
                      阅读原文
                      <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover/link:opacity-100 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
