/**
 * 智兔数服 API 服务
 * 文档: https://www.zhituapi.com/hsstockapi.html
 */

const getZhituToken = () => {
  const token = import.meta.env.VITE_ZHITU_TOKEN;
  // 额外检查是否为字符串 "undefined" 或 "null"
  if (!token || token === 'undefined' || token === 'null') {
    console.warn('Zhitu API Token (VITE_ZHITU_TOKEN) is missing or invalid in .env');
    return '';
  }
  return token;
};

const BASE_URL = 'https://api.zhituapi.com';

export interface ZhituStock {
  dm: string; // 股票代码
  mc: string; // 股票名称
  jys: string; // 交易所
}

export interface ZhituQuote {
  dm: string;
  mc: string;
  p: number; // 当前价
  zde: number; // 涨跌额
  zdf: number; // 涨跌幅
  hs: number; // 换手率
  ze: number; // 成交额
  zs: number; // 昨收
  jk: number; // 今开
  zg: number; // 最高
  zd: number; // 最低
}

export interface ZhituNews {
  id?: number | string;
  title: string;
  content?: string;
  digest?: string;
  time: string;
  source: string;
  url: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  heat?: number;
  stocks?: string[];
}

export const zhituApi = {
  /**
   * 获取沪深 A 股列表
   */
  async getStockList(): Promise<ZhituStock[]> {
    const token = getZhituToken();
    if (!token) return [];
    try {
      const response = await fetch(`${BASE_URL}/hs/list/all?token=${token}`);
      if (!response.ok) {
        const text = await response.text();
        console.error(`Zhitu API (getStockList) Error: ${response.status} ${response.statusText}`, text);
        return [];
      }
      const data = await response.json();
      console.log('Zhitu API (getStockList) Response:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('ZhituApi Error (getStockList):', error);
      return [];
    }
  },

  /**
   * 获取沪深 A 股实时行情 (批量)
   * @param codes 股票代码列表，如 ['000001', '600000']
   */
  async getRealtimeQuotes(codes: string[]): Promise<ZhituQuote[]> {
    if (!codes.length) return [];
    const token = getZhituToken();
    if (!token) return [];
    try {
      const codesStr = codes.join(',');
      const response = await fetch(`${BASE_URL}/hs/market/realtime?token=${token}&dm=${codesStr}`);
      if (!response.ok) {
        const text = await response.text();
        console.error(`Zhitu API (getRealtimeQuotes) Error: ${response.status} ${response.statusText}`, text);
        return [];
      }
      const data = await response.json();
      console.log('Zhitu API (getRealtimeQuotes) Response:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('ZhituApi Error (getRealtimeQuotes):', error);
      return [];
    }
  },

  /**
   * 获取个股实时详情
   */
  async getStockDetail(code: string): Promise<ZhituQuote | null> {
    const token = getZhituToken();
    if (!token) return null;
    try {
      const response = await fetch(`${BASE_URL}/hs/market/realtime?token=${token}&dm=${code}`);
      if (!response.ok) {
        const text = await response.text();
        console.error(`Zhitu API (getStockDetail) Error: ${response.status} ${response.statusText}`, text);
        return null;
      }
      const data = await response.json();
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('ZhituApi Error (getStockDetail):', error);
      return null;
    }
  },

  /**
   * 获取财经新闻/资讯
   * 接口地址：https://api.zhituapi.com/hs/news/all?token=token
   * 或者：https://api.zhituapi.com/hs/news/list?token=token
   */
  async getNews(limit = 20): Promise<ZhituNews[]> {
    const token = getZhituToken();
    if (!token) return [];
    
    // 智兔新闻接口可能会有变动，这里尝试两个常见的路径
    const paths = ['/hs/news/all', '/hs/news/list'];
    
    for (const path of paths) {
      try {
        console.log(`Trying Zhitu API news path: ${path}`);
        const response = await fetch(`${BASE_URL}${path}?token=${token}`);
        
        if (!response.ok) {
          const text = await response.text();
          console.error(`Zhitu API (getNews) ${path} Error: ${response.status} ${response.statusText}`, text);
          continue; // 尝试下一个路径
        }
        
        const rawText = await response.text();
        let data;
        try {
          data = JSON.parse(rawText);
        } catch {
          console.error(`Zhitu API (getNews) ${path} JSON Parse Error. Raw text:`, rawText);
          continue;
        }
        
        console.log(`Zhitu API (getNews) ${path} Response:`, data);
        
        if (Array.isArray(data) && data.length > 0) {
          return data.slice(0, limit);
        }
      } catch (error) {
        console.error(`ZhituApi Error (getNews) ${path}:`, error);
      }
    }
    
    return [];
  }
};
