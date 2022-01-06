const { retrieveLatestGameInfo, getMineInfo, getCrabsForHire, getCurrentStage, chooseCrab } = require('./crabada-game.js')
const { startGame, reinforceTeam, endGame, checkPriceAgainstLimit } = require('./crabada-tx.js')
const address = '0xF26DC84E3bC6F8C59663581fa6978C74496Efb15'



function phaseLogger(gameState) {
  let phase = gameState[gameState.length - 1]
  txTime = new Date(phase['transaction_time'] * 1000)
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

/*TODO:
Game flow only needs to know:
1. When to start - When there's no game
2. When to end - when the state is wait to settle, and the timestamp is passed
3. When to reinforce - when the action is attack or reinforce attack
4. When to do nothing

GAME START = when no game ID
REINFORCE1 = when the most recent phase is attack
REINFORCE2 = when the most recent phase is reinforce-attack + length = 4 (start, atk, reinf, atk) but not 5 (start, atk, reinf, re-atk, reinf, re-atk)
GAME END

While True:
  repeatedly check the status of the game and evaulate whether we need an action
  when we need an action, perform it


ROUNDS:
Null = "process":[{"action":"create-game","transaction_time":1640105351}]
- len 1 = await attack
- get attacked
0 = "process":[{"action":"create-game","transaction_time":1640105534},{"action":"attack","transaction_time":1640105538}]
- len 2 = been attacked
- reinforce defense 1
1 = "process":[{"action":"create-game","transaction_time":1640105520},{"action":"attack","transaction_time":1640105525},{"action":"reinforce-defense","transaction_time":1640105615}]
- len 3 = reinforced def 1
- reinforce attack 1
2 = "process":[{"action":"create-game","transaction_time":1640105520},{"action":"attack","transaction_time":1640105525},{"action":"reinforce-defense","transaction_time":1640105615},{"action":"reinforce-attack","transaction_time":1640105804}]
- len 4 = attack reinforced 1
- reinforce defense 2
3 = "process":[{"action":"create-game","transaction_time":1640105731},{"action":"attack","transaction_time":1640105733},{"action":"reinforce-defense","transaction_time":1640105826},{"action":"reinforce-attack","transaction_time":1640105886},{"action":"reinforce-defense","transaction_time":1640105944}]
- len 5 = attack reinforced 1
- reinforce attack 2
4 = "process":[{"action":"create-game","transaction_time":1640105731},{"action":"attack","transaction_time":1640105733},{"action":"reinforce-defense","transaction_time":1640105826},{"action":"reinforce-attack","transaction_time":1640105886},{"action":"reinforce-defense","transaction_time":1640105944},{"action":"reinforce-attack","transaction_time":1640105963}]
- Wait for Crabada to "settle" the game
4 = "process":[{"action":"create-game","transaction_time":1640092454},{"action":"attack","transaction_time":1640092458},{"action":"reinforce-defense","transaction_time":1640092520},{"action":"reinforce-attack","transaction_time":1640092524},{"action":"reinforce-defense","transaction_time":1640092589},{"action":"reinforce-attack","transaction_time":1640092594},{"action":"settle","transaction_time":1640096090}]
- close game
status closed = "process":[{"action":"create-game","transaction_time":1640092454},{"action":"attack","transaction_time":1640092458},{"action":"reinforce-defense","transaction_time":1640092520},{"action":"reinforce-attack","transaction_time":1640092524},{"action":"reinforce-defense","transaction_time":1640092589},{"action":"reinforce-attack","transaction_time":1640092594},{"action":"settle","transaction_time":1640096090},{"action":"close-game","transaction_time":1640106934}]
*/


async function playGame(mine) {
  const gameState = mine['result']['process']
  let phase = gameState[gameState.length - 1]
  //console.log(gameState[gameState.length - 1]['action'])
  console.log(phase['action'])
  switch (phase['action']) {
    case 'create-game':
      //phaseLogger(gameState)
      //wait for opponent to go
      break;
    case 'attack': //means they have just attacked me
    case 'reinforce-attack': //means they have just reinforced their attack
      if (gameState.length > 4){
        console.log("no need to reinforce a third time, wait for settle")
        //should sleep for an hour or so
        break
      }
      phaseLogger(gameState)
      //idk, when this phase or attack is the most recent, I think I need to reinforce
      crabsForHire = await getCrabsForHire()
      crabs = await chooseCrab(crabsForHire)
      //crabs is now an ordered list of the best crabs instead of 1 crab
      if (await checkPriceAgainstLimit(crabs[0])) {
        console.log(`${crabs[0]}dis one`)
        console.log(crabs[0])
        reinforceTeam(mine['result']['game_id'], crabs[0]['id'], crabs[0]['price'])
        break
      } else {
        console.log("too expensive or other failure")
        exit()
        phaseLogger(gameState)
        break
      }
    case 'reinforce-defense': //means it's their turn, and I need to chill
      phaseLogger(gameState)
      break
    case 'settle':
      phaseLogger(gameState)
      gameEnd = new Date(mine['result']['end_time'] * 1000)
      currentTime = new Date()
      timeUntilGameEnds = new Date(gameEnd - currentTime)
      console.log(gameEnd)
      console.log(currentTime)
      console.log(timeUntilGameEnds)
      //don't try to end just yet
      if (Math.sign(timeUntilGameEnds) ==1) {
        console.log(`game still running until ${gameEnd}`)
        setTimeout(function() {
          console.log("Time's up! Game should be over now")
          endGame(mine['result']['game_id'])
      }, timeUntilGameEnds);
      } else {
        console.log(`Game scheduled to end at ${gameEnd}, currently it's ${currentTime}, lets end the game`)
        endGame(mine['result']['game_id'])
      }
    
      break
    case 'start':
      console.log("Starting game...")
      startGame()
      break
  }
}


async function gameRunner() {
  console.log(`[Game-runner] Retrieving lastest game ID for ${address}`)
  game_id = await retrieveLatestGameInfo(address)
  console.log(game_id)
  if (game_id == 'NO_GAME') {
    console.log(`[Game-runner] no game ID found for ${address}, attempting to start game...`)
    startGame()
  } else {
    const mine = await getMineInfo(game_id)
    //console.log(`[Game-runner] Retrieved object for Mine ${latestGameID}:`)
    console.log(`[Game-runner] ${JSON.stringify(mine)}`)

    //loop goes here?
    //console.log(`[Game-runner] ${game_id}`)
    playGame(mine)
  }
}


gameRunner()