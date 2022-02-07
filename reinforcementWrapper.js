const { checkPriceAgainstLimit, logger, reinforceTeam, sendReinforceTx } = require("./crabada-tx");
const {getCrabsForHire, chooseCrab} = require('./crabada-game')

async function reinforcementWrapper(mine) {
    const crabsForHire = await getCrabsForHire();
    const crabs = await chooseCrab(mine, crabsForHire);
    //crabs is now an ordered list of the best crabs instead of 1 crab
    if (await checkPriceAgainstLimit(crabs[0])) {
        logger.info(`[Crabada-game] selecting the following crab ${crabs[0]}`);
        const signedReinforcement = await reinforceTeam(mine['result']['game_id'], crabs[0]['id'], crabs[0]['price']);
        const receipt = await sendReinforceTx(signedReinforcement, mine);
        return receipt;
    } else {
        logger.warn("[Crabada-game] Crab rental is a no-go. Either the crab was too expensive or a different error occured.");
        process.exit(0);
    }
}
exports.reinforcementWrapper = reinforcementWrapper;
