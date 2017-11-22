const BigNumber = require("bignumber.js")

const VinToken = artifacts.require("./VinToken.sol")

module.exports = function (deployer, network, accounts) {
    let founder1Address, founder2Address, founder3Address ,icoStartTime, icoEndTime
    let amount1, amount2, amount3
    if (network == "live") {
        founder1Address = "0x0"
        founder2Address = "0x0"
        founder3Address = "0x0"
        icoStartTime = 1521727200 // Thursday, March 22, 2018 2:00:00 PM UTC
        icoEndTime = 1523800800 // Sunday, April 15, 2018 2:00:00 PM UTC
        amount1 = new BigNumber("250000000e18")
        amount2 = new BigNumber("87500000e18")
        amount3 = new BigNumber("50000000e18")
    }
    else {
        founder1Address = accounts[7]
        founder2Address = accounts[8]
        founder3Address = accounts[9]
        icoStartTime = 1521727200 // Thursday, March 22, 2018 2:00:00 PM UTC
        icoEndTime = 1523800800 // Sunday, April 15, 2018 2:00:00 PM UTC
        amount1 = 100
        amount2 = 100
        amount3 = 100
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