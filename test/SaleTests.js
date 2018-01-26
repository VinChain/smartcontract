const utils = require("./utils.js")
const BigNumber = require("bignumber.js")
const chai = require("chai")
chai.use(require("chai-bignumber")())
chai.use(require("chai-as-promised"))
chai.should()

const VinToken = artifacts.require("./VinToken.sol")
const Sale = artifacts.require("./Sale.sol")
const PricingStrategy = artifacts.require("./PricingStrategy.sol")

contract("Sale", (accounts) => {

    const OWNER = accounts[0]
    const INVESTOR = accounts[1]
    const INVESTOR2 = accounts[2]
    const WALLET = accounts[3]
    const ADMIN = accounts[4]
    const UNKNOWN = accounts[5]
    const RATE = 1
    const WEI_MINIMUM_GOAL = 99
    const WEI_MAXIMUM_GOAL = 100
    const DAY = 60*60*24

    const deploySale = async (deltaStart, deltaEnd) => {
        const token = await VinToken.deployed()
        const pricingStrategy = await PricingStrategy.deployed()
        const now = utils.now()
        const sale = await Sale.new(
            now + deltaStart*DAY,
            now + deltaEnd*DAY,
            pricingStrategy.address,
            token.address,
            WALLET,
            WEI_MAXIMUM_GOAL,
            WEI_MINIMUM_GOAL,
            0,
            10
        )
        
        await token.approve(sale.address, WEI_MAXIMUM_GOAL * RATE, {from: OWNER})
        await token.editWhitelist(sale.address, true, {from: OWNER})
        await token.setSaleAddress(sale.address, {from: OWNER})

        return {
            sale: sale, 
            token: token,
            strategy: pricingStrategy
        }
    }

    let sale

    before(async () => {
        sale = await Sale.deployed()
    })

    it("should set owner correctly", async () => {
        const res = await sale.owner()

        res.should.equal(OWNER)
    })

    it("should not allow to invest before start", async () => {
        return sale.sendTransaction({ from: INVESTOR, value: 1 })
            .should.be.rejected
    })

    it("should allow owner edit whitelist", async () => {
        await sale.editEarlyParicipantWhitelist(INVESTOR, true, { from: OWNER })

        const res = await sale.earlyParticipantWhitelist(INVESTOR)

        res.should.be.true
    })

    it("should allow owner set PricingStrategy", async () => {
        await sale.setPricingStrategy(PricingStrategy.address, { from: OWNER })

        const res = new BigNumber(await sale.pricingStrategy())

        res.should.be.bignumber.equals(PricingStrategy.address)
    })

    it("should not allow to invest less then min amount", async () => {
        return sale.sendTransaction({ from: INVESTOR, value: 1 })
            .should.be.rejected
    })

    it("should allow whitelisted investors to invest before start", async () => {
        const value = 11
        await sale.sendTransaction({ from: INVESTOR, value: value })
        const token = await VinToken.deployed()
        const balance = new BigNumber(await token.balanceOf(INVESTOR))

        balance.should.be.bignumber.equals(value * RATE)
    })

    it("should allow all investors to invest after start", async () => {
        const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
        const startTime = (await sale.startTime()).toNumber()
        utils.increaseTime(startTime - now + 30)

        const value = 2
        const balance1 = new BigNumber(web3.eth.getBalance(WALLET))

        await sale.sendTransaction({ from: INVESTOR2, value: value })

        const token = await VinToken.deployed()
        const tokens = new BigNumber(await token.balanceOf(INVESTOR2))
        const balance2 = new BigNumber(web3.eth.getBalance(WALLET))

        tokens.should.be.bignumber.equals(value * RATE)
        balance2.should.be.bignumber.equals(balance1.plus(value))
    })

    it("should now allow to invest more then hard cap", async () => {
        const weiCap = await sale.weiMaximumGoal()
        const weiRaised = await sale.weiRaised()
        await sale.sendTransaction({ from: INVESTOR2, value: weiCap.minus(weiRaised) })

        return sale.sendTransaction({ from: INVESTOR2, value: 1 }).should.be.rejected
    })

    it("should now allow to invest after endTime", async () => {
        sale = (await deploySale(10,11)).sale;
        const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
        const endTime = (await sale.endTime()).toNumber()
        utils.increaseTime(endTime - now + 30)

        return sale.sendTransaction({ from: INVESTOR2, value: 5 }).should.be.rejected
    })

    it("should not allow to buy investor from white list amount of tokens less than minimum value", async() => {
        let contracts = await deploySale(5, 15); 
        sale = contracts.sale;
        let token = contracts.token;
        let pricingStrategy = contracts.strategy;
        
        const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
        const startTime = (await sale.startTime()).toNumber()
        utils.increaseTime(startTime - now + 6*DAY);
        await sale.editEarlyParicipantWhitelist(INVESTOR, true, { from: OWNER });
        await sale.sendTransaction({from: INVESTOR, value: 9}).should.be.rejected;
    })

    it("should allow to buy investor from white list with amount of tokens more than minimum value", async() => {
        let value = 11;
        await sale.sendTransaction({from: INVESTOR, value: value}).should.be.fulfilled;
    })

    it("should allow to buy investor with amount of tokens more than minimum value", async() => {
        let value = 5;
        await sale.sendTransaction({from: INVESTOR2, value: value}).should.be.fulfilled;
    })

    it("should allow admin to register external payment", async () => {
        let {sale, token} = await deploySale(5, 10)
        let wei = 3

        await sale.setAdmin(ADMIN, {from: OWNER})

        const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
        const startTime = (await sale.startTime()).toNumber()
        utils.increaseTime(startTime - now + 30)
        
        const tokens1 = new BigNumber(await token.balanceOf(INVESTOR))
        await sale.registerPayment(INVESTOR, wei, {from: ADMIN})
        const tokens2 = new BigNumber(await token.balanceOf(INVESTOR))

        const investedAmount = new BigNumber(await sale.investedAmountOf(INVESTOR))

        tokens2.sub(tokens1).should.bignumber.equal(wei * RATE)
        investedAmount.should.bignumber.equal(wei)
    })

    it("should not allow non-admin to register external payment", async () => {
        let {sale, token} = await deploySale(5, 10)
        let wei = 3

        await sale.setAdmin(ADMIN, {from: OWNER})

        const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
        const startTime = (await sale.startTime()).toNumber()
        utils.increaseTime(startTime - now + 30)
        
        await sale.registerPayment(INVESTOR, wei, {from: UNKNOWN}).should.be.rejected
    })

    it("should not allow external buyers to refund ether", async () => {
        let {sale, token} = await deploySale(5, 10)
        let wei = 3

        await sale.setAdmin(ADMIN, {from: OWNER})

        // wait till start time
        let now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
        const startTime = (await sale.startTime()).toNumber()
        utils.increaseTime(startTime - now + 30)
        
        await sale.registerPayment(INVESTOR, wei, {from: ADMIN})

        // wait till end time
        now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
        const endTime = (await sale.endTime()).toNumber()
        utils.increaseTime(endTime - now + 30)

        await sale.loadRefund({value: wei})
        await sale.refund({from: INVESTOR}).should.be.rejected
    })
})