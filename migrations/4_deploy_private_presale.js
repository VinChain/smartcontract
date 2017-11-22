const BigNumber = require("bignumber.js")

const VinToken = artifacts.require("VinToken.sol")
const Presale = artifacts.require("Presale.sol")
const PricingStrategy = artifacts.require("PricingStrategy.sol")

module.exports = function (deployer, network, accounts) {
    let startTime, endTime, pricingStrategy, weiMaximumGoal, wallet, weiMinimumGoal, maxTokens, minAmount
    
    if (network == "live") {
        startTime = 1511438400 // Thursday, November 23, 2017 12:00:00 PM UTC
        endTime =   1512129599 // Friday, December 1, 2017 11:59:59 AM UTC
        pricingStrategy = PricingStrategy.address
        wallet = "0x0"
        weiMaximumGoal = web3.toWei(1585, "ether")
        weiMinimumGoal = web3.toWei(1585, "ether")
        maxTokens = new BigNumber(12500000).mul(new BigNumber("1e18"))
        minAmount = web3.toWei(1, "ether")
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
    }
    
    deployer.deploy(Presale,
        startTime,
        endTime,
        pricingStrategy,
        VinToken.address,
        wallet,
        weiMaximumGoal,
        weiMinimumGoal,
        minAmount
    )
    .then(() => VinToken.deployed())
    .then((token) => {
        return token.approve(Presale.address, maxTokens)
        .then(() => token.editWhitelist(Presale.address, true))
        .then(() => token.setSaleAddress(Presale.address))
    })
    .then(() => console.log("Presale contracts deployed successfully"))
}