//Contains each AVAX transaction needed for gameplay plus helper methods
require('dotenv').config();
const { AVAX_API_URL, PRIVATE_KEY, ADDRESS, CRABADA_CONTRACT } = process.env;
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(AVAX_API_URL));

//HEX Helper
function convertNumberToPaddedHex(number){
    //takes a number, uses numberToHex, then pads the value to 64 
    const bn = web3.utils.toBN(number)
    //converts cn to hex, leftPads the value to len 64, then trims the hex prefix
    return web3.utils.stripHexPrefix(web3.utils.padLeft(`${web3.utils.numberToHex(bn)}`, 64))
}

//Game Functions
async function startGame() {    
    /*
    Function: startGame(uint256 teamId) ***

    MethodID: 0xe5ed1d59
    [0]:  0000000000000000000000000000000000000000000000000000000000000d13
    */
    const startGameData = '0xe5ed1d5900000000000000000000000000000000000000000000000000000000000013B4'
    const nonce = await web3.eth.getTransactionCount(ADDRESS, 'latest'); // nonce starts counting from 0
    const gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': startGameData, 'nonce': nonce})

    const transaction = {
        'to': CRABADA_CONTRACT,
        'gas': gasEstimate, //318963
        'maxPriorityFeePerGas': 1000000000,
        'nonce': nonce,
        // optional data field to send message or execute smart contract
        'data': startGameData
    };

    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);

    web3.eth.sendSignedTransaction(signedTx.rawTransaction, function (error, hash) {
        if (!error) {
            console.log("🎉 The hash of your transaction is: ", hash, "\n Check the Mempool to view the status of your transaction!");
        } else {
            console.log("❗Something went wrong while submitting your transaction:", error)
        }
    });
}

async function reinforceTeam(gameId, crabadaId, borrowPrice) {
    /*
    Function: reinforceDefense(uint256 gameId, uint256 crabadaId, uint256 borrowPrice) ***

    MethodID: 0x08873bfb
    [0]:  000000000000000000000000000000000000000000000000000000000003f870
    [1]:  0000000000000000000000000000000000000000000000000000000000002425
    [2]:  00000000000000000000000000000000156ef9730933c22a3e5da6e400000000

    OG:
    0x08873bfb000000000000000000000000000000000000000000000000000000000003f870000000000000000000000000000000000000000000000000000000000000242500000000000000000000000000000000156ef9730933c22a3e5da6e400000000
    */

    //TODO: Logic to build the reinforce game data
    gameId = convertNumberToPaddedHex(gameId)
    crabadaId = convertNumberToPaddedHex(crabadaId)
    borrowPrice = convertNumberToPaddedHex(borrowPrice)


    const reinforceGameData = `0x08873bfb${gameId}${crabadaId}${borrowPrice}`
    const nonce = await web3.eth.getTransactionCount(ADDRESS, 'latest'); // nonce starts counting from 0
    const gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': reinforceGameData, 'nonce': nonce})

    const transaction = {
        'to': CRABADA_CONTRACT,
        'gas': gasEstimate, //320000
        'maxPriorityFeePerGas': 1000000000,
        'nonce': nonce,
        // optional data field to send message or execute smart contract
        'data': reinforceGameData
    };

    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);

    web3.eth.sendSignedTransaction(signedTx.rawTransaction, function (error, hash) {
        if (!error) {
            console.log("🎉 The hash of your transaction is: ", hash, "\n Check the Mempool to view the status of your transaction!");
        } else {
            console.log("❗Something went wrong while submitting your transaction:", error)
        }
    });
}

async function endGame(gameId) {
    /*
    Function: closeGame(uint256 gameId) ***

    MethodID: 0x2d6ef310
    [0]:  000000000000000000000000000000000000000000000000000000000003f870

    OG:
    0x2d6ef310000000000000000000000000000000000000000000000000000000000003f870
    */

    const param1 = convertNumberToPaddedHex(gameId)
    console.log(param1)

    const closeGameData = `0x2d6ef310${convertNumberToPaddedHex(gameId)}`
    console.log(closeGameData)

    //const closeGameData = '0x2d6ef310000000000000000000000000000000000000000000000000000000000003f870'
    const nonce = await web3.eth.getTransactionCount(ADDRESS, 'latest'); // nonce starts counting from 0
    const gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': closeGameData, 'nonce': nonce})
    console.log(gameId)
    console.log(gasEstimate)
    console.log(closeGameData)

    const transaction = {
        'to': CRABADA_CONTRACT,
        'gas': gasEstimate, //167235
        'maxPriorityFeePerGas': 1000000000,
        'nonce': nonce,
        // optional data field to send message or execute smart contract
        'data': closeGameData
    };
    console.log(transaction)
    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);

    web3.eth.sendSignedTransaction(signedTx.rawTransaction, function (error, hash) {
        if (!error) {
            console.log("🎉 The hash of your transaction is: ", hash, "\n Check the Mempool to view the status of your transaction!");
        } else {
            console.log("❗Something went wrong while submitting your transaction:", error)
        }
    });
}

async function checkPriceAgainstLimit(crab){
    console.log("crab here:")
    console.log(crab)
    const bn = web3.utils.toBN(crab['price'])
    const priceCap = web3.utils.toBN("35000000000000000000")
    console.log(await web3.utils.fromWei(bn, 'Ether'))
    console.log(await web3.utils.fromWei(priceCap, 'Ether'))
    if (bn.lte(priceCap)){
        console.log(`${bn} is less than ${priceCap}`)
        console.log("renting crab?")
        return true
    } else {
        console.log(`${bn} is greater than ${priceCap}`)
        console.log("Crabs too expensive! Try again later")
        return false
    }
}


module.exports = {startGame, reinforceTeam, endGame, convertNumberToPaddedHex, checkPriceAgainstLimit}