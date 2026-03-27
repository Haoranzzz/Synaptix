/**
 * 智兔数服 API 服务
 * 文档: https://www.zhituapi.com/hsstockapi.html
 */

const TOKEN = import.meta.env.VITE_ZHITU_TOKEN;
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
  id: number;
  title: string;
  content: string;
  digest: string;
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
    try {
      const response = await fetch(`${BASE_URL}/hs/list/all?token=${TOKEN}`);
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
    try {
      const codesStr = codes.join(',');
      const response = await fetch(`${BASE_URL}/hs/market/realtime?token=${TOKEN}&dm=${codesStr}`);
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
    try {
      const response = await fetch(`${BASE_URL}/hs/market/realtime?token=${TOKEN}&dm=${code}`);
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
   */
  async getNews(limit = 20): Promise<ZhituNews[]> {
    try {
      const response = await fetch(`${BASE_URL}/hs/news/all?token=${TOKEN}`);
      const data = await response.json();
      console.log('Zhitu API (getNews) Response:', data);
      // 如果返回的是对象数组，取前 limit 条
      if (Array.isArray(data)) {
        return data.slice(0, limit);
      }
      return [];
    } catch (error) {
      console.error('ZhituApi Error (getNews):', error);
      return [];
    }
  }
};
