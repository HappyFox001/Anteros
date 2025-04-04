/**
 * AptosWalletProvider Component - Blockchain Wallet Integration
 *
 * @remarks
 * This component serves as the foundation for blockchain interactions within the Anteros platform,
 * providing seamless integration with the Aptos blockchain through wallet connectivity.
 * 
 * Key features:
 * - Automatic connection to supported Aptos wallets (primarily Petra)
 * - Testnet configuration for development and testing purposes
 * - Comprehensive error handling for wallet connection issues
 * - Context provider pattern that makes wallet functionality available throughout the application
 * - Simplified interface that abstracts away blockchain complexity
 * 
 * The AptosWalletProvider wraps the entire application to ensure that wallet state and
 * functionality are accessible to all components that require blockchain interaction.
 * This component is essential for enabling transactions, account management, and on-chain
 * data retrieval throughout the Anteros platform.
 */

"use client";

import { ReactNode } from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';

interface AptosWalletProviderProps {
  children: ReactNode;
}

export default function AptosWalletProvider({ children }: AptosWalletProviderProps) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{ 
        network: Network.TESTNET
      }}
      optInWallets={["Petra"]}
      onError={(error) => {
        console.log("钱包连接错误:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
