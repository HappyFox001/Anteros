"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { truncateAddress } from '@aptos-labs/wallet-adapter-core';

const PetraWalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16C0 7.16344 7.16344 0 16 0Z" fill="#FF5F5F"/>
    <path d="M20.5 10.5H24V21.5H20.5V10.5Z" fill="white"/>
    <path d="M8 10.5H11.5V21.5H8V10.5Z" fill="white"/>
    <path d="M11.5 14H20.5V18H11.5V14Z" fill="white"/>
  </svg>
);

export default function WalletConnect() {
  const { 
    connect, 
    disconnect, 
    account, 
    wallets, 
    connected, 
    wallet,
    network
  } = useWallet();
  const [accountBalance, setAccountBalance] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && account?.address) {
        try {
          const response = await fetch(`https://api.testnet.aptoslabs.com/v1/accounts/${account.address.toString()}/resources`);
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          const resources = await response.json();
          
          const aptosCoin = Array.isArray(resources) 
            ? resources.find((r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>')
            : null;
          
          if (aptosCoin && aptosCoin.data && aptosCoin.data.coin) {
            const balance = parseInt(aptosCoin.data.coin.value) / 100000000;
            setAccountBalance(balance.toFixed(4));
          } else {
            setAccountBalance('0');
          }
        } catch (error) {
          console.error('获取余额失败:', error);
          setAccountBalance('获取失败');
        }
      } else {
        setAccountBalance(null);
      }
    };

    fetchBalance();
  }, [connected, account]);

  const handleConnect = async () => {
    // 专门连接Petra钱包
    const petraWallet = wallets.find(w => w.name === 'Petra');
    if (petraWallet) {
      await connect(petraWallet.name);
    } else {
      alert('请安装Petra钱包扩展: https://petra.app/');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative">
      {!connected ? (
        <button
          onClick={handleConnect}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 flex items-center space-x-2"
        >
          <span className="w-5 h-5 flex items-center justify-center">
            <PetraWalletIcon />
          </span>
          <span>连接Petra钱包</span>
        </button>
      ) : (
        <div>
          <button
            onClick={toggleDropdown}
            className="bg-gray-800/70 hover:bg-gray-700/70 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 border border-gray-700/50"
          >
            <span className="w-5 h-5 flex items-center justify-center">
              <PetraWalletIcon />
            </span>
            <span className="font-mono">{account?.address ? truncateAddress(account.address.toString()) : ''}</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-800/50 z-10 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm font-mono">钱包</span>
                  <span className="text-white font-medium flex items-center">
                    <span className="w-4 h-4 mr-2 flex items-center justify-center">
                      <PetraWalletIcon />
                    </span>
                    Petra
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm font-mono">网络</span>
                  <span className="text-white font-medium">{network?.name || 'Testnet'}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm font-mono">余额</span>
                  <span className="text-white font-medium">
                    {accountBalance ? `${accountBalance} APT` : '加载中...'}
                  </span>
                </div>
                <div className="border-t border-gray-800 my-2"></div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm font-mono">地址</span>
                  <span className="text-white font-medium font-mono text-xs">
                    {account?.address ? truncateAddress(account.address.toString()) : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>断开连接</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
