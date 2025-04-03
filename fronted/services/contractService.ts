import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { InputTransactionData } from '@aptos-labs/wallet-adapter-core';

const CONTRACT_ADDRESS = '0x0fb40f927acef2e907ca2743bd0bbc6ee2439d7f6c3f08d04f98746683e1f3bd'; // 使用实际的地址替换
const MODULE_NAME = 'trend_trading';

const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET
});
const aptos = new Aptos(aptosConfig);


const globalCache: {
  contractPrice?: { value: number; timestamp: number };
  spotPrices: Record<string, { value: number; timestamp: number }>;
  fundingRates: Record<string, { value: number; timestamp: number }>;
} = {
  spotPrices: {},
  fundingRates: {}
};

const CACHE_TTL = 20000; // 20秒

const isCacheValid = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_TTL;
};

export interface ContractService {
  openLong: (keyword: string, size: number) => Promise<string>;
  openShort: (keyword: string, size: number) => Promise<string>;
  getContractPrice: () => Promise<number>;
  getFundingRate: (keyword: string) => Promise<number>;
  getUserPosition: (userAddress: string) => Promise<{size: number, isLong: boolean, entryPrice: number}>;
  getSpotPrice: (keyword: string) => Promise<number>;
  updateTrendData: (keyword: string, realtimeValue: number, monthlyValue: number, note: string) => Promise<void>;
}

export const useContractService = (): ContractService => {
  const { account, signAndSubmitTransaction } = useWallet();

  const openLong = async (keyword: string, size: number): Promise<string> => {
    if (!account?.address) {
      throw new Error('钱包未连接');
    }
    console.log(1)
    try {
      // 构建交易
      const transaction = ({
        sender: account.address,
        data: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::open_position`,
          functionArguments: [
            keyword,
            BigInt(Math.floor(size)),
            true
          ],
        },
      });
      console.log(2)
      
      // 直接传递transaction对象给钱包适配器
      const pendingTxn = await signAndSubmitTransaction(transaction as InputTransactionData);
      
      console.log(3)
      // 等待交易完成
      const committedTxn = await aptos.waitForTransaction({
        transactionHash: pendingTxn.hash
      });

      return committedTxn.hash;
    } catch (error: unknown) {
      console.error('做多操作失败:', error);
      throw error;
    }
  };

  const openShort = async (keyword: string, size: number): Promise<string> => {
    if (!account?.address) {
      throw new Error('钱包未连接');
    }

    try {
      // 构建交易
      const transaction = ({
        sender: account.address,
        data: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::open_position`,
          functionArguments: [
            keyword,
            BigInt(Math.floor(size)),
            false
          ],
        },
      });

      // 直接传递transaction对象给钱包适配器
      const pendingTxn = await signAndSubmitTransaction(transaction as InputTransactionData);

      // 等待交易完成
      const committedTxn = await aptos.waitForTransaction({
        transactionHash: pendingTxn.hash
      });

      return committedTxn.hash;
    } catch (error) {
      console.error('做空操作失败:', error);
      throw error;
    }
  };

  const getContractPrice = async (): Promise<number> => {
    try {
      // 检查缓存
      if (globalCache.contractPrice && isCacheValid(globalCache.contractPrice.timestamp)) {
        console.log('使用缓存的合约价格');
        return globalCache.contractPrice.value;
      }
      
      // 尝试使用view函数调用
      try {
        const response = await aptos.view({
          payload: {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_contract_price`,
            functionArguments: []
          }
        });
        const value = Number(response[0]);
        
        // 更新缓存
        globalCache.contractPrice = { value, timestamp: Date.now() };
        
        return value;
      } catch (viewError: any) {
        console.warn('通过view调用获取合约价格失败，返回默认值:', viewError);
        
        // 如果合约未初始化或其他错误，返回默认值
        return 100; // 返回默认值
      }
    } catch (error) {
      console.error('获取合约价格失败:', error);
      return 100; // 返回默认值
    }
  };

  const getFundingRate = async (keyword: string): Promise<number> => {
    try {
      // 检查缓存
      if (globalCache.fundingRates[keyword] && isCacheValid(globalCache.fundingRates[keyword].timestamp)) {
        console.log(`使用缓存的资金费率 (${keyword})`);
        return globalCache.fundingRates[keyword].value;
      }
      
      // 尝试使用view函数调用
      try {
        const response = await aptos.view({
          payload: {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::calculate_funding_rate`,
            functionArguments: [keyword]
          }
        });
        const value = Number(response[0]);
        
        // 更新缓存
        globalCache.fundingRates[keyword] = { value, timestamp: Date.now() };
        
        return value;
      } catch (viewError: any) {
        console.warn('通过view调用获取资金费率失败，返回默认值:', viewError);
        
        // 检查是否是E_DATA_NOT_FOUND错误
        if (viewError.message && viewError.message.includes('E_DATA_NOT_FOUND') || 
            viewError.message && viewError.message.includes('sub_status: Some(2)')) {
          console.log(`关键词 "${keyword}" 在oracle中不存在，使用默认资金费率`);
          return 10; // 默认资金费率为1%（10个基点）
        }
        
        return 0; // 返回默认值
      }
    } catch (error) {
      console.error('获取资金费率失败:', error);
      return 0; // 返回默认值
    }
  };

  const getUserPosition = async (userAddress: string): Promise<{size: number, isLong: boolean, entryPrice: number}> => {
    try {
      // 尝试使用view函数调用
      try {
        const response = await aptos.view({
          payload: {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_position`,
            functionArguments: [userAddress]
          }
        });
        
        return {
          size: Number(response[0]),
          isLong: Boolean(response[1]),
          entryPrice: Number(response[2])
        };
      } catch (viewError) {
        console.warn('通过view调用获取用户仓位失败，尝试从资源中获取:', viewError);
        
        // 如果view调用失败，尝试从资源中获取
        const resources = await aptos.getAccountResources({
          accountAddress: CONTRACT_ADDRESS
        });
        
        const tradingState = resources.find(
          (r) => r.type === `${CONTRACT_ADDRESS}::${MODULE_NAME}::TradingState`
        );
        
        if (!tradingState || !tradingState.data) {
          return { size: 0, isLong: false, entryPrice: 0 };
        }
        
        // 使用类型断言解决TypeScript类型错误
        const data = tradingState.data as { positions?: any };
        if (!data.positions) {
          return { size: 0, isLong: false, entryPrice: 0 };
        }
        
        // 尝试从positions表中获取用户仓位
        // 注意：这可能无法直接访问表中的数据，取决于Move合约的实现
        // 这是一个后备方案，可能需要根据实际情况调整
        return { size: 0, isLong: false, entryPrice: 0 };
      }
    } catch (error) {
      console.error('获取用户仓位失败:', error);
      return { size: 0, isLong: false, entryPrice: 0 }; // 返回默认值
    }
  };

  const getSpotPrice = async (keyword: string): Promise<number> => {
    try {
      // 检查缓存
      if (globalCache.spotPrices[keyword] && isCacheValid(globalCache.spotPrices[keyword].timestamp)) {
        console.log(`使用缓存的现货价格 (${keyword})`);
        return globalCache.spotPrices[keyword].value;
      }
      
      // 尝试使用view函数调用
      try {
        const response = await aptos.view({
          payload: {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_spot_price`,
            functionArguments: [keyword]
          }
        });
        const value = Number(response[0]);
        
        // 更新缓存
        globalCache.spotPrices[keyword] = { value, timestamp: Date.now() };
        
        return value;
      } catch (viewError: any) {
        console.warn('通过view调用获取现货价格失败，返回默认值:', viewError);
        
        // 检查是否是E_DATA_NOT_FOUND错误
        if (viewError.message && viewError.message.includes('E_DATA_NOT_FOUND') || 
            viewError.message && viewError.message.includes('sub_status: Some(2)')) {
          console.log(`关键词 "${keyword}" 在oracle中不存在，使用默认价格`);
          
          // 对于不存在的关键词，使用默认值
          if (keyword.toLowerCase() === 'trump') return 120;
          if (keyword.toLowerCase() === 'biden') return 110;
          if (keyword.toLowerCase() === 'harris') return 105;
          
          // 其他关键词使用通用默认值
          return 100;
        }
        
        return 100; // 返回默认值，与合约中的默认值一致
      }
    } catch (error) {
      console.error('获取现货价格失败:', error);
      return 100; // 返回默认值
    }
  };

  const updateTrendData = async (keyword: string, realtimeValue: number, monthlyValue: number, note: string): Promise<void> => {
    if (!account?.address) {
      throw new Error('钱包未连接');
    }
    
    const payload = {
      sender: account.address,
      data: {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::update_trend_data`,
        functionArguments: [keyword, realtimeValue, monthlyValue, note]
      }
    };
    
    await signAndSubmitTransaction(payload as InputTransactionData);
  };

  return {
    openLong,
    openShort,
    getContractPrice,
    getFundingRate,
    getUserPosition,
    getSpotPrice,
    updateTrendData
  };
};
