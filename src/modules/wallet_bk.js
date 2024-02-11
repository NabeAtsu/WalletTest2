import { outputLog } from "./logger.js";
var ec = new window.elliptic.ec('secp256k1');

export async function createWalletAsync(key) {
    try {
        // 参考：https://arpable.com/technology/blockchain-wallet/
        // ランダム文字列とキーを使用しハッシュ値（秘密鍵）を取得する
        const randomString = await generateRandomStringAsync(32);
        const hmacSHA512 = await computeHMACSHA512Async(randomString, key);
        outputLog('Random String', randomString);
        outputLog('secretCode', hmacSHA512.masterSecretKey);
        outputLog('chainCode', hmacSHA512.masterChainCode);

        // 取得した秘密鍵から公開鍵を生成する
        const publicKey = await generateKeyPairFromHashAsync(hmacSHA512.masterSecretKey);
        outputLog('privateKey', JSON.stringify(hmacSHA512.masterSecretKey));
        outputLog('publicKey', JSON.stringify(publicKey));

        // 公開鍵からアドレスを生成する
        const address = generateAddressFromPublicKey(publicKey)
        outputLog('Ethereum Address', JSON.stringify(address));

        // 秘密鍵・公開鍵・アドレスを返却する
        return { result: true, privateKey: hmacSHA512.masterSecretKey, publicKey: publicKey, address: address };
    } catch (error) {
        outputLog('秘密鍵の生成中にエラーが発生しました', error);
        return { result: false, privateKey: null, publicKey: null, address: null };
    }
}
export async function createWalletByEthersAsync(key, randomString) {
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
        const wallet = new ethers.Wallet(hmacSHA512.masterSecretKey).connect(ethers.provider);
        outputLog('wallet', JSON.stringify(wallet));

        return { result: true, wallet: wallet };
    } catch (error) {
        outputLog('秘密鍵の生成中にエラーが発生しました', error);
        return { result: false, privateKey: null, publicKey: null, address: null };
    }
}

// 参考：https://www.tabnine.com/code/javascript/functions/elliptic/KeyPair/sign
export async function signMessageAsync(message, privateKey) {
    const keyPair = ec.keyFromPrivate(privateKey);
    const signature = keyPair.sign(message);
    return {
        r: signature.r.toString(16),
        s: signature.s.toString(16)
    };
}
export async function signMessageByEthersAsync(message, wallet) {
    const signature = wallet.signMessage(message);
    return signature;
}

// 参考：https://www.tabnine.com/code/javascript/functions/elliptic/KeyPair/verify
export async function verifySignatureAsync(message, signature, publicKey) {
    const keyPair = ec.keyFromPublic(publicKey, 'hex');
    return keyPair.verify(message, signature);
}
export async function verifySignatureByEthersAsync(message, signature, publicKey) {
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

async function generateKeyPairFromHashAsync(hash) {
    const keyPair = ec.keyFromPrivate(hash);
    const publicKey = keyPair.getPublic().encode('hex');
    return publicKey;
}

function generateAddressFromPublicKey(publicKey) {
    // 公開鍵の先頭の '04' を削除
    const publicKeyWithoutPrefix = publicKey.slice(2);
    const hash = keccak256.arrayBuffer(hexStringToByte(publicKeyWithoutPrefix));
    const hashHex = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
    const address = '0x' + hashHex.slice(-40);

    return applyEthereumChecksum(address);
}

function hexStringToByte(str) {
    if (!str) {
        return new Uint8Array();
    }

    var a = [];
    for (var i = 0, len = str.length; i < len; i+=2) {
        a.push(parseInt(str.substr(i,2),16));
    }

    return new Uint8Array(a);
}

function applyEthereumChecksum(address) {
    address = address.toLowerCase().replace('0x','');
    const hash = keccak256(address);
    let checksumAddress = '0x';

    for (let i = 0; i < address.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            checksumAddress += address[i].toUpperCase();
        } else {
            checksumAddress += address[i];
        }
    }

    return checksumAddress;
}
