let BigNumber = require("bignumber.js")

let PricingStrategy = artifacts.require("PricingStrategy.sol")

module.exports = (deployer, network) => {

    let LIMITS, RATES

    if (network == "live") {
        LIMITS = [0,     1000000, 5000000, 12500000, 100000000, 250000000]
        RATES =  [10000, 8570,    7500,    6000,     5455,      5000     ]
    }
    else {
        LIMITS = [0]
        RATES = [1]
    }

    // add decimals
    for (let i = 0; i < LIMITS.length; i++) {
        LIMITS[i] = new BigNumber(LIMITS[i]).mul(new BigNumber("1e18"))
    }

    deployer.deploy(
        PricingStrategy,
        LIMITS,
        RATES
    )
}

