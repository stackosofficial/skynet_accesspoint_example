# AI Service Endpoints Documentation

A guide for interacting with AI service endpoints to create an agent.

## Prerequisites

- Node.js environment
- `.env` file configured (see `.env.example`)

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

##userAuthPayload##: Get user auth payload using `await skynode.appManager.getUrsulaAuth()`

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
  ],
  "model": "claude-3-5-sonnet-20241022"
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
