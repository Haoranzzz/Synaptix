import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { BrainCircuit, Clock, ExternalLink, Bookmark, Share2, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { mockNews } from '@/lib/mockData';
import { zhituApi } from '@/lib/zhitu';
import type { ZhituNews } from '@/lib/zhitu';

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

  const fetchNews = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // 1. Try fetching from Zhitu API first
      const zhituNews = await zhituApi.getNews(20);
      
      if (zhituNews && zhituNews.length > 0) {
        const mappedNews: NewsArticle[] = zhituNews.map((n: ZhituNews) => ({
          id: n.id || Math.random(),
          title: n.title,
          summary: n.content || n.digest || '',
          ai_summary: '',
          published_at: n.time || new Date().toISOString(),
          sentiment_label: n.sentiment || 'neutral',
          heat_score: n.heat || 50,
          article_url: n.url || '',
          news_sources: { source_name: n.source || '智兔财经' },
          news_article_assets: (n.stocks || []).map((s: string) => ({
            assets: { asset_code: s }
          }))
        }));

        let filtered = mappedNews;
        if (filter !== 'all') {
          filtered = mappedNews.filter(n => n.sentiment_label === filter);
        }
        setNewsList(filtered);
        return;
      }

      // 2. Fallback to Supabase
      let query = supabase
        .from('news_articles')
        .select(`
          id, title, summary, ai_summary, published_at, sentiment_label, heat_score, article_url,
          news_sources (source_name),
          news_article_assets (
            assets (asset_code)
          )
        `)
        .order('published_at', { ascending: false })
        .limit(20);

      if (filter !== 'all') {
        query = query.eq('sentiment_label', filter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setNewsList(data as unknown as NewsArticle[]);
      } else {
        // 3. Fallback to mock data
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
  };

  useEffect(() => {
    fetchNews();
  }, [filter]);

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
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 px-0 md:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center sticky top-16 bg-background/80 backdrop-blur-md py-4 z-10 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">情报中心</h1>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "p-1.5 text-text-muted hover:text-primary transition-all active:scale-95",
              isRefreshing && "animate-spin text-primary"
            )}
            title="刷新资讯"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar whitespace-nowrap">
          {['all', 'positive', 'negative'].map(f => (
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
              {f === 'all' ? '全部' : f === 'positive' ? '利多' : '利空'}
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
        ) : newsList.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm italic">暂无资讯</div>
        ) : newsList.map(news => (
          <Card key={news.id} className="overflow-hidden hover:border-primary/50 transition-all group border-border/50 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getRelativeTime(news.published_at)}
                  </span>
                  <span className="hidden xs:inline">•</span>
                  <span className="truncate max-w-[100px] md:max-w-none">{news.news_sources?.source_name || '未知来源'}</span>
                  {news.heat_score > 80 && (
                    <>
                      <span className="hidden xs:inline">•</span>
                      <span className="text-red-400 flex items-center gap-1 font-medium">
                        🔥 热度爆发
                      </span>
                    </>
                  )}
                </div>
                <div className="flex gap-1 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 hover:bg-surface-hover rounded-full text-text-muted hover:text-text-main transition-colors">
                    <Bookmark className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                  <button className="p-1.5 hover:bg-surface-hover rounded-full text-text-muted hover:text-text-main transition-colors">
                    <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>

              <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3 group-hover:text-primary transition-colors cursor-pointer leading-snug">
                {news.title}
              </h2>
              
              <p className="text-sm md:text-base text-text-muted mb-4 leading-relaxed line-clamp-3 md:line-clamp-none">
                {news.summary}
              </p>

              {news.ai_summary && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 md:p-4 mb-4">
                  <div className="flex items-start gap-2 md:gap-3">
                    <BrainCircuit className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs md:text-sm font-bold mb-1 text-primary">AI 深度洞察</div>
                      <div className="text-xs md:text-sm text-text-main/90 leading-relaxed">
                        {news.ai_summary}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 md:gap-4 mt-2">
                <div className="flex flex-wrap gap-2">
                  {news.news_article_assets?.map((item, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-surface-hover text-[10px] md:text-xs font-mono border border-border cursor-pointer hover:border-primary/50 transition-colors">
                      ${item.assets?.asset_code}
                    </span>
                  ))}
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] md:text-xs font-medium border",
                    news.sentiment_label === 'positive' ? "bg-up/10 text-up border-up/20" : 
                    news.sentiment_label === 'negative' ? "bg-down/10 text-down border-down/20" : 
                    "bg-surface-hover text-text-muted border-border"
                  )}>
                    {news.sentiment_label === 'positive' ? '利多' : news.sentiment_label === 'negative' ? '利空' : '中性'}
                  </span>
                </div>
                
                {news.article_url && (
                  <a href={news.article_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] md:text-xs text-text-muted hover:text-primary transition-colors font-medium">
                    查看原文 <ExternalLink className="w-3 h-3" />
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
