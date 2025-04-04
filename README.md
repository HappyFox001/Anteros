<div align="center">

# ✨ Anteros: Attention is all you trade ✨

> **_「让舆论数据金融化，用金融力量净化信息」_**
> 
> <span style="color:#007BFF; font-weight:bold; font-style:italic;">**「Financialize Public Opinion, Purify Information with Market Forces」**</span>

![Anteros](./assets/logo.jpg)
</div>

Anteros is a revolutionary decentralized platform built on the Aptos blockchain that bridges real-world sentiment data with blockchain financial instruments. By leveraging search trends 🔍, social media tags #️⃣, and other sentiment indicators, Anteros creates a new class of financial derivatives that reflect public opinion and attention, ultimately leading to more rational information ecosystems. Powered by Aptos Move's unique resource-oriented programming model, Anteros delivers unparalleled security and performance for sentiment-based financial instruments.

## 🌟 Project Vision
<div align="center">

> <span style="color:#E83E8C; font-weight:bold;">**「信息即资产，共识创造价值」**</span>
> 
> <span style="color:#007BFF; font-weight:bold;">**「Information as Asset, Consensus Creates Value」**</span>

</div>
Anteros aims to financialize real-world information by:

1. 📊 **Capturing Real-World Data**: Utilizing Google search trends, Twitter hashtags, and other public sentiment indicators
2. 💱 **Tokenizing Sentiment**: Converting these data points into on-chain assets through our proprietary weighting algorithm
3. 📈 **Creating Financial Instruments**: Enabling trading of sentiment-based derivatives with proper funding rate mechanisms
4. ⚖️ **Aligning Contract and Spot Prices**: Ensuring financial stability through robust price discovery
5. 🧠 **Rationalizing Public Opinion**: Using market mechanisms to filter noise and promote quality information

## 🔧 Core Components

### 📝 Smart Contracts

The Anteros platform is built on Aptos Move and leverages its key features:

- **Resource-oriented programming**: Ensuring secure asset management
- **Formal verification**: Providing mathematical guarantees of contract correctness
- **Move VM**: Enabling high-throughput transaction processing
- **Parallel execution engine**: Allowing for scalable performance

Our platform consists of two main contracts:

1. **SearchTrendsOracle (`search_trends_oracle.move`)** 🔮
   - Captures and stores real-time and monthly trend data
   - Provides weighted data points for various keywords
   - Implements auto-generation of default values for new trends
   - Includes event emission for data updates

```
┌─────────────────┐        ┌─────────────────┐
│  External Data  │───────▶│  Oracle Update  │
└─────────────────┘        └────────┬────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │  Weighted Data  │
                           └────────┬────────┘
                                    │
                                    ▼
┌─────────────────┐        ┌─────────────────┐
│  Trading Logic  │◀───────│   Spot Price    │
└─────────────────┘        └─────────────────┘
```

2. **TrendTrading (`trend_trading.move`)** 💹
   - Implements the trading mechanism for sentiment-based derivatives
   - Calculates spot prices based on weighted trend data
   - Manages long and short positions
   - Implements funding rate calculation to align contract and spot prices
   - Handles price impact based on position size

### 🖥️ Backend Services

The backend provides API endpoints for:
- 🔄 Fetching real-time trend data from external sources
- ⚙️ Processing and weighting trend information
- 🔗 Updating the on-chain oracle with verified data via Aptos's high-throughput API
- 📡 Serving aggregated trend information to the frontend
- 🔐 Securely signing transactions with Aptos account abstraction

```
┌───────────┐    ┌───────────┐    ┌───────────┐
│  External  │    │ Weighting │    │  Oracle   │
│   APIs     │───▶│ Algorithm │───▶│  Update   │
└───────────┘    └───────────┘    └───────────┘
```

### 🎨 Frontend Application

Our Next.js-based frontend offers:
- 📊 Interactive dashboard for visualizing trend data
- 📉 Trading interface for opening long/short positions
- 👛 Seamless integration with Petra, Martian, and other Aptos wallets
- ⚡ Real-time updates of price movements and funding rates
- 🧩 Support for Aptos's unique account and resource model

```
┌───────────────────────────────────────────────┐
│                                               │
│  ┌─────────┐  ┌─────────┐      ┌─────────┐   │
│  │ Trends  │  │ Trading │      │ Wallet  │   │
│  │ Charts  │  │ Panel   │      │ Connect │   │
│  └─────────┘  └─────────┘      └─────────┘   │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │                                         │ │
│  │             Market Data                 │ │
│  │                                         │ │
│  └─────────────────────────────────────────┘ │
│                                               │
└───────────────────────────────────────────────┘
```

## ⚙️ How It Works

<div align="center">

> <span style="color:#E83E8C; font-weight:bold;">**「数据驱动价格，市场净化信息」**</span>
> 
> <span style="color:#007BFF; font-weight:bold;">**「Data Drives Price, Markets Purify Information」**</span>

</div>

1. 🔍 **Data Collection**: External APIs collect search trends and social media tag popularity
2. 🧮 **Data Processing**: Our backend applies weighting algorithms to normalize and score the data
3. 📤 **Oracle Updates**: Processed data is pushed to the on-chain oracle
4. 💰 **Price Formation**: Contract prices are calculated using a weighted formula:
   ```
   Price = (RealTimeValue * REALTIME_WEIGHT + MonthlyValue * MONTHLY_WEIGHT) / 100
   ```
5. 📊 **Trading**: Users can open long or short positions on specific trends
6. 🔄 **Funding Rate**: A funding mechanism ensures contract prices converge with spot prices:
   ```
   FundingRate = min(MAX_FEE_RATE, (|ContractPrice - SpotPrice| * BASIS_POINTS) / SpotPrice)
   ```

```
Data Flow & Price Formation
--------------------------

External Data  →  Weighted Algorithm  →  Oracle  →  Spot Price
                                                     ↓
                                                  Contract
                                                     ↓
                      Funding Rate  ←  Price Deviation
```

## 🌈 Benefits

<div align="center">

> <span style="color:#E83E8C; font-weight:bold;">**「让市场力量优化信息生态」**</span>
> 
> <span style="color:#007BFF; font-weight:bold;">**「Let Market Forces Optimize the Information Ecosystem」**</span>

</div>

- 🔍 **Information Quality**: Financial incentives drive more accurate information discovery and rational discourse
- 📈 **Market Efficiency**: Provides price discovery for previously non-financialized data
- 🛡️ **Hedging Capability**: Allows businesses to hedge against public sentiment shifts
- 🔎 **Transparency**: On-chain data ensures transparency and auditability
- 🧠 **Rational Discourse**: By attaching financial value to information, we encourage more thoughtful and factual public discourse
- 🌐 **Information Democracy**: Decentralized price discovery gives voice to collective wisdom rather than centralized authorities

```
Before Anteros                 After Anteros
---------------                --------------
                               
Noise  ███████████            Noise  █████
Signal █████                  Signal ███████████
                               
Bias   ██████████             Bias   ████
Facts  ██████                 Facts  ████████████
```

## 🚀 Getting Started

### Prerequisites
- 🔧 Aptos CLI (v2.0+)
- 🟢 Node.js 16+
- 🐍 Python 3.9+
- 🦊 Petra or other Aptos-compatible wallet

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/HappyFox001/Anteros.git
   cd anteros
   ```

2. Set up the backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

3. Set up the frontend:
   ```bash
   cd fronted
   pnpm install
   pnpm run dev
   ```

4. Deploy the contracts:
   ```bash
   cd contract
   aptos move compile --named-addresses anteros=0x1
   aptos move publish --named-addresses anteros=0x1
   ```

## 🔮 Future Roadmap

<div align="center">

> **「构建更理性的信息世界」**
> 
> **「Building a More Rational Information World」**

</div>

- 🔄 Integration with more data sources (Reddit, Discord, etc.)
- 🧠 Advanced weighting algorithms with machine learning
- 🧺 Multi-asset baskets for diversified sentiment exposure
- 🏛️ Governance token for protocol decisions using Aptos's token standard
- ⛓️ Cross-chain implementations via LayerZero and other bridges
- 📱 Mobile app for trend monitoring and trading
- 🤖 API for institutional integrations
- 🔍 Sentiment analysis tools for deeper insight
- 🔐 Integration with Aptos's upcoming ZK-rollup solutions
- 🌊 Leveraging Aptos's parallel execution for high-frequency trading

```
Roadmap Timeline
----------------

Q2 2025: 🔄 More Data Sources  →  🧠 ML Algorithms  →  🧺 Multi-asset Baskets
                                                       ↓
Q4 2025: 🤖 API Integration  ←  📱 Mobile App  ←  🏛️ Governance Token
                                                       ↓
Q2 2026: 🔍 Sentiment Analysis  →  ⛓️ Cross-chain  →  🌐 Global Expansion
```

## 🤔 What we need

As a hackathon project, Anteros needs support from various aspects to achieve our vision:

- 🌐 **Operational Resources**: Due to our project's high dependency on information flow and community engagement, we need strong operational support to establish an initial user base
- 🔍 **Data Partnerships**: Collaborations with platforms owning high-quality sentiment data and search trends
- 🚀 **Ecosystem Support**: Technical and marketing resources from the Aptos ecosystem to help us expand quickly
- 💼 **Industry Advisors**: Professionals with experience in financial derivatives and information markets
- 🧪 **Test Users**: Community members willing to participate in early testing and provide feedback
- 🔄 **Liquidity Providers**: Providing initial liquidity for our sentiment derivative market

We believe Anteros' vision - to financialize public opinion data and use market forces to optimize the information ecosystem - represents a revolutionary use case for blockchain technology. With your support, we can co-create a more rational and efficient information world.

## 🤝 What we can supply to Aptos

By providing a robust and functional sentiment derivative market on Aptos, we can attract real users and provide a unique use case for Aptos's parallel execution capabilities. Additionally, we can:

- Provide a platform for users to express their opinions and engage in discussions
- Offer a way for content creators to monetize their content and build a community
- Create a new revenue stream for platforms and content creators
- Increase the adoption of Aptos and its ecosystem

## 🤝 Team
- [Treap](https://github.com/TreapGoGo) (CEO)
- [张谦](https://github.com/HappyFox001) (CTO)
- [欢喜](https://github.com/Undertone0809) (COO)
- [zeeland](https://github.com/soberli404) (strategy consultant)

## 👥 Contributing

<div align="center">

> <span style="color:#E83E8C; font-weight:bold;">**「共建信息金融新世界」**</span>
> 
> <span style="color:#007BFF; font-weight:bold;">**「Co-creating a New World of Information Finance」**</span>

</div>
We welcome contributions to Anteros! And We need you help to make Anteros great again.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
---

<div align="center">

### 「用金融的力量，让世界的信息更美好」
### 「Using the Power of Finance to Make the World's Information Better」

<br>
</div>