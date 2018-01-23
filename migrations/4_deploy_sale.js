const BigNumber = require("bignumber.js")

const VinToken = artifacts.require("VinToken.sol")
const Sale = artifacts.require("Sale.sol")
const PricingStrategy = artifacts.require("PricingStrategy.sol")

module.exports = function (deployer, network, accounts) {
    let startTime, 
        endTime, 
        pricingStrategy, 
        weiMaximumGoal, 
        wallet, 
        weiMinimumGoal, 
        maxTokens, 
        minAmount,
        minAmountForWL
    
    if (network == "live") {
        startTime = 1511438400 // Thursday, November 23, 2017 12:00:00 PM UTC
        endTime =   1512129599 // Friday, December 1, 2017 11:59:59 AM UTC
        pricingStrategy = PricingStrategy.address
        wallet = "0x7d5669Ee2B8e9935849FaE55B74D05184f9E3867"
        weiMaximumGoal = web3.toWei(1585, "ether")
        weiMinimumGoal = web3.toWei(1585, "ether")
        maxTokens = new BigNumber(12500000).mul(new BigNumber("1e18"))
        minAmount = web3.toWei(1, "ether")
        minAmountForWL = web3.toWei(2.5, "ether")
    }
    else {
        const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
        startTime = now + 1000
        endTime = now + 2000
        pricingStrategy = PricingStrategy.address
        wallet = accounts[3]
        weiMaximumGoal = new BigNumber(100)
        weiMinimumGoal = 1
        maxTokens = new BigNumber(12500000).mul(new BigNumber("1e18"))
        minAmount = 2
        minAmountForWL = 10
    }
    
    deployer.deploy(Sale,
        startTime,
        endTime,
        pricingStrategy,
        VinToken.address,
        wallet,
        weiMaximumGoal,
        weiMinimumGoal,
        minAmount,
        minAmountForWL
    )
    .then(() => VinToken.deployed())
    .then((token) => {
        return token.approve(Sale.address, maxTokens)
        .then(() => token.editWhitelist(Sale.address, true))
    })
    .then(() => console.log("Sale contracts deployed successfully"))
}
