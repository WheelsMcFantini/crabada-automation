/*eslint-env node, mocha */
const fetch = require('node-fetch')
const { sendTx, checkPriceAgainstLimit, reinforceTeam, reinforceTeamFromInventory, statusEnum} = require('./crabada-tx.js')
const IDLE_API = 'idle-api.crabada.com'
//const IDLE_API = 'idle-game-subnet-test-api.crabada.com'
const USER_MINES_PATH = '/public/idle/mines?user_address='
const MINE_PATH = '/public/idle/mine/'
const TEAM_PATH = '/public/idle/teams?user_address='
//const CAN_JOIN_PATH = '/public/idle/crabadas/can-join-team?user_address='
const EXTRA_OPTS = '&page=1&status=open&limit=8'
const NO_GAME_OPTS = '&page=1&limit=8'
const AVAX_API_URL = process.env.AVAX_API_URL
const ADDRESS = process.env.ADDRESS
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(AVAX_API_URL));
//const BN = web3.utils.BN
const { format, createLogger, transports } = require('winston')
//const {LoggingWinston} = require('@google-cloud/logging-winston');

//do I want the tavern stuff in it's own file? 
//Tavern file with choose crab, calculate MP, retry re
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

async function getTeamsAtAddress(address) {
  const url = `https://${IDLE_API}${TEAM_PATH}${address}`
  logger.info(`[Crabada-game] ${url}`)
  logger.info(`[Crabada-game] Retrieving teams at ${address}: ${url}`)
  let data = {}
  try {
    data = await fetch(url)
    logger.info(data)
  } catch (error) {
    logger.error(error)
  }
  const teamData = await data.json()
  //teams can be LOCK, AVAILABLE, MINING, LOOTING?, only return teams with 3 crabs
  return teamData['result']['data']
}



//currently supports a single game, function returns the Game_ID
async function retrieveLatestGameInfo(address) {
  const url = `https://${IDLE_API}${USER_MINES_PATH}${address}${EXTRA_OPTS}`
  logger.info(`[Crabada-game] ${url}`)
  logger.info(`[Crabada-game] Retrieving latest game status for ${address}: ${url}`)
  let data = {}
  try {
    data = await fetch(url)
    logger.info(data)
  } catch (error) {
    logger.error(error)
  }
  const gameData = await data.json()
  if (gameData['result']['totalRecord'] == 0) {
    logger.http(`[Crabada-game] no game: ${JSON.stringify(gameData['result'])}`)
    const no_game_url = `https://${IDLE_API}${TEAM_PATH}${address}${NO_GAME_OPTS}`
    const no_data = await fetch(no_game_url)
    const no_gameData = await no_data.json()
    logger.info(`[Crabada-game] ${no_gameData['result']['data'][0]['team_id']}`)
    return { 'game_id': 'NO_GAME', 'team_id': `${no_gameData['result']['data'][0]['team_id']}` }
  } else {
    logger.info(`[Crabada-game] Latest mine ID: ${gameData['result']['data'][0]['game_id']}`)
    return gameData['result']['data'][0]['game_id']
  }
}

async function getMineInfo(mine_id) {

  const url = `https://${IDLE_API}${MINE_PATH}${mine_id}`
  logger.info(`[Crabada-game] Retrieving mine object for Mine: ${mine_id}`)
  try {
    const data = await fetch(url)
    logger.info(data)
    const mine = await data.json()
    return mine
  } catch (error) {
    logger.error(error)
  }

}

//might make sense to feed a type of sort in?
//I search for: Cheapest, strongest, most skilled
async function getCrabsForHire() {
  
  //Inventory Reinforce
  const inventory_url = `https://idle-api.crabada.com/public/idle/crabadas/can-join-team?user_address=${ADDRESS}`
  logger.info(`[Crabada-game] Checking inventory for idle crabs`)
    try {
      const data = await fetch(inventory_url)
      logger.info(data)
      const inventory = await data.json()
      //if there's crabs, create and return the rentable ones
      //if there's no crabs, keep going
      if (inventory['result']['totalRecord'] > 0){
        logger.info(`[Crabada-game] Idle crabs available for hire`)
        logger.info(inventory['result']['data'])
        return {crabsForHire: inventory['result']['data'], source: "inventory"}
      }
    }  catch (error) {
      logger.error(error)
    }
  //Tavern Reinforce
    const tavern_url = 'https://idle-api.crabada.com/public/idle/crabadas/lending?orderBy=mine_point&order=desc&page=1&limit=10'
    logger.info(`[Crabada-game] Retrieving mercenary info from Tavern`)

    try {
      const data = await fetch(tavern_url)
      logger.info(data)
      const tavern = await data.json()
      return {crabsForHire: tavern['result']['data'], source: "tavern"}
    }  catch (error) {
      logger.error(error)
    }
}

async function chooseCrab(mine, listOfCrabsToHire) {
  let bestCrabs = []
  for (let i in listOfCrabsToHire) {
    //logger.info(listOfCrabsToHire[i])
    //let hasPrice = Object.prototype.hasOwnProperty.call(listOfCrabsToHire[i], 'price');

    //if (hasPrice){listOfCrabsToHire[i].price = await web3.utils.toWei('000000000000000001', 'ether')}
    //logger.info(listOfCrabsToHire[i])
    //logger.info(`${mine}`)
    const crabMeta = await calculateMR(mine, listOfCrabsToHire[i])
    //logger.info(crabMeta)
    //if positive, add to best crabs, otherwise, next.
    if (Math.sign(crabMeta['value']) == 1 ) {
      bestCrabs.push(crabMeta)
    }
  }
  //logger.info("pre-sort")
  //logger.info(bestCrabs)
  bestCrabs.sort(function (a, b) { return b['value'] - a['value'] })
  //logger.info("post-sort")
  logger.info(`[Crabada-game] ${bestCrabs}`)
  return bestCrabs
}

async function calculateMR(mine, crab) {
  //First I Want to enumerate all the Crabs MP and figure out the modifier
  const BASE_CHANCE = 7.0
  const crabList = [...mine['result']['defense_team_info']]
  //logger.info(`${JSON.stringify(mine)}`)
  //logger.info(`${crabList[0].toString()}`)
  let mpMod = getMPMod(crabList)
  //logger.info(`current MPmod = ${mpMod}`)
  let bpMod = getBPMod(mine)
  //logger.info(`current BPmod = ${bpMod}`)
  const currentMinersRevengeChance = BASE_CHANCE + mpMod + bpMod

  //add potential crab to the team for calculations
  crabList.push(crab)

  mpMod = getMPMod(crabList)
  //logger.info(`${crabList[0].toString()}`)
  bpMod = getBPMod(mine)
  //logger.info(`${crabList[0].toString()}`)
  const potentialMinersRevengeChance = BASE_CHANCE + mpMod + bpMod
  const difference = potentialMinersRevengeChance - currentMinersRevengeChance

  logger.info(`[Crabada-game] Current MR chance is ${currentMinersRevengeChance}%, potential MR chance with crab-${crab['id']} becomes ${potentialMinersRevengeChance}, a difference of ${difference}`)
  const bn = await web3.utils.toBN(crab['price'])
  const numTus = await web3.utils.fromWei(bn, 'Ether')
  logger.info(`[Crabada-game] With a price of ${numTus} TUS and a bonus of ${difference}, this crab gets you ${difference / numTus} MR chance per TUS`)
  return { 'id': crab['id'], 'price': crab['price'], 'value': difference / numTus }
}

//Takes a list of crabs as input and calculates the MP mod for Miners revenge
function getMPMod(crabList) {
  let total = 0
  //logger.info(crabList)
  for (let crab in crabList) {
    //logger.info(crabList[crab])
    let mp = crabList[crab]['critical'] + crabList[crab]['speed']
    total += mp
    //logger.info(total)
  }
  //logger.info(`total mp:${total}`)

  //((average MP - 56)*1.25)
  return (((total / crabList.length) - 56) * 1.25)
}

//takes a mine as input and calculates the BP closeness for Miners Revenge
function getBPMod(mine) {
  //messes up if defense points are higher than attack
 
  let { defense_point, attack_point } = mine['result']
  //logger.info(`stringified mine.result.attack_point? ${JSON.stringify(mine['result']['attack_point'])}`)
  //logger.info(`stringified mine.result.defense_point? ${JSON.stringify(mine['result']['defense_point'])}`)
  let delta = attack_point - defense_point
  //logger.info(`Delta = ${delta}`)
  let bpMod = 20 / Math.sqrt(delta)
  //logger.info(`bpMod = ${bpMod}`)
  return bpMod
}



async function reinforcementWrapper(mine) {
  
  const {crabsForHire, source} = await getCrabsForHire();
  //determine whether to reinforce from inv or tavern
  if (source == "inventory"){
    logger.info(`[Crabada-game] selecting the following crab ${crabsForHire[0]}`);
      const signedReinforcement = await reinforceTeamFromInventory(mine['result']['game_id'], crabsForHire[0]['id']);
      if (signedReinforcement == "failed"){
        reinforcementWrapper(mine)
        return
      }
      const status = await sendTx(signedReinforcement);
      logger.info(`status: ${status}`)
      if (status == statusEnum.SUCCESS){
        logger.info("TX success")
      }else if (status == statusEnum.FAIL){
        logger.info("TX fail")
      } else if (status == statusEnum.CRAB_LOCKED){
        logger.info("Crab locked")
      }
  } else {
  const crabs = await chooseCrab(mine, crabsForHire);
  //crabs is now an ordered list of the best crabs instead of 1 crab
    if (await checkPriceAgainstLimit(crabs[0])) {
      logger.info(`[Crabada-game] selecting the following crab ${crabs[0]}`);
      const signedReinforcement = await reinforceTeam(mine['result']['game_id'], crabs[0]['id'], crabs[0]['price']);
      const status = await sendTx(signedReinforcement);
      logger.info(`status: ${status}`)
      if (status == statusEnum.SUCCESS){
        logger.info("TX success")
      }else if (status == statusEnum.FAIL){
        logger.info("TX fail")
      } else if (status == statusEnum.CRAB_LOCKED){
        logger.info("Crab locked")
      }
    } else {
        logger.warn("[Crabada-game] Crab rental is a no-go. Either the crab was too expensive or a different error occured.");
        return 'fail';
    }  }
  
}

/* web3.eth.sendTransaction({from: '0x123...', data: '0x432...'})
.once('sending', function(payload){ ... })
.once('sent', function(payload){ ... })
.once('transactionHash', function(hash){ ... })
.once('receipt', function(receipt){ ... })
.on('confirmation', function(confNumber, receipt, latestBlockHash){ ... })
.on('error', function(error){ ... })
.then(function(receipt){
 // will be fired once the receipt is mined
});*/


module.exports = { getTeamsAtAddress, getMineInfo, reinforcementWrapper }