let BigNumber = require("bignumber.js")

let PricingStrategy = artifacts.require("PricingStrategy.sol")

module.exports = (deployer, network) => {
    console.log('deploy private pricing strategy');
    let LIMITS, RATES

    LIMITS = [1290, 4950, 8610, 12270, 15930, 19590, 23250]
    RATES =  [28000, 25000, 24000, 23000, 22000, 21000, 20000]

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

