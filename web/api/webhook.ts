import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// 获取环境变量
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // 适配 TrendRadar 的通用 Webhook 模板格式
    // 用户推荐模板: {"title":"{title}","content":"{content}"}
    
    // 1. 尝试获取内容
    const title = payload.title || 'TrendRadar 推送';
    const content = payload.content || payload.text || payload.markdown || JSON.stringify(payload);
    const sourceName = payload.platform || 'TrendRadar';
    const link = payload.link || '';
    const time = payload.time || new Date().toISOString();

    // 2. 处理数据存入逻辑
    let sourceId = null;

    // A. 获取或创建新闻源
    const { data: sourceData, error: sourceError } = await supabase
      .from('news_sources')
      .select('id')
      .eq('source_name', sourceName)
      .single();

    if (sourceError && sourceError.code === 'PGRST116') {
      const { data: newSource, error: createError } = await supabase
        .from('news_sources')
        .insert({ source_name: sourceName, source_type: 'media' })
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

    // B. 插入新闻文章
    const { data: newsItem, error: newsError } = await supabase
      .from('news_articles')
      .insert({
        source_id: sourceId,
        title: title,
        summary: content,
        article_url: link,
        published_at: time,
        status: 'published'
      })
      .select('id')
      .single();

    if (newsError) {
      console.error('Error inserting news article:', newsError);
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
