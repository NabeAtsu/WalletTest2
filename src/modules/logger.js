export function outputLog(itemName, message) {
    console.log(itemName + " : " + message);
    const logElement = document.getElementById("log__message");
    logElement.innerText = itemName + " : " + message;
}