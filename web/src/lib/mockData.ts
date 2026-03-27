export const mockMarketOverview = [
  { asset_code: '000001.SH', asset_name: '上证指数', last_price: 3054.43, price_change_pct: 1.25 },
  { asset_code: '399001.SZ', asset_name: '深证成指', last_price: 9586.32, price_change_pct: 1.54 },
  { asset_code: '399006.SZ', asset_name: '创业板指', last_price: 1884.09, price_change_pct: 2.11 },
  { asset_code: '000688.SH', asset_name: '科创50', last_price: 801.45, price_change_pct: -0.45 },
];

export const mockAiInsight = {
  title: '新能源板块持续回暖',
  summary: '受多重利好政策刺激，新能源产业链上下游个股普涨。今日市场整体呈现震荡走高的态势，三大股指集体收涨，其中创业板指领涨。两市成交额较前一交易日有所放大，北向资金净流入超百亿。',
  evidence_items: ['政策补贴延续', '头部企业订单超预期', '锂矿价格触底反弹'],
  risk_items: ['产能过剩隐忧', '国际贸易壁垒'],
};

export const mockHotTopics = [
  { title: '央行降准落地，释放长期资金', summary: '央行宣布全面降准0.5个百分点，预计释放长期资金约1万亿元，利好股市和债市。', heat_score: 98 },
  { title: '多地出台稳楼市新政', summary: '一线城市相继优化房地产调控政策，降低首付比例，有望带动相关产业链回暖。', heat_score: 85 },
  { title: '人工智能大模型加速迭代', summary: '国内头部科技企业相继发布新一代AI大模型，算力需求激增，相关概念股受追捧。', heat_score: 92 },
];

export const mockRecentSignals = [
  { id: 1, signal_title: 'MACD金叉', signal_description: '贵州茅台(600519)日线级别MACD出现金叉，短线有反弹需求。', signal_time: new Date().toISOString(), direction_label: 'buy' },
  { id: 2, signal_title: 'KDJ死叉', signal_description: '宁德时代(600519)日线级别KDJ出现死叉，注意短线回调风险。', signal_time: new Date(Date.now() - 3600000).toISOString(), direction_label: 'sell' },
  { id: 3, signal_title: '突破阻力位', signal_description: '比亚迪(002594)放量突破前期平台高点，上涨空间打开。', signal_time: new Date(Date.now() - 7200000).toISOString(), direction_label: 'buy' },
];

export const mockSignals = [
  { id: 1, signal_type: 'spike_up', signal_title: '价格异动上涨', signal_description: '检测到异常大单买入，价格短线急升。', signal_time: new Date().toISOString(), heat_score: 95, assets: { asset_code: 'AAPL' } },
  { id: 2, signal_type: 'sentiment_shift', signal_title: '市场情绪转向', signal_description: '社交媒体和新闻情绪转为悲观，请注意风险。', signal_time: new Date(Date.now() - 3600000).toISOString(), heat_score: 88, assets: { asset_code: 'TSLA' } },
  { id: 3, signal_type: 'breakout', signal_title: '向上突破', signal_description: '放量突破前期平台阻力位。', signal_time: new Date(Date.now() - 7200000).toISOString(), heat_score: 90, assets: { asset_code: 'NVDA' } },
];

export const mockWatchlist = [
  { id: 1, asset_code: 'AAPL', asset_name: '苹果', last_price: 185.92, price_change_pct: 1.2, ai_signal_label: 'buy' },
  { id: 2, asset_code: 'MSFT', asset_name: '微软', last_price: 420.55, price_change_pct: 0.8, ai_signal_label: 'hold' },
  { id: 3, asset_code: 'BTCUSDT', asset_name: '比特币', last_price: 65000.00, price_change_pct: -2.5, ai_signal_label: 'sell' },
];
export const mockUserProfile = {
  display_name: '测试用户',
  email: 'test@example.com',
  avatar_url: '',
  preferences: {
    theme: 'dark',
    notifications: true
  }
};

export const mockNews = [
  { id: 1, title: '美联储宣布维持利率不变', summary: '美联储在最新的货币政策会议上决定维持联邦基金利率目标区间在5.25%-5.5%不变，符合市场预期。', published_at: new Date().toISOString(), sentiment_label: 'neutral', heat_score: 95 },
  { id: 2, title: '苹果发布新款AI芯片', summary: '苹果公司在WWDC上发布了专为AI计算设计的M4芯片，性能大幅提升。', published_at: new Date(Date.now() - 3600000).toISOString(), sentiment_label: 'positive', heat_score: 88 },
  { id: 3, title: '某头部房企债务违约', summary: '国内某大型房地产企业未能按期支付美元债利息，引发市场对房地产板块的担忧。', published_at: new Date(Date.now() - 7200000).toISOString(), sentiment_label: 'negative', heat_score: 90 },
];

export const mockQuotes = [
  { id: 1, asset_code: 'AAPL', asset_name: '苹果', market_name: '美股', last_price: 185.92, price_change_pct: 1.2, volume: 50000000 },
  { id: 2, asset_code: 'MSFT', asset_name: '微软', market_name: '美股', last_price: 420.55, price_change_pct: 0.8, volume: 30000000 },
  { id: 3, asset_code: 'BTCUSDT', asset_name: '比特币', market_name: '加密货币', last_price: 65000.00, price_change_pct: -2.5, volume: 15000 },
  { id: 4, asset_code: '600519.SH', asset_name: '贵州茅台', market_name: 'A股', last_price: 1700.00, price_change_pct: 0.5, volume: 2000000 },
];
