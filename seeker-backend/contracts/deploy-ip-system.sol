// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "./IPAssetNFT.sol";
import "./IPAssetManagerV2.sol";

/**
 * @title IPAssetSystemDeployer
 * @dev Deployment script for the IP Asset Management System
 * @notice This contract demonstrates how to deploy and initialize the IP asset system
 */
contract IPAssetSystemDeployer {
    
    IPAssetNFT public ipAssetNFT;
    IPAssetManagerV2 public ipAssetManager;
    
    event SystemDeployed(
        address indexed ipAssetNFT,
        address indexed ipAssetManager,
        address indexed deployer
    );
    
    constructor() {
        // Deploy IP Asset NFT contract first (no arguments needed)
        ipAssetNFT = new IPAssetNFT();
        
        // Deploy IP Asset Manager with NFT contract address
        ipAssetManager = new IPAssetManagerV2(address(ipAssetNFT));
        
        // Set the IP Asset Manager in the NFT contract
        ipAssetNFT.setIPAssetManager(address(ipAssetManager));
        
        // Transfer ownership of NFT contract to the manager
        ipAssetNFT.transferOwnership(address(ipAssetManager));
        
        emit SystemDeployed(
            address(ipAssetNFT),
            address(ipAssetManager),
            msg.sender
        );
    }
    
    /**
     * @dev Get the deployed contract addresses
     */
    function getDeployedAddresses() external view returns (
        address nftContract,
        address managerContract
    ) {
        return (address(ipAssetNFT), address(ipAssetManager));
    }
    
    /**
     * @dev Transfer ownership of the IP Asset Manager to a new owner
     * @param newOwner New owner address
     */
    function transferManagerOwnership(address newOwner) external {
        ipAssetManager.transferOwnership(newOwner);
    }
} 