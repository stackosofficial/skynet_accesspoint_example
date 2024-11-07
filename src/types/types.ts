export interface UserAuthPayload {
    userAddress: string;
    signature: string;
    message: string;
}

export interface BaseRequestPayload {
    userAuthPayload: UserAuthPayload;
    nftId: string;
}

export interface ServiceResponse {
    success: boolean;
    data: any;
    error?: string;
}

// Service-specific interfaces
export interface StackOSRequest extends BaseRequestPayload {
    prompt: string;
}

export interface RunPodRequest extends BaseRequestPayload {
    prompt: string;
}

export interface ClaudeRequest extends BaseRequestPayload {
    messages: Array<{
        role: string;
        content: string;
    }>;
    model: string;
}

export interface OpenAIRequest extends BaseRequestPayload {
    prompt: string;
}

export interface LighthouseRequest extends BaseRequestPayload {
    prompt: string;
    files: File[];
}

export interface OpenAIImageRequest extends BaseRequestPayload {
    prompt: string;
}

export interface OpenAIImageResponse {
    created: number;
    data: Array<{
        url: string;
        revised_prompt?: string;
    }>;
}

export interface IPFSUploadResponse {
    success: boolean;
    cid: string;
    url: string;
} 