/*eslint-env node, mocha*/
/* eslint-disable no-unused-vars */
//Contains each AVAX transaction needed for gameplay plus helper methods
require('dotenv').config();
//const { AVAX_API_URL, PRIVATE_KEY, ADDRESS, CRABADA_CONTRACT } = process.env;
const SWIMMER_NETWORK = false
const AVAX_API_URL = process.env.AVAX_API_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ADDRESS = process.env.ADDRESS
const CRABADA_CONTRACT = process.env.CRABADA_CONTRACT
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(AVAX_API_URL));
const { format, createLogger, transports } = require('winston')
//const {LoggingWinston} = require('@google-cloud/logging-winston');

const statusEnum = Object.freeze({
    SUCCESS: 0,
    FAIL: 1,
    CRAB_LOCKED: 2
  })

//const loggingWinston = new LoggingWinston();

const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()),
    transports: [
    new transports.Console(),
    //new transports.File({ filename: 'combined.log' })
  ]
});
exports.logger = logger;

//HEX Helper
function convertNumberToPaddedHex(number){
    //takes a number, uses numberToHex, then pads the value to 64 
    const bn = web3.utils.toBN(number)
    //converts cn to hex, leftPads the value to len 64, then trims the hex prefix
    return web3.utils.stripHexPrefix(web3.utils.padLeft(`${web3.utils.numberToHex(bn)}`, 64))
}

//Game Functions
async function startGame(teamId) {    
    /*
    Function: startGame(uint256 teamId) ***

    MethodID: 0xe5ed1d59
    [0]:  0000000000000000000000000000000000000000000000000000000000000d13
    */
    teamId = convertNumberToPaddedHex(teamId)
    const startGameData = `0xe5ed1d59${teamId}`
    //const startGameData = '0xe5ed1d5900000000000000000000000000000000000000000000000000000000000013B4'
    const nonce = await web3.eth.getTransactionCount(ADDRESS, 'latest'); // nonce starts counting from 0
    const gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': startGameData, 'nonce': nonce})
    
    let transaction = {}
    if (SWIMMER_NETWORK){
        transaction = {
            'to': CRABADA_CONTRACT,
            'gas': gasEstimate, //320000
            'gasPrice': "0000000000",
            'nonce': nonce,
            // optional data field to send message or execute smart contract
            'data': startGameData
        };
    } else {
        transaction = {
            'to': CRABADA_CONTRACT,
            'gas': gasEstimate, //320000
            'maxPriorityFeePerGas': 1000000000,
            'nonce': nonce,
            // optional data field to send message or execute smart contract
            'data': startGameData
        };
    }

    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
    return signedTx
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
    logger.info("estimating gas")
    let gasEstimate
    try { 
         gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': reinforceGameData, 'nonce': nonce})
    }
    catch (error){
        logger.log(error)
        //I should pass reinforce failed
    }
    let transaction = {}
    if (SWIMMER_NETWORK){
        transaction = {
            'to': CRABADA_CONTRACT,
            'gas': gasEstimate, //320000
            'gasPrice': "0000000000",
            'nonce': nonce,
            // optional data field to send message or execute smart contract
            'data': reinforceGameData
        };
    } else {
        transaction = {
            'to': CRABADA_CONTRACT,
            'gas': gasEstimate, //320000
            'maxPriorityFeePerGas': 1000000000,
            'nonce': nonce,
            // optional data field to send message or execute smart contract
            'data': reinforceGameData
        };
    }
    logger.info("tx created but not signed")
    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
    logger.info("done with reinforce")
    return signedTx
    
}

async function reinforceTeamFromInventory(gameId, crabadaId) {
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
    let borrowPrice = convertNumberToPaddedHex('000000000000000000')


    const reinforceGameData = `0x08873bfb${gameId}${crabadaId}${borrowPrice}`
    const nonce = await web3.eth.getTransactionCount(ADDRESS, 'latest'); // nonce starts counting from 0
    logger.info("estimating gas")
    let gasEstimate
    try { 
         gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': reinforceGameData, 'nonce': nonce})
    }
    catch (error){
        logger.log(`This is an error! ${error} |DONE`)
    }
    let transaction = {}
    if (SWIMMER_NETWORK){
        transaction = {
            'to': CRABADA_CONTRACT,
            'gas': gasEstimate, //320000
            'gasPrice': "0000000000",
            'nonce': nonce,
            // optional data field to send message or execute smart contract
            'data': reinforceGameData
        };
    } else {
        transaction = {
            'to': CRABADA_CONTRACT,
            'gas': gasEstimate, //320000
            'maxPriorityFeePerGas': 1000000000,
            'nonce': nonce,
            // optional data field to send message or execute smart contract
            'data': reinforceGameData
        };
    }
    logger.info("tx created but not signed")
    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
    logger.info("done with reinforce")
    return signedTx
    
}

async function createTransaction(transactionPayload){
    const nonce = await web3.eth.getTransactionCount(ADDRESS, 'latest'); // nonce starts counting from 0
    const gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': transactionPayload, 'nonce': nonce})

    const transaction = {
        'to': CRABADA_CONTRACT,
        'gas': gasEstimate, //320000
        'maxPriorityFeePerGas': 1000000000,
        'nonce': nonce,
        // optional data field to send message or execute smart contract
        'data': transactionPayload
    };

    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);

    return signedTx
}

async function sendTx(signedTransaction){
    const sendTxResult = web3.eth.sendSignedTransaction(signedTransaction.rawTransaction)
        .on('transactionHash', function(hash){logger.info(`[Crabada-game] 🎉 The hash of your transaction is: ${hash}`)})
        .on('receipt', function(receipt){logger.info(`[Crabada-game] Got reciept ${JSON.stringify(receipt)}`)
        .on('error', function(error, reciept){
            //examine the error object, to try and get to see if the crab was locked. If so, go again. 
            logger.info(`[Crabada-game] ❗Something went wrong while processing your transaction. Error->${error}, Reciept->${reciept}`)
        })
        //resolves here
})
}

async function endGame(gameId) {
    /*
    Function: closeGame(uint256 gameId) ***

    MethodID: 0x2d6ef310
    [0]:  000000000000000000000000000000000000000000000000000000000003f870

    OG:
    0x2d6ef310000000000000000000000000000000000000000000000000000000000003f870
    */


    const closeGameData = `0x2d6ef310${convertNumberToPaddedHex(gameId)}`
    //logger.info(closeGameData)

    //const closeGameData = '0x2d6ef310000000000000000000000000000000000000000000000000000000000003f870'
    const nonce = await web3.eth.getTransactionCount(ADDRESS, 'latest'); // nonce starts counting from 0
    const gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': closeGameData, 'nonce': nonce})
    //logger.info(gameId)
    //logger.info(gasEstimate)
    //logger.info(closeGameData)
    let transaction = {}
    if (SWIMMER_NETWORK){
        transaction = {
            'to': CRABADA_CONTRACT,
            'gas': gasEstimate, //320000
            'gasPrice': "0000000000",
            'nonce': nonce,
            // optional data field to send message or execute smart contract
            'data': closeGameData
        };
    } else {
        transaction = {
            'to': CRABADA_CONTRACT,
            'gas': gasEstimate, //320000
            'maxPriorityFeePerGas': 1000000000,
            'nonce': nonce,
            // optional data field to send message or execute smart contract
            'data': closeGameData
        };
    }
    //logger.info(transaction)
    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
    return signedTx
  
}

async function checkPriceAgainstLimit(crab){
    //logger.info("crab here:")
    //logger.info(crab)
    const bn = web3.utils.toBN(crab['price'])
    const priceCap = web3.utils.toBN("35000000000000000000")
    //logger.info(await web3.utils.fromWei(bn, 'Ether'))
    //logger.info(await web3.utils.fromWei(priceCap, 'Ether'))
    if (bn.lte(priceCap)){
        logger.info(`[Crabada-transaction] ${bn} is less than ${priceCap}`)
        logger.info("[Crabada-transaction] renting crab?")
        return true
    } else {
        logger.info(`[Crabada-transaction] ${bn} is greater than ${priceCap}`)
        logger.info("[Crabada-transaction] Crabs too expensive! Try again later")
        return false
    }
}


module.exports = {startGame, reinforceTeam, reinforceTeamFromInventory, endGame, convertNumberToPaddedHex, checkPriceAgainstLimit, sendTx, statusEnum}