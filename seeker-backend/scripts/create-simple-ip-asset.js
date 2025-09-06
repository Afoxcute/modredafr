import pkg from "hardhat";
const { ethers } = pkg;
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  console.log("🚀 Creating Simple IP Asset...");

  // Check if private key is set
  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ PRIVATE_KEY environment variable is not set. Please check your .env file.");
  }

  // Get the deployer account
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  console.log("📝 Using account:", deployer.address);

  // Contract addresses from your deployment
  const IPAssetManagerV2Address = "0xA20Ba7d4aD1bb40D46f3B9F8b4e722848C68d80a";

  console.log("📋 Using IPAssetManagerV2:", IPAssetManagerV2Address);

  // Get contract instance
  const ipAssetManager = await ethers.getContractAt("IPAssetManagerV2", IPAssetManagerV2Address);

  try {
    // IP asset data - only 4 parameters as per contract
    const ipAssetName = "My";
    const ipAssetDescription = "This is my first intellectual";
    const ipAssetURI = "https://ipfs.io/ipfs/QmbVNqLp48W7e6YLdmmhnW8EQRUVdaMoUxcLu3eb2XVyan"; // Replace with actual IPFS hash
    const ipfsHash = "https://ipfs.io/ipfs/QmPkfGy3YHRG8g3bG87mHbmF44cMsJZHhP2BNtA3t7d8gu"; // IPFS hash for encrypted content

    console.log("\n📚 Creating IP Asset:");
    console.log("   Name:", ipAssetName);
    console.log("   Description:", ipAssetDescription);
    console.log("   URI:", ipAssetURI);
    console.log("   IPFS Hash:", ipfsHash);

    // Register the IP asset with correct 4 parameters
    console.log("\n⏳ Registering IP Asset...");
    const registerTx = await ipAssetManager.connect(deployer).registerIPAsset(
      ipAssetName,
      ipAssetDescription,
      ipAssetURI,
      ipfsHash
    );
    
    console.log("   📄 Transaction hash:", registerTx.hash);
    console.log("   ⏳ Waiting for confirmation...");
    
    const registerReceipt = await registerTx.wait();
    console.log("   ✅ IP Asset registered successfully!");

    // Get the IP asset ID from the event
    const ipAssetRegisteredEvent = registerReceipt.logs.find(
      log => log.eventName === "IPAssetRegistered"
    );
    
    if (ipAssetRegisteredEvent) {
      const ipAssetId = ipAssetRegisteredEvent.args.assetId;
      console.log("\n🎉 Success! IP Asset created with ID:", ipAssetId.toString());
      
      console.log("\n📋 IP Asset Details:");
      console.log("   🆔 ID:", ipAssetId.toString());
      console.log("   📚 Name:", ipAssetName);
      console.log("   👤 Owner:", deployer.address);
      console.log("   🔗 URI:", ipAssetURI);
      console.log("   🔐 IPFS Hash:", ipfsHash);
      
      console.log("\n🔍 View on HashScan:");
      console.log("   https://hashscan.io/testnet/contract/" + IPAssetManagerV2Address);
      
    } else {
      console.log("   ❌ Could not find IPAssetRegistered event");
    }

  } catch (error) {
    console.error("❌ Error creating IP asset:", error);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Tip: Make sure you have enough ETH for gas fees");
    } else if (error.message.includes("execution reverted")) {
      console.log("💡 Tip: Check if the contract is properly deployed");
    }
    
    throw error;
  }
}

// Handle errors
main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
}); 