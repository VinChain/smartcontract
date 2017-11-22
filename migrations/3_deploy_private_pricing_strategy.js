let BigNumber = require("bignumber.js")

let PricingStrategy = artifacts.require("PricingStrategy.sol")

module.exports = (deployer, network) => {

    let LIMITS, RATES

    if (network == "live") {
        LIMITS = [0,     1000000000]
        RATES =  [10000, 10000]
    }
    else {
        LIMITS = [0,999999999]
        RATES = [1,0]
    }

    // add decimals
    for (let i = 0; i < LIMITS.length; i++) {
        LIMITS[i] = new BigNumber(LIMITS[i]).mul(new BigNumber("1e18"))
        console.log(LIMITS[i])
    }

    deployer.deploy(
        PricingStrategy,
        LIMITS,
        RATES
    )
}

