let BigNumber = require("bignumber.js")

let PricingStrategy = artifacts.require("PricingStrategy.sol")

module.exports = (deployer, network) => {

    let LIMITS, RATES

    if (network == "live") {
        LIMITS = [0,     1000001, 5000001, 12500001, 100000001, 250000001]
        RATES =  [10000, 8570,    7500,    6000,     5455,      5000     ]
    }
    else {
        LIMITS = [0,0,0,0,0,0]
        RATES = [1,1,1,1,1,1]
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

