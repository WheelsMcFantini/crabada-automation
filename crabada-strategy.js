const parentLogger = require('./utilities.js')
const logMetadata = { file: 'crabada-strategy.js' }
parentLogger.debug(`loaded the following variables`, logMetadata)

async function getSortedStartTimes(teamData) {
    const logger = parentLogger.child({ function: "getSortedStartTimes" }, logMetadata)
    let startTimeArray = []
    for (let i = 0; i < teamData.length; i++) {
        const  {team_id, status, game_start_time} = teamData[i]
        logger.info(`checking start time for team ${teamData[i]['team_id']}`)
        logger.info(`Team: ${team_id}, Status: ${status}, Start Time: ${game_start_time}`)
        startTimeArray.push({"team_id": team_id, "status": status, "game_start_time": game_start_time})
    }
    startTimeArray.sort(function (a, b) { return b['game_start_time'] - a['game_start_time'] })
    logger.debug(`Start time Array: ${JSON.stringify(startTimeArray)}`)
    return startTimeArray
}

async function staggeredGameStartable(startTimes, intervalSeconds){
    const logger = parentLogger.child({ function: "staggeredGameStartable" }, logMetadata)
    logger.debug(`Start Times: ${JSON.stringify(startTimes)}`)
    const lastStart = startTimes[0]['game_start_time']
    if (lastStart == null) {
        logger.info(`No games started. Starting game available`)
        return 'true'
    }
    const d = new Date()
        const crabDate = Math.round(d.getTime() / 1000)
        logger.debug(`Date.getTime(): ${crabDate}`)
        //logger.info(`Date.now(): ${Math.round(d.now()/1000)}`)
        const staggerStartTime = Number(lastStart) + Number(intervalSeconds)
        logger.info(`Most recent game started at: ${lastStart}, next game can start at ${staggerStartTime}`)
        if (staggerStartTime > crabDate){
            logger.debug(`Stagger start: ${staggerStartTime} > Last Started: ${lastStart}`)
            logger.info(`Stagger start available in ${staggerStartTime-crabDate} seconds`)
            return 'false'
        } else {
            logger.debug(`Last Started: ${lastStart} > Stagger start: ${staggerStartTime}`)
            logger.info(`Stagger start has been available for ${crabDate - staggerStartTime} seconds`)
            return 'true'
        }

}



/* async function getAverageInterval(teamData){
    //calculate the average interval between teams
    return
} */

module.exports = {getSortedStartTimes, staggeredGameStartable}