const BigNumber = require("bignumber.js")
const chai = require("chai")
chai.use(require("chai-bignumber")())
chai.use(require("chai-as-promised"))
chai.should()

let PricingStrategy = artifacts.require("PricingStrategy.sol")

contract("PricingStrategy", () => {
    const RATES =  [1, 2,  3,  4,  5,  6 ]
    const LIMITS = [0, 10, 20, 30, 40, 50]

    it("should calculate token amount properly", async () => {
        const tokensSold = [0, 1, 11, 50, 51]
        const expected =   [0, 10, 20, 50, 60]
        const instance = await PricingStrategy.new(LIMITS, RATES)

        for (let i = 0; i < tokensSold.length; i++) {
            let result = new BigNumber(await instance.calculateTokenAmount(10, tokensSold[i]))
            result.should.bignumber.equal(expected[i])
        }
    })
})