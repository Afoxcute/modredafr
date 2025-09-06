import axios from 'axios';
import { prisma } from './prisma';
import config from '../env.config';

export interface YakoaRegistrationData {
  tokenId: string;
  transactionHash: string;
  creatorId: string;
  title: string;
  description: string;
  mediaUrl?: string;
  ipfsHash?: string;
}

export interface YakoaInfringementStatus {
  id: string;
  status: string;
  infringements?: any[];
  lastChecked: string;
}

export class YakoaIntegrationService {
  private backendUrl: string;
  private apiKey: string;

  constructor() {
    this.backendUrl = config.yakoa.backendUrl;
    this.apiKey = config.yakoa.apiKey;
  }

  /**
   * Register an IP asset with Yakoa for infringement monitoring
   */
  async registerIPAssetForMonitoring(ipAssetId: string): Promise<any> {
    try {
      console.log(`🔍 Registering IP Asset ${ipAssetId} with Yakoa for monitoring...`);

      // Get IP asset data from database
      const ipAsset = await prisma.iPAsset.findUnique({
        where: { id: ipAssetId },
        include: { user: true }
      });

      if (!ipAsset) {
        throw new Error(`IP Asset ${ipAssetId} not found in database`);
      }

      // Prepare registration data
      const registrationData: YakoaRegistrationData = {
        tokenId: `${ipAsset.contractAddress}:${ipAsset.tokenId}`,
        transactionHash: `0x${ipAssetId.slice(0, 64)}`, // Generate a transaction hash from IP asset ID
        creatorId: ipAsset.owner,
        title: ipAsset.name,
        description: ipAsset.description,
        mediaUrl: ipAsset.metadataURI,
        ipfsHash: ipAsset.ipfsHash || undefined
      };

      // Register with Yakoa backend
      const response = await axios.post(
        `${this.backendUrl}/api/yakoa/register`,
        {
          ipAssetId,
          registrationData
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.apiKey
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log(`✅ IP Asset ${ipAssetId} registered with Yakoa successfully`);
      
      // Update IP asset with Yakoa registration info
      await prisma.iPAsset.update({
        where: { id: ipAssetId },
        data: {
          lastModified: new Date()
        }
      });

      return {
        success: true,
        data: response.data,
        message: `IP Asset ${ipAssetId} registered with Yakoa for infringement monitoring`
      };

    } catch (error: any) {
      console.error(`❌ Error registering IP Asset ${ipAssetId} with Yakoa:`, error.message);
      
      // Handle specific error cases
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Yakoa backend service is not available at ${this.backendUrl}`);
      }
      
      if (error.response?.status === 409) {
        return {
          success: true,
          alreadyRegistered: true,
          message: `IP Asset ${ipAssetId} already registered with Yakoa`,
          data: error.response.data
        };
      }
      
      throw new Error(`Failed to register IP Asset with Yakoa: ${error.message}`);
    }
  }

  /**
   * Check infringement status for an IP asset
   */
  async checkInfringementStatus(ipAssetId: string): Promise<YakoaInfringementStatus> {
    try {
      console.log(`🔍 Checking infringement status for IP Asset ${ipAssetId}...`);

      // Get IP asset data
      const ipAsset = await prisma.iPAsset.findUnique({
        where: { id: ipAssetId }
      });

      if (!ipAsset) {
        throw new Error(`IP Asset ${ipAssetId} not found`);
      }

      const tokenId = `${ipAsset.contractAddress}:${ipAsset.tokenId}`;

      // Check status via Yakoa backend
      const response = await axios.get(
        `${this.backendUrl}/api/yakoa/status/${encodeURIComponent(tokenId)}`,
        {
          headers: {
            'X-API-KEY': this.apiKey
          },
          timeout: 15000 // 15 second timeout
        }
      );

      const status: YakoaInfringementStatus = {
        id: ipAssetId,
        status: response.data.status || 'unknown',
        infringements: response.data.infringements || [],
        lastChecked: new Date().toISOString()
      };

      console.log(`✅ Infringement status for IP Asset ${ipAssetId}:`, status.status);

      return status;

    } catch (error: any) {
      console.error(`❌ Error checking infringement status for IP Asset ${ipAssetId}:`, error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Yakoa backend service is not available at ${this.backendUrl}`);
      }
      
      throw new Error(`Failed to check infringement status: ${error.message}`);
    }
  }

  /**
   * Register multiple IP assets for monitoring
   */
  async registerMultipleIPAssets(ipAssetIds: string[]): Promise<any> {
    console.log(`🔍 Registering ${ipAssetIds.length} IP assets with Yakoa...`);

    const results = [];
    const errors = [];

    for (const ipAssetId of ipAssetIds) {
      try {
        const result = await this.registerIPAssetForMonitoring(ipAssetId);
        results.push(result);
      } catch (error: any) {
        console.error(`❌ Failed to register IP Asset ${ipAssetId}:`, error.message);
        errors.push({ ipAssetId, error: error.message });
      }
    }

    return {
      successful: results,
      failed: errors,
      total: ipAssetIds.length,
      successCount: results.length,
      failureCount: errors.length
    };
  }

  /**
   * Get all IP assets that need Yakoa registration
   */
  async getIPAssetsForYakoaRegistration(): Promise<any[]> {
    try {
      // Get IP assets that haven't been registered with Yakoa yet
      // You can add a field like 'yakoaRegistered' to track this
      const ipAssets = await prisma.iPAsset.findMany({
        where: {
          isActive: true
        },
        include: {
          user: true
        }
      });

      return ipAssets;
    } catch (error: any) {
      console.error('❌ Error fetching IP assets for Yakoa registration:', error.message);
      throw error;
    }
  }

  /**
   * Register all active IP assets with Yakoa
   */
  async registerAllActiveIPAssets(): Promise<any> {
    try {
      console.log('🔍 Registering all active IP assets with Yakoa...');

      const ipAssets = await this.getIPAssetsForYakoaRegistration();
      const ipAssetIds = ipAssets.map(asset => asset.id);

      if (ipAssetIds.length === 0) {
        return {
          message: 'No active IP assets found for registration',
          total: 0,
          successCount: 0,
          failureCount: 0
        };
      }

      return await this.registerMultipleIPAssets(ipAssetIds);

    } catch (error: any) {
      console.error('❌ Error registering all IP assets with Yakoa:', error.message);
      throw error;
    }
  }

  /**
   * Get infringement reports for all IP assets
   */
  async getAllInfringementReports(): Promise<any> {
    try {
      console.log('🔍 Fetching infringement reports for all IP assets...');

      const ipAssets = await prisma.iPAsset.findMany({
        where: { isActive: true }
      });

      const reports = [];
      const errors = [];

      for (const ipAsset of ipAssets) {
        try {
          const status = await this.checkInfringementStatus(ipAsset.id);
          reports.push({
            ipAssetId: ipAsset.id,
            name: ipAsset.name,
            status
          });
        } catch (error: any) {
          errors.push({
            ipAssetId: ipAsset.id,
            name: ipAsset.name,
            error: error.message
          });
        }
      }

      return {
        reports,
        errors,
        total: ipAssets.length,
        successCount: reports.length,
        failureCount: errors.length
      };

    } catch (error: any) {
      console.error('❌ Error fetching infringement reports:', error.message);
      throw error;
    }
  }

  /**
   * Health check for Yakoa backend service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.backendUrl}/`, {
        timeout: 5000 // 5 second timeout
      });
      return response.status === 200;
    } catch (error: any) {
      console.error('❌ Yakoa backend health check failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export const yakoaIntegration = new YakoaIntegrationService(); 