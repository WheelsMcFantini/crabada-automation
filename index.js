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
      console.log(`[Game-Runner] Current Phase: Attack 1`)
      console.log(`[Game-Runner] Phase start time: ${txTime}`)
      console.log(`[Game-Runner] Next operation: Reinforce 1`)
      break
    case 'reinforce-defense':
      if (gameState['round'] == 1) {
        console.log(`[Game-Runner] Current Phase: Reinforce 1`)
        console.log(`[Game-Runner] Phase start time: ${txTime}`)
        console.log(`[Game-Runner] Next operation: Attack 2`)
        break
      }
      console.log(`[Game-Runner] Current Phase: Reinforce 2`)
      console.log(`[Game-Runner] Phase start time: ${txTime}`)
      console.log(`[Game-Runner] Next operation: Attack 3`)
      break
    case 'reinforce-attack':
      if (gameState['round'] == 1) {
        console.log(`[Game-Runner] Current Phase: Attack 2`)
        console.log(`[Game-Runner] Phase start time: ${txTime}`)
        console.log(`[Game-Runner] Next operation: Reinforce 2`)
        break
      }
      console.log(`[Game-Runner] Current Phase: Attack 3`)
      console.log(`[Game-Runner] Phase start time: ${txTime}`)
      console.log(`[Game-Runner] Next operation: Await Settle`)
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
  let phase = gameState[gameState.length - 1]
  //console.log(gameState[gameState.length - 1]['action'])
  console.log(phase['action'])
  switch (phase['action']) {
    case 'create-game':
      //phaseLogger(gameState)
      //wait for opponent to go
      break;
    case 'attack':
      phaseLogger(gameState)
      //idk, when this phase is the case, I think I need to reinforce
      crabs = await getCrabsForHire()
      crab = await chooseCrab(crabs)
      if (await checkPriceAgainstLimit(crab)) {
        //console.log(`${crab}dis one`)
        //console.log(crab)
        reinforceTeam(mine['result']['game_id'], crab['id'], crab['price'])
        break
      } else {
        console.log("too expensive or other failure")
        exit()
        phaseLogger(gameState)
        break
      }
      //idk
      break
    case 'reinforce-defense':
      phaseLogger(gameState)
      //don;t actually think this code ever runs
      crabs = await getCrabsForHire()
      crab = await chooseCrab(crabs)
      if (await checkPriceAgainstLimit(crab)) {
        //console.log(`${crab}dis one`)
        //console.log(crab)
        reinforceTeam(mine['result']['game_id'], crab['id'], crab['price'])
        break
      } else {
        console.log("too expensive or other failure")
        exit()
        phaseLogger(gameState)
        break
      }

    case 'reinforce-attack':

      phaseLogger(gameState)
      //idk, when this phase is the case, I think I need to reinforce
      crabs = await getCrabsForHire()
      crab = await chooseCrab(crabs)
      if (await checkPriceAgainstLimit(crab)) {
        console.log(`${crab}dis one`)
        console.log(crab)
        reinforceTeam(mine['result']['game_id'], crab['id'], crab['price'])
        break
      } else {
        console.log("too expensive or other failure")
        exit()
        phaseLogger(gameState)
        break
      }
      //idk
      break

      phaseLogger(gameState)
      //wait for opponent to go
      break
    case 'settle':
      phaseLogger(gameState)
      gameEnd = new Date(mine['result']['end_time'] * 1000)
      console.log(gameEnd)
      //don't try to end just yet
      endGame(mine['result']['game_id'])
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

    //console.log(`[Game-runner] ${game_id}`)
    playGame(mine)
  }

}

gameRunner()