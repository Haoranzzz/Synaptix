import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// 获取环境变量
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 辅助函数：清洗文本
const cleanText = (text: string, maxLength: number) => {
  if (!text) return '';
  let cleaned = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength - 3) + '...';
  }
  return cleaned;
};

// 辅助函数：校验链接
const isValidUrl = (url: string) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// 辅助函数：生成 SHA1 Hash
async function generateEventId(title: string, platform: string, link: string, published_at: string) {
  const rawString = `${title}|${platform}|${link}|${published_at}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(rawString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

export default async function handler(req: Request) {
  // 增加对 OPTIONS 请求的处理（支持 CORS）
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: { 'Allow': 'POST, OPTIONS' }
    });
  }

  try {
    const payload = await req.json();
    console.log('Received Webhook Payload:', JSON.stringify(payload, null, 2));

    // 适配 v1 规范
    // 提取字段
    let title = payload.title || '';
    let content = payload.content || payload.text || payload.markdown || '';
    let platform = payload.platform || payload.source_name || payload.feed_name || payload.source || '';
    let link = payload.link || '';
    const published_at = payload.published_at || payload.time_display || payload.crawl_time || payload.time || new Date().toISOString();
    
    // v1 新增字段
    const schema_version = payload.schema_version || 'trendaradar.news.v1';
    const source_type = payload.source_type || 'media';
    const mode = payload.mode || '';
    const report_type = payload.report_type || '';
    const sent_at = payload.sent_at || new Date().toISOString();
    
    // 推荐字段
    const keyword = payload.keyword || '';
    const rank = parseInt(payload.rank, 10) || 0;
    let count = 1;
    if (payload.count !== undefined) {
      count = parseInt(payload.count, 10);
      if (isNaN(count)) count = 1;
    }
    const heat_score = parseFloat(payload.heat_score) || 0;

    // 事件键： event_id = sha1(title|platform|link|published_at)[:16]
    let event_id = payload.event_id || payload.origin_hash || '';
    if (!event_id) {
      event_id = await generateEventId(title, platform, link, published_at);
    }

    // 空值兜底：内容为空时自动生成“来源+时间”摘要
    if (!content && platform) {
      content = `来源：${platform}，发布时间：${published_at}`;
    }

    // 固定质量门槛：title/content/platform 任一为空则拒收
    if (!title || !content || !platform) {
      console.warn('Rejected: Missing required fields (title, content, or platform).');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // 文本清洗：去换行/多空格，限制长度
    title = cleanText(title, 200);
    content = cleanText(content, 500);
    platform = cleanText(platform, 80);

    // 链接校验：仅允许 http/https 且有域名，不合法置空
    if (!isValidUrl(link)) {
      link = '';
    }

    // 确保有 event_id 用于去重
    if (!event_id) {
      console.warn('Warning: event_id is missing, but proceeding.');
    }

    // 记录 v1 规范的其他字段，防止未使用变量的 linter 错误
    console.log('Webhook metadata:', {
      schema_version,
      mode,
      report_type,
      keyword,
      rank,
      count
    });

    // 2. 处理数据存入逻辑
    let sourceId = null;

    // A. 获取或创建新闻源
    const { data: sourceData, error: sourceError } = await supabase
      .from('news_sources')
      .select('id')
      .eq('source_name', platform)
      .single();

    if (sourceError && sourceError.code === 'PGRST116') {
      const { data: newSource, error: createError } = await supabase
        .from('news_sources')
        .insert({ source_name: platform, source_type: source_type })
        .select('id')
        .single();
      
      if (!createError && newSource) {
        sourceId = newSource.id;
      } else {
        console.error('Error creating news source:', createError);
      }
    } else if (sourceData) {
      sourceId = sourceData.id;
    }

    // B. 插入新闻文章 (按 origin_hash = event_id upsert)
    const articleData = {
      source_id: sourceId,
      title: title,
      summary: content,
      article_url: link,
      published_at: published_at,
      crawled_at: sent_at,
      heat_score: heat_score,
      origin_hash: event_id,
      status: 'published'
    };

    const newsQuery = supabase.from('news_articles');
    let newsResult;

    if (event_id) {
      newsResult = await newsQuery
        .upsert(articleData, { onConflict: 'origin_hash' })
        .select('id')
        .single();
    } else {
      newsResult = await newsQuery
        .insert(articleData)
        .select('id')
        .single();
    }

    const { data: newsItem, error: newsError } = newsResult;

    if (newsError) {
      console.error('Error inserting/upserting news article:', newsError);
      return new Response(JSON.stringify({ error: 'Database error', details: newsError }), { status: 500 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Article saved successfully',
      id: newsItem?.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
