export interface TrendingKeyword {
  keyword: string;
  price: number;
  change: number;
}

export interface TrendingInfo {
  title: string;
  content: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  keyword: string;
}
