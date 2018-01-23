let BigNumber = require("bignumber.js")

let PricingStrategy = artifacts.require("PricingStrategy.sol")

module.exports = (deployer, network) => {
    console.log('deploy private pricing strategy');
    let LIMITS, RATES

    if (network == "live") {
        LIMITS = [0,     1000000000]
        RATES =  [10000, 10000]
    }
    else {
        LIMITS = [50, 100]
        RATES = [1, 1]
    }

    // add decimals
    for (let i = 0; i < LIMITS.length; i++) {
        LIMITS[i] = new BigNumber(LIMITS[i]).mul(new BigNumber("1e18"))
        console.log(LIMITS[i])
    }

    deployer.deploy(
        PricingStrategy,
        RATES,
        LIMITS
    )
}

