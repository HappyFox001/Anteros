/**
 * Contract Service - Blockchain Interaction Layer
 *
 * @remarks
 * This service provides a comprehensive interface for interacting with the Anteros smart contracts
 * on the Aptos blockchain. It abstracts away the complexity of blockchain transactions and
 * provides a clean, typed API for the frontend application to use.
 * 
 * Key features:
 * - Position management (opening long and short positions on keywords)
 * - Real-time price data retrieval with intelligent caching
 * - Contract price and funding rate calculations
 * - User position tracking and management
 * - Trend data updates and oracle interactions
 * - Error handling and fallback mechanisms for blockchain operations
 * 
 * The ContractService is the core bridge between the Anteros frontend and blockchain,
 * implementing all necessary methods to interact with the trend_trading module deployed
 * on the Aptos testnet. It uses the Aptos TS SDK for blockchain communication and
 * integrates with the wallet adapter for transaction signing.
 */

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

const CACHE_TTL = 20000;

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
      
      const pendingTxn = await signAndSubmitTransaction(transaction as InputTransactionData);
      
      console.log(3)
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

      const pendingTxn = await signAndSubmitTransaction(transaction as InputTransactionData);

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
      if (globalCache.contractPrice && isCacheValid(globalCache.contractPrice.timestamp)) {
        console.log('使用缓存的合约价格');
        return globalCache.contractPrice.value;
      }
      
      try {
        const response = await aptos.view({
          payload: {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_contract_price`,
            functionArguments: []
          }
        });
        const value = Number(response[0]);
        
        globalCache.contractPrice = { value, timestamp: Date.now() };
        
        return value;
      } catch (viewError: any) {
        console.warn('通过view调用获取合约价格失败，返回默认值:', viewError);
        
        return 100;
      }
    } catch (error) {
      console.error('获取合约价格失败:', error);
      return 100;
    }
  };

  const getFundingRate = async (keyword: string): Promise<number> => {
    try {
      if (globalCache.fundingRates[keyword] && isCacheValid(globalCache.fundingRates[keyword].timestamp)) {
        console.log(`使用缓存的资金费率 (${keyword})`);
        return globalCache.fundingRates[keyword].value;
      }
      
      try {
        const response = await aptos.view({
          payload: {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::calculate_funding_rate`,
            functionArguments: [keyword]
          }
        });
        const value = Number(response[0]);
        
        globalCache.fundingRates[keyword] = { value, timestamp: Date.now() };
        
        return value;
      } catch (viewError: any) {
        console.warn('通过view调用获取资金费率失败，返回默认值:', viewError);
        
        if (viewError.message && viewError.message.includes('E_DATA_NOT_FOUND') || 
            viewError.message && viewError.message.includes('sub_status: Some(2)')) {
          console.log(`关键词 "${keyword}" 在oracle中不存在，使用默认资金费率`);
          return 10;
        }
        
        return 0;
      }
    } catch (error) {
      console.error('获取资金费率失败:', error);
      return 0;
    }
  };

  const getUserPosition = async (userAddress: string): Promise<{size: number, isLong: boolean, entryPrice: number}> => {
    try {
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
        
        const resources = await aptos.getAccountResources({
          accountAddress: CONTRACT_ADDRESS
        });
        
        const tradingState = resources.find(
          (r) => r.type === `${CONTRACT_ADDRESS}::${MODULE_NAME}::TradingState`
        );
        
        if (!tradingState || !tradingState.data) {
          return { size: 0, isLong: false, entryPrice: 0 };
        }

        const data = tradingState.data as { positions?: any };
        if (!data.positions) {
          return { size: 0, isLong: false, entryPrice: 0 };
        }
        
        return { size: 0, isLong: false, entryPrice: 0 };
      }
    } catch (error) {
      console.error('获取用户仓位失败:', error);
      return { size: 0, isLong: false, entryPrice: 0 };
    }
  };

  const getSpotPrice = async (keyword: string): Promise<number> => {
    try {
      if (globalCache.spotPrices[keyword] && isCacheValid(globalCache.spotPrices[keyword].timestamp)) {
        console.log(`使用缓存的现货价格 (${keyword})`);
        return globalCache.spotPrices[keyword].value;
      }
      
      try {
        const response = await aptos.view({
          payload: {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_spot_price`,
            functionArguments: [keyword]
          }
        });
        const value = Number(response[0]);
        
        globalCache.spotPrices[keyword] = { value, timestamp: Date.now() };
        
        return value;
      } catch (viewError: any) {
        console.warn('通过view调用获取现货价格失败，返回默认值:', viewError);
        
        if (viewError.message && viewError.message.includes('E_DATA_NOT_FOUND') || 
            viewError.message && viewError.message.includes('sub_status: Some(2)')) {
          console.log(`关键词 "${keyword}" 在oracle中不存在，使用默认价格`);
          
          if (keyword.toLowerCase() === 'trump') return 120;
          if (keyword.toLowerCase() === 'biden') return 110;
          if (keyword.toLowerCase() === 'harris') return 105;
          
          return 100;
        }
        
        return 100;
      }
    } catch (error) {
      console.error('获取现货价格失败:', error);
      return 100;
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
