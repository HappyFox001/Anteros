/**
 * Mock Trending News Data Service
 *
 * @remarks
 * This module provides a comprehensive mock data system for trending news and information
 * within the Anteros platform. It generates realistic, contextually relevant news items
 * for different keywords that users can trade on, creating an immersive and dynamic
 * trading experience.
 * 
 * Key features:
 * - Keyword-specific news generation with sentiment analysis (positive/negative/neutral)
 * - Time-based news organization with realistic timestamps
 * - Domain-specific content generation for various sectors (crypto, AI, politics, etc.)
 * - Customizable news retrieval methods for different UI components
 * - Mock trending keywords with associated price and change data
 * 
 * The mock data system simulates a real-world news feed that would influence keyword
 * pricing in an actual production environment. This allows for realistic testing and
 * demonstration of the platform's trading interface without requiring external API
 * dependencies during development and testing phases.
 */

import { TrendingKeyword } from '../types/trending';

export interface TrendingInfo {
  title: string;
  content: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  keyword: string;
}

export const generateTrendingNewsForKeyword = (keyword: string, price: number, change: number): TrendingInfo[] => {
  const now = new Date();
  const sentiment = change >= 0 ? 'positive' : 'negative';
  const priceMovement = change >= 0 ? '上涨' : '下跌';
  
  const news: TrendingInfo[] = [
  ];
  
  switch(keyword) {
    case 'Trump':
      news.push(
        {
          title: '特朗普税改计划引发市场震动',
          content: '特朗普宣布将推出全面税改计划，承诺降低企业税率至15%，华尔街投资者反应积极，科技股大幅上涨。',
          timestamp: `${(now.getHours() - 2).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: '特朗普贸易政策引发国际担忧',
          content: '特朗普表示将对中国商品加征关税，欧盟和亚洲多国表示担忧，国际贸易紧张局势升级。',
          timestamp: `${(now.getHours() - 4).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'negative',
          keyword: keyword
        },
        {
          title: '特朗普能源政策支持石油产业',
          content: '特朗普承诺扩大石油开采权，能源股应声上涨，分析师预测油价将在短期内稳定。',
          timestamp: `${(now.getHours() - 6).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        }
      );
      break;
      
    case 'OpenAI':
      news.push(
        {
          title: 'OpenAI发布GPT-5技术预览',
          content: 'OpenAI宣布GPT-5技术预览版将于下月向企业客户开放，新模型在推理和创造性任务上有突破性进展。',
          timestamp: `${(now.getHours() - 3).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'OpenAI与谷歌AI安全联盟',
          content: 'OpenAI与谷歌宣布成立AI安全联盟，共同制定大型语言模型安全标准，应对潜在风险。',
          timestamp: `${(now.getHours() - 5).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'OpenAI研究人员警告AI风险',
          content: '多位OpenAI高级研究员发表联合声明，警告超级智能AI可能带来的系统性风险，呼吁加强监管。',
          timestamp: `${(now.getHours() - 8).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'negative',
          keyword: keyword
        }
      );
      break;
      
    case 'Claude':
      news.push(
        {
          title: 'Claude 3.5模型超越竞争对手',
          content: '最新基准测试显示Claude 3.5在多项专业领域任务中超越竞争对手，特别是在医学和法律推理方面。',
          timestamp: `${(now.getHours() - 2).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'Claude开发者API定价下调',
          content: 'Anthropic宣布Claude API价格下调30%，旨在吸引更多开发者，与OpenAI展开直接价格竞争。',
          timestamp: `${(now.getHours() - 4).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'Claude在欧洲市场份额下滑',
          content: '最新市场调研显示Claude在欧洲市场份额较上季度下滑15%，面临本地化AI服务的强劲竞争。',
          timestamp: `${(now.getHours() - 7).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'negative',
          keyword: keyword
        }
      );
      break;
      
    case 'GPT4o':
      news.push(
        {
          title: 'GPT4o视觉能力获医疗突破',
          content: '研究表明GPT4o在医学影像分析中准确率达到专家水平，多家医院开始试点应用于辅助诊断。',
          timestamp: `${(now.getHours() - 1).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'GPT4o实时翻译功能获赞',
          content: '用户评测显示GPT4o的实时多语言翻译功能在准确性和流畅度上远超竞品，特别是在处理专业术语方面。',
          timestamp: `${(now.getHours() - 3).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'GPT4o遭遇数据隐私质疑',
          content: '欧盟数据保护机构对GPT4o的数据处理方式提出质疑，可能面临合规调查和潜在罚款。',
          timestamp: `${(now.getHours() - 9).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'negative',
          keyword: keyword
        }
      );
      break;
      
    case 'Aptos':
      news.push(
        {
          title: 'Aptos与全球支付巨头合作',
          content: 'Aptos宣布与全球支付巨头合作，将区块链支付解决方案整合到现有支付网络，预计交易量将大幅增长。',
          timestamp: `${(now.getHours() - 2).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'Aptos Layer 2扩展方案公布',
          content: 'Aptos基金会公布Layer 2扩展方案，将使网络吞吐量提升10倍，同时保持低交易费用和高安全性。',
          timestamp: `${(now.getHours() - 5).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'Aptos开发者生态系统激励计划',
          content: 'Aptos启动1亿美元开发者激励计划，鼓励更多开发者在Aptos网络上构建DeFi和Web3应用。',
          timestamp: `${(now.getHours() - 7).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        }
      );
      break;
      
    case 'Solana':
      news.push(
        {
          title: 'Solana移动设备销量突破预期',
          content: 'Solana手机Saga二代销量突破预期，首周售出10万台，Web3原生移动设备市场迎来爆发。',
          timestamp: `${(now.getHours() - 1).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'Solana NFT交易量超以太坊',
          content: 'Solana网络NFT交易量连续第三个月超过以太坊，低费用和高速交易成为吸引创作者的主要因素。',
          timestamp: `${(now.getHours() - 4).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'Solana网络短暂中断引担忧',
          content: 'Solana主网在高峰期出现短暂中断，虽然迅速恢复，但再次引发对网络稳定性的担忧。',
          timestamp: `${(now.getHours() - 8).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'negative',
          keyword: keyword
        }
      );
      break;
      
    case 'Cardano':
      news.push(
        {
          title: 'Cardano智能合约数量突破一万',
          content: 'Cardano网络上的智能合约数量突破一万个里程碑，生态系统应用多样性显著提升。',
          timestamp: `${(now.getHours() - 3).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'Cardano创始人宣布重大合作',
          content: 'Charles Hoskinson宣布Cardano与多个非洲国家政府达成合作，将区块链技术应用于土地登记和教育认证。',
          timestamp: `${(now.getHours() - 6).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'Cardano治理提案引发社区分歧',
          content: '最新治理提案建议改变Cardano质押奖励机制，引发社区激烈讨论，可能影响网络去中心化程度。',
          timestamp: `${(now.getHours() - 9).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'neutral',
          keyword: keyword
        }
      );
      break;
      
    case 'Earthquake':
      news.push(
        {
          title: '地震预测AI模型准确率提升',
          content: '科学家开发的AI地震预测模型在近期测试中准确率达到75%，比传统方法提高30%，引发投资热潮。',
          timestamp: `${(now.getHours() - 2).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: '地震保险市场规模扩大',
          content: '全球地震保险市场规模预计到2026年将达到2500亿美元，年复合增长率12%，科技创新是主要驱动力。',
          timestamp: `${(now.getHours() - 5).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: '地震监测卫星网络获批',
          content: '国际合作项目批准发射12颗专用地震监测卫星，将形成全球覆盖网络，大幅提升预警能力。',
          timestamp: `${(now.getHours() - 7).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        }
      );
      break;
    case 'NFT':
      news.push(
        {
          title: 'NFT艺术品拍卖创下历史新高',
          content: '在佳士得拍卖会上，一幅数字艺术品以超过100万美元成交，刷新了NFT艺术品拍卖记录。',
          timestamp: `${(now.getHours() - 2).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'NFT市场监管政策出台',
          content: '各国政府陆续出台针对NFT市场的监管政策，旨在规范行业发展，保护消费者权益。',
          timestamp: `${(now.getHours() - 4).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'NFT项目融资额突破10亿美元',
          content: '在过去的季度中，有超过10个NFT项目获得数亿美元融资，显示了市场的旺盛需求。',
          timestamp: `${(now.getHours() - 6).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        }
      );
      break;
    case 'AI':
      news.push(
        {
          title: 'AI生成式艺术作品展出',
          content: '在伦敦当代艺术馆展出的AI生成式艺术作品吸引了大量观众，展现了AI在艺术领域的潜力。',
          timestamp: `${(now.getHours() - 2).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'AI伦理委员会成立',
          content: '国际AI伦理委员会宣布成立，旨在规范AI技术发展，保护人类利益。',
          timestamp: `${(now.getHours() - 4).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'AI芯片研发取得突破',
          content: '多家科技巨头宣布在AI芯片研发上取得重要进展，预计将大幅提升计算能力。',
          timestamp: `${(now.getHours() - 6).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        }
      );
      break;
    case 'DeFi':
      news.push(
        {
          title: 'DeFi项目融资额突破10亿美元',
          content: '在过去的季度中，有超过10个DeFi项目获得数亿美元融资，显示了市场的旺盛需求。',
          timestamp: `${(now.getHours() - 2).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'DeFi平台交易量突破100亿美元',
          content: 'DeFi平台在第一季度的交易量突破100亿美元，同比增长200%。',
          timestamp: `${(now.getHours() - 4).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'DeFi监管政策出台',
          content: '各国政府陆续出台针对DeFi市场的监管政策，旨在规范行业发展，保护消费者权益。',
          timestamp: `${(now.getHours() - 6).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        }
      );
      break;
    case 'TinTinLand':
      news.push(
        {
          title: 'TinTinLand发起Web3+AI共学月活动',
          content: 'TinTinLand开启为期五周的Web3+AI主题共学月，帮助开发者深入探索四个Web3+AI项目，捕获浪潮碰撞下的无限机遇。',
          timestamp: `${(now.getHours() - 1).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'TinTinLand与多个生态合作举办13场Web3活动',
          content: 'TinTinLand加快与0G、FLOW、Movement、AIvalanche、TON、Sui、DogeCon等一众潜力新星生态的合作步伐，共同探索项目技术创新和发展机遇。',
          timestamp: `${(now.getHours() - 3).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: 'TinTinLand发起Web3+DePIN主题共学月',
          content: 'TinTinLand携手知名项目共同打造一个系统化、互动性强的学习平台，帮助开发者不断提升技能，紧跟前沿发展，共探DePIN赛道新风口。',
          timestamp: `${(now.getHours() - 5).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        }
      );
      break;
      
    default:
      news.push(
        {
          title: `${keyword}领域投资热度上升`,
          content: `${keyword}相关企业在过去一个季度吸引风险投资超过10亿美元，市场预期该领域将持续高速增长。`,
          timestamp: `${(now.getHours() - 2).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        },
        {
          title: `${keyword}技术创新获突破`,
          content: `${keyword}领域研究人员宣布重大技术突破，可能彻底改变现有市场格局，领先企业股价应声上涨。`,
          timestamp: `${(now.getHours() - 4).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          sentiment: 'positive',
          keyword: keyword
        }
      );
  }
  
  return news;
};

export const mockTrendingKeywords: TrendingKeyword[] = [
  { keyword: "Trump", price: 78, change: 5.2 },
  { keyword: "OpenAI", price: 45, change: -2.3 },
  { keyword: "Claude", price: 32, change: -8.1 },
  { keyword: "GPT 4O", price: 56, change: 3.7 },
  { keyword: "Aptos", price: 140, change: 1.2 },
  { keyword: "Solana", price: 40, change: 2.5 },
  { keyword: "Cardano", price: 60, change: 1.8 },
  { keyword: "Earthquake", price: 70, change: 0.5 },
  { keyword: "NFT", price: 90, change: 0.8 },
  { keyword: "AI", price: 30, change: 1.5 },
  { keyword: "DeFi", price: 40, change: 2.2 },
  { keyword: "TinTinLand", price: 100, change: 1.2 },
];

export const allTrendingNews: TrendingInfo[] = mockTrendingKeywords.flatMap(
  keyword => generateTrendingNewsForKeyword(keyword.keyword, keyword.price, keyword.change)
);
export const getTrendingNewsByKeyword = (keyword: string): TrendingInfo[] => {
  return allTrendingNews.filter(news => news.keyword === keyword);
};

export const getLatestTrendingNews = (count: number = 5): TrendingInfo[] => {
  return [...allTrendingNews]
    .sort((a, b) => {
      const timeA = a.timestamp.split(':').map(Number);
      const timeB = b.timestamp.split(':').map(Number);
      return (timeB[0] * 60 + timeB[1]) - (timeA[0] * 60 + timeA[1]);
    })
    .slice(0, count);
};
