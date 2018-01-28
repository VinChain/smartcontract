const BigNumber = require("bignumber.js")

const VinToken = artifacts.require("./VinToken.sol")

module.exports = function (deployer, network, accounts) {
    console.log('deploy token');
    let founder1Address, founder2Address, founder3Address ,icoStartTime, icoEndTime
    let amount1, amount2, amount3

    
    icoStartTime = 1521727200 // Thursday, March 22, 2018 2:00:00 PM UTC
    icoEndTime = 1523800800 // Sunday, April 15, 2018 2:00:00 PM UTC


    if (network == "live" || network == "kovan") {
        amount1 = new BigNumber("250000000e18")
        amount2 = new BigNumber("87500000e18")
        amount3 = new BigNumber("50000000e18")
        founder1Address = "0x8e1A4ea526fe0C513B043dAa5E83E99c48f07a7e"
        founder2Address = "0x6C10491f481bBDA18f1CFb2bdEF5aBe2d296e1bE"
        founder3Address = "0xf67771d8d13B78018ed212dB9965940797999120"
    }
    else {
        amount1 = 100
        amount2 = 100
        amount3 = 100
        founder1Address = accounts[6]
        founder2Address = accounts[7]
        founder3Address = accounts[8]
    }

    deployer.deploy(
        VinToken,
        founder1Address,
        founder2Address,
        icoStartTime,
        icoEndTime
    )
    .then(() => VinToken.deployed())
    .then((token) => {
        return token.transfer(founder1Address, amount1)
            .then(() => token.transfer(founder2Address, amount2))
            .then(() => token.transfer(founder3Address, amount3))
    })
}