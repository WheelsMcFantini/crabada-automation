/*eslint-env node, mocha*/
/* eslint-disable no-unused-vars */
//Contains each AVAX transaction needed for gameplay plus helper methods
require('dotenv').config();
const { AVAX_API_URL, PRIVATE_KEY, ADDRESS, CRABADA_CONTRACT, SWIMMER_NETWORK } = process.env;


//const AVAX_API_URL = process.env.AVAX_API_URL//swimmer
//const PRIVATE_KEY = process.env.PRIVATE_KEY
//const ADDRESS = process.env.ADDRESS
//const CRABADA_CONTRACT = process.env.CRABADA_CONTRACT//swimmer
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(AVAX_API_URL));
const parentLogger = require('./utilities.js')
const logMetadata = { file: 'crabada-tx.js' , address: ADDRESS }


parentLogger.debug(`loaded the following variables`, logMetadata)
parentLogger.debug(`AVAX_API_URL: ${AVAX_API_URL}`, logMetadata)
parentLogger.debug(`ADDRESS: ${ADDRESS}`, logMetadata)
parentLogger.debug(`CRABADA_CONTRACT: ${CRABADA_CONTRACT}`, logMetadata)
parentLogger.debug(`SWIMMER_NETWORK: ${SWIMMER_NETWORK}`, logMetadata)

//const {LoggingWinston} = require('@google-cloud/logging-winston');

const statusEnum = Object.freeze({
    SUCCESS: 0,
    FAIL: 1,
    CRAB_LOCKED: 2
  })



/**
* Function that converts a number into a 0 padded hexadecimal number
* @author   Wheels
* @param    {number} number    number to convert
* @return   {bn}         0 padded hexadecimal bigNumber of length 64, with the prefix removed
*/
function convertNumberToPaddedHex(number){
    //takes a number, uses numberToHex, then pads the value to 64 
    const bn = web3.utils.toBN(number)
    //converts cn to hex, leftPads the value to len 64, then trims the hex prefix
    return web3.utils.stripHexPrefix(web3.utils.padLeft(`${web3.utils.numberToHex(bn)}`, 64))
}

/**
* Function that creates and signs a startGame transaction
* @author   Wheels
* @param    {number} teamId    teamId of the team to start a game for
* @return   {Object}         signed Transaction object, ready to be sent
*/
async function startGame(teamId) {    
    const logger = parentLogger.child({ function: "startGame" }, logMetadata);
    logger.debug(`Recieved input teamId: ${teamId}`)
    /*
    Function: startGame(uint256 teamId) ***

    MethodID: 0xe5ed1d59
    [0]:  0000000000000000000000000000000000000000000000000000000000000d13
    */
    teamId = convertNumberToPaddedHex(teamId)
    const startGameData = `0xe5ed1d59${teamId}`
    //const startGameData = '0xe5ed1d5900000000000000000000000000000000000000000000000000000000000013B4'
    const nonce = await web3.eth.getTransactionCount(ADDRESS, 'latest'); // nonce starts counting from 0
    logger.debug(`Nonce: ${nonce}`)
    const gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': startGameData, 'nonce': nonce})
    logger.debug(`gasEstimate: ${gasEstimate}`)

    let transaction = {}
    if (SWIMMER_NETWORK == "true"){
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
    logger.debug(`Transaction data to be signed: ${JSON.stringify(transaction)}`)

    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
    return signedTx
}

/**
* Function that creates and signs a reinforceTeam transaction to reinforce from the tavern
* @author   Wheels
* @param    {number} gameId    The ID of the game to reinforce with a crab
* @param    {number} crabadaId    the ID of the crab to reinforce the game with
* @param    {number} borrowPrice    The price in wei of the crab to reinforce with
* @return   {Object}         signed Transaction object, ready to be sent
*/
async function reinforceTeam(gameId, crabadaId, borrowPrice) {
    const logger = parentLogger.child({ function: "reinforceTeam" }, logMetadata);
    logger.debug(`Recieved input gameId: ${gameId}`)
    logger.debug(`Recieved input crabadaId: ${crabadaId}`)
    logger.debug(`Recieved input borrowPrice: ${borrowPrice}`)
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
    logger.debug(`Nonce: ${nonce}`)
    let gasEstimate
    try { 
         gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': reinforceGameData, 'nonce': nonce})
         logger.debug(`gasEstimate: ${gasEstimate}`)
    }
    catch (error){
        logger.error(`${JSON.stringify(error)}`)
        return "failed"
    }
    let transaction = {}
    if (SWIMMER_NETWORK == "true"){
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
    logger.debug(`Transaction data to be signed: ${JSON.stringify(transaction)}`)
    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
    logger.info("done with reinforce")
    return signedTx
    
}

/**
* Function that creates and signs a reinforceTeamFromInventory transaction to reinforce from the inventory
* @author   Wheels
* @param    {number} gameId    The ID of the game to reinforce with a crab
* @param    {number} crabadaId    the ID of the crab to reinforce the game with
* @return   {Object}         signed Transaction object, ready to be sent
*/
async function reinforceTeamFromInventory(gameId, crabadaId) {
    const logger = parentLogger.child({ function: "reinforceTeamFromInventory" }, logMetadata);
    logger.debug(`Recieved input gameId: ${gameId}`)
    logger.debug(`Recieved input crabadaId: ${crabadaId}`)
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
    logger.debug(`Nonce: ${nonce}`)
    let gasEstimate
    try { 
         gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': reinforceGameData, 'nonce': nonce})
         logger.debug(`gasEstimate: ${gasEstimate}`)
        }
        catch (error){
            logger.error(`${JSON.stringify(error)}`)
            return "failed"
        }
    let transaction = {}
    if (SWIMMER_NETWORK == "true"){
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
    logger.debug(`Transaction data to be signed: ${JSON.stringify(transaction)}`)
    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
    logger.info("done with reinforce")
    return signedTx
    
}

/**
* Function that estimates gas for a transaction
* @author   Wheels
* @param    {string} to_address    The recipient of the transaction
* @param    {string} from_address The sender of the transaction
* @param    {Object} transactionPayload The data contained in the transaction
* @param    {number} nonce 
* @return   {number}         Estimated Gas Limit
*/
async function estimateGas(to_address, from_address, transactionPayload, nonce){
    const logger = parentLogger.child({ function: "estimateGas" }, logMetadata);
    try {
        const gasEstimate = await web3.eth.estimateGas({'to': to_address, 'from': from_address, 'data': transactionPayload, 'nonce': nonce})
        return gasEstimate
    }
    catch (error){
        logger.info(`${JSON.stringify(error)}`)
        return 
    }
}


/**
* Function that creates a generic transaction to be signed
* @author   Wheels
* @param    {Object} transactionPayload    The ID of the game to reinforce with a crab
* @return   {Object}         signed Transaction object, ready to be sent
*/
async function createTransaction(transactionPayload){
    const logger = parentLogger.child({ function: "createTransaction" }, logMetadata);
    const nonce = await web3.eth.getTransactionCount(ADDRESS, 'latest'); // nonce starts counting from 0
    logger.debug(`Nonce: ${nonce}`)
    const gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': transactionPayload, 'nonce': nonce})

    const transaction = {
        'to': CRABADA_CONTRACT,
        'gas': gasEstimate, //320000
        'maxPriorityFeePerGas': 1000000000,
        'nonce': nonce,
        // optional data field to send message or execute smart contract
        'data': transactionPayload
    };
    logger.debug(`Transaction data to be signed: ${JSON.stringify(transaction)}`)
    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);

    return signedTx
}

/**
* Function that sends a signed Transaction to be executed
* @author   Wheels
* @param    {Object} signedTransaction    A signed Transaction object
*/
async function sendTx(signedTransaction){
    const logger = parentLogger.child({ function: "sendTx" }, logMetadata);
    
    const sendTxResult = web3.eth.sendSignedTransaction(signedTransaction.rawTransaction)
        .on('transactionHash', function(hash){logger.info(`🎉 The hash of your transaction is: ${hash}`)})
        .on('receipt', function(receipt){logger.info(`Successfully mined transaction for ${receipt['cumulativeGasUsed']*receipt['effectiveGasPrice']} Gwei`);logger.debug(`Reciept: ${JSON.stringify(receipt)}`)})
        .on('error', function(error, reciept){
            //examine the error object, to try and get to see if the crab was locked. If so, go again. 
            logger.info(`❗Something went wrong while processing your transaction. Error->${JSON.stringify(error)}, Tx -> ${JSON.stringify(signedTransaction)}, Reciept->${reciept}`)
        })
        await new Promise(resolve => setTimeout(resolve, 5000))    
}


/**
* Function that creates and signs an endGame transaction
* @author   Wheels
* @param    {number} gameId    gameId of the game to end
* @return   {Object}         signed Transaction object, ready to be sent
*/
async function endGame(gameId) {
    const logger = parentLogger.child({ function: "endGame" }, logMetadata);
    logger.debug(`Recieved input gameId: ${gameId}`)
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
    //logger.info(ADDRESS)

    const nonce = await web3.eth.getTransactionCount(ADDRESS, 'latest'); // nonce starts counting from 0
    logger.debug(`Nonce: ${nonce}`)
    const gasEstimate = await web3.eth.estimateGas({'to': CRABADA_CONTRACT, 'from': ADDRESS, 'data': closeGameData, 'nonce': nonce})
    logger.debug(`gasEstimate: ${gasEstimate}`)
    //logger.info(closeGameData)
    let transaction = {}
    if (SWIMMER_NETWORK == "true"){
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

/**
* Function that checks the price of a rental crab against a set limit
* @author   Wheels
* @param    {Object} crab    crab to price check
* @return   {boolean}         true if the crab is within budget, false otherwise
*/
async function checkPriceAgainstLimit(crab){
    const logger = parentLogger.child({ function: "checkPriceAgainstLimit" }, logMetadata);
    //logger.info("crab here:")
    //logger.info(crab)
    const bn = web3.utils.toBN(crab['price'])
    const priceCap = web3.utils.toBN("35000000000000000000")
    //logger.info(await web3.utils.fromWei(bn, 'Ether'))
    //logger.info(await web3.utils.fromWei(priceCap, 'Ether'))
    if (bn.lte(priceCap)){
        logger.debug(`${bn} is less than ${priceCap}`)
        logger.info("Renting crab")
        return true
    } else {
        logger.debug(`${bn} is greater than ${priceCap}`)
        logger.info("Crabs too expensive! Try again later")
        return false
    }
}



module.exports = {startGame, reinforceTeam, endGame, convertNumberToPaddedHex, checkPriceAgainstLimit, reinforceTeamFromInventory, sendTx, statusEnum}
