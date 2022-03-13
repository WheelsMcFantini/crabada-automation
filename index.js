/*eslint-env node, mocha */
const { getTeamsAtAddress, getMineInfo, reinforcementWrapper } = require('./crabada-game.js')
const { startGame, endGame, sendTx, statusEnum} = require('./crabada-tx.js')
require('dotenv').config();
const ADDRESS = process.env.ADDRESS
const ACTIVE = process.env.ACTIVE
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
    //new transports.File({ filename: 'combined.log' })
  ]
});

async function parseMine(team){
  //given a team "object", check if a game is running, if not, try to start one.
  if (team['game_id'] == null){
      console.log(`There does not appear to be an active mine for team ${team['team_id']}. We should start one.`)
      const signedStartGameTX = await startGame(team['team_id'])
      const status = await sendTx(signedStartGameTX);
      logger.info(`status: ${status}`)
      if (status == statusEnum.SUCCESS){
          logger.info("TX success")
      } else if (status == statusEnum.FAIL){
          logger.info("TX fail")
      }
      return 'start'
  }

  let mine = await getMineInfo(team['game_id'])

  //is the game over? if time between last action and now is more than 30m, it's done
  let lastAction = mine['result']['process'][mine['result']['process'].length - 1]
  let lastActionTime = lastAction['transaction_time']
  let gameEndTime = mine['result']['end_time']
  let now = Date.now()
  //console.log(now)
  let currentTime = Math.round(now/1000)
  let gameRound = mine['result']['game_round']
  var phaseEnd = lastActionTime + 30*60000;
  //console.log(currentTime)
  //console.log(phaseEnd)
  //console.log(currentTime)
  //check to see if game is over or someone is out of time
  
  //if the game is over, end the game
  if (currentTime > gameEndTime) {
      console.log(`the game should be over, the current time is ${currentTime} and that's greater than the end time of ${gameEndTime}`)
      //return 'settle'
      const signedEndGameTX = await endGame(mine['result']['game_id'])
      const status = await sendTx(signedEndGameTX);
      logger.info(`status: ${status}`)
      if (status == statusEnum.SUCCESS){
          logger.info("TX success")
      } else if (status == statusEnum.FAIL){
          logger.info("TX fail")
      }
  }
  //if the turn has timed out, wait for game to end, not working for some reason
  else if (currentTime > phaseEnd){
      console.log(`the game should be over, more than 30 min have elapsed since the last action`)
      return 'wait'
  } 
  //if the last turn has been taken, wait for game to end
  else if (gameRound == 4) {
      console.log(`the game is essentially over, the last turn has been taken`)
      return 'wait'
  //otherwise, play the game
  } else {
      console.log(`the game is still going until ${gameEndTime}`)
      if (gameRound == 0 || gameRound == 2){
          console.log(`gotta reinforce the defenses!`)
          //return 'reinforce'
          await reinforcementWrapper(mine)
          return 'reinforce'
      } else if (gameRound == null || gameRound == 1 || gameRound == 3){
          console.log(`waiting for opponent to go`)
          return 'wait'
      }
  }
}

function phaseLogger(gameState) {
  let phase = gameState[gameState.length - 1]
  const txTime = new Date(phase['transaction_time'] * 1000)
  switch (phase['action']) {
    case 'create-game':
      console.log(`[Game-Runner] Displayed Phase: Start`)
      console.log(`[Game-Runner] Phase start time: ${txTime}`)
      console.log(`[Game-Runner] Next operation: Await Attack or Close Game`)
      break
    case 'attack':
      console.log(`[Game-Runner] Most Recent Action was attack`)
      console.log(`[Game-Runner] Phase start time: ${txTime}`)
      console.log(`[Game-Runner] Bot will attempt to reinforce`)
      break
    case 'reinforce-attack':
      console.log(`[Game-Runner] Most Recent Action was reinforce-attack`)
      console.log(`[Game-Runner] Phase start time: ${txTime}`)
      console.log(`[Game-Runner] Bot will attempt to reinforce`)
      break
    case 'reinforce-defense':
      console.log(`[Game-Runner] Current Phase: Reinforce 1`)
      console.log(`[Game-Runner] Phase start time: ${txTime}`)
      console.log(`[Game-Runner] Next operation: Attack 2`)
      break
    case 'settle':
      console.log(`[Game-Runner] Current Phase: Settle`)
      console.log(`[Game-Runner] Phase start time: ${txTime}`)
      console.log(`[Game-Runner] Next operation: Close Game`)
      break
  }
}


async function playGame(mine) {
  const gameState = mine['result']['process']
  const teamID = mine['result']['team_id']
  let phase = gameState[gameState.length - 1]
  //console.log(gameState[gameState.length - 1]['action'])
  logger.info(`[Game-runner ${teamID}] current phase: ${phase['action']}`)
  let currentTime = Math.round(Date.now()/1000)
  let gameEndTime = mine['result']['end_time']
  if (currentTime >= gameEndTime){
    logger.info(`[Game-runner ${teamID}] Game scheduled to end at ${gameEndTime}, currently it's ${currentTime}, lets end the game`)
        const signedEndGameTX = await endGame(mine['result']['game_id'])
        const status = await sendTx(signedEndGameTX);
        logger.info(`status: ${status}`)
      if (status == statusEnum.SUCCESS){
        logger.info("TX success")
      }else if (status == statusEnum.FAIL){
        logger.info("TX fail")
      }
  }
  switch (phase['action']) {
    case 'create-game': {
      //phaseLogger(gameState)
      //wait for opponent to go
      break;
    }
    case 'attack': //means they have just attacked me
    case 'reinforce-attack': {//means they have just reinforced their attack
      if (gameState.length > 4) {
        //console.log("no need to reinforce a third time, wait for settle")
        logger.info(`[Game-runner ${teamID}] no need to reinforce a third time, wait for settle`)
        //should sleep for an hour or so
        break
      }
      phaseLogger(gameState)
      reinforcementWrapper(mine)
      break
      //idk, when this phase or attack is the most recent, I think I need to reinforce
      /* crabsForHire = await getCrabsForHire()
      crabs = await chooseCrab(mine, crabsForHire)
      //crabs is now an ordered list of the best crabs instead of 1 crab
      if (await checkPriceAgainstLimit(crabs[0])) {
        logger.info(`[Game-runner] selecting the following crab ${crabs[0]}`)
        reinforceTeam(mine['result']['game_id'], crabs[0]['id'], crabs[0]['price'])
        .then(logger.http("[Game-runner] Team Reinforced"))
        break
      } else {
        logger.warn("[Game-runner] Crab rental is a no-go. Either the crab was too expensive or a different error occured.")
        process.exit(0)
      } */
    }
    case 'reinforce-defense': { //means it's their turn, and I need to chill
      phaseLogger(gameState)
      break
    }
    case 'settle': {
      phaseLogger(gameState)
      const gameEnd = new Date(mine['result']['end_time'] * 1000)
      currentTime = new Date()
      const timeUntilGameEnds = new Date(gameEnd - currentTime)
      //console.log(gameEnd)
      //console.log(currentTime)
      //console.log(timeUntilGameEnds)

      if (Math.sign(timeUntilGameEnds) == 1) {
        logger.info(`[Game-runner ${teamID}] game still running until ${gameEnd}`)
        //setTimeout(function() {
        //  console.log("Time's up! Game should be over now")
        //  endGame(mine['result']['game_id'])
        //}, timeUntilGameEnds);
      } else {
        logger.info(`[Game-runner ${teamID}] Game scheduled to end at ${gameEnd}, currently it's ${currentTime}, lets end the game`)
        const signedEndGameTX = await endGame(mine['result']['game_id'])
        const status = await sendTx(signedEndGameTX);
        logger.info(`status: ${status}`)
      if (status == statusEnum.SUCCESS){
        logger.info("TX success")
      }else if (status == statusEnum.FAIL){
        logger.info("TX fail")
      }
    }
      break
    }
    case 'start': {
      logger.info(`[Game-runner ${teamID}] Starting game...`)
      startGame(mine['result']['team_id'])
        .then(logger.http(`[Game-runner ${teamID}] Game started`))
      break
    }
  }
}


async function gameRunner() {
  //query address for teams, for each team, check status
  //based on strategy, run game
  if (ACTIVE == 'False') { process.exit(0) }
  const teamData = await getTeamsAtAddress(ADDRESS)
  console.log(teamData.length)
  for (let i = 0; i < teamData.length; i++) {
    //for each team
    const teamID = teamData[i]['team_id']
    console.log(i)
    if (teamData[i]['crabada_id_1'] == null || teamData[i]['crabada_id_2'] == null || teamData[i]['crabada_id_3'] == null){
      console.log(`[Game-runner ${teamID}] ${teamData[i]['team_id']} appears to not have enough crabs to go mine, skipping for now`)
      continue
    }
    await parseMine(teamData[i])
    /*  3/07  logger.info(`[Game-runner ${teamID}] Retrieving lastest game ID for ${ADDRESS}:${teamData[i]['team_id']}`)
    logger.info(teamData[i])
    if (teamData[i]['game_id'] == 'NO_GAME' || teamData[i]['game_id'] == null) {
      logger.info(`[Game-runner ${teamID}] no game ID found for ${ADDRESS}:${teamData[i]['team_id']}, attempting to start game...`)
      startGame(teamData[i]['team_id'])
    } else {
      const mine = await getMineInfo(teamData[i]['game_id'])
      //console.log(`[Game-runner] Retrieved object for Mine ${latestGameID}:`)
      logger.info(`[Game-runner ${teamID}] ${JSON.stringify(mine)}`)

      //loop goes here?
      //console.log(`[Game-runner] ${game_id}`)
      await playGame(mine)
    3/07 } */
    /*logger.info(`[Game-runner] Retrieving lastest game ID for ${ADDRESS}`)
    const game_info = await retrieveLatestGameInfo(ADDRESS)
    logger.info(game_info)
    if (game_info['game_id'] == 'NO_GAME') {
      logger.info(`[Game-runner] no game ID found for ${ADDRESS}, attempting to start game...`)
      startGame(game_info['team_id'])
    } else {
      const mine = await getMineInfo(game_info)
      //console.log(`[Game-runner] Retrieved object for Mine ${latestGameID}:`)
      logger.info(`[Game-runner] ${JSON.stringify(mine)}`)

      //loop goes here?
      //console.log(`[Game-runner] ${game_id}`)
      await playGame(mine)
    }*/
    //await new Promise(resolve => setTimeout(resolve, 10000));
  }
}
//gameRunner()
module.exports = { gameRunner, playGame, phaseLogger }