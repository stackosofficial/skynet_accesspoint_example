import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
    UserAuthPayload,
    ServiceResponse,
    StackOSRequest,
    RunPodRequest,
    ClaudeRequest,
    OpenAIRequest,
    IPFSUploadResponse
} from '../types/types';
import FormData from 'form-data';
import { getSkyNode, verifyBudget } from './Skynet';
import { ETHAddress } from '@decloudlabs/skynet/lib/types/types';
import { SkyContractService } from '@decloudlabs/skynet/lib/types/types';

export class AIServiceClient {
    private axiosInstance: AxiosInstance;
    private projectId: string;

    constructor() {
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000 // 30 seconds timeout
        };

        this.axiosInstance = axios.create(config);
        this.projectId = process.env.PROJECT_ID!;
    }

    /**
     * Initialize the client by getting the signature
     */
    async initialize(): Promise<void> {
        const skyNode = await getSkyNode();
        // verify address with project id

        const readByte32 =
            "0x917ec7ea41e5f357223d15148fe9b320af36ca576055af433ea3445b39221799";
        const contractBasedDeploymentByte32 =
            "0x503cf060389b91af8851125bd70ce66d16d12330718b103fc7674ef6d27e70c9";

        const ownerAddress = await skyNode.contractService.AppNFT.ownerOf(this.projectId);
        if (ownerAddress !== process.env.AGENT_ADDRESS!) {
            const callHasRole = async (roleValue: string) =>
                await this.hasRole(this.projectId, roleValue, process.env.AGENT_ADDRESS!, skyNode.contractService);

            const [hasReadRoleResp, hasDeployerRoleResp] = await Promise.all([
                callHasRole(readByte32),
                callHasRole(contractBasedDeploymentByte32),
            ]);

            if (!hasReadRoleResp && !hasDeployerRoleResp) {
                throw new Error("Cant find the Project Role");
            }
        }


    }

    async hasRole(
        nftID: string,
        roleValue: string,
        requester: ETHAddress,
        contractService: SkyContractService
    ) {
        const result = await contractService.callContractRead<boolean, boolean>(
            contractService.AppNFT.hasRole(nftID, roleValue, requester),
            (res) => res
        );
        return result;
    };

    /**
     * Deploy Ethereum explorer using StackOS
     */
    async createDockerApp(prompt: string): Promise<ServiceResponse> {
        const budgetVerified = await verifyBudget("stackai", "6");
        if (!budgetVerified) {
            return { success: false, data: null, error: "Budget can't be verified" };
        }
        const skyNode = await getSkyNode();
        const userAuthPayload = await skyNode.appManager.getUrsulaAuth();

        if (!userAuthPayload.success) {
            throw new Error("Cant get Ursula Auth");
        }

        const payload: StackOSRequest = {
            userAuthPayload: userAuthPayload.data,
            nftId: this.projectId,
            prompt
        };

        try {
            const response = await this.axiosInstance.post(
                'https://stackaiservice.metalturtle.xyz/natural-request',
                payload
            );
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, data: null, error: String(error) };
        }
    }

    /**
     * Create ML/AI pod using RunPod
     */
    async createMLPod(): Promise<ServiceResponse> {
        const budgetVerified = await verifyBudget("runpod", "7");
        if (!budgetVerified) {
            return { success: false, data: null, error: "Budget can't be verified" };
        }

        const skyNode = await getSkyNode();
        const userAuthPayload = await skyNode.appManager.getUrsulaAuth();

        if (!userAuthPayload.success) {
            throw new Error("Cant get Ursula Auth");
        }

        const payload: RunPodRequest = {
            userAuthPayload: userAuthPayload.data,
            nftId: this.projectId,
            prompt: "Create a new pod name: 'RunPod Tensorflow' imageName: 'runpod/pytorch' ports: 8888/http volume: /workspace"
        };

        try {
            const response = await this.axiosInstance.post(
                'http://localhost:3001/natural-request',
                payload
            );
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, data: null, error: String(error) };
        }
    }

    /**
     * Generate text using Claude AI
     */
    async generateWithClaude(prompt: string): Promise<ServiceResponse> {
        const budgetVerified = await verifyBudget("anthropic", "5");
        if (!budgetVerified) {
            return { success: false, data: null, error: "Budget can't be verified" };
        }


        const skyNode = await getSkyNode();
        const userAuthPayload = await skyNode.appManager.getUrsulaAuth();

        if (!userAuthPayload.success) {
            throw new Error("Cant get Ursula Auth");
        }


        const payload: ClaudeRequest = {
            userAuthPayload: userAuthPayload.data,
            nftId: this.projectId,
            messages: [{ role: 'user', content: prompt }],
            model: 'claude-3-5-sonnet-20241022'
        };

        try {
            const response = await this.axiosInstance.post(
                'https://claudeservice-n694.stackos.io/claude-3-5-sonnet-20241022/natural-request',
                payload
            );
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, data: null, error: String(error) };
        }
    }

    /**
     * Generate text using OpenAI
     */
    async generateWithOpenAI(prompt: string, model: string): Promise<ServiceResponse> {
        const budgetVerified = await verifyBudget("openai", "4");
        if (!budgetVerified) {
            return { success: false, data: null, error: "Budget can't be verified" };
        }
        const skyNode = await getSkyNode();
        const userAuthPayload = await skyNode.appManager.getUrsulaAuth();

        if (!userAuthPayload.success) {
            throw new Error("Cant get Ursula Auth");
        }

        const payload: OpenAIRequest = {
            userAuthPayload: userAuthPayload.data,
            nftId: this.projectId,
            prompt
        };

        try {
            const response = await this.axiosInstance.post(
                `http://localhost:3004/natural-request/${model}/focused`,
                payload
            );
            return { success: true, data: response.data };
        } catch (error) {
            console.log("error", error);
            return { success: false, data: null, error: String(error) };
        }
    }



    /**
     * Upload file to IPFS
     * @param fileBuffer The file buffer to upload
     * @param fileName The name of the file
     */
    private async uploadToIPFS(fileBuffer: Buffer, fileName: string): Promise<ServiceResponse> {

        const budgetVerified = await verifyBudget("ipfs", "8");
        if (!budgetVerified) {
            return { success: false, data: null, error: "Budget can't be verified" };
        }

        const skyNode = await getSkyNode();
        const userAuthPayload = await skyNode.appManager.getUrsulaAuth();

        if (!userAuthPayload.success) {
            throw new Error("Cant get Ursula Auth");
        }

        const formData = new FormData();

        formData.append('userAuthPayload', JSON.stringify(userAuthPayload.data));
        formData.append('nftId', this.projectId);
        formData.append('files', fileBuffer, { filename: fileName });
        formData.append('prompt', 'Please upload the Buffer files');

        try {
            const response = await this.axiosInstance.post<IPFSUploadResponse>(
                'http://localhost:3001/natural-request',
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                    }
                }
            );
            return { success: true, data: response.data };
        } catch (error) {
            console.log("error", error);
            return { success: false, data: null, error: String(error) };
        }
    }


    /**
     * Generate image using DALL-E 3 and upload to IPFS
     * @param prompt The image generation prompt
     * @returns ServiceResponse with IPFS URL
     */
    async generateAndStoreImage(prompt: string): Promise<ServiceResponse> {
        try {
            // 1. Generate image with DALL-E 3
            const imageResult = await this.generateWithOpenAI(prompt, 'dall-e-3');
            console.log("imageResult", imageResult.data.image.data[0].url);
            if (!imageResult.success || !imageResult.data?.image.data[0].url) {
                throw new Error('Failed to generate image');
            }

            // 2. Download the image
            const imageUrl = imageResult.data.image.data[0].url;
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(imageResponse.data);

            // 3. Upload to IPFS
            const ipfsResult = await this.uploadToIPFS(imageBuffer, 'generated-image.png');
            if (!ipfsResult.success) {
                throw new Error('Failed to upload to IPFS');
            }

            console.log("ipfsResult", ipfsResult.data.data.data[0].data.Hash);

            return {
                success: true,
                data: {
                    originalPrompt: prompt,
                    revisedPrompt: imageResult.data.image.data[0].revised_prompt,
                    imageUrl: imageUrl,
                    ipfsUrl: "https://gateway.mesh3.network/ipfs/" + ipfsResult.data.data.data[0].data.Hash,
                    ipfshash: ipfsResult.data.data.data[0].data.Hash
                }
            };
        } catch (error) {
            console.log("error", error);
            return { success: false, data: null, error: String(error) };
        }
    }
} 