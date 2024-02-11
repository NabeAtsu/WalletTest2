import {
    createWalletAsync,
    signMessageAsync,
    verifySignatureAsync,
    generateRandomStringAsync
} from './modules/wallet.js';
import { outputLog } from "./modules/logger.js"
import { saveRandomStringAsync, getRandomStringAsync } from "./services/indexedDB.js"
import { abi_Erc721 } from "./abi/abi_Erc721.js"
// import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

var wallet;

var passwordTextElement;
var createWalletBtnElement;
var walletAddressElement;
var secretKeyElement;
var walletMsgElement;

var txAddressElement;
var tokenURIBtnElement;
var tokenURIElement;
var txMsgElement;

document.addEventListener('DOMContentLoaded', (event) => {
    ////////////////////////////////////////////////////////////////////////////
    // Create elements
    ////////////////////////////////////////////////////////////////////////////
    passwordTextElement = document.getElementById('wallet__password');
    createWalletBtnElement = document.getElementById('wallet__create');
    walletAddressElement = document.getElementById('wallet__address');
    secretKeyElement = document.getElementById('wallet__secretKey');
    walletMsgElement = document.getElementById('wallet__message');
    
    txAddressElement = document.getElementById('tx__address');
    tokenURIBtnElement = document.getElementById('tx__exec');
    tokenURIElement = document.getElementById('tx__tokenURI');
    txMsgElement = document.getElementById('tx__message');

    ////////////////////////////////////////////////////////////////////////////
    // Create events
    ////////////////////////////////////////////////////////////////////////////
    createWalletBtnElement.addEventListener('click', createWallet);
    tokenURIBtnElement.addEventListener('click', getTokenURI);
});

////////////////////////////////////////////////////////////////////////////
// Functions
////////////////////////////////////////////////////////////////////////////
async function createWallet() {
    const key = passwordTextElement.value;
    const randomString = await getRandomStringAsync();
    outputLog("randomString :", randomString);
    const createdWallet = await createWalletAsync(key, randomString);
    if (!createdWallet.result) {
        outputLog("createWallet", "ウォレットの生成に失敗しました。");
        return;
    }
    wallet = createdWallet.wallet;
    
    const message = "message";
    const signature = await signMessageAsync(message, wallet);

    outputLog('message', message);
    outputLog('signature', JSON.stringify(signature));
    outputLog('wallet.publicKey', wallet.address);
    const verified = await verifySignatureAsync(message, signature, wallet.address);
    outputLog('署名の検証結果', verified ? "有効" : "無効");

    walletAddressElement.innerText = "Address :" + wallet.address;
    secretKeyElement.innerText = "SecretKey :" + randomString;
}

async function getTokenURI() {
    const contractAddress = txAddressElement.value;
    const contract = new ethers.Contract(contractAddress, abi_Erc721, wallet);

    const uri = await contract.tokenURI(1);
    tokenURIElement.innerText = "tokenURI :" + uri;
}

////////////////////////////////////////////////////////////////////////////
// Service worker
////////////////////////////////////////////////////////////////////////////
async function generateRandomStringIfNeededAsync(length) {
    let randomString = await getRandomStringAsync();
    if (!randomString) {
        randomString = await generateRandomStringAsync(length);
        await saveRandomStringAsync(randomString);
    }
    return randomString;
}

// Set serviceworker
const registration = await navigator.serviceWorker.register('/src/sw.js', {
	scope: '/src/',
});
console.log("registration :", registration);

// Init value
await generateRandomStringIfNeededAsync(32);
