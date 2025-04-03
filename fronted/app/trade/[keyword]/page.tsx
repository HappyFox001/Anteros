"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import WalletConnect from "@/components/WalletConnect";
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useContractService } from "@/services/contractService";

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
      
      for (let i = MAX_DATA_POINTS; i >= 0; i--) {
        const timestamp = now - i * 2000;
        const randomFactor = 0.98 + Math.random() * 0.04;
        const price = initialPrice * randomFactor;
        const date = new Date(timestamp);
        const formattedTime = `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`;
        initialData.push({ timestamp, price, formattedTime });
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
          generateMockData(decodedKeyword);
        }
      } catch (error) {
        console.error("Error fetching price data:", error);
        const decodedKeyword = decodeURIComponent(keyword);
        generateMockData(decodedKeyword);
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
          dataRef.current.forEach(point => {
            point.contractPrice = calculatedContractPrice;
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

  const startFastContractPriceConvergence = () => {
    if (contractConvergenceIntervalRef.current) {
      clearInterval(contractConvergenceIntervalRef.current);
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
          dataRef.current.forEach(point => {
            point.contractPrice = targetPrice;
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
        
        return true; // 收敛完成
      }
      
      const newContractPrice = contractPrice - adjustmentPerStep;
      setContractPrice(newContractPrice);
      
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
      
      stepsCompleted++;
      return false; // 收敛未完成
    };
    
    const isConverged = adjustPrice();
    if (isConverged) return;
    
    // 设置定时器继续收敛 - 每200ms执行一次，共15次，总计3秒
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

  const generateMockData = (decodedKeyword: string) => {
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
    
    setIsLoading(false);
  };

  const getOption = () => {
    const option = {
      animation: true,
      animationDuration: 500,
      animationEasing: 'cubicOut',
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '5%',
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
            <div style="padding: 8px; border-radius: 4px;">
              <div style="margin-bottom: 8px; font-size: 14px; opacity: 0.8;">时间: ${params[0].name}</div>
          `;
          
          content += `<div style="font-size: 16px; font-weight: bold; color: ${priceChange >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}">现货价格: $${params[0].value.toFixed(2)}</div>`;
          
          if (params.length > 1 && params[1].value) {
            content += `<div style="font-size: 16px; font-weight: bold; color: #3b82f6">合约价格: $${params[1].value.toFixed(2)}</div>`;
          }
          
          content += `</div>`;
          return content;
        },
        extraCssText: 'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); border-radius: 8px;'
      },
      legend: {
        data: ['现货价格', '合约价格'],
        textStyle: {
          color: 'rgba(148, 163, 184, 0.7)'
        },
        right: 10,
        top: 0
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
          margin: 14
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisLabel: {
          color: 'rgba(148, 163, 184, 0.7)',
          fontFamily: 'monospace',
          fontSize: 14,
          formatter: function(value: number) {
            return '$' + value.toFixed(2);
          },
          margin: 16
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(148, 163, 184, 0.1)',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: '现货价格',
          type: 'line',
          sampling: 'average',
          symbol: 'circle',
          symbolSize: 8,
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
          symbolSize: 6,
          itemStyle: {
            color: 'rgb(59, 130, 246)',
            borderColor: '#fff',
            borderWidth: 2
          },
          lineStyle: {
            color: 'rgb(59, 130, 246)',
            width: 2,
            type: 'dashed'
          },
          data: realtimeData.map(item => item.contractPrice),
          smooth: true
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
      
      // 在发送交易前，先在前端更新合约价格
      const tradeSize = parseFloat(quantity);
      
      // 更新多仓位
      setTotalLongPositions(prev => prev + tradeSize);
      
      // 计算新的合约价格
      const newSpotPrice = spotPrice;
      const newContractPrice = calculateContractPrice(
        newSpotPrice, 
        totalLongPositions + tradeSize, 
        totalShortPositions
      );
      
      // 立即更新UI
      setContractPrice(newContractPrice);
      
      // 计算新的资金费率
      const newFundingRate = calculateFundingRate(newContractPrice, newSpotPrice);
      setFundingRate(newFundingRate / 10);
      
      // 更新图表
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
      
      // 启动快速合约价格收敛过程 - 5秒内收敛
      startFastContractPriceConvergence();
      
      // 发送实际交易到区块链
      const hash = await contractService.openLong(decodeURIComponent(keyword), tradeSize);
      setTxHash(hash);
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
      
      // 更新空仓位
      setTotalShortPositions(prev => prev + tradeSize);
      
      // 计算新的合约价格
      const newSpotPrice = spotPrice;
      const newContractPrice = calculateContractPrice(
        newSpotPrice, 
        totalLongPositions, 
        totalShortPositions + tradeSize
      );
      
      // 立即更新UI
      setContractPrice(newContractPrice);
      
      // 计算新的资金费率
      const newFundingRate = calculateFundingRate(newContractPrice, newSpotPrice);
      setFundingRate(newFundingRate / 10);
      
      // 更新图表
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
      
      // 启动快速合约价格收敛过程 - 5秒内收敛
      startFastContractPriceConvergence();
      
      // 发送实际交易到区块链
      const hash = await contractService.openShort(decodeURIComponent(keyword), tradeSize);
      setTxHash(hash);
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
      bids: Array<{price: number, size: number, total: number, filled?: boolean}>,
      asks: Array<{price: number, size: number, total: number, filled?: boolean}>
    }>({
      bids: [],
      asks: []
    });
    
    const orderBookIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const tradeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // 生成模拟订单
    useEffect(() => {
      if (isLoading || contractPrice <= 0) return;
      
      const generateOrders = () => {
        const bids: Array<{price: number, size: number, total: number}> = [];
        const asks: Array<{price: number, size: number, total: number}> = [];
        
        // 生成买单 - 基于合约价格而非现货价格
        let bidTotal = 0;
        for (let i = 0; i < 5; i++) {
          const priceOffset = (Math.random() * 0.5 + 0.1) * (i + 1);
          const price = Math.floor((contractPrice - priceOffset) * 100) / 100;
          if (price <= 0) continue;
          
          const size = Math.floor(Math.random() * 50) + 10;
          bidTotal += size;
          bids.push({
            price,
            size,
            total: bidTotal
          });
        }
        
        // 生成卖单 - 基于合约价格而非现货价格
        let askTotal = 0;
        for (let i = 0; i < 5; i++) {
          const priceOffset = (Math.random() * 0.5 + 0.1) * (i + 1);
          const price = Math.floor((contractPrice + priceOffset) * 100) / 100;
          
          const size = Math.floor(Math.random() * 50) + 10;
          askTotal += size;
          asks.push({
            price,
            size,
            total: askTotal
          });
        }
        
        // 按价格排序
        bids.sort((a, b) => b.price - a.price); // 买单从高到低
        asks.sort((a, b) => a.price - b.price); // 卖单从低到高
        
        setOrders(prev => ({
          ...prev,
          bids,
          asks
        }));
      };
      
      generateOrders();
      
      // 定期更新订单簿
      orderBookIntervalRef.current = setInterval(() => {
        generateOrders();
      }, 5000);
      
      return () => {
        if (orderBookIntervalRef.current) {
          clearInterval(orderBookIntervalRef.current);
        }
      };
    }, [contractPrice, isLoading]);
    
    // 模拟成交
    useEffect(() => {
      if (isLoading || contractPrice <= 0) return;
      
      const simulateTrade = () => {
        // 根据合约价格和现货价格的差异决定交易方向
        // 如果合约价格 > 现货价格，应该增加卖单成交（增加空仓）
        // 如果合约价格 < 现货价格，应该增加买单成交（增加多仓）
        const priceDiff = contractPrice - spotPrice;
        const isBuy = priceDiff < 0;
        
        // 从订单簿中选择一个订单
        const orderPool = isBuy ? [...orders.asks] : [...orders.bids];
        if (orderPool.length === 0) return;
        
        // 随机选择订单
        const orderIndex = Math.floor(Math.random() * orderPool.length);
        const order = orderPool[orderIndex];
        
        // 随机决定成交数量
        const fillSize = Math.floor(Math.random() * 30) + 10;
        
        setOrders(prev => {
          // 更新订单状态（标记为已成交）
          const updatedOrderPool = isBuy ? [...prev.asks] : [...prev.bids];
          if (updatedOrderPool[orderIndex]) {
            updatedOrderPool[orderIndex] = {
              ...updatedOrderPool[orderIndex],
              filled: true,
              size: updatedOrderPool[orderIndex].size - fillSize
            };
          }
          
          return {
            ...prev,
            bids: isBuy ? prev.bids : updatedOrderPool,
            asks: isBuy ? updatedOrderPool : prev.asks
          };
        });
      };
      
      // 随机时间间隔模拟成交
      const scheduleNextTrade = () => {
        const delay = Math.floor(Math.random() * 2000) + 1000; // 1-3秒
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
    }, [contractPrice, isLoading, orders, spotPrice]);
    
    if (isLoading) {
      return (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-gray-500 font-mono animate-pulse">加载中...</div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 买单区域 */}
        <div className="md:col-span-1">
          <div className="mb-2 text-center">
            <span className="text-xs font-mono text-cyan-400">买单 (合约)</span>
          </div>
          <div className="space-y-1">
            {orders.bids.map((order, index) => (
              <div 
                key={`bid-${index}`} 
                className={`flex justify-between items-center p-2 rounded-lg ${order.filled ? 'bg-green-900/30 animate-pulse' : 'bg-black/50 border border-green-900/30'} transition-colors`}
              >
                <div className="text-green-400 font-mono text-sm">${order.price.toFixed(2)}</div>
                <div className="text-gray-300 font-mono text-sm">{order.size}</div>
                <div className="relative w-full max-w-[80px] h-1 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-green-500/50 rounded-full"
                    style={{ width: `${Math.min(100, (order.total / orders.bids[orders.bids.length - 1]?.total || 1) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* 当前价格指示器 */}
          <div className="mt-4 p-2 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-cyan-400">现价</span>
              <span className="font-mono text-white">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs font-mono text-cyan-400">合约价</span>
              <span className="font-mono text-cyan-400">${contractPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* 卖单区域 */}
        <div className="md:col-span-1">
          <div className="mb-2 text-center">
            <span className="text-xs font-mono text-fuchsia-400">卖单 (合约)</span>
          </div>
          <div className="space-y-1">
            {orders.asks.map((order, index) => (
              <div 
                key={`ask-${index}`} 
                className={`flex justify-between items-center p-2 rounded-lg ${order.filled ? 'bg-red-900/30 animate-pulse' : 'bg-black/50 border border-red-900/30'} transition-colors`}
              >
                <div className="text-red-400 font-mono text-sm">${order.price.toFixed(2)}</div>
                <div className="text-gray-300 font-mono text-sm">{order.size}</div>
                <div className="relative w-full max-w-[80px] h-1 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-red-500/50 rounded-full"
                    style={{ width: `${Math.min(100, (order.total / orders.asks[orders.asks.length - 1]?.total || 1) * 100)}%` }}
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
      {/* Cyberpunk background grid */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(to right, rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 0, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center',
        }}></div>
        
        {/* Random data streams */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={`data-stream-${i}`} 
            className="absolute w-[1px] bg-gradient-to-b from-transparent via-cyan-500 to-transparent opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: 0,
              height: '100%',
              animation: `dataStream ${5 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 价格图表 */}
          <div className="lg:col-span-2 bg-black/40 backdrop-blur-md rounded-xl border border-cyan-900/50 p-5 shadow-[0_0_30px_rgba(0,255,255,0.1)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] relative overflow-hidden">
            {/* Scanline effect */}
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
          
          {/* 订单簿可视化 */}
          <div className="mt-6 border-t border-cyan-800/30 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-400">订单簿</h3>
              <div className="text-xs text-cyan-400 font-mono px-3 py-1 bg-cyan-900/20 rounded-full border border-cyan-800/30">实时更新</div>
            </div>
            
            <OrderBookVisualization 
              currentPrice={currentPrice} 
              contractPrice={contractPrice}
              isLoading={isLoading || isContractDataLoading}
              onNewTrade={startFastContractPriceConvergence}
            />
          </div>
        </div>
        
        {/* 交易面板 */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-fuchsia-900/50 p-5 shadow-[0_0_30px_rgba(255,0,255,0.1)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,0,255,0.2)] relative overflow-hidden">
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-[0.03]">
            <div className="absolute inset-0 z-10" style={{
              backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '100% 3px',
              backgroundPosition: '0 0',
              animation: 'scanline 8s linear infinite',
            }}></div>
          </div>
          
          <h2 className="text-xl font-bold mb-6 font-mono bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 relative z-20">交易</h2>
          
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
          
          <div className="mb-5 relative z-20">
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
          
          <div className="mb-6 relative z-20">
            <label className="block text-cyan-400 mb-2 font-mono text-sm">总价值</label>
            <div className="bg-black/50 border border-cyan-700/50 rounded-lg px-4 py-3 font-mono text-lg text-white relative group overflow-hidden">
              <span className="relative z-10">${totalValue.toFixed(2)}</span>
              <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-8 relative z-20">
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
            <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-800/30 rounded-lg relative z-20">
              <p className="text-cyan-400 text-sm font-mono break-all">
                交易哈希: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 10)}
              </p>
            </div>
          )}
          

        </div>
      </div>
    </div>
  );
}
