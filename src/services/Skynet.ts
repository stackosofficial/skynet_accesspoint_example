import SkyMainNodeJS from '@decloudlabs/skynet/lib/services/SkyMainNodeJS';
import SkyEnvConfigNodeJS, { AppModifier, AppPayload, AppSubnetConfig, ContractApp, CRUD_APP_STAGE, DripRateFactors, STORAGE_TYPE, SubscriptionParam } from '@decloudlabs/skynet/lib/types/types';
import { ethers } from 'ethers';

let initializedAppCrypto: SkyMainNodeJS;

const initializeSkyNodeCrypto = async (): Promise<SkyMainNodeJS> => {
    if (!initializedAppCrypto) {
        const envConfig: SkyEnvConfigNodeJS = {
            JRPC_PROVIDER: process.env.PROVIDER_RPC!,
            WALLET_PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY!,
            STORAGE_API: {
                LIGHTHOUSE: {
                    LIGHTHOUSE_API_KEY: process.env.LIGHTHOUSE_API_KEY!
                },
                IPFS: {
                    PROJECT_ID: process.env.IPFS_PROJECT_ID!,
                    PROJECT_SECRET: process.env.IPFS_PROJECT_SECRET!
                }
            }
        };
        initializedAppCrypto = new SkyMainNodeJS(envConfig);
        await initializedAppCrypto.init(true);
    }
    return initializedAppCrypto;
};

export const getSkyNode = async (): Promise<SkyMainNodeJS> => {
    return await initializeSkyNodeCrypto();
};

export const createBudget = async (appName: string, subnetId: string) => {
    const skyNode = await getSkyNode();

    if (!process.env.PROJECT_ID) {
        return {
            success: false,
            nftId: "",
            appId: 0
        }
    }

    const contractApp: ContractApp = {
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

    let subscriptionParam: SubscriptionParam = {
        licenseAddress: "0x0000000000000000000000000000000000000000",
        supportAddress: "0x3C904a5f23f868f309a6DB2a428529F33848f517",
        platformAddress: "0xBC6200490F4bFC9092eA2987Ddb1Df478997e0cd",
        referralAddress: "0x0000000000000000000000000000000000000000",
        createTime: 0
    }

    const createTimeResp = await skyNode.dripRateManager.getSubscriptionParam(process.env.PROJECT_ID!);

    if (createTimeResp && createTimeResp.success) {
        if (createTimeResp.data.createTime > 0) {
            subscriptionParam.createTime = createTimeResp.data.createTime;
        }
    }

    const dripRateFactors: DripRateFactors = {
        licenseFactor: 0,
        supportFactor: 0,
        platformFactor: 0,
        referralFactor: 0,
        discountFactor: 0,
        referralExpiryDuration: 0,
        createTime: 0,
        daoRate: 0
    }

    const appPayload: AppPayload = {}

    const appModifier: AppModifier = {
        modAttribVar: {},
        contractParam: {},
        loggerURL: "https://appsender.skynet.io/api/appStatus"
    }

    const createAppResponse = await skyNode.appManager.createApp(
        contractApp,
        subscriptionParam,
        dripRateFactors,
        [etherToWei(Number(process.env.DEFAULT_RESOURCE_BUDGET!), 18).toString()],
        appPayload,
        appModifier,
        async (status) => {
            if (status === CRUD_APP_STAGE.CREATE_SUCCESSFUL) {
                console.log("status", status);
            }
        },
        { fetchAppList: true, fetchSubscriptionParam: true, fetchBalanceForSubscription: true, getDeploymentStatus: false }
    );
    console.log("createAppResponse", createAppResponse);
    return createAppResponse;
}

export const verifyBudget = async (appName: string, subnetId: string) => {
    const appList = await fetchApps();
    if (!appList) return false;
    const subnetList = appList.flatMap(app => app.subnetList);
    if (!subnetList.includes(subnetId)) {
        await createBudget(appName, subnetId);
        return true;
    };
    const verifyBudgetResponse = await getSubnetBalance(subnetId);
    console.log("verifyBudgetResponse", verifyBudgetResponse);
    if (verifyBudgetResponse && Number(verifyBudgetResponse) < (Number(process.env.DEFAULT_RESOURCE_BUDGET!) * 0.5)) {
        await addBudget(subnetId);
        return true;
    }
    return true;
}

export const addBudget = async (subnetId: string) => {
    const skyNode = await getSkyNode();
    const valueInWei = ethers.utils.parseEther(process.env.DEFAULT_RESOURCE_BUDGET!);
    const addbalanceRespose = await skyNode.contractService.SkynetWrapper.addBalanceByBuyingXCT(
        process.env.PROJECT_ID!,
        [subnetId],
        [valueInWei.toString()],
        { value: valueInWei }
    );
    console.log("addbalanceRespose", addbalanceRespose);
}


export const getSubnetBalance = async (
    subnetId: string
) => {
    const skyNode = await getSkyNode();

    if (!skyNode || !process.env.PROJECT_ID) return;

    try {
        const subnetList = [subnetId];
        const balance = await skyNode.contractService.SubscriptionBalance.getSubnetNFTBalances(
            process.env.PROJECT_ID!,
            subnetList
        );

        if (balance) {
            const formattedBalance = ethers.utils.formatUnits(balance.balanceList[0], 18);
            return formattedBalance;
        }
    } catch (error) {
        console.error('Error fetching subnet balances:', error);
    }
};


export const fetchApps = async () => {
    if (!process.env.PROJECT_ID) return;
    const skyNode = await getSkyNode();
    const apps = await skyNode.appManager.contractCall.getAppList(process.env.PROJECT_ID!);
    if (apps && apps.success) {
        return apps.data;
    }
    return [];
}

const etherToWei = (ether: number, decimal: number) => {
    if (decimal === 6) {
        return (Math.floor(ether * 1e6));
    }
    return (Math.floor(ether * 1e18));
};

