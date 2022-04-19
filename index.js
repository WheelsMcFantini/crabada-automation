/*eslint-env node, mocha */
require('dotenv').config();
const { ACTIVE, STAGGER, BREEDING, ADDRESS, TAVERN_ENABLED, START_INTERVAL } = process.env;
const {getSortedStartTimes, staggeredGameStartable} = require('./crabada-strategy')
const { getTeamsAtAddress, getMineInfo, reinforcementWrapper } = require('./crabada-game.js')
const { startGame, endGame, sendTx, statusEnum} = require('./crabada-tx.js')
const parentLogger = require('./utilities.js')
const logMetadata = { file: 'index.js' , address: ADDRESS }
parentLogger.debug(`loaded the following variables`, logMetadata)
parentLogger.debug(`ADDRESS: ${ADDRESS}`, logMetadata)
parentLogger.debug(`ACTIVE: ${ACTIVE}`, logMetadata)
parentLogger.debug(`BREEDING: ${BREEDING}`, logMetadata)
parentLogger.debug(`TAVERN_ENABLED: ${TAVERN_ENABLED}`, logMetadata)
parentLogger.debug(`START_INTERVAL: ${START_INTERVAL}`, logMetadata)


/**
* Function that analyzes team data, and if necessary retrieves and analyzes mine data to determine the next move. Currently makes those moves as well. 
* @author   Wheels
* @param    {Object} team    Mining Team object
* @return   {string}         The necessary action given the mines state, (start|wait|reinforce|end)
*/
async function parseMine(team, startable){
  const logger = parentLogger.child({ file: 'index.js'}, { team: team['team_id'] }, { function: "parseMine" })
  if (team['game_id'] == null){
      logger.info(`There does not appear to be an active mine for team ${team['team_id']}. We should start one.`)
      //next 8 lines will be removed and called from a different function
      if (BREEDING == "True"){
        logger.info(`Breeding mode enabled, starting games forbidden`)
        return 'wait'
      }
      if (startable == 'false') {
        logger.info(`Stagger Start preventing start`)
        return 'wait'
      }
      if (startable == 'started') {
        logger.info(`Already started a team this interval preventing start`)
        return 'wait'
      }
      //get time since last game start, make it true or false?
      const signedStartGameTX = await startGame(team['team_id'])
      const status = await sendTx(signedStartGameTX);
      logger.info(`status: ${status}`,{ team: team['team_id'] })
      if (status == statusEnum.SUCCESS){
          logger.info("TX success",{ team: team['team_id'] })
      } else if (status == statusEnum.FAIL){
          logger.info("TX fail",{ team: team['team_id'] })
      }
      return 'start'
  }
  logger.info(`Retrieving mine object for Mine: ${team['game_id']}`)
  let mine = await getMineInfo(team['game_id'])
  logger.debug(`Got Mine: ${JSON.stringify(mine)}`)
  //is the game over? if time between last action and now is more than 30m, it's done
  let lastAction = mine['result']['process'][mine['result']['process'].length - 1]
  let lastActionTime = lastAction['transaction_time']
  let gameEndTime = mine['result']['end_time']
  let now = Date.now()
  //logger.info(now)
  let currentTime = Math.round(now/1000)
  //let gameRound = mine['result']['game_round'] I think they updated the mainnet game
  let gameRound = mine['result']['round']
  var phaseEnd = lastActionTime + 30*60;
  logger.debug(`The current time is: ${currentTime}`)
  logger.debug(`The last action time is: ${lastActionTime}`)
  logger.debug(`The phase end time is: ${phaseEnd}`)
  logger.debug(`The game end time is: ${gameEndTime}`)
  //logger.info(currentTime)
  //check to see if game is over or someone is out of time
  
  //if the game is over, end the game
  if (currentTime > gameEndTime) {
      logger.info(`The game should be over, the current time is ${currentTime} and that's greater than the end time of ${gameEndTime}`)
      //next 8 lines will be removed and called from a different function
      const signedEndGameTX = await endGame(mine['result']['game_id'])
      const status = await sendTx(signedEndGameTX);
      logger.info(`status: ${status}`)
      if (status == statusEnum.SUCCESS){
          logger.info("TX success")
      } else if (status == statusEnum.FAIL){
          logger.info("TX fail")
      }
      return 'end'
  }
  //if the turn has timed out, wait for game to end, not working for some reason
  else if (currentTime > phaseEnd){
      logger.info(`The game should be over, more than 30 min have elapsed since the last action`)
      return 'wait'
  } 
  //if the last turn has been taken, wait for game to end
  else if (gameRound == 4) {
      logger.info(`The game is essentially over, the last turn has been taken`)
      return 'wait'
  //otherwise, play the game
  } else {
      logger.info(`The game is still going until ${gameEndTime}`)
      logger.info(`${gameRound}`)
      if (gameRound == 0 || gameRound == 2){
          logger.info(`Gotta reinforce the defenses!`)
          //next line will be removed and called from a different function
          await reinforcementWrapper(mine, TAVERN_ENABLED)
          return 'reinforce'
      } else if (gameRound == null || gameRound == 1 || gameRound == 3){
          logger.info(`Waiting for opponent to go`)
          return 'wait'
      }
  }
}

/**
* Function that is the entry point. Attempts to play the game for each team at a given address
* @author   Wheels
*/
async function gameRunner() {
  //query address for teams, for each team, check status
  //based on strategy, run game
  const logger = parentLogger.child({ file: 'index.js'}, { address: ADDRESS }, { function: "gameRunner" })
  if (ACTIVE == 'False') { return }
  const teamData = await getTeamsAtAddress(ADDRESS)
  logger.debug(`teamData Content: ${JSON.stringify(teamData)}`)
  const startTimeList = await getSortedStartTimes(teamData)
  logger.debug(`startTimeList Content: ${JSON.stringify(startTimeList)}`)
  let startable = await staggeredGameStartable(startTimeList, START_INTERVAL)
  logger.debug(`Startable Type: ${typeof(startable)}`)
  logger.debug(`Startable Content: ${startable}`)
  ///logger.info(teamData.length)
  for (let i = 0; i < teamData.length; i++) {
    //for each team
    const teamID = teamData[i]['team_id']
    //logger.info(i)
    if (teamData[i]['crabada_id_1'] == null || teamData[i]['crabada_id_2'] == null || teamData[i]['crabada_id_3'] == null){
      logger.info(`${teamData[i]['team_id']} appears to not have enough crabs to go mine, skipping for now`,{ team: teamID })
      continue
    }
    if (STAGGER == 'true') {
      logger.info(`Stagger content: ${STAGGER}`)
      let result = await parseMine(teamData[i], startable)
      if (result == 'start'){
        startable = 'started'
      }
    } else {
      await parseMine(teamData[i], 'true')
    }
/*     let output = await parseMine(teamData[i])
    if (output == 'reinforce'){
      await new Promise(resolve => setTimeout(resolve, 5000));
    }*/
  }
}


//gameRunner()
module.exports = { gameRunner }