const utils = require("./utils.js")
const BigNumber = require("bignumber.js")
const chai = require("chai")
chai.use(require("chai-bignumber")())
chai.use(require("chai-as-promised"))
chai.should()

const VinToken = artifacts.require("./VinToken.sol")
const Presale = artifacts.require("./Presale.sol")
const PricingStrategy = artifacts.require("./PricingStrategy.sol")

contract("Presale", (accounts) => {

    const OWNER = accounts[0]
    const INVESTOR = accounts[1]
    const INVESTOR2 = accounts[2]
    const WALLET = accounts[3]
    const RATE = 1
    const WEI_MINIMUM_GOAL = 1
    const WEI_MAXIMUM_GOAL = 100

    const deployPresale = async (deltaStart, deltaEnd) => {
        const token = await VinToken.deployed()
        const pricingStrategy = await PricingStrategy.deployed()
        const now = utils.now()
        const presale = await Presale.new(
            now + deltaStart,
            now + deltaEnd,
            pricingStrategy.address,
            token.address,
            WALLET,
            WEI_MAXIMUM_GOAL,
            WEI_MINIMUM_GOAL,
            0
        )
        
        await token.approve(presale.address, WEI_MAXIMUM_GOAL * RATE, {from: OWNER})
        await token.editWhitelist(presale.address, true, {from: OWNER})
        await token.setSaleAddress(presale.address, {from: OWNER})

        return presale
    }

    let presale

    before(async () => {
        presale = await Presale.deployed()
    })

    it("should set owner correctly", async () => {
        const res = await presale.owner()

        res.should.equal(OWNER)
    })

    it("should not allow to invest before start", async () => {
        return presale.sendTransaction({ from: INVESTOR, value: 1 })
            .should.be.rejected
    })

    it("should allow owner edit whitelist", async () => {
        await presale.editEarlyParicipantWhitelist(INVESTOR, true, { from: OWNER })

        const res = await presale.earlyParticipantWhitelist(INVESTOR)

        res.should.be.true
    })

    it("should allow owner set PricingStrategy", async () => {
        await presale.setPricingStrategy(PricingStrategy.address, { from: OWNER })

        const res = new BigNumber(await presale.pricingStrategy())

        res.should.be.bignumber.equals(PricingStrategy.address)
    })

    it("should not allow to invest less then min amount", async () => {
        return presale.sendTransaction({ from: INVESTOR, value: 1 })
            .should.be.rejected
    })

    it("should allow whitelisted investors to invest before start", async () => {
        const value = 2
        await presale.sendTransaction({ from: INVESTOR, value: value })

        const token = await VinToken.deployed()
        const balance = new BigNumber(await token.balanceOf(INVESTOR))

        balance.should.be.bignumber.equals(value * RATE)
    })

    it("should allow all investors to invest after start", async () => {
        const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
        const startTime = (await presale.startTime()).toNumber()
        utils.increaseTime(startTime - now + 30)

        const value = 2
        const balance1 = new BigNumber(web3.eth.getBalance(WALLET))

        await presale.sendTransaction({ from: INVESTOR2, value: value })

        const token = await VinToken.deployed()
        const tokens = new BigNumber(await token.balanceOf(INVESTOR2))
        const balance2 = new BigNumber(web3.eth.getBalance(WALLET))

        tokens.should.be.bignumber.equals(value * RATE)
        balance2.should.be.bignumber.equals(balance1.plus(value))
    })

    it("should now allow to invest more then hard cap", async () => {
        const weiCap = await presale.weiMaximumGoal()
        const weiRaised = await presale.weiRaised()
        await presale.sendTransaction({ from: INVESTOR2, value: weiCap.minus(weiRaised) })

        return presale.sendTransaction({ from: INVESTOR2, value: 1 }).should.be.rejected
    })

    it("should now allow to invest after endTime", async () => {
        presale = await deployPresale(10,11)
        const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
        const endTime = (await presale.endTime()).toNumber()
        utils.increaseTime(endTime - now + 30)

        return presale.sendTransaction({ from: INVESTOR2, value: 1 }).should.be.rejected
    })

})