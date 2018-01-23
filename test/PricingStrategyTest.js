const BigNumber = require("bignumber.js")
const chai = require("chai")
chai.use(require("chai-bignumber")())
chai.use(require("chai-as-promised"))
chai.should()

let PricingStrategy = artifacts.require("PricingStrategy.sol")

contract("PricingStrategy", () => {
    const RATES =  [1, 2,  3,  4,  5]
    const LIMITS = [10, 20, 30, 40, 50]
    const WEI = 7

    let strategy;

    it("should calculate token amount properly when weiAmount = 0", async () => {
    
        strategy = await PricingStrategy.new(RATES, LIMITS)

        let expectedTokenAmount = 0;
        let weiAmount = 0;
        let result = new BigNumber(await strategy.calculateTokenAmount(weiAmount, 0));
        result.should.bignumber.equal(expectedTokenAmount);
    })

    it("should calculate token amount properly", async () => {
            let expectedTokenAmount = 20;
            let weiAmount = 15;
            let weiRaised = 0;
            let result = new BigNumber(await strategy.calculateTokenAmount(weiAmount, weiRaised));
            result.should.bignumber.equal(expectedTokenAmount);
    })

    it("should calculate token amount properly", async () => {
        let expectedTokenAmount = 150;
        let weiAmount = 50;
        let weiRaised = 0;
        let result = new BigNumber(await strategy.calculateTokenAmount(weiAmount, weiRaised));
        result.should.bignumber.equal(expectedTokenAmount);
    })

    it("should calculate token amount properly", async () => {
        let expectedTokenAmount = 18 + 30 + 4;
        let weiAmount = 20;
        let weiRaised = 11;
        let result = new BigNumber(await strategy.calculateTokenAmount(weiAmount, weiRaised));
        result.should.bignumber.equal(expectedTokenAmount);
    })

    it("#1 should be a pricing strategy", async () => {
        (await strategy.isPricingStrategy()).should.be.true
    })

    it("#2 should calculate amount correctly, when tokensSold = 0", async () => {
        const weiRaised = 0
        const expected = WEI * RATES[0]
        const result = await strategy.calculateTokenAmount(WEI, weiRaised)
        result.toNumber().should.equal(expected)
    })

    it("#3 should calculate amount correctly inside slot", async () => {
        const weiRaised = 2
        const expected = WEI * RATES[0]
        const result = await strategy.calculateTokenAmount(WEI, weiRaised)
        result.toNumber().should.equal(expected)
    })

    it("#4 should calculate amount correctly on slot border", async () => {
        const delta = 3
        const weiAmount = 6;
        const weiRaised = LIMITS[0] - delta
        const expected = (delta*RATES[0]) + (weiAmount - delta)*RATES[1]
        const result = await strategy.calculateTokenAmount(weiAmount, weiRaised)
        result.toNumber().should.equal(expected)
    })

    it("#5 should calculate amount correctly in the beginning of new slot", async () => {
        const tokensSold = LIMITS[0]
        const expected = WEI * RATES[1]
        const result = await strategy.calculateTokenAmount(WEI, tokensSold)
        result.toNumber().should.equal(expected)
    })

    it("#6 should calculate amount correctly in last slot border", async () => {
        const wei = 1
        const weiRaised = LIMITS[4] - wei
        const expected = wei * RATES[4]
        const result = await strategy.calculateTokenAmount(wei, weiRaised)
        result.toNumber().should.equal(expected)
    })

    it("#7 should throw, if all slots ended", async () => {
        const weiRaised = LIMITS[4]
        const result = strategy.calculateTokenAmount(WEI, weiRaised)
        return result.should.be.rejected
    })

    it("#8 should throw, if all slots exceeded", async () => {
        const wei = 10
        const weiRaised = LIMITS[4] - 1
        const result = strategy.calculateTokenAmount(wei, weiRaised)
        return result.should.be.rejected
    })

    // currentRate and currentIndex tests

    it("#9 should calculate currentRate correctly", async () => {
        const weiRaised =     [0, 8, LIMITS[0], LIMITS[1]-1, LIMITS[2]-1, LIMITS[3]-1]
        const expectedTokens = [RATES[0], RATES[0], RATES[1], RATES[1], RATES[2], RATES[3]]
        const expectedIndex =  [0, 0, 1, 1, 2, 3]

        for (let i = 0; i < weiRaised.length; i++) {
            const [resTokens, resIndex] = await strategy.currentRate(weiRaised[i])
            resTokens.toNumber().should.equal(expectedTokens[i], `token index=${i}`)
            resIndex.toNumber().should.equal(expectedIndex[i], `index=${i}`)
        }
    })

})
// const RATES =  [1, 2,  3,  4,  5]
// const LIMITS = [10, 20, 30, 40, 50]