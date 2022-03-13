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
      logger.info(`There does not appear to be an active mine for team ${team['team_id']}. We should start one.`)
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
  //logger.info(now)
  let currentTime = Math.round(now/1000)
  let gameRound = mine['result']['game_round']
  var phaseEnd = lastActionTime + 30*60000;
  //logger.info(currentTime)
  //logger.info(phaseEnd)
  //logger.info(currentTime)
  //check to see if game is over or someone is out of time
  
  //if the game is over, end the game
  if (currentTime > gameEndTime) {
      logger.info(`the game should be over, the current time is ${currentTime} and that's greater than the end time of ${gameEndTime}`)
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
      logger.info(`the game should be over, more than 30 min have elapsed since the last action`)
      return 'wait'
  } 
  //if the last turn has been taken, wait for game to end
  else if (gameRound == 4) {
      logger.info(`the game is essentially over, the last turn has been taken`)
      return 'wait'
  //otherwise, play the game
  } else {
      logger.info(`the game is still going until ${gameEndTime}`)
      if (gameRound == 0 || gameRound == 2){
          logger.info(`gotta reinforce the defenses!`)
          //return 'reinforce'
          await reinforcementWrapper(mine)
          return 'reinforce'
      } else if (gameRound == null || gameRound == 1 || gameRound == 3){
          logger.info(`waiting for opponent to go`)
          return 'wait'
      }
  }
}

async function gameRunner() {
  //query address for teams, for each team, check status
  //based on strategy, run game
  if (ACTIVE == 'False') { process.exit(0) }
  const teamData = await getTeamsAtAddress(ADDRESS)
  logger.info(teamData.length)
  for (let i = 0; i < teamData.length; i++) {
    //for each team
    const teamID = teamData[i]['team_id']
    logger.info(i)
    if (teamData[i]['crabada_id_1'] == null || teamData[i]['crabada_id_2'] == null || teamData[i]['crabada_id_3'] == null){
      logger.info(`[Game-runner ${teamID}] ${teamData[i]['team_id']} appears to not have enough crabs to go mine, skipping for now`)
      continue
    }
    await parseMine(teamData[i])
    //await new Promise(resolve => setTimeout(resolve, 10000));
  }
}
//gameRunner()
module.exports = { gameRunner }