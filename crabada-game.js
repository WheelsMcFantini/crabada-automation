/*eslint-env node, mocha */
require('dotenv').config();

const { AVAX_API_URL, ADDRESS, SWIMMER_NETWORK } = process.env;
const MINE_PATH = '/public/idle/mine/'
const TEAM_PATH = '/public/idle/teams?user_address='
const IDLE_API = 'idle-game-api.crabada.com'
const options = {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET"
}
// if (SWIMMER_NETWORK == "True") {
//const IDLE_API = 'idle-game-subnet-test-api.crabada.com'
//} 
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(AVAX_API_URL));
const fetch = require('node-fetch')
const { sendTx, checkPriceAgainstLimit, reinforceTeam, reinforceTeamFromInventory, statusEnum } = require('./crabada-tx.js')
const parentLogger = require('./utilities.js')
const logMetadata = { file: 'crabada-game.js', address: ADDRESS }
parentLogger.debug(`loaded the following variables`, logMetadata)
parentLogger.debug(`ADDRESS: ${ADDRESS}`, logMetadata)
parentLogger.debug(`AVAX_API_URL: ${AVAX_API_URL}`, logMetadata)
parentLogger.debug(`BREEDING: ${SWIMMER_NETWORK}`, logMetadata)
parentLogger.debug(`IDLE_API: ${IDLE_API}`, logMetadata)

//const USER_MINES_PATH = '/public/idle/mines?user_address='

//const CAN_JOIN_PATH = '/public/idle/crabadas/can-join-team?user_address='
//const EXTRA_OPTS = '&page=1&status=open&limit=8'
//const NO_GAME_OPTS = '&page=1&limit=8'

//const BN = web3.utils.BN

/**
* Function that gets team data of a given address
* @author   Wheels
* @param    {String} address    Avalanche Address
* @return   {Object}         Array of Team objects
*/
async function getTeamsAtAddress(address) {
  const logger = parentLogger.child({ function: "getTeamsAtAddress" }, logMetadata)
  logger.debug(`Recieved input address: ${address}`)

  const url = `https://${IDLE_API}${TEAM_PATH}${address}&limit=20`
  
  logger.info(`Fetching teams at URL: ${url}`)
  let data = {}
  try {
    data = await fetch(url, options)
    logger.info(`Got a successful response status: ${data.status}`)
    logger.info(`the retrieved data:`)
    logger.info(JSON.stringify(data.body))
    const teamData = await data.json()
    return teamData['result']['data']
  } catch (error) {
    logger.warn(JSON.stringify(error))
  }

  
  //teams can be LOCK, AVAILABLE, MINING, LOOTING?, only return teams with 3 crabs
  
}

/**
* Function that retrieves a given Mine object from the Crabada API
* @author   Wheels
* @param    {number} mine_id    Mine ID Number
* @return   {Object}         Mine Object
*/
async function getMineInfo(mine_id) {
  const logger = parentLogger.child({ function: "getMineInfo" }, logMetadata)
  logger.debug(`Recieved input Mine ID: ${mine_id}`)

  const url = `https://${IDLE_API}${MINE_PATH}${mine_id}`
  try {
    logger.info(`Fetching mine info at URL: ${url}`)
    const data = await fetch(url, options)
    logger.info(`Got a successful response status: ${data.status}`)
    const mine = await data.json()
    return mine
  } catch (error) {
    logger.warn(JSON.stringify(error))
  }

}

/**
* Function that retrieves a list of inventory crabs available to reinforce with from the Crabada API
* @author   Wheels
* @return   {Object}         Array of useable crabs, source of crabs (inventory|tavern)

async function getInventoryRentableCrabs() {
  const logger = parentLogger.child({ function: "getInventoryRentableCrabs" }, logMetadata)

  const inventory_url = `https://idle-api.crabada.com/public/idle/crabadas/can-join-team?user_address=${ADDRESS}`
  logger.info(`Checking inventory for idle crabs`)
  try {
    logger.info(`Fetching inventory info at URL: ${inventory_url}`)
    const data = await fetch(inventory_url)
    logger.info(`Got a successful response status: ${data.status}`)
    const inventory = await data.json()
    //if there's crabs, create and return the rentable ones
    //if there's no crabs, keep going
    if (inventory['result']['totalRecord'] > 0) {
      logger.info(`Idle crabs available for hire!`)
      logger.debug(`Idle crabs available for hire: ${JSON.stringify(inventory['result']['data'])}`)
      return { crabsForHire: inventory['result']['data'], source: "inventory" }
    }
  } catch (error) {
    logger.error(JSON.stringify(error))
  }
}
*/

/**
* Function that retrieves a list of tavern crabs available to reinforce with from the Crabada API
* @author   Wheels
* @return   {Object}         Array of useable crabs, source of crabs (inventory|tavern)

async function getTavernCrabs() {
  const logger = parentLogger.child({ function: "getTavernCrabs" }, logMetadata)

  const tavern_url = 'https://idle-api.crabada.com/public/idle/crabadas/lending?orderBy=mine_point&order=desc&page=1&limit=10'
  logger.info(`Retrieving mercenary info from Tavern`)

  try {
    const data = await fetch(tavern_url)
    logger.info(data)
    const tavern = await data.json()
    return { crabsForHire: tavern['result']['data'], source: "tavern" }
  } catch (error) {
    logger.error(JSON.stringify(error))
  }
}
*/

/**
* Function that retrieves a given Mine object from the Crabada API
* @author   Wheels
* @return   {Object}         Array of useable crabs, source of crabs (inventory|tavern)
*/
async function getCrabsForHire(tavern_enabled) {
  const logger = parentLogger.child({ function: "getCrabsForHire" }, logMetadata)
  logger.debug(`Recieved Tavern Enabled Status ${tavern_enabled}`)
  //check inv for rentables. If no rentables check tavern enabled, if not enabled, return no crabs. if enabled, do tavern. 
  //Inventory Reinforce
  const inventory_url = `https://idle-game-api.crabada.com/public/idle/crabadas/can-join-team?user_address=${ADDRESS}`
  logger.info(`Checking inventory for idle crabs`)
  try {
    logger.info(`Fetching inventory info at URL: ${inventory_url}`)
    const data = await fetch(inventory_url, options)
    logger.info(`Got a successful response status: ${data.status}`)
    const inventory = await data.json()
    //if there's crabs, create and return the rentable ones
    //if there's no crabs, keep going
    if (inventory['result']['totalRecord'] > 0) {
      logger.info(`Idle crabs available for hire!`)
      logger.debug(`Idle crabs available for hire: ${JSON.stringify(inventory['result']['data'])}`)
      return { crabsForHire: inventory['result']['data'], source: "inventory" }
    } else {
      logger.info(`No Idle crabs available for hire!`)
    }
    if (tavern_enabled == "true") {
        //Tavern Reinforce
        logger.info(`The Tavern is enabled!`)
        logger.debug(`tavern_enabled: ${tavern_enabled}`)
        const tavern_url = 'https://idle-game-api.crabada.com/public/idle/crabadas/lending?orderBy=mine_point&order=desc&page=1&limit=100'
        logger.info(`Retrieving mercenary info from Tavern at ${tavern_url}`)
        try {
          const data = await fetch(tavern_url, options)
          logger.info(data)
          const tavern = await data.json()
          return { crabsForHire: tavern['result']['data'], source: "tavern" }
        } catch (error) {
          logger.error(JSON.stringify(error))
        }
      }
      else { 
      {return { crabsForHire: ['none'], source: "no-crabs" }}
      }
  } catch (error) {
    logger.error(JSON.stringify(error))
  }


}

/**
* Function that returns a sorted list of crabs by effectiveness and their location
* @author   Wheels
* @param  {Object} mine mine object
* @param  {Array} listofCrabsToHire Array of crabs available to hire
* @return   {Object}         Array of useable crabs sorted by effectiveness, source of crabs (inventory|tavern)
*/
async function chooseCrab(mine, listOfCrabsToHire) {
  const logger = parentLogger.child({ function: "chooseCrab" }, logMetadata)
  logger.debug(`Recieved mine input: ${JSON.stringify(mine)}`)
  logger.debug(`Recieved listOfCrabsToHire input: ${JSON.stringify(listOfCrabsToHire)}`)

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
    if (Math.sign(crabMeta['value']) == 1) {
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
/**
* Function that evaluates a crab for value
* @author   Wheels
* @param  {Object} mine mine object
* @param  {Object} crab single crab object
* @return   {Object}         Object consisting of a crabs id, price and value
*/
async function calculateMR(mine, crab) {
  const logger = parentLogger.child({ function: "calculateMR" }, logMetadata)
  logger.debug(`Recieved mine input: ${JSON.stringify(mine)}`)
  logger.debug(`Recieved crab input: ${JSON.stringify(crab)}`)

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


/**
* Function that calculates the MPmod for a given team of crabs. MPmod is (Average MP of the team’s crabs - Base MP value) *1.25
* @author   Wheels
* @param  {Object} crabList Array of 3-5 crabs
* @return   {number}         The MPmod for crabList
*/
function getMPMod(crabList) {
  const logger = parentLogger.child({ function: "getMPMod" }, logMetadata)
  logger.debug(`Recieved crabList input: ${crabList}`)

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

/**
* Function that calculates the BP closeness for Miners Revenge. BPmod is 20/((Looter BP - Miner BP)^0.5)
* @author   Wheels
* @param  {Object} mine mine object
* @return   {number}         The BPmod for mine
*/
function getBPMod(mine) {
  const logger = parentLogger.child({ function: "getBPMod" }, logMetadata)
  logger.debug(`Recieved Mine Data ${JSON.stringify(mine)}`)

  //messes up if defense points are higher than attack
  let { defense_point, attack_point } = mine['result']
  logger.debug(`Looter BP: ${JSON.stringify(mine['result']['attack_point'])}`)
  logger.debug(`Miner BP: ${JSON.stringify(mine['result']['defense_point'])}`)
  let delta = attack_point - defense_point
  logger.debug(`BP Delta = ${delta}`)
  let bpMod = 20 / Math.sqrt(delta)
  logger.debug(`bpMod = ${bpMod}`)
  return bpMod
}

/**
* Function that determines whether to reinforce from inventory or the tavern
* @author   Wheels
* @param  {Object} mine mine object
* @return   
*/

/**
* Function that is supposed to be a retry-able wrapper for the crab reinforcement transaction. Doesn't currently do what I need it to do.
* @author   Wheels
* @param  {Object} mine mine object
* @return   
*/
async function reinforcementWrapper(mine, tavern_enabled) {
  const logger = parentLogger.child({ function: "reinforcementWrapper" }, logMetadata)
  logger.debug(`Recieved Mine Data ${JSON.stringify(mine)}`)
  logger.debug(`Recieved Tavern Enabled Status ${tavern_enabled}`)

  const { crabsForHire, source } = await getCrabsForHire(tavern_enabled);
  logger.info(`No crabs to reinforce with`)
  //determine whether to reinforce from inv or tavern
  if (source == "inventory") {
    logger.info(`Reinforcing from Inventory`)
    logger.debug(`Crab to reinforce with: ${JSON.stringify(crabsForHire[0])}`);
    logger.info(`Reinforcing with Crab #${crabsForHire[0]['id']} for a cost of 0 TUS`)
    const signedReinforcement = await reinforceTeamFromInventory(mine['result']['game_id'], crabsForHire[0]['id']);
    if (signedReinforcement == "failed") {
      logger.info(`would be Trying reinforcement wrapper again!`)
      //reinforcementWrapper(mine, tavern_enabled)
      return
    }
    const status = await sendTx(signedReinforcement);
    logger.info(`status: ${status}`)
    if (status == statusEnum.SUCCESS) {
      logger.info("TX success")
    } else if (status == statusEnum.FAIL) {
      logger.info("TX fail")
    } else if (status == statusEnum.CRAB_LOCKED) {
      logger.info("Crab locked")
    }
  } else if (source == "tavern") {
    logger.info(`Reinforcing from Tavern`)
    const crabs = await chooseCrab(mine, crabsForHire);
    //crabs is now an ordered list of the best crabs instead of 1 crab
    if (await checkPriceAgainstLimit(crabs[0])) {
      logger.debug(`Crab to reinforce with: ${JSON.stringify(crabs[0])}`);
      logger.info(`Reinforcing with Crab #${crabs[0]['id']} for a cost of ${crabs[0]['price']} TUS`)
      const signedReinforcement = await reinforceTeam(mine['result']['game_id'], crabs[0]['id'], crabs[0]['price']);
      const status = await sendTx(signedReinforcement);
      logger.info(`status: ${status}`)
      if (status == statusEnum.SUCCESS) {
        logger.info("TX success")
      } else if (status == statusEnum.FAIL) {
        logger.info("TX fail")
      } else if (status == statusEnum.CRAB_LOCKED) {
        logger.info("Crab locked")
      }
    } 
  } else {
    logger.warn("Crab rental is a no-go. Either the crab was too expensive, we had an empty inventory and restrictions or something else went wrong");
    return 'fail';
  }

}

module.exports = { getTeamsAtAddress, getMineInfo, reinforcementWrapper }