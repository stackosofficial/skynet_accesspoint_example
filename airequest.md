# AI Service Endpoints Documentation

## Signature
To get the signature, we need to initialize a sdk called @decloudlabs/skynet

then we have to initialize the sdk with the private key for nodejs application

this is code for initialize the sdk 

```
import SkyMainNodeJS from '@decloudlabs/skynet/lib/services/SkyMainNodeJS';
import SkyEnvConfigNodeJS, { AppSubnetConfig } from '@decloudlabs/skynet/lib/types/types';

let initializedAppCrypto: SkyMainNodeJS;

const initializeSkyNodeCrypto = async (): Promise<SkyMainNodeJS> => {
    if (!initializedAppCrypto) {
        const envConfig: SkyEnvConfigNodeJS = {
            JRPC_PROVIDER: process.env.PROVIDER_RPC!,
            WALLET_PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY!,
            STORAGE_API: {}
        };
        initializedAppCrypto = new SkyMainNodeJS(envConfig);
        await initializedAppCrypto.init(true);
    }
    return initializedAppCrypto;
};

export const getSkyNode = async (): Promise<SkyMainNodeJS> => {
    return await initializeSkyNodeCrypto();
};
```




## Common Parameters
All requests (except Lighthouse) share these parameters:
```json
{
  "userAuthPayload": {
    "userAddress": "0x317d0ec5ccCEBF772B3ADaCdD8d0339B0FD4B1Ac",
    "signature": "<unique-signature>",
    "message": "<timestamp>"
  },
  "nftId": "733"
}
```

## Service Endpoints

### 1. StackOS
- **URL**: `https://stackaiservice.metalturtle.xyz/natural-request`
- **Purpose**: Deploy Ethereum explorer
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Unique Parameters**:
```json
{
  "prompt": "Please deploy alethio/ethereum-lite-explorer with the tag as latest and port 80 with CPU as 128 core and 2000 mb ram and add a balance of 1 day"
}
```

### 2. RunPod
- **URL**: `http://localhost:3001/natural-request`
- **Purpose**: Create ML/AI pods
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Unique Parameters**:
```json
{
  "prompt": "Create a new pod name: 'RunPod Tensorflow' imageName: 'runpod/pytorch' ports: 8888/http volume: /workspace"
}
```

### 3. Anthropic (Claude)
- **URL**: `https://claudeservice-n694.stackos.io/claude-3-5-sonnet-20241022/natural-request`
- **Purpose**: AI text generation
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Unique Parameters**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Generate a NextJS App code for a hello world app"
    }
  ],
  "model": "claude-3-5-sonnet-20241022"
}
```

### 4. OpenAI
- **URL**: `https://openapiservice-n244.stackos.io/natural-request/gpt-4-turbo/focused`
- **Purpose**: AI text generation
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Unique Parameters**:
```json
{
  "prompt": "Generate a hello world HTML app"
}
```

### 5. Lighthouse
- **URL**: `http://localhost:3001/natural-request`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Form Data Parameters**:
  - `userAuthPayload`: JSON string containing user authentication data
  - `nftId`: NFT identifier
  - `prompt`: User instructions for file handling
  - `files`: Array of files to be processed
```json
{
  "userAuthPayload": {
    "userAddress": "0x317d0ec5ccCEBF772B3ADaCdD8d0339B0FD4B1Ac",
    "signature": "<unique-signature>",
    "message": "<timestamp>"
  },
  "nftId": "733",
  "prompt": "Upload these files to Lighthouse",
  "files": [/* Array of files */]
}
```