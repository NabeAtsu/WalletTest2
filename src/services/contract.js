import { outputLog } from "../modules/logger.js"
import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";
import { abi_Erc721 } from "../abi/abi_Erc721.js"

export async function getTokenURI(contractAddress, wallet = null) {
    // outputLog('abi_Erc721', abi_Erc721);
    outputLog('wallet', wallet);
    const contract = new ethers.Contract(contractAddress, abi_Erc721, wallet);
    outputLog('contract', contract);

    const uri = await contract.tokenURI(1);
    tokenURI.innerText = "tokenURI :" + uri;
}