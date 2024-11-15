# AI Service Endpoints Documentation

A guide for interacting with AI service endpoints to create an agent.

## Prerequisites

- Node.js environment
- `.env` file configured (see `.env.example`)

## Resource Budget Management

Before using any service endpoints, you need to configure and manage your resource budget. The following functions from `src/services/Skynet.ts` handle budget management:

### Create Initial Budget
```typescript
const createBudget = async (appName: string, subnetId: string) => {
    const skyNode = await getSkyNode();

    if (!process.env.PROJECT_ID) {
        return {
            success: false,
            nftId: "",
            appId: 0
        }
    }

    const contractApp = {
        nftID: process.env.PROJECT_ID!,
        appID: "",
        appName: `${appName}`,
        appPath: Buffer.from(STORAGE_TYPE.LIGHTHOUSE + '/').toString('hex'),
        modPath: Buffer.from(STORAGE_TYPE.LIGHTHOUSE + '/').toString('hex'),
        appSubnetConfig: [{
            resourceType: [1],
            resourceCount: [1],
            multiplier: [1]
        }],
        subnetList: [subnetId],
        cidLock: false
    }

    const subscriptionParam = {
        licenseAddress: "0x0000000000000000000000000000000000000000",
        supportAddress: "0x3C904a5f23f868f309a6DB2a428529F33848f517",
        platformAddress: "0xBC6200490F4bFC9092eA2987Ddb1Df478997e0cd",
        referralAddress: "0x0000000000000000000000000000000000000000",
        createTime: 0
    }

    const createTimeResp = await skyNode.dripRateManager.getSubscriptionParam(process.env.PROJECT_ID!);
    if (createTimeResp?.success && createTimeResp.data.createTime > 0) {
        subscriptionParam.createTime = createTimeResp.data.createTime;
    }

    const createAppResponse = await skyNode.appManager.createApp(
        contractApp,
        subscriptionParam,
        {
            licenseFactor: 0,
            supportFactor: 0,
            platformFactor: 0,
            referralFactor: 0,
            discountFactor: 0,
            referralExpiryDuration: 0,
            createTime: 0,
            daoRate: 0
        },
        [etherToWei(Number(process.env.DEFAULT_RESOURCE_BUDGET!), 18).toString()],
        {},
        {
            modAttribVar: {},
            contractParam: {},
            loggerURL: "https://appsender.skynet.io/api/appStatus"
        },
        async (status) => {
            if (status === CRUD_APP_STAGE.CREATE_SUCCESSFUL) {
                console.log("status", status);
            }
        },
        { fetchAppList: true, fetchSubscriptionParam: true, fetchBalanceForSubscription: true, getDeploymentStatus: false }
    );
    return createAppResponse;
}
```

### Verify and Auto-top up Budget
```typescript
const verifyBudget = async (appName: string, subnetId: string) => {
    const appList = await fetchApps();
    if (!appList) return false;
    
    const subnetList = appList.flatMap(app => app.subnetList);
    if (!subnetList.includes(subnetId)) {
        await createBudget(appName, subnetId);
        return true;
    };
    
    const verifyBudgetResponse = await getSubnetBalance(subnetId);

    if (verifyBudgetResponse && Number(verifyBudgetResponse) < (Number(process.env.DEFAULT_RESOURCE_BUDGET!) * 0.5)) {
        await addBudget(subnetId);
        return true;
    }
    return true;
}
```

### Add More Budget
```typescript
const addBudget = async (subnetId: string) => {
    const skyNode = await getSkyNode();
    const valueInWei = ethers.utils.parseEther(process.env.DEFAULT_RESOURCE_BUDGET!);
    const addbalanceRespose = await skyNode.contractService.SkynetWrapper.addBalanceByBuyingXCT(
        process.env.PROJECT_ID!,
        [subnetId],
        [valueInWei.toString()],
        { value: valueInWei }
    );
    return addbalanceRespose;
}
```

Required environment variables for budget management:
```env
PROVIDER_RPC=            # Your RPC provider URL
AGENT_PRIVATE_KEY=       # Your wallet private key
PROJECT_ID=              # Your project NFT ID
DEFAULT_RESOURCE_BUDGET= # Default budget amount in ETH
```

Example usage:
```typescript
// Before making API calls, verify budget
await verifyBudget("MyApp", "4");
```

> **Important**: 
> - Ensure sufficient budget is maintained to use the service endpoints
> - The system automatically tops up when balance falls below 50% of DEFAULT_RESOURCE_BUDGET
> - Initial budget creation is required for first-time subnet usage
> - Budget management functions require proper wallet configuration with sufficient funds

## SDK Initialization

```typescript
import SkyMainNodeJS from '@decloudlabs/skynet/lib/services/SkyMainNodeJS';

const initializeSkyNodeCrypto = async (): Promise<SkyMainNodeJS> => {
    if (!global.initializedAppCrypto) {
        const envConfig = {
            JRPC_PROVIDER: process.env.PROVIDER_RPC!,
            WALLET_PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY!,
            STORAGE_API: {}
        };
        global.initializedAppCrypto = new SkyMainNodeJS(envConfig);
        await global.initializedAppCrypto.init(true);
    }
    return global.initializedAppCrypto;
};
```

## Authentication

All endpoints require these parameters:

```json
{
  "userAuthPayload": {
    "userAddress": "0xYourWalletAddress",
    "signature": "<unique-signature>",
    "message": "<timestamp>"
  },
  "prompt": "Your prompt",
  "nftId": "YourNFTId"
}
```

## userAuthPayload 
Get user auth payload using `await skynode.appManager.getUrsulaAuth()`

## Service Endpoints

### 1. StackOS (Ethereum Explorer)
**POST** `https://stackaiservice.metalturtle.xyz/natural-request`
```json
{
  "userAuthPayload": { ... },
  "nftId": "YourNFTId",
  "prompt": "Deploy alethio/ethereum-lite-explorer"
}
```

### 2. RunPod (ML/AI Pods)
**POST** `https://runpodservice-n694.stackos.io/natural-request`
```json
{
  "userAuthPayload": { ... },
  "nftId": "YourNFTId",
  "prompt": "Create a new pod with config X"
}
```

### 3. Claude (AI Text)
**POST** `https://claudeservice-n694.stackos.io/claude-3-5-sonnet-20241022/natural-request`
```json
{
  "userAuthPayload": { ... },
  "nftId": "YourNFTId",
  "messages": [
    {
      "role": "user",
      "content": "Your prompt"
    }
  ]
}
```

### 4. OpenAI (AI Text)
**POST** `https://openapiservice-n244.stackos.io/natural-request/gpt-4-turbo/focused`
```json
{
  "userAuthPayload": { ... },
  "nftId": "YourNFTId",
  "prompt": "Your prompt"
}
```

### 5. IPFS (File Storage)
**POST** `https://lightservice-n694.stackos.io/natural-request`  
**Content-Type**: `multipart/form-data`
```json
{
  "userAuthPayload": { ... },
  "nftId": "YourNFTId",
  "prompt": "Upload files",
  "files": [/* File array */]
}
```

## Example Implementation

An example agent implementation is available at `src/index.ts`. This example demonstrates how to initialize the SDK and interact with the various service endpoints.
