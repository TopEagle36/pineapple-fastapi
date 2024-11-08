import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { baseSepolia, abstractTestnet } from 'wagmi/chains';

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = '3e205ec1e2f65ac244dd2b4a8099d004';

// 2. Create wagmiConfig
const metadata = {
  name: 'AppKit',
  description: 'AppKit Example',
  url: 'https://web3modal.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const communeTestNet = {
  ...abstractTestnet,
  id: 9461,
  network: 'commune-testnet',
  name: 'Commune Testnet',
  nativeCurrency: { name: 'COMAI TEST', symbol: 'COMAI', decimals: 18 },
  iconUrl: '/chains/comai.png',
  iconBackground: 'transparent',
  rpcUrls: {
    default: {
      http: ['https://testnet.api.communeai.net'],
    },
    public: {
      http: ['https://testnet.api.communeai.net'],
    },
  },
};

const chains = [communeTestNet];
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  auth: {
    email: false,
    socials: [],
    // showWallets: false,
    // walletFeatures: false
  },
});
