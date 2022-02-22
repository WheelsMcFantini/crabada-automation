const assert = require('chai').assert
const nock = require('nock')
const { retrieveLatestGameInfo, getMineInfo, getCrabsForHire, calculateMR, chooseCrab} = require('../crabada-game.js')



ADDRESS = "0xF26DC84E3bC6F8C59663581fa6978C74496Efb15"


describe('game functions', function () {
    //describe('function_name', anon-func to test function_name   

    describe('retrieveLatestGameInfo', function () {
        const scope = nock('https://idle-api.crabada.com')
        .get('/public/idle/mines?user_address=0xF26DC84E3bC6F8C59663581fa6978C74496Efb15&page=1&status=open&limit=8')
        .reply(200, { "error_code": null, "message": null, "result": { "totalRecord": 1, "totalPages": 1, "page": 1, "limit": 8, "data": [{ "game_id": 762113, "start_time": 1643399709, "end_time": 1643414109, "cra_reward": 4125000000000000000, "tus_reward": 334125000000000000000, "miner_cra_reward": 1687500000000000000, "miner_tus_reward": 136687500000000000000, "looter_cra_reward": 2737500000000000000, "looter_tus_reward": 221737500000000000000, "estimate_looter_win_cra": 2737500000000000000, "estimate_looter_win_tus": 221737500000000000000, "estimate_looter_lose_cra": 300000000000000000, "estimate_looter_lose_tus": 24300000000000000000, "estimate_miner_lose_cra": 1687500000000000000, "estimate_miner_lose_tus": 136687500000000000000, "estimate_miner_win_cra": 4125000000000000000, "estimate_miner_win_tus": 334125000000000000000, "round": 4, "team_id": 5044, "owner": "0xf26dc84e3bc6f8c59663581fa6978c74496efb15", "defense_point": 1032, "defense_mine_point": 380, "attack_team_id": 3076, "attack_team_owner": "0x98ac0736ba6000d5c5159bcf31a509d5490e478f", "attack_point": 1109, "winner_team_id": 3076, "status": "open", "process": [{ "action": "create-game", "transaction_time": 1643399709 }, { "action": "attack", "transaction_time": 1643399711 }, { "action": "reinforce-defense", "transaction_time": 1643400313 }, { "action": "reinforce-attack", "transaction_time": 1643400346 }, { "action": "reinforce-defense", "transaction_time": 1643400612 }, { "action": "reinforce-attack", "transaction_time": 1643400623 }, { "action": "settle", "transaction_time": 1643403317 }], "crabada_id_1": 7341, "crabada_id_2": 8604, "crabada_id_3": 6810, "mine_point_modifier": 0, "crabada_1_photo": "7341.png", "crabada_2_photo": "8604.png", "crabada_3_photo": "6810.png", "defense_crabada_number": 5 }] } })
        .get('/public/idle/mines?user_address=0xF26DC84E3bC6F8C59663581fa6978C74496Efb15&page=1&status=open&limit=8')
        .reply(200, { "error_code": null, "message": null, "result": { "totalRecord": 0, "totalPages": 1, "page": 1, "limit": 8, "data": [] } })
        .get('/public/idle/teams?user_address=0xF26DC84E3bC6F8C59663581fa6978C74496Efb15&page=1&limit=8')
        .reply(200,{"error_code":null,"message":null,"result":{"totalRecord":1,"totalPages":1,"page":1,"limit":8,"data":[{"team_id":5044,"owner":"0xf26dc84e3bc6f8c59663581fa6978c74496efb15","crabada_id_1":7341,"crabada_1_photo":"7341.png","crabada_1_hp":111,"crabada_1_speed":29,"crabada_1_armor":27,"crabada_1_damage":60,"crabada_1_critical":47,"crabada_1_is_origin":0,"crabada_1_is_genesis":0,"crabada_1_legend_number":0,"crabada_id_2":8604,"crabada_2_photo":"8604.png","crabada_2_hp":113,"crabada_2_speed":30,"crabada_2_armor":29,"crabada_2_damage":56,"crabada_2_critical":41,"crabada_2_is_origin":0,"crabada_2_is_genesis":0,"crabada_2_legend_number":0,"crabada_id_3":6810,"crabada_3_photo":"6810.png","crabada_3_hp":114,"crabada_3_speed":27,"crabada_3_armor":28,"crabada_3_damage":54,"crabada_3_critical":42,"crabada_3_is_origin":0,"crabada_3_is_genesis":0,"crabada_3_legend_number":0,"battle_point":592,"time_point":216,"mine_point":216,"game_type":"mining","mine_start_time":1643399709,"mine_end_time":1643414109,"game_id":762113,"game_start_time":1643399709,"game_end_time":1643414109,"process_status":"settle","game_round":4,"status":"MINING","crabada_1_class":3,"crabada_2_class":6,"crabada_3_class":6,"crabada_1_type":1,"crabada_2_type":1,"crabada_3_type":1}],"team_size":3}})
        
        it('retrieveLatestGameInfo should return a number', async () => {
            const result = await retrieveLatestGameInfo(ADDRESS)
            assert.isNumber(result)
        }),

            it('no_game should have two keys', async () => {

                result = await retrieveLatestGameInfo(ADDRESS)
                expectedKeys = ['game_id', 'team_id']
                assert.hasAllKeys(result, expectedKeys)
            })


    })

    describe('getMineInfo', function () {
        const scope = nock('https://idle-api.crabada.com')
        .get('/public/idle/mine/762113')
        .reply(200,{"error_code":null,"message":null,"result":{"game_id":762113,"start_time":1643399709,"end_time":1643414109,"cra_reward":4125000000000000000,"tus_reward":334125000000000000000,"miner_cra_reward":1687500000000000000,"miner_tus_reward":136687500000000000000,"looter_cra_reward":2737500000000000000,"looter_tus_reward":221737500000000000000,"estimate_looter_win_cra":2737500000000000000,"estimate_looter_win_tus":221737500000000000000,"estimate_looter_lose_cra":300000000000000000,"estimate_looter_lose_tus":24300000000000000000,"estimate_miner_lose_cra":1687500000000000000,"estimate_miner_lose_tus":136687500000000000000,"estimate_miner_win_cra":4125000000000000000,"estimate_miner_win_tus":334125000000000000000,"round":4,"team_id":5044,"owner":"0xf26dc84e3bc6f8c59663581fa6978c74496efb15","defense_point":1032,"defense_mine_point":216,"defense_crabada_id_1":7341,"defense_crabada_id_2":8604,"defense_crabada_id_3":6810,"mine_point_modifier":0,"attack_team_id":3076,"attack_team_owner":"0x98ac0736ba6000d5c5159bcf31a509d5490e478f","attack_point":1109,"attack_crabada_id_1":7614,"attack_crabada_id_2":13297,"attack_crabada_id_3":7474,"winner_team_id":3076,"status":"close","process":[{"action":"create-game","transaction_time":1643399709},{"action":"attack","transaction_time":1643399711},{"action":"reinforce-defense","transaction_time":1643400313},{"action":"reinforce-attack","transaction_time":1643400346},{"action":"reinforce-defense","transaction_time":1643400612},{"action":"reinforce-attack","transaction_time":1643400623},{"action":"settle","transaction_time":1643403317},{"action":"close-game","transaction_time":1643414419}],"defense_hp":592,"defense_speed":148,"defense_armor":136,"defense_damage":304,"defense_critical":232,"attack_hp":688,"attack_speed":125,"attack_armor":168,"attack_damage":253,"attack_critical":189,"defense_team_info":[{"crabada_id":707,"photo":"707.png","hp":127,"speed":31,"armor":26,"damage":67,"critical":51},{"crabada_id":6810,"photo":"6810.png","hp":114,"speed":27,"armor":28,"damage":54,"critical":42},{"crabada_id":7341,"photo":"7341.png","hp":111,"speed":29,"armor":27,"damage":60,"critical":47},{"crabada_id":8604,"photo":"8604.png","hp":113,"speed":30,"armor":29,"damage":56,"critical":41},{"crabada_id":11366,"photo":"11366.png","hp":127,"speed":31,"armor":26,"damage":67,"critical":51}],"attack_team_info":[{"crabada_id":7474,"photo":"7474.png","hp":133,"speed":23,"armor":28,"damage":46,"critical":36},{"crabada_id":7614,"photo":"7614.png","hp":130,"speed":23,"armor":34,"damage":49,"critical":37},{"crabada_id":13297,"photo":"13297.png","hp":144,"speed":27,"armor":35,"damage":56,"critical":40},{"crabada_id":13961,"photo":"13961.png","hp":133,"speed":25,"armor":36,"damage":48,"critical":37},{"crabada_id":18736,"photo":"18736.png","hp":148,"speed":27,"armor":35,"damage":54,"critical":39}]}})
        .get('/public/idle/mine/762113')
        .reply(200,{"error_code":null,"message":null,"result":{"game_id":762113,"start_time":1643399709,"end_time":1643414109,"cra_reward":4125000000000000000,"tus_reward":334125000000000000000,"miner_cra_reward":1687500000000000000,"miner_tus_reward":136687500000000000000,"looter_cra_reward":2737500000000000000,"looter_tus_reward":221737500000000000000,"estimate_looter_win_cra":2737500000000000000,"estimate_looter_win_tus":221737500000000000000,"estimate_looter_lose_cra":300000000000000000,"estimate_looter_lose_tus":24300000000000000000,"estimate_miner_lose_cra":1687500000000000000,"estimate_miner_lose_tus":136687500000000000000,"estimate_miner_win_cra":4125000000000000000,"estimate_miner_win_tus":334125000000000000000,"round":4,"team_id":5044,"owner":"0xf26dc84e3bc6f8c59663581fa6978c74496efb15","defense_point":1032,"defense_mine_point":216,"defense_crabada_id_1":7341,"defense_crabada_id_2":8604,"defense_crabada_id_3":6810,"mine_point_modifier":0,"attack_team_id":3076,"attack_team_owner":"0x98ac0736ba6000d5c5159bcf31a509d5490e478f","attack_point":1109,"attack_crabada_id_1":7614,"attack_crabada_id_2":13297,"attack_crabada_id_3":7474,"winner_team_id":3076,"status":"close","process":[{"action":"create-game","transaction_time":1643399709},{"action":"attack","transaction_time":1643399711},{"action":"reinforce-defense","transaction_time":1643400313},{"action":"reinforce-attack","transaction_time":1643400346},{"action":"reinforce-defense","transaction_time":1643400612},{"action":"reinforce-attack","transaction_time":1643400623},{"action":"settle","transaction_time":1643403317},{"action":"close-game","transaction_time":1643414419}],"defense_hp":592,"defense_speed":148,"defense_armor":136,"defense_damage":304,"defense_critical":232,"attack_hp":688,"attack_speed":125,"attack_armor":168,"attack_damage":253,"attack_critical":189,"defense_team_info":[{"crabada_id":707,"photo":"707.png","hp":127,"speed":31,"armor":26,"damage":67,"critical":51},{"crabada_id":6810,"photo":"6810.png","hp":114,"speed":27,"armor":28,"damage":54,"critical":42},{"crabada_id":7341,"photo":"7341.png","hp":111,"speed":29,"armor":27,"damage":60,"critical":47},{"crabada_id":8604,"photo":"8604.png","hp":113,"speed":30,"armor":29,"damage":56,"critical":41},{"crabada_id":11366,"photo":"11366.png","hp":127,"speed":31,"armor":26,"damage":67,"critical":51}],"attack_team_info":[{"crabada_id":7474,"photo":"7474.png","hp":133,"speed":23,"armor":28,"damage":46,"critical":36},{"crabada_id":7614,"photo":"7614.png","hp":130,"speed":23,"armor":34,"damage":49,"critical":37},{"crabada_id":13297,"photo":"13297.png","hp":144,"speed":27,"armor":35,"damage":56,"critical":40},{"crabada_id":13961,"photo":"13961.png","hp":133,"speed":25,"armor":36,"damage":48,"critical":37},{"crabada_id":18736,"photo":"18736.png","hp":148,"speed":27,"armor":35,"damage":54,"critical":39}]}})


        it('getMineInfo should return an object', async () => {
            const result = await getMineInfo(762113)
            assert.isObject(result)
        }
        ),
            it('Mineobject should posess mine keys', async () => {
                const result = await getMineInfo(762113)
                expectedKeys = ['error_code', 'message', 'result']
                assert.hasAllKeys(result, expectedKeys)
            }
            )
    })

    describe('getCrabsForHire', function () {
        const scope = nock('https://idle-api.crabada.com')
        .get('/public/idle/crabadas/lending?orderBy=mine_point&order=desc&page=1&limit=10')
        .reply(200,{"error_code":null,"message":null,"result":{"totalRecord":321,"totalPages":33,"page":1,"limit":10,"data":[{"crabada_id":10787,"id":10787,"price":28900000000000000000,"crabada_name":"Crabada 10787","lender":"0x1fafef2c8d8cf8e9a2e6ec8558c280b7b5812678","is_being_borrowed":0,"borrower":"0x261899ebc5300321c2fa9c88633bea620bd5a68c","game_id":762800,"crabada_type":1,"crabada_class":5,"class_id":5,"class_name":"CRABOID","is_origin":0,"is_genesis":0,"legend_number":0,"pure_number":6,"photo":"10787.png","hp":127,"speed":31,"damage":67,"critical":51,"armor":26,"battle_point":220,"time_point":82,"mine_point":82},{"crabada_id":20460,"id":20460,"price":26500000000000000000,"crabada_name":"Crabada 20460","lender":"0x19855963f33030a69a59741bfba17f607f8e3a92","is_being_borrowed":0,"borrower":"0x54dbd83cdc27e2d5d93b01d7463648738c3883ba","game_id":764692,"crabada_type":1,"crabada_class":5,"class_id":5,"class_name":"CRABOID","is_origin":0,"is_genesis":0,"legend_number":0,"pure_number":6,"photo":"20460.png","hp":127,"speed":31,"damage":67,"critical":51,"armor":26,"battle_point":220,"time_point":82,"mine_point":82},{"crabada_id":8150,"id":8150,"price":30000000000000000000,"crabada_name":"Crabada 8150","lender":"0x3f5f363c5f0d6f5b18d396b23e5dc311647034b9","is_being_borrowed":0,"borrower":"0xfcc9e06736a4700842de9b74a350b6dc8eb3fb9e","game_id":763352,"crabada_type":1,"crabada_class":5,"class_id":5,"class_name":"CRABOID","is_origin":0,"is_genesis":0,"legend_number":0,"pure_number":6,"photo":"8150.png","hp":127,"speed":31,"damage":67,"critical":51,"armor":26,"battle_point":220,"time_point":82,"mine_point":82},{"crabada_id":8042,"id":8042,"price":27900000000000000000,"crabada_name":"Crabada 8042","lender":"0xc923dd451dfb1fc6a4608982c6c077414da06a4d","is_being_borrowed":0,"borrower":"0xdc72c862525aa52290c783a059e7c7920f1db6af","game_id":764523,"crabada_type":1,"crabada_class":5,"class_id":5,"class_name":"CRABOID","is_origin":0,"is_genesis":0,"legend_number":0,"pure_number":6,"photo":"8042.png","hp":127,"speed":31,"damage":67,"critical":51,"armor":26,"battle_point":220,"time_point":82,"mine_point":82},{"crabada_id":9232,"id":9232,"price":29000000000000000000,"crabada_name":"Crabada 9232","lender":"0x30c3cc17ba6821643075d29465bf0ecbd16da310","is_being_borrowed":0,"borrower":"0xfa91f7a1b4193855e52340ec6c4404557b5804a8","game_id":760481,"crabada_type":1,"crabada_class":5,"class_id":5,"class_name":"CRABOID","is_origin":0,"is_genesis":0,"legend_number":0,"pure_number":6,"photo":"9232.png","hp":127,"speed":31,"damage":67,"critical":51,"armor":26,"battle_point":220,"time_point":82,"mine_point":82},{"crabada_id":9952,"id":9952,"price":29000000000000000000,"crabada_name":"Crabada 9952","lender":"0x30c3cc17ba6821643075d29465bf0ecbd16da310","is_being_borrowed":0,"borrower":"0xfcc9e06736a4700842de9b74a350b6dc8eb3fb9e","game_id":763360,"crabada_type":1,"crabada_class":5,"class_id":5,"class_name":"CRABOID","is_origin":0,"is_genesis":0,"legend_number":0,"pure_number":6,"photo":"9952.png","hp":127,"speed":31,"damage":67,"critical":51,"armor":26,"battle_point":220,"time_point":82,"mine_point":82},{"crabada_id":12050,"id":12050,"price":28900000000000000000,"crabada_name":"Crabada 12050","lender":"0x1fafef2c8d8cf8e9a2e6ec8558c280b7b5812678","is_being_borrowed":0,"borrower":"0x261899ebc5300321c2fa9c88633bea620bd5a68c","game_id":762818,"crabada_type":1,"crabada_class":5,"class_id":5,"class_name":"CRABOID","is_origin":0,"is_genesis":0,"legend_number":0,"pure_number":6,"photo":"12050.png","hp":127,"speed":31,"damage":67,"critical":51,"armor":26,"battle_point":220,"time_point":82,"mine_point":82},{"crabada_id":9252,"id":9252,"price":27990000000000000000,"crabada_name":"Crabada 9252","lender":"0x4bdfc8a1d2af98692a7553a1912652e580282bf6","is_being_borrowed":0,"borrower":"0x99857983f39287b4f56584578a38fe8f2cb44c51","game_id":764677,"crabada_type":1,"crabada_class":5,"class_id":5,"class_name":"CRABOID","is_origin":0,"is_genesis":0,"legend_number":0,"pure_number":6,"photo":"9252.png","hp":127,"speed":31,"damage":67,"critical":51,"armor":26,"battle_point":220,"time_point":82,"mine_point":82},{"crabada_id":11366,"id":11366,"price":24000000000000000000,"crabada_name":"Crabada 11366","lender":"0x9a9a14bf03d3cecbcaa0a03545475defcfc6c81f","is_being_borrowed":0,"borrower":"0xf44e38a4f8ac87ee50fa9089ab94a69e953b396b","game_id":764674,"crabada_type":1,"crabada_class":5,"class_id":5,"class_name":"CRABOID","is_origin":0,"is_genesis":0,"legend_number":0,"pure_number":6,"photo":"11366.png","hp":127,"speed":31,"damage":67,"critical":51,"armor":26,"battle_point":220,"time_point":82,"mine_point":82},{"crabada_id":715,"id":715,"price":30000000000000000000,"crabada_name":"Crabada 715","lender":"0xb3ab08e50adaf5d17b4ed045e660a5094a83bc01","is_being_borrowed":0,"borrower":"0xfcc9e06736a4700842de9b74a350b6dc8eb3fb9e","game_id":763360,"crabada_type":1,"crabada_class":5,"class_id":5,"class_name":"CRABOID","is_origin":1,"is_genesis":0,"legend_number":0,"pure_number":6,"photo":"715.png","hp":127,"speed":31,"damage":67,"critical":51,"armor":26,"battle_point":220,"time_point":82,"mine_point":82}]}})

        it('getCrabsForHire should return an Array of rentable crabs', async () => {
            const result = await getCrabsForHire()
            assert.isArray(result)
        }
        )
    })

    describe('calculateMR', function () {
        const mine = {"error_code":null,"message":null,"result":{"game_id":762113,"start_time":1643399709,"end_time":1643414109,"cra_reward":4125000000000000000,"tus_reward":334125000000000000000,"miner_cra_reward":1687500000000000000,"miner_tus_reward":136687500000000000000,"looter_cra_reward":2737500000000000000,"looter_tus_reward":221737500000000000000,"estimate_looter_win_cra":2737500000000000000,"estimate_looter_win_tus":221737500000000000000,"estimate_looter_lose_cra":300000000000000000,"estimate_looter_lose_tus":24300000000000000000,"estimate_miner_lose_cra":1687500000000000000,"estimate_miner_lose_tus":136687500000000000000,"estimate_miner_win_cra":4125000000000000000,"estimate_miner_win_tus":334125000000000000000,"round":4,"team_id":5044,"owner":"0xf26dc84e3bc6f8c59663581fa6978c74496efb15","defense_point":1032,"defense_mine_point":216,"defense_crabada_id_1":7341,"defense_crabada_id_2":8604,"defense_crabada_id_3":6810,"mine_point_modifier":0,"attack_team_id":3076,"attack_team_owner":"0x98ac0736ba6000d5c5159bcf31a509d5490e478f","attack_point":1109,"attack_crabada_id_1":7614,"attack_crabada_id_2":13297,"attack_crabada_id_3":7474,"winner_team_id":3076,"status":"close","process":[{"action":"create-game","transaction_time":1643399709},{"action":"attack","transaction_time":1643399711},{"action":"reinforce-defense","transaction_time":1643400313},{"action":"reinforce-attack","transaction_time":1643400346},{"action":"reinforce-defense","transaction_time":1643400612},{"action":"reinforce-attack","transaction_time":1643400623},{"action":"settle","transaction_time":1643403317},{"action":"close-game","transaction_time":1643414419}],"defense_hp":592,"defense_speed":148,"defense_armor":136,"defense_damage":304,"defense_critical":232,"attack_hp":688,"attack_speed":125,"attack_armor":168,"attack_damage":253,"attack_critical":189,"defense_team_info":[{"crabada_id":707,"photo":"707.png","hp":127,"speed":31,"armor":26,"damage":67,"critical":51},{"crabada_id":6810,"photo":"6810.png","hp":114,"speed":27,"armor":28,"damage":54,"critical":42},{"crabada_id":7341,"photo":"7341.png","hp":111,"speed":29,"armor":27,"damage":60,"critical":47},{"crabada_id":8604,"photo":"8604.png","hp":113,"speed":30,"armor":29,"damage":56,"critical":41},{"crabada_id":11366,"photo":"11366.png","hp":127,"speed":31,"armor":26,"damage":67,"critical":51}],"attack_team_info":[{"crabada_id":7474,"photo":"7474.png","hp":133,"speed":23,"armor":28,"damage":46,"critical":36},{"crabada_id":7614,"photo":"7614.png","hp":130,"speed":23,"armor":34,"damage":49,"critical":37},{"crabada_id":13297,"photo":"13297.png","hp":144,"speed":27,"armor":35,"damage":56,"critical":40},{"crabada_id":13961,"photo":"13961.png","hp":133,"speed":25,"armor":36,"damage":48,"critical":37},{"crabada_id":18736,"photo":"18736.png","hp":148,"speed":27,"armor":35,"damage":54,"critical":39}]}}
        const crab = {"crabada_id":10787,"id":10787,"price":28900000000000000000,"crabada_name":"Crabada 10787","lender":"0x1fafef2c8d8cf8e9a2e6ec8558c280b7b5812678","is_being_borrowed":0,"borrower":"0x261899ebc5300321c2fa9c88633bea620bd5a68c","game_id":762800,"crabada_type":1,"crabada_class":5,"class_id":5,"class_name":"CRABOID","is_origin":0,"is_genesis":0,"legend_number":0,"pure_number":6,"photo":"10787.png","hp":127,"speed":31,"damage":67,"critical":51,"armor":26,"battle_point":220,"time_point":82,"mine_point":82}
        it('calculateMR should return an rentable crab data object consisting of the crabs id, price in TUS and the value rating', async () => {
            const result = await calculateMR(mine, crab)
            expectedKeys = ['id', 'price', 'value']
            assert.hasAllKeys(result, expectedKeys)
        }
        )
    })
})