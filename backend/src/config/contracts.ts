import { Address } from 'viem';

// Contract addresses from latest deployment
export const CONTRACT_ADDRESSES = {
  IP_ASSET_MANAGER_V2: '0xA20Ba7d4aD1bb40D46f3B9F8b4e722848C68d80a' as Address,
  IP_ASSET_NFT: '0x227f1cDcBeb442F07e4A2119ab0AD83C21E6fFE5' as Address,
} as const;

// Export default contract addresses
export const IP_ASSET_MANAGER_V2_ADDRESS = CONTRACT_ADDRESSES.IP_ASSET_MANAGER_V2;
export const IP_ASSET_NFT_ADDRESS = CONTRACT_ADDRESSES.IP_ASSET_NFT;

