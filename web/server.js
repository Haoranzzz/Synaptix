import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// 配置 Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());

// 静态文件服务 - 指向构建后的 dist 目录
app.use(express.static(path.join(__dirname, 'dist')));

// Webhook 接口
app.post('/api/webhook', async (req, res) => {
  try {
    const payload = req.body;
    console.log('Received Webhook Payload:', JSON.stringify(payload, null, 2));

    const title = payload.title || 'TrendRadar 推送';
    const content = payload.content || payload.text || payload.markdown || JSON.stringify(payload);
    const sourceName = payload.platform || 'TrendRadar';
    const link = payload.link || '';
    const time = payload.time || new Date().toISOString();

    let sourceId = null;

    // 1. 获取或创建新闻源
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

    // 2. 插入新闻文章
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
      res.status(500).json({ error: 'Database error', details: newsError });
    } else {
      res.status(200).json({ 
        success: true, 
        message: 'Article saved successfully',
        id: newsItem?.id 
      });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 处理所有其他请求，返回单页应用的 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Webhook endpoint: http://your-server-ip:${port}/api/trendradar-webhook`);
});
