import { outputLog } from "./logger.js";
// import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

export async function createWalletAsync(key, randomString) {
    try {
        // 参考：https://arpable.com/technology/blockchain-wallet/
        // ランダム文字列とキーを使用しハッシュ値（秘密鍵）を取得する
        if (!randomString) {
            randomString = await generateRandomStringAsync(32);
            await saveRandomStringAsync(randomString);
        }
        const hmacSHA512 = await computeHMACSHA512Async(randomString, key);
        outputLog('Random String', randomString);
        outputLog('secretCode', hmacSHA512.masterSecretKey);
        outputLog('chainCode', hmacSHA512.masterChainCode);

        // 取得した秘密鍵から公開鍵を生成する
        // const provider = new ethers.JsonRpcProvider('https://endpoints.omniatech.io/v1/matic/mainnet/public');https://polygon-mainnet.infura.io/v3/4b8409b2ceda483ba12afc4e2ea93610
        const provider = new ethers.providers.JsonRpcProvider('https://polygon-mainnet.infura.io/v3/4b8409b2ceda483ba12afc4e2ea93610');
        const wallet = new ethers.Wallet(hmacSHA512.masterSecretKey).connect(provider);

        return { result: true, wallet: wallet };
    } catch (error) {
        outputLog('秘密鍵の生成中にエラーが発生しました', error);
        return { result: false, privateKey: null, publicKey: null, address: null };
    }
}

export async function signMessageAsync(message, wallet) {
    const signature = wallet.signMessage(message);
    return signature;
}

export async function verifySignatureAsync(message, signature, publicKey) {
    // const address = await ethers.verifyMessage(message, signature);
    const address = await ethers.utils.verifyMessage(message, signature);
    return address == publicKey;
}

export async function generateRandomStringAsync(length) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function computeHMACSHA512Async(randomString, key) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", keyData, { name: "HMAC", hash: { name: "SHA-512" } }, 
        false, ["sign"]
    );
    const signature = await window.crypto.subtle.sign(
        "HMAC", keyMaterial, encoder.encode(randomString)
    );

    const sha512 = Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
    return { masterSecretKey: sha512.slice(0, 64), masterChainCode: sha512.slice(-64)}
}
