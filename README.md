# crabada-automation
Crabada Idle-game Autominer aka CrustyChamps

about:
This application automatically mines in the Crabada idle-game on the Swimmer network. 
It's capable of staggering games and reinforcing teams from inventory for maximum efficiency.

I wrote this in Node.JS to teach myself Node and how to programatically interact with smart contracts. The contracts
were not open source so I had to do a little bit of reverse engineering to get the contract function calls right. 


One of the hardest things to get working correctly was issuing viable transactions. Figuring out which web3.js 
functions to use while teaching yourself javascript is not easy! Having multiple teams run from the same account
was also a big win, and part of what made running it so easy. 

I think it would be super cool to get something like this working for the battle game. 


This project can run locally or in GCP. I ran mine in GCP but will include instructions for local first, GCP if they don't nerf idle game rewards. 

Locally, you'll want to provide a dotenv file in crabada-automation with the following variables:

API_URL= Swimmer network RPC URL

CRABADA_CONTRACT= Swimmer network Crabada Contract address

ADDRESS= the address of the playing account

PRIVATE_KEY=the private key of the playing account

LEVEL="(info|debug)"

ACTIVE=(True|False)

BREEDING=(leave blank or set to "True")

TAVERN_ENABLED="(true|false)"
STAGGER="(true|false)"
START_INTERVAL=num_of_minutes

The bot will start up and:
1. check ACTIVE to see if it should be running, 
2. retrieve a list of teams at the players address
3. gathers data for stagger-start

For each team at the address:
1. check for 3 crabs on the team, otherwise skip that team
2. if stagger-start is enabled, checks to see if it's time to start a new team
3. if so, runs a "startable" game, which means its allowed to start a game
4. otherwise, initiates gameplay for a given team

Gameplay:
1. Check for existance of a game, if none, check for conditions that prevent a game start, if none, start
2. Parse last action, and game timings
3. if the game is over, end it
4. if the game is pseudo-over(mine over but not finished, turn timer elapsed), wait
5. if we can take the reinforce action, take it
6. if we have inventory crabs, reinforce with the best one
7. if no inventory crabs, check tavern enabeld
8. if tavern not enabled, fail to reinforce, otherwise reinforce with best crab from tavern 

please reach out to wheelsmcfantini@gmail.com with questions or comments. 
