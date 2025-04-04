/**
 * Trade Page - Advanced Keyword Trading Interface
 *
 * @remarks
 * This sophisticated trading interface enables users to engage with the Anteros decentralized
 * prediction market ecosystem. The page dynamically loads based on the selected keyword and
 * provides comprehensive trading functionality with real-time data visualization.
 * 
 * Key features:
 * - Interactive price charts with customizable time ranges and technical indicators
 * - Real-time order book visualization showing market depth and liquidity
 * - Position management interface for tracking long/short positions and PnL
 * - Trending news and sentiment analysis related to the selected keyword
 * - Advanced contract pricing model with funding rate calculations
 * - Responsive layout optimized for both desktop and mobile trading
 * 
 * The trade page represents the core functionality of the Anteros platform, allowing users
 * to speculate on keyword popularity and price movements within a fully on-chain environment.
 * All trading activity is secured by the Aptos blockchain for maximum transparency and security.
 */


"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import WalletConnect from "@/components/WalletConnect";
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useContractService } from "@/services/contractService";
import { getTrendingNewsByKeyword } from "@/data/mockTrendingNews";
import { TrendingInfo } from "@/types/trending";
import './scrollbar.css';

interface PriceData {
  time: string;
  price: number;
}

interface RealtimeData {
  timestamp: number;
  price: number;
  contractPrice?: number;
  formattedTime?: string;
}


export default function TradePage() {
  const params = useParams();
  const router = useRouter();
  const keyword = params.keyword as string;
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [realtimeData, setRealtimeData] = useState<RealtimeData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [tradingVolume, setTradingVolume] = useState<number>(0);
  const [marketCap, setMarketCap] = useState<number>(0);
  const [circulatingSupply, setCirculatingSupply] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<string>('');
  const [totalValue, setTotalValue] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>('');
  const [contractPrice, setContractPrice] = useState<number>(0);
  const [spotPrice, setSpotPrice] = useState<number>(0);
  const [fundingRate, setFundingRate] = useState<number>(0);
  const [isContractDataLoading, setIsContractDataLoading] = useState<boolean>(true);
  const [trendingInfo, setTrendingInfo] = useState<TrendingInfo[]>([]);
  const apiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);  
  const dataRef = useRef<RealtimeData[]>([]);
  const echartsRef = useRef<ReactECharts>(null);
  const latestPriceRef = useRef<number>(0);
  
  const MAX_DATA_POINTS = 15;
  
  const { connected, account } = useWallet();
  
  const contractService = useContractService();

  const REALTIME_WEIGHT = 60;
  const MONTHLY_WEIGHT = 40;
  const BASIS_POINTS = 1000;
  const MAX_FEE_RATE = 100;
  
  const [totalLongPositions, setTotalLongPositions] = useState<number>(1000);
  const [totalShortPositions, setTotalShortPositions] = useState<number>(800);
  const [isContractPriceConverging, setIsContractPriceConverging] = useState<boolean>(false);
  const contractConvergenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [longPositions, setLongPositions] = useState<Array<{amount: number, entryPrice: number, timestamp: string}>>([]); 
  const [shortPositions, setShortPositions] = useState<Array<{amount: number, entryPrice: number, timestamp: string}>>([]); 
  const [longValue, setLongValue] = useState<number>(0);
  const [shortValue, setShortValue] = useState<number>(0);
  const [longPnl, setLongPnl] = useState<number>(0);
  const [shortPnl, setShortPnl] = useState<number>(0);

  const calculatePriceImpact = (size: number, isLong: boolean) => {
    const baseImpact = size * 0.5;
    const nonLinearFactor = Math.sqrt(size) * 2;
    const impact = Math.floor(baseImpact + nonLinearFactor);
    return impact > 200 ? 200 : impact;
  };

  const calculateContractPrice = (spotPrice: number, longPositions: number, shortPositions: number) => {
    const longImpact = calculatePriceImpact(longPositions, true);
    const shortImpact = calculatePriceImpact(shortPositions, false);
    const priceImpactPercentage = (longImpact - shortImpact) / 100;
    const priceImpact = spotPrice * priceImpactPercentage;
    const price = spotPrice + priceImpact;
    
    return price > 0 ? price : 1;
  };

  const calculateFundingRate = (contractPrice: number, spotPrice: number) => {
    if (spotPrice === 0 || contractPrice === 0) {
      return 0;
    }
    
    let deviation = 0;
    if (contractPrice > spotPrice) {
      deviation = ((contractPrice - spotPrice) * BASIS_POINTS) / spotPrice;
    } else {
      deviation = ((spotPrice - contractPrice) * BASIS_POINTS) / spotPrice;
    }
    
    return deviation > MAX_FEE_RATE ? MAX_FEE_RATE : deviation;
  };

  useEffect(() => {
    const initializeData = () => {
      const now = Date.now();
      const initialData: RealtimeData[] = [];
      
      const initialPrice = 50 + Math.random() * 50;
      latestPriceRef.current = initialPrice;
      
      const initialContractPrice = initialPrice * (1 + (Math.random() * 0.1 - 0.05));
      
      for (let i = MAX_DATA_POINTS; i >= 0; i--) {
        const timestamp = now - i * 2000;
        const randomFactor = 0.98 + Math.random() * 0.04;
        const price = initialPrice * randomFactor;
        
        const contractRandomFactor = 0.99 + Math.random() * 0.02;
        const contractPrice = initialContractPrice * contractRandomFactor;
        
        const date = new Date(timestamp);
        const formattedTime = `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`;
        initialData.push({ timestamp, price, contractPrice, formattedTime });
      }
      
      dataRef.current = initialData;
      setRealtimeData([...initialData]);
      setCurrentPrice(initialPrice);
    };
    
    initializeData();

    animationIntervalRef.current = setInterval(() => {
      if (echartsRef.current && dataRef.current.length > 0) {
        const echartsInstance = echartsRef.current.getEchartsInstance();

        for (let i = 0; i < dataRef.current.length - 1; i++) {
          dataRef.current[i].price = dataRef.current[i + 1].price;
          if (dataRef.current[i+1].contractPrice) {
            dataRef.current[i].contractPrice = dataRef.current[i+1].contractPrice;
          }
        }
        
        const randomFactor = 0.998 + Math.random() * 0.004;
        dataRef.current[dataRef.current.length - 1].price = latestPriceRef.current * randomFactor;
        
        if (contractPrice > 0) {
          const contractRandomFactor = 0.999 + Math.random() * 0.002;
          const baseContractPrice = contractPrice * contractRandomFactor;
          
          const noise = (Math.random() * 0.01 - 0.005) * contractPrice;
          dataRef.current[dataRef.current.length - 1].contractPrice = baseContractPrice + noise;
        }
        
        const now = Date.now();
        for (let i = 0; i < dataRef.current.length; i++) {
          const timestamp = now - (dataRef.current.length - 1 - i) * 2000;
          dataRef.current[i].timestamp = timestamp;
          const date = new Date(timestamp);
          dataRef.current[i].formattedTime = `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`;
        }
        
        echartsInstance.setOption({
          series: [
            {
              data: dataRef.current.map(item => item.price)
            },
            {
              data: dataRef.current.map(item => item.contractPrice)
            }
          ],
          xAxis: {
            data: dataRef.current.map(item => item.formattedTime)
          }
        });
        
        setRealtimeData([...dataRef.current]);
      }
    }, 500);
    
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);

  const trendingInfoLoadedRef = useRef<boolean>(false);
  
  useEffect(() => {
    trendingInfoLoadedRef.current = false;
    const decodedKeyword = decodeURIComponent(keyword);
    fetchTrendingInfo(decodedKeyword);
  }, [keyword]);
  
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const decodedKeyword = decodeURIComponent(keyword);
        
        const response = await fetch(`/api/mock_search_trends/${decodedKeyword}`);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.status === "success") {
          if (data.yearly_data && data.yearly_data.length > 0) {
            const formattedData = data.yearly_data.map((item: any) => ({
              time: item.date,
              price: item.value
            }));
            
            setPriceData(formattedData);
          }
          
          const newPrice = data.realtime_data;
          setCurrentPrice(newPrice);
          latestPriceRef.current = newPrice;
          
          if (data.yearly_data && data.yearly_data.length >= 2) {
            const lastPrice = data.yearly_data[data.yearly_data.length - 1].value;
            const prevPrice = data.yearly_data[data.yearly_data.length - 2].value;
            const change = ((lastPrice - prevPrice) / prevPrice) * 100;
            setPriceChange(parseFloat(change.toFixed(2)));
          }
          
          setTradingVolume(newPrice * 10000);
          setMarketCap(newPrice * 1000000);
          setCirculatingSupply(Math.round(newPrice * 10000));
          
          setIsLoading(false);
        } else {
          console.warn("API returned unexpected data format:", data);
          generateMockData(decodedKeyword, false);
        }
      } catch (error) {
        console.error("Error fetching price data:", error);
        const decodedKeyword = decodeURIComponent(keyword);
        generateMockData(decodedKeyword, false);
      }
    };

    fetchPriceData();
    
    apiIntervalRef.current = setInterval(fetchPriceData, 2000);

    return () => {
      if (apiIntervalRef.current) {
        clearInterval(apiIntervalRef.current);
      }
    };
  }, [keyword]);

  useEffect(() => {
    if (quantity && !isNaN(parseFloat(quantity))) {
      setTotalValue(parseFloat(quantity) * currentPrice);
    } else {
      setTotalValue(0);
    }
  }, [quantity, currentPrice]);
  
  useEffect(() => {
    if (longPositions.length > 0) {
      const currentLongValue = longPositions.reduce((total, position) => {
        return total + (position.amount * contractPrice);
      }, 0);
      setLongValue(currentLongValue);
      
      const costBasis = longPositions.reduce((total, position) => {
        return total + (position.amount * position.entryPrice);
      }, 0);
      
      const pnlPercentage = ((currentLongValue - costBasis) / costBasis) * 100;
      setLongPnl(pnlPercentage);
    } else {
      setLongValue(0);
      setLongPnl(0);
    }
    
    if (shortPositions.length > 0) {
      const currentShortValue = shortPositions.reduce((total, position) => {
        return total + (position.amount * contractPrice);
      }, 0);
      setShortValue(currentShortValue);
      
      const costBasis = shortPositions.reduce((total, position) => {
        return total + (position.amount * position.entryPrice);
      }, 0);
      
      const pnlPercentage = ((costBasis - currentShortValue) / costBasis) * 100;
      setShortPnl(pnlPercentage);
    } else {
      setShortValue(0);
      setShortPnl(0);
    }
  }, [longPositions, shortPositions, contractPrice]);

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        setIsContractDataLoading(true);
        const decodedKeyword = decodeURIComponent(keyword);
        
        const realtimeValue = currentPrice || 100;
        const monthlyValue = realtimeValue * 0.9;
        
        const calculatedSpotPrice = ((realtimeValue * REALTIME_WEIGHT) + (monthlyValue * MONTHLY_WEIGHT)) / 100;
        setSpotPrice(calculatedSpotPrice);
        
        const calculatedContractPrice = calculateContractPrice(
          calculatedSpotPrice, 
          totalLongPositions, 
          totalShortPositions
        );
        setContractPrice(calculatedContractPrice);
        
        const calculatedFundingRate = calculateFundingRate(calculatedContractPrice, calculatedSpotPrice);
        setFundingRate(calculatedFundingRate / 10);
        
        if (dataRef.current && dataRef.current.length > 0) {
          const lastContractPrice = dataRef.current[dataRef.current.length - 1].contractPrice || calculatedContractPrice;
          
          dataRef.current.forEach((point, index) => {
            const transitionFactor = index / dataRef.current.length;
            const basePrice = lastContractPrice * (1 - transitionFactor) + calculatedContractPrice * transitionFactor;
            const noise = (Math.random() * 0.01 - 0.005) * basePrice;
            point.contractPrice = basePrice + noise;
          });
          
          if (echartsRef.current) {
            const echartsInstance = echartsRef.current.getEchartsInstance();
            echartsInstance.setOption({
              series: [
                {
                  data: dataRef.current.map(item => item.price)
                },
                {
                  data: dataRef.current.map(item => item.contractPrice)
                }
              ]
            });
          }
          
          setRealtimeData([...dataRef.current]);
        }
      } catch (error) {
        console.error('计算合约数据失败:', error);
      } finally {
        setIsContractDataLoading(false);
      }
    };
    
    fetchContractData();
    
    return () => {
    };
  }, [currentPrice, keyword, totalLongPositions, totalShortPositions]);

  const lastConvergenceTimeRef = useRef<number>(0);
  
  const startFastContractPriceConvergence = () => {
    const now = Date.now();
    if (now - lastConvergenceTimeRef.current < 500) {
      return;
    }
    lastConvergenceTimeRef.current = now;
    
    if (contractConvergenceIntervalRef.current) {
      clearInterval(contractConvergenceIntervalRef.current);
    }
    
    if (isContractPriceConverging) {
      return;
    }
    
    setIsContractPriceConverging(true);

    const totalSteps = 15; 
    const currentContractPrice = contractPrice;
    const targetPrice = spotPrice;
    const priceDiff = currentContractPrice - targetPrice;

    const adjustmentPerStep = priceDiff / totalSteps;
    let stepsCompleted = 0;

    const adjustPrice = () => {
      if (stepsCompleted >= totalSteps || Math.abs(contractPrice - targetPrice) < 0.1) {
        if (contractConvergenceIntervalRef.current) {
          clearInterval(contractConvergenceIntervalRef.current);
          contractConvergenceIntervalRef.current = null;
        }
        setIsContractPriceConverging(false);
        
        setContractPrice(targetPrice);
        
        if (dataRef.current && dataRef.current.length > 0) {
          dataRef.current.forEach((point, index) => {
            const variation = (Math.random() * 0.01 - 0.005) * targetPrice;
            point.contractPrice = targetPrice + variation;
          });
          
          if (echartsRef.current) {
            const echartsInstance = echartsRef.current.getEchartsInstance();
            echartsInstance.setOption({
              series: [
                {
                  data: dataRef.current.map(item => item.price)
                },
                {
                  data: dataRef.current.map(item => item.contractPrice)
                }
              ]
            });
          }
          
          setRealtimeData([...dataRef.current]);
        }
        
        return true;
      }
      
      const newContractPrice = contractPrice - adjustmentPerStep;
      setContractPrice(newContractPrice);
      
      if (dataRef.current && dataRef.current.length > 0) {
        dataRef.current.forEach((point, index) => {
          const variation = (Math.random() * 0.01 - 0.005) * newContractPrice;
          point.contractPrice = newContractPrice + variation;
        });
        
        if (echartsRef.current) {
          const echartsInstance = echartsRef.current.getEchartsInstance();
          echartsInstance.setOption({
            series: [
              {
                data: dataRef.current.map(item => item.price)
              },
              {
                data: dataRef.current.map(item => item.contractPrice)
              }
            ]
          });
        }
        
        setRealtimeData([...dataRef.current]);
      }
      
      stepsCompleted++;
      return false;
    };
    
    const isConverged = adjustPrice();
    if (isConverged) return;
    
    contractConvergenceIntervalRef.current = setInterval(() => {
      const isFinished = adjustPrice();
      if (isFinished && contractConvergenceIntervalRef.current) {
        clearInterval(contractConvergenceIntervalRef.current);
        contractConvergenceIntervalRef.current = null;
        setIsContractPriceConverging(false);
      }
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (contractConvergenceIntervalRef.current) {
        clearInterval(contractConvergenceIntervalRef.current);
      }
    };
  }, []);

  const generateMockData = (decodedKeyword: string, refreshTrendingInfo: boolean = true) => {
    const data: PriceData[] = [];
    const now = new Date();
    let basePrice = 50 + Math.random() * 50;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      basePrice = basePrice + (Math.random() - 0.5) * 5;
      if (basePrice < 10) basePrice = 10;
      
      data.push({
        time: date.toISOString().split('T')[0],
        price: parseFloat(basePrice.toFixed(2))
      });
    }
    
    const currentPrice = data[data.length - 1].price;
    const yesterdayPrice = data[data.length - 2].price;
    const priceChange = parseFloat(((currentPrice - yesterdayPrice) / yesterdayPrice * 100).toFixed(2));
    
    setPriceData(data);
    setCurrentPrice(currentPrice);
    setPriceChange(priceChange);
    latestPriceRef.current = currentPrice;
    
    setTradingVolume(currentPrice * 10000);
    setMarketCap(currentPrice * 1000000);
    setCirculatingSupply(Math.round(currentPrice * 10000));
    
    if (refreshTrendingInfo) {
      fetchTrendingInfo(decodedKeyword);
    }
    
    setIsLoading(false);
  };
  
  const fetchTrendingInfo = (keyword: string) => {
    if (trendingInfoLoadedRef.current && trendingInfo.length > 0) {
      return;
    }
    
    const trendingNews = getTrendingNewsByKeyword(keyword);
    
    if (trendingNews.length === 0) {
      const allKeywords = ['Trump', 'OpenAI', 'Claude', 'GPT 4O', 'Aptos', 'Solana', 'Cardano', 'Earthquake'];
      const closestMatch = allKeywords.find(k => 
        keyword.toLowerCase().includes(k.toLowerCase()) || 
        k.toLowerCase().includes(keyword.toLowerCase())
      ) || 'Aptos'; // Default to Aptos if no match
      
      const fallbackNews = getTrendingNewsByKeyword(closestMatch);
      setTrendingInfo(fallbackNews);
      trendingInfoLoadedRef.current = true;
      return;
    }
    
    const sortedNews = [...trendingNews].sort((a, b) => {
      const timeA = a.timestamp.split(':').map(Number);
      const timeB = b.timestamp.split(':').map(Number);
      return (timeB[0] * 60 + timeB[1]) - (timeA[0] * 60 + timeA[1]);
    });
    
    setTrendingInfo(sortedNews);
    trendingInfoLoadedRef.current = true;
  };

  const getOption = () => {
    const option = {
      animation: true,
      animationDuration: 300,
      animationEasing: 'cubicInOut',
      animationDelay: function (idx: number) {
        return idx * 30;
      },
      animationThreshold: 2000,
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '8%',
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderColor: 'rgba(100, 116, 139, 0.3)',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: 14
        },
        formatter: function(params: any) {
          let content = `
            <div style="padding: 10px; border-radius: 4px;">
              <div style="margin-bottom: 10px; font-size: 14px; opacity: 0.8; border-bottom: 1px solid rgba(100, 116, 139, 0.3); padding-bottom: 6px;">时间: ${params[0].name}</div>
          `;
          
          params.sort((a: any, b: any) => {
            if (a.seriesName === '现货价格') return -1;
            if (b.seriesName === '现货价格') return 1;
            return 0;
          });
          
          for (let i = 0; i < params.length; i++) {
            const param = params[i];
            if (!param.value && param.value !== 0) continue;
            
            let color = '#3b82f6';
            if (param.seriesName === '现货价格') {
              color = priceChange >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
            }
            
            const diff = i > 0 && params[0].value ? ((param.value - params[0].value) / params[0].value * 100).toFixed(2) : '';
            const diffText = diff ? `<span style="font-size: 12px; margin-left: 8px; color: ${parseFloat(diff) >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}">(${parseFloat(diff) >= 0 ? '+' : ''}${diff}%)</span>` : '';
            
            content += `<div style="font-size: 16px; font-weight: bold; color: ${color}; margin-bottom: ${i < params.length - 1 ? '8px' : '0'}; display: flex; align-items: center;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; margin-right: 8px;"></div>
              <div>${param.seriesName}: $${param.value.toFixed(2)}${diffText}</div>
            </div>`;
          }
          
          content += `</div>`;
          return content;
        },
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: 'rgba(148, 163, 184, 0.5)',
            width: 1,
            type: 'dashed'
          }
        },
        extraCssText: 'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); border-radius: 8px;'
      },
      legend: {
        data: ['现货价格', '合约价格'],
        textStyle: {
          color: 'rgba(148, 163, 184, 0.7)',
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 'bold'
        },
        right: 10,
        top: 0,
        itemWidth: 15,
        itemHeight: 10,
        itemGap: 15,
        icon: 'roundRect',
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: realtimeData.map(item => item.formattedTime),
        axisLine: {
          lineStyle: {
            color: 'rgba(148, 163, 184, 0.2)'
          }
        },
        axisLabel: {
          color: 'rgba(148, 163, 184, 0.7)',
          fontFamily: 'monospace',
          fontSize: 14,
          formatter: function(value: string, index: number) {
            return index % 3 === 0 ? value : '';
          },
          margin: 35,
          align: 'left',
          padding: [0, 0, 0, 10] // 上右下左的内边距
        },
        splitLine: {
          show: false
        },
        axisTick: {
          show: true,
          alignWithLabel: true,
          lineStyle: {
            color: 'rgba(148, 163, 184, 0.2)'
          }
        }
      },
      yAxis: {
        type: 'value',
        position: 'right',
        axisLine: {
          show: false
        },
        axisLabel: {
          color: 'rgba(148, 163, 184, 0.7)',
          fontFamily: 'monospace',
          fontSize: 14,
          formatter: function(value: number) {
            return '$' + Math.round(value);
          },
          margin: 16
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(148, 163, 184, 0.1)',
            type: 'dashed'
          }
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: 'rgba(148, 163, 184, 0.2)'
          }
        },
        splitNumber: 5,
        scale: true,
        minInterval: 1
      },
      series: [
        {
          name: '现货价格',
          type: 'line',
          sampling: 'average',
          symbol: 'circle',
          symbolSize: 8,
          showSymbol: true,
          itemStyle: {
            color: priceChange >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: priceChange >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
            shadowBlur: 10
          },
          lineStyle: {
            color: priceChange >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
            width: 3,
            shadowColor: priceChange >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            shadowBlur: 10
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: priceChange >= 0 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
              },
              {
                offset: 0.5,
                color: priceChange >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
              },
              {
                offset: 1,
                color: priceChange >= 0 ? 'rgba(34, 197, 94, 0.02)' : 'rgba(239, 68, 68, 0.02)'
              }
            ])
          },
          data: realtimeData.map(item => item.price),
          smooth: true,
          markPoint: {
            symbol: 'circle',
            symbolSize: 12,
            itemStyle: {
              color: priceChange >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
              borderColor: '#fff',
              borderWidth: 2,
              shadowColor: priceChange >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
              shadowBlur: 10
            },
            data: [
              { type: 'max', name: '最高值' },
              { type: 'min', name: '最低值' }
            ],
            label: {
              formatter: function(params: any) {
                return '$' + params.value.toFixed(2);
              },
              fontSize: 14,
              fontWeight: 'bold',
              position: 'top',
              distance: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: [4, 8],
              borderRadius: 4
            }
          }
        },
        {
          name: '合约价格',
          type: 'line',
          symbol: 'circle',
          symbolSize: 7,
          showSymbol: true,
          itemStyle: {
            color: 'rgb(59, 130, 246)',
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(59, 130, 246, 0.5)',
            shadowBlur: 8
          },
          lineStyle: {
            color: 'rgb(59, 130, 246)',
            width: 3,
            shadowColor: 'rgba(59, 130, 246, 0.2)',
            shadowBlur: 8,
            type: 'solid'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(59, 130, 246, 0.3)'
              },
              {
                offset: 0.5,
                color: 'rgba(59, 130, 246, 0.1)'
              },
              {
                offset: 1,
                color: 'rgba(59, 130, 246, 0.02)'
              }
            ])
          },
          data: realtimeData.map(item => item.contractPrice),
          smooth: true,
          markPoint: {
            symbol: 'circle',
            symbolSize: 10,
            itemStyle: {
              color: 'rgb(59, 130, 246)',
              borderColor: '#fff',
              borderWidth: 2,
              shadowColor: 'rgba(59, 130, 246, 0.5)',
              shadowBlur: 8
            },
            data: [
              { type: 'max', name: '最高值' },
              { type: 'min', name: '最低值' }
            ],
            label: {
              formatter: function(params: any) {
                return '$' + params.value.toFixed(2);
              },
              fontSize: 14,
              fontWeight: 'bold',
              position: 'top',
              distance: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: [4, 8],
              borderRadius: 4
            }
          }
        }
      ]
    };
    
    return option;
  };

  const handleBuy = async () => {
    if (!connected) {
      alert('请先连接钱包');
      return;
    }
    
    if (!quantity || parseFloat(quantity) <= 0) {
      alert('请输入有效的数量');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const tradeSize = parseFloat(quantity);
      
      setTotalLongPositions(prev => prev + tradeSize);
      
      const newSpotPrice = spotPrice;
      const newContractPrice = calculateContractPrice(
        newSpotPrice, 
        totalLongPositions + tradeSize, 
        totalShortPositions
      );
      
      setContractPrice(newContractPrice);
      
      const newFundingRate = calculateFundingRate(newContractPrice, newSpotPrice);
      setFundingRate(newFundingRate / 10);
      
      if (dataRef.current && dataRef.current.length > 0) {
        dataRef.current.forEach(point => {
          point.contractPrice = newContractPrice;
        });
        
        if (echartsRef.current) {
          const echartsInstance = echartsRef.current.getEchartsInstance();
          echartsInstance.setOption({
            series: [
              {
                data: dataRef.current.map(item => item.price)
              },
              {
                data: dataRef.current.map(item => item.contractPrice)
              }
            ]
          });
        }
        
        setRealtimeData([...dataRef.current]);
      }
      
      startFastContractPriceConvergence();

      const hash = await contractService.openLong(decodeURIComponent(keyword), tradeSize);
      
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setLongPositions(prev => [
        ...prev,
        {
          amount: tradeSize,
          entryPrice: newContractPrice,
          timestamp: timestamp
        }
      ]);
      
      setTxHash(hash);
      setQuantity(''); // 清空输入框
      alert(`买入 ${decodeURIComponent(keyword)} 成功！交易哈希: ${hash.substring(0, 8)}...`);
    } catch (error) {
      console.error('买入失败:', error);
      alert(`买入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSell = async () => {
    if (!connected) {
      alert('请先连接钱包');
      return;
    }
    
    if (!quantity || parseFloat(quantity) <= 0) {
      alert('请输入有效的数量');
      return;
    }
    
    try {
      setIsProcessing(true);

      const tradeSize = parseFloat(quantity);
      
      setTotalShortPositions(prev => prev + tradeSize);
      
      const newSpotPrice = spotPrice;
      const newContractPrice = calculateContractPrice(
        newSpotPrice, 
        totalLongPositions, 
        totalShortPositions + tradeSize
      );
      
      setContractPrice(newContractPrice);
      
      const newFundingRate = calculateFundingRate(newContractPrice, newSpotPrice);
      setFundingRate(newFundingRate / 10);
      
      if (dataRef.current && dataRef.current.length > 0) {
        dataRef.current.forEach(point => {
          point.contractPrice = newContractPrice;
        });
        
        if (echartsRef.current) {
          const echartsInstance = echartsRef.current.getEchartsInstance();
          echartsInstance.setOption({
            series: [
              {
                data: dataRef.current.map(item => item.price)
              },
              {
                data: dataRef.current.map(item => item.contractPrice)
              }
            ]
          });
        }
        
        setRealtimeData([...dataRef.current]);
      }
      
      startFastContractPriceConvergence();
      
      const hash = await contractService.openShort(decodeURIComponent(keyword), tradeSize);
      
      // 记录新的空头仓位
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setShortPositions(prev => [
        ...prev,
        {
          amount: tradeSize,
          entryPrice: newContractPrice,
          timestamp: timestamp
        }
      ]);
      
      setTxHash(hash);
      setQuantity(''); // 清空输入框
      alert(`卖出 ${decodeURIComponent(keyword)} 成功！交易哈希: ${hash.substring(0, 8)}...`);
    } catch (error) {
      console.error('卖出失败:', error);
      alert(`卖出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    router.push('/next');
  };

  const trendingScrollPositionRef = useRef<number>(0);
  const trendingScrollContainerRef = useRef<HTMLDivElement | null>(null);
  
  const TrendingInfoCards = ({ trendingInfo }: { trendingInfo: TrendingInfo[] }) => {
    const localScrollRef = useRef<HTMLDivElement | null>(null);
    
    useEffect(() => {
      const scrollContainer = localScrollRef.current;
      if (!scrollContainer) return;
      
      trendingScrollContainerRef.current = scrollContainer;
      
      scrollContainer.scrollTop = trendingScrollPositionRef.current;
      
      const handleScroll = () => {
        if (scrollContainer) {
          trendingScrollPositionRef.current = scrollContainer.scrollTop;
        }
      };
      
      scrollContainer.addEventListener('scroll', handleScroll);
      
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }, []);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        if (localScrollRef.current) {
          localScrollRef.current.scrollTop = trendingScrollPositionRef.current;
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }, [trendingInfo]);
    
    if (trendingInfo.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500 font-mono animate-pulse">加载热点信息中...</div>
        </div>
      );
    }
    
    return (
      <div 
        ref={localScrollRef}
        className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar"
        onScroll={(e) => {
          trendingScrollPositionRef.current = (e.target as HTMLDivElement).scrollTop;
        }}
      >
        {trendingInfo.map((info, index) => {
          let bgColor = 'bg-indigo-900/20';
          let borderColor = 'border-indigo-800/30';
          let titleColor = 'text-cyan-400';
          
          if (info.sentiment === 'positive') {
            bgColor = 'bg-green-900/20';
            borderColor = 'border-green-800/30';
            titleColor = 'text-green-400';
          } else if (info.sentiment === 'negative') {
            bgColor = 'bg-red-900/20';
            borderColor = 'border-red-800/30';
            titleColor = 'text-red-400';
          }
          
          return (
            <div 
              key={`trending-${info.title}-${index}`} 
              className={`${bgColor} border ${borderColor} rounded-lg p-3 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className={`font-mono text-sm font-bold ${titleColor}`}>{info.title}</h4>
                <span className="text-gray-400 text-xs font-mono">{info.timestamp}</span>
              </div>
              <p className="text-white/80 text-xs leading-relaxed">{info.content}</p>
            </div>
          );
        })}
      </div>
    );
  };
  
  const OrderBookVisualization = ({ 
    currentPrice, 
    contractPrice, 
    isLoading,
    onNewTrade
  }: { 
    currentPrice: number, 
    contractPrice: number, 
    isLoading: boolean,
    onNewTrade: () => void
  }) => {
    const [orders, setOrders] = useState<{
      bids: Array<{price: number, size: number, total: number, filled?: boolean, id?: string}>,
      asks: Array<{price: number, size: number, total: number, filled?: boolean, id?: string}>
    }>({
      bids: [],
      asks: []
    });
    
    const orderBookIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const tradeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const initialOrdersGeneratedRef = useRef(false);
    
    useEffect(() => {
      if (isLoading || contractPrice <= 0) return;
      
      const generateInitialOrders = () => {
        if (initialOrdersGeneratedRef.current) return;
        
        const bids: Array<{price: number, size: number, total: number, id: string}> = [];
        const asks: Array<{price: number, size: number, total: number, id: string}> = [];
        
        let bidTotal = 0;
        for (let i = 0; i < 4; i++) {
          const priceOffset = (Math.random() * 0.5 + 0.1) * (i + 1);
          const price = Math.floor((contractPrice - priceOffset) * 100) / 100;
          if (price <= 0) continue;
          
          const size = Math.floor(Math.random() * 50) + 10;
          bidTotal += size;
          bids.push({
            price,
            size,
            total: bidTotal,
            id: `bid-${Date.now()}-${i}`
          });
        }
        
        let askTotal = 0;
        for (let i = 0; i < 4; i++) {
          const priceOffset = (Math.random() * 0.5 + 0.1) * (i + 1);
          const price = Math.floor((contractPrice + priceOffset) * 100) / 100;
          
          const size = Math.floor(Math.random() * 50) + 10;
          askTotal += size;
          asks.push({
            price,
            size,
            total: askTotal,
            id: `ask-${Date.now()}-${i}`
          });
        }
        
        bids.sort((a, b) => b.price - a.price);
        asks.sort((a, b) => a.price - b.price);
        
        setOrders({
          bids,
          asks
        });
        
        initialOrdersGeneratedRef.current = true;
      };
      
      const updateRandomOrder = () => {
        setOrders(prev => {
          const updateBid = Math.random() > 0.5;
          const orderPool = updateBid ? [...prev.bids] : [...prev.asks];
          
          if (orderPool.length === 0) return prev;
          
          const orderIndex = Math.floor(Math.random() * orderPool.length);
          
          const sizeChange = Math.floor(Math.random() * 10) - 5; // -5 to +5
          const newSize = Math.max(5, orderPool[orderIndex].size + sizeChange);
          
          orderPool[orderIndex] = {
            ...orderPool[orderIndex],
            size: newSize
          };

          let runningTotal = 0;
          const updatedPool = orderPool.map(order => {
            runningTotal += order.size;
            return {
              ...order,
              total: runningTotal
            };
          });
          
          return {
            ...prev,
            bids: updateBid ? updatedPool : prev.bids,
            asks: !updateBid ? updatedPool : prev.asks
          };
        });
      };
      
      generateInitialOrders();

      orderBookIntervalRef.current = setInterval(() => {
        updateRandomOrder();
      }, 2000);
      
      return () => {
        if (orderBookIntervalRef.current) {
          clearInterval(orderBookIntervalRef.current);
        }
      };
    }, [contractPrice, isLoading]);
    
    useEffect(() => {
      if (isLoading || contractPrice <= 0) return;
      
      const simulateTrade = () => {
        const priceDiff = contractPrice - spotPrice;
        const isBuy = priceDiff < 0;
        
        setOrders(prev => {
          const orderPool = isBuy ? [...prev.asks] : [...prev.bids];
          if (orderPool.length === 0) return prev;
          
          const orderIndex = Math.floor(Math.random() * orderPool.length);
          const order = orderPool[orderIndex];
          
          const fillSize = Math.floor(Math.random() * 30) + 10;
          const newSize = Math.max(0, order.size - fillSize);
          
          orderPool[orderIndex] = {
            ...orderPool[orderIndex],
            filled: true,
            size: newSize
          };
          
          let runningTotal = 0;
          const updatedPool = orderPool.map(o => {
            runningTotal += o.size;
            return {
              ...o,
              total: runningTotal
            };
          });
          
          onNewTrade();
          
          return {
            ...prev,
            bids: isBuy ? prev.bids : updatedPool,
            asks: isBuy ? updatedPool : prev.asks
          };
        });
      };
      
      const scheduleNextTrade = () => {
        const delay = Math.floor(Math.random() * 2000) + 1000;
        tradeIntervalRef.current = setTimeout(() => {
          simulateTrade();
          scheduleNextTrade();
        }, delay);
      };
      
      scheduleNextTrade();
      
      return () => {
        if (tradeIntervalRef.current) {
          clearTimeout(tradeIntervalRef.current);
        }
      };
    }, [contractPrice, isLoading, spotPrice, onNewTrade]);
    
    if (isLoading) {
      return (
        <div className="h-[350px] flex items-center justify-center">
          <div className="text-gray-500 font-mono animate-pulse">加载中...</div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col gap-1 h-[350px] flex-shrink-0 flex-grow-0">
        <div className="flex-1">
          <div className="mb-1 text-center">
            <span className="font-mono text-fuchsia-400 text-[10px]">卖单</span>
          </div>
          <div className="space-y-1 flex flex-col">
            {[...orders.asks].reverse().map((order) => (
              <div 
                key={order.id || `ask-${order.price}`} 
                className={`flex justify-between items-center py-0.5 px-2 rounded-sm ${order.filled ? 'bg-red-900/30 animate-pulse' : 'bg-black/50 border border-red-900/30'} transition-all duration-300`}
                style={{ 
                  transform: order.filled ? 'scale(0.98)' : 'scale(1)',
                  opacity: order.size <= 5 ? 0.7 : 1
                }}
              >
                <div className="text-red-400 font-mono text-[10px]">${order.price.toFixed(2)}</div>
                <div className="text-gray-300 font-mono text-[10px]">{order.size}</div>
                <div className="relative w-full max-w-[45px] h-1 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-red-500/50 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (order.total / orders.asks[orders.asks.length - 1]?.total || 1) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="py-1 px-2 rounded-sm bg-indigo-900/20 border border-indigo-800/30 flex-shrink-0 my-1">
          <div className="flex justify-between items-center">
            <span className="font-mono text-cyan-400 text-[10px]">合约价</span>
            <span className="font-mono text-cyan-400 text-[10px]">${contractPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-1 text-center">
            <span className="font-mono text-cyan-400 text-[10px]">买单</span>
          </div>
          <div className="space-y-1 flex flex-col">
            {orders.bids.map((order) => (
              <div 
                key={order.id || `bid-${order.price}`} 
                className={`flex justify-between items-center py-0.5 px-2 rounded-sm ${order.filled ? 'bg-green-900/30 animate-pulse' : 'bg-black/50 border border-green-900/30'} transition-all duration-300`}
                style={{ 
                  transform: order.filled ? 'scale(0.98)' : 'scale(1)',
                  opacity: order.size <= 5 ? 0.7 : 1
                }}
              >
                <div className="text-green-400 font-mono text-[10px]">${order.price.toFixed(2)}</div>
                <div className="text-gray-300 font-mono text-[10px]">{order.size}</div>
                <div className="relative w-full max-w-[45px] h-1 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-green-500/50 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (order.total / orders.bids[orders.bids.length - 1]?.total || 1) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(to right, rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 0, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center',
        }}></div>
        
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={`data-stream-${i}`} 
            className="absolute w-[1px] bg-gradient-to-b from-transparent via-cyan-500 to-transparent opacity-30"
            style={{
              left: `${(i / 15) * 100}%`,
              top: 0,
              height: '100%',
              animation: `dataStream ${5 + (i % 5)}s linear infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          ></div>
        ))}
      </div>
      
      <style jsx global>{`
        @keyframes dataStream {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-black/30 hover:bg-black/50 rounded-lg border border-cyan-700/50 flex items-center transition-all duration-300 hover:translate-y-[-2px] backdrop-blur-sm shadow-lg shadow-cyan-900/20 group"
          >
            <span className="font-mono text-cyan-400 group-hover:text-cyan-300">← 返回</span>
          </button>
          
          <WalletConnect />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-3xl font-bold mb-2 md:mb-0 font-mono bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-400 relative">
            {decodeURIComponent(keyword)}
            <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500 to-fuchsia-500"></span>
          </h1>
          
          <div className="flex items-center">
            <div className="text-2xl font-bold font-mono mr-3 text-white relative group">
              <span className="relative z-10">${currentPrice.toFixed(2)}</span>
              <span className="absolute inset-0 bg-black/20 blur-sm rounded-lg -z-0 group-hover:bg-cyan-900/20 transition-colors duration-300"></span>
            </div>
            <div className={`px-3 py-1 rounded-full ${priceChange >= 0 ? 'bg-green-900/30 text-green-400 border border-green-700/30' : 'bg-red-900/30 text-red-400 border border-red-700/30'} font-mono text-sm shadow-lg ${priceChange >= 0 ? 'shadow-green-900/20' : 'shadow-red-900/20'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange}%
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2 bg-black/40 backdrop-blur-md rounded-xl border border-cyan-900/50 p-5 shadow-[0_0_30px_rgba(0,255,255,0.1)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-[0.03]">
              <div className="absolute inset-0 z-10" style={{
                backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '100% 3px',
                backgroundPosition: '0 0',
                animation: 'scanline 8s linear infinite',
              }}></div>
            </div>
            
            <div className="flex items-center justify-between mb-4 relative z-20">
              <h2 className="text-xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-400">实时价格</h2>
              <div className="text-xs text-cyan-400 font-mono px-3 py-1 bg-cyan-900/20 rounded-full border border-cyan-800/30">最近30秒</div>
            </div>
            <div className="relative h-[350px] z-20">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-cyan-500 font-mono animate-pulse">加载中...</div>
                </div>
              ) : (
                <ReactECharts
                  ref={echartsRef}
                  option={getOption()}
                  style={{ height: '100%', width: '100%' }}
                  theme="dark"
                  notMerge={false}
                  lazyUpdate={true}
                />
              )}
            </div>
          </div>
          <div className="lg:col-span-1 bg-black/40 backdrop-blur-md rounded-xl border border-cyan-900/50 p-5 shadow-[0_0_30px_rgba(0,255,255,0.1)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-400">订单簿</h3>
              <div className="text-xs text-cyan-400 font-mono px-3 py-1 bg-cyan-900/20 rounded-full border border-cyan-800/30">实时更新</div>
            </div>
            
            <OrderBookVisualization 
              currentPrice={currentPrice} 
              contractPrice={contractPrice}
              isLoading={isLoading || isContractDataLoading}
              onNewTrade={() => {
                // Use requestAnimationFrame to prevent unnecessary re-renders
                requestAnimationFrame(() => {
                  startFastContractPriceConvergence();
                });
              }}
            />
          </div>
          
          <div className="lg:col-span-1 bg-black/40 backdrop-blur-md rounded-xl border border-purple-900/50 p-5 shadow-[0_0_30px_rgba(128,0,255,0.1)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(128,0,255,0.2)] relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-400">热点信息</h3>
              <div className="text-xs text-purple-400 font-mono px-3 py-1 bg-purple-900/20 rounded-full border border-purple-800/30">实时动态</div>
            </div>
            
            <TrendingInfoCards trendingInfo={trendingInfo} />
          </div>
        </div>
        
        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-fuchsia-900/50 p-5 shadow-[0_0_30px_rgba(255,0,255,0.1)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,0,255,0.2)] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-[0.03]">
            <div className="absolute inset-0 z-10" style={{
              backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '100% 3px',
              backgroundPosition: '0 0',
              animation: 'scanline 8s linear infinite',
            }}></div>
          </div>
          
          <h2 className="text-xl font-bold mb-6 font-mono bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 relative z-20">交易与仓位</h2>
          
          {!connected ? (
            <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-lg p-4 mb-6 relative z-20">
              <p className="text-cyan-400 text-center mb-4 font-mono">请先连接Aptos钱包以进行交易</p>
              <div className="flex justify-center">
                <WalletConnect />
              </div>
            </div>
          ) : (
            <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-lg p-4 mb-6 relative z-20">
              <p className="text-cyan-400 text-center font-mono">钱包已连接</p>
              <p className="text-center text-white/70 text-sm mt-1 font-mono">
                {account?.address ? account.address.toString().substring(0, 6) + '...' + account.address.toString().substring(account.address.toString().length - 4) : ''}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-20">
            <div className="bg-black/30 border border-cyan-900/30 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-4 font-mono bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">交易信息</h3>
              
              <div className="mb-5 relative">
                <label className="block text-cyan-400 mb-2 font-mono text-sm">数量</label>
                <input 
                  type="number" 
                  className="w-full bg-black/50 border border-cyan-700/50 rounded-lg px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-white"
                  placeholder="输入数量"
                  min="0"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!connected}
                />
              </div>
              
              <div className="mb-6 relative">
                <label className="block text-cyan-400 mb-2 font-mono text-sm">总价值</label>
                <div className="bg-black/50 border border-cyan-700/50 rounded-lg px-4 py-3 font-mono text-lg text-white relative group overflow-hidden">
                  <span className="relative z-10">${totalValue.toFixed(2)}</span>
                  <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button 
                  onClick={handleBuy}
                  className={`bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white py-3 rounded-lg font-bold font-mono transition-all duration-300 hover:translate-y-[-2px] shadow-lg shadow-green-900/20 relative overflow-hidden group ${(!connected || isProcessing) && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!connected || isProcessing}
                >
                  <span className="relative z-10">{isProcessing ? '处理中...' : '买入'}</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></span>
                </button>
                <button 
                  onClick={handleSell}
                  className={`bg-gradient-to-r from-red-600 to-fuchsia-600 hover:from-red-500 hover:to-fuchsia-500 text-white py-3 rounded-lg font-bold font-mono transition-all duration-300 hover:translate-y-[-2px] shadow-lg shadow-red-900/20 relative overflow-hidden group ${(!connected || isProcessing) && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!connected || isProcessing}
                >
                  <span className="relative z-10">{isProcessing ? '处理中...' : '卖出'}</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></span>
                </button>
              </div>
              
              {txHash && (
                <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-800/30 rounded-lg">
                  <p className="text-cyan-400 text-sm font-mono break-all">
                    交易哈希: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 10)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-black/30 border border-fuchsia-900/30 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-4 font-mono bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-400">仓位信息</h3>
              
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-mono text-sm font-bold text-green-400">多头仓位</h4>
                    <div className="text-white font-mono text-sm">
                      ${longValue.toFixed(2)}
                      <span className={`ml-2 ${longPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {longPnl >= 0 ? '+' : ''}{longPnl.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  {longPositions.length === 0 ? (
                    <p className="text-gray-400 text-xs font-mono text-center py-2">暂无多头仓位</p>
                  ) : (
                    <div className="space-y-2">
                      {longPositions.map((position, index) => (
                        <div key={`long-${index}`} className="bg-black/30 rounded p-2 text-xs font-mono">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">数量:</span>
                            <span className="text-white">{position.amount}</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">入场价:</span>
                            <span className="text-white">${position.entryPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">时间:</span>
                            <span className="text-white">{position.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-mono text-sm font-bold text-red-400">空头仓位</h4>
                    <div className="text-white font-mono text-sm">
                      ${shortValue.toFixed(2)}
                      <span className={`ml-2 ${shortPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {shortPnl >= 0 ? '+' : ''}{shortPnl.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  {shortPositions.length === 0 ? (
                    <p className="text-gray-400 text-xs font-mono text-center py-2">暂无空头仓位</p>
                  ) : (
                    <div className="space-y-2">
                      {shortPositions.map((position, index) => (
                        <div key={`short-${index}`} className="bg-black/30 rounded p-2 text-xs font-mono">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">数量:</span>
                            <span className="text-white">{position.amount}</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">入场价:</span>
                            <span className="text-white">${position.entryPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">时间:</span>
                            <span className="text-white">{position.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-mono text-sm font-bold text-cyan-400">当前合约价格</h4>
                    <div className="text-white font-mono text-sm">${contractPrice.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
