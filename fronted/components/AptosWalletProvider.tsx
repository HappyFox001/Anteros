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
