const { privateDecrypt } = require('crypto')
const https = require('https')
const fetch = require('node-fetch')
const { exit } = require('process')
const { startGame } = require('./crabada-tx.js')
IDLE_API = 'idle-api.crabada.com'
USER_MINES_PATH = '/public/idle/mines?user_address='
MINE_PATH = '/public/idle/mine/'
TEAM_PATH = '/public/idle/teams?user_address='
EXTRA_OPTS = '&page=1&status=open&limit=8'
NO_GAME_OPTS = '&page=1&limit=8'
const AVAX_API_URL = process.env.AVAX_API_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ADDRESS = process.env.ADDRESS
const CRABADA_CONTRACT = process.env.CRABADA_CONTRACT
const Web3 = require('web3');
const { Console } = require('console')
const web3 = new Web3(new Web3.providers.HttpProvider(AVAX_API_URL));
const { format, createLogger, transports } = require('winston')

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
    new transports.File({ filename: 'combined.log' })
  ]
});

//currently supports a single game, function returns the Game_ID
async function retrieveLatestGameInfo(address) {
  const url = `https://${IDLE_API}${USER_MINES_PATH}${address}${EXTRA_OPTS}`
  logger.info(`[Crabada-game] ${url}`)
  logger.info(`[Crabada-game] Retrieving latest game status for ${address}: ${url}`)
  const data = await fetch(url)
  const gameData = await data.json()
  if (gameData['result']['totalRecord'] == 0) {
    logger.notice(`[Crabada-game] no game: ${JSON.stringify(gameData['result'])}`)
    const no_game_url = `https://${IDLE_API}${TEAM_PATH}${address}${NO_GAME_OPTS}`
    const no_data = await fetch(no_game_url)
    const no_gameData = await no_data.json()
    logger.info(`[Crabada-game] ${no_gameData['result']['data'][0]['team_id']}`)
    return {'game_id': 'NO_GAME', 'team_id': `${no_gameData['result']['data'][0]['team_id']}`}
  } else {
    logger.info(`[Crabada-game] Latest mine ID: ${gameData['result']['data'][0]['game_id']}`)
    return gameData['result']['data'][0]['game_id']
  }
}

async function getMineInfo(mine_id) {
  
  const url = `https://${IDLE_API}${MINE_PATH}${mine_id}`
  logger.info(`[Crabada-game] Retrieving mine object for Mine: ${mine_id}`)
  const data = await fetch(url)
  const mine = await data.json()
  return mine
}

//might make sense to feed a type of sort in?
//I search for: Cheapest, strongest, most skilled
async function getCrabsForHire() {
  const url = 'https://idle-api.crabada.com/public/idle/crabadas/lending?orderBy=mine_point&order=desc&page=1&limit=10'
  logger.info(`[Crabada-game] Retrieving mercenary info from Tavern`)
  const data = await fetch(url)
  const tavern = await data.json()
  return tavern['result']['data']
}

async function chooseCrab(mine, listOfCrabsToHire){
  bestCrabs = []
  for (i in listOfCrabsToHire){
      //console.log(listOfCrabsToHire[i])
      crabMeta = await calculateMR(mine, listOfCrabsToHire[i])
      //if positive, add to best crabs, otherwise, next.
      if (Math.sign(crabMeta['value']) ==1) {
          bestCrabs.push(crabMeta)
      }
  }
  //console.log("pre-sort")
  //console.log(bestCrabs)
  bestCrabs.sort(function(a, b){return b['value'] - a['value']})
  //console.log("post-sort")
  logger.info(`[Crabada-game] ${bestCrabs}`)
  return bestCrabs
}

async function calculateMR(mine, crab) {
  //First I Want to enumerate all the Crabs MP and figure out the modifier
  const BASE_CHANCE = 7.0
  let crabList = [...mine['result']['defense_team_info']]

  mpMod = getMPMod(crabList)
  bpMod = getBPMod(mine)
  currentMinersRevengeChance = BASE_CHANCE + mpMod + bpMod

  //add potential crab to the team for calculations
  crabList.push(crab)

  mpMod = getMPMod(crabList)

  bpMod = getBPMod(mine)

  potentialMinersRevengeChance = BASE_CHANCE + mpMod + bpMod
  difference = potentialMinersRevengeChance - currentMinersRevengeChance

  logger.info(`[Crabada-game] Current MR chance is ${currentMinersRevengeChance}%, potential MR chance with crab-${crab['id']} becomes ${potentialMinersRevengeChance}, a difference of ${difference}`)
  const bn = await web3.utils.toBN(crab['price'])
  numTus = await web3.utils.fromWei(bn, 'Ether')
  logger.info(`[Crabada-game] With a price of ${numTus} TUS and a bonus of ${difference}, this crab gets you ${difference/numTus} MR chance per TUS`)
  return {'id': crab['id'],'price': crab['price'], 'value': difference/numTus}
}

//Takes a list of crabs as input and calculates the MP mod for Miners revenge
function getMPMod(crabList) {
  total = 0
  //console.log(crabList)
  for (crab in crabList) {
      //console.log(crabList[crab])
      mp = crabList[crab]['critical'] + crabList[crab]['speed']
      total += mp
      console.log(total)
  }
  //console.log(`total mp:${total}`)

  //((average MP - 56)*1.25)
  return (((total / crabList.length) - 56) * 1.25)
}

//takes a mine as input and calculates the BP closeness for Miners Revenge
function getBPMod(mine) {
  //messes up if defense points are higher than attack
  let { defense_point, attack_point } = mine['result']
  delta = attack_point - defense_point
  bpMod = 20 / Math.sqrt(delta)
  return bpMod
}



module.exports = { retrieveLatestGameInfo, getMineInfo, getCrabsForHire, chooseCrab }