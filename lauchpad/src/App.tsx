
import './App.css'
import React from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';
import { TokenLaunchpad } from './component/launchpad';

function App() {
 

  return (
    <>
     <ConnectionProvider endpoint={"https://solana-devnet.g.alchemy.com/v2/I6bzuLk18JGZXv9spj7DF"}>
            <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                  <div className='flex justify-around'>
                       <WalletMultiButton />
                    <WalletDisconnectButton />
                  </div>
                   
                    <TokenLaunchpad/>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
      
    </>
  )
}

export default App
