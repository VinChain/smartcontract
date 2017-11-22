const BigNumber = require("bignumber.js")
const chai = require("chai")
const utils = require("./utils")
chai.use(require("chai-bignumber")())
chai.use(require("chai-as-promised"))
chai.should()

const VinToken = artifacts.require("./VinToken.sol")

contract("VinToken", (accounts) => {

  const OWNER = accounts[0]
  const UNKNOWN = accounts[1]
  const UNKNOWN2 = accounts[2]
  const WHITELISTED = accounts[3]
  const TOTAL_SUPPLY = new BigNumber("1e+27")
  const PRESALE_ADDRESS = accounts[6]
  const FOUNDER_1_ADDRESS = accounts[7]
  const FOUNDER_2_ADDRESS = accounts[8]
  const ICO_START_TIME = 1521727200 // Thursday, March 22, 2018 2:00:00 PM UTC
  const ICO_END_TIME = 1523800800 // Sunday, April 15, 2018 2:00:00 PM UTC
  const LOCK_PERIOD_FOR_BUYERS = 100 * 24 * 60 * 60 // 100 days > 12 weeks
  const TIME_FOR_ICO_END = ICO_END_TIME - Math.round(Date.now() / 1000)

  let token

  before(async () => {
    token = await VinToken.new(
      FOUNDER_1_ADDRESS,
      FOUNDER_2_ADDRESS,
      ICO_START_TIME,
      ICO_END_TIME,
      { from: OWNER }
    )
  })

  it("should not allow set presale address from non-owner address", async () => {
    const promise = token.setSaleAddress(PRESALE_ADDRESS, {from: UNKNOWN})
    return promise.should.be.rejected  
  })

  it("should allow to set presale address from owner address", async () => {
    await token.setSaleAddress(PRESALE_ADDRESS, {from: OWNER})
    let presaleAddress = await token.saleAddress()
    presaleAddress.should.equal(PRESALE_ADDRESS)
  })

  it("should not allow to add users to isPresaleBuyer list from non-presale address", async()=>{
    const promise = token.addToTimeLockedList(accounts[5], { from: UNKNOWN })
    return promise.should.be.rejected
  })

  it("should allow to add users to isPresaleBuyer list from presale address", async()=>{
    await token.addToTimeLockedList(UNKNOWN, {from: PRESALE_ADDRESS})
    await token.addToTimeLockedList(UNKNOWN2, {from: PRESALE_ADDRESS})
    let res1 = await token.isPresaleBuyer(UNKNOWN)
    let res2 = await token.isPresaleBuyer(UNKNOWN2)
    res1.should.be.true
    res2.should.be.true
  })

  it("should return totalSupply", async () => {
    const res = new BigNumber(await token.totalSupply())
    res.should.be.bignumber.equals(TOTAL_SUPPLY)
  })

  it("should assign totalSupply to owner", async () => {
    const balance = new BigNumber(await token.balanceOf(OWNER))
    balance.should.be.bignumber.equals(TOTAL_SUPPLY)
  })

  it("should set owner properly", async () => {
    const res = await token.owner()
    res.should.equal(OWNER)
  })

  it("should add owner into whitelist", async () => {
    const res = await token.whitelistedBeforeActivation(OWNER)
    res.should.be.true
  })

  it("should not add others into whitelist", async () => {
    const res = await token.whitelistedBeforeActivation(UNKNOWN)
    res.should.be.false
  })

  it("should allow owner add accounts into whitelist", async () => {
    await token.editWhitelist(WHITELISTED, true)
    const res = await token.whitelistedBeforeActivation(WHITELISTED)
    res.should.be.true
  })

  it("should allow operations to whitelisted accounts", async () => {
    const amount = 100
    const balance1 = await token.balanceOf(OWNER)

    await token.approve(WHITELISTED, amount, { from: OWNER })
    await token.transferFrom(OWNER, WHITELISTED, amount, { from: WHITELISTED })

    const balance2 = new BigNumber(await token.balanceOf(OWNER))

    balance2.should.be.bignumber.equals(TOTAL_SUPPLY.minus(amount))
  })

  it("should founders balances equals", async () => {
    await token.transfer(FOUNDER_1_ADDRESS, 1000, {from: OWNER})
    await token.transfer(FOUNDER_2_ADDRESS, 1000, {from: OWNER})
    let balance1 = new BigNumber(await token.balanceOf(FOUNDER_1_ADDRESS))
    let balance2 = new BigNumber(await token.balanceOf(FOUNDER_2_ADDRESS))
    balance1.should.be.bignumber.equals(1000)
    balance2.should.be.bignumber.equals(1000)
  })

  it("should not allow operations to non-whitelisted accounts", async () => {
    const amount = 100

    await token.transfer(UNKNOWN, amount, { from: OWNER })

    const promise = token.transfer(OWNER, amount, { from: UNKNOWN })
    return promise.should.be.rejected
  })

  it("should not allow non-owner to activate token", async () => {
    return token.activate({from : UNKNOWN}).should.be.rejected
  })

  it("should allow owner to activate token", async () => {
    await token.activate({from : OWNER})
    const isActivated = await token.isActivated()
    isActivated.should.be.true
  })

  it("should allow transfer tokens from owner account before lock time ended", async()=>{
    const amount = 100
    const expectedBalance = (new BigNumber(await token.balanceOf(UNKNOWN))).plus(amount)
    await token.transfer(UNKNOWN, amount, { from: OWNER })
    const balance = new BigNumber(await token.balanceOf(UNKNOWN))
    balance.should.be.bignumber.equals(expectedBalance)
  })

  it("should not allow transfer tokens from non-owner accounts before lock time ended", async () => {
    const amount = 100
    const promise = token.transfer(UNKNOWN2, amount, { from: UNKNOWN })
    return promise.should.be.rejected
  })

  it("should allow transfer tokens from all accounts after lock time ended", async() => {
    utils.increaseTime(TIME_FOR_ICO_END + LOCK_PERIOD_FOR_BUYERS)
    const amount = 100
    await token.transfer(UNKNOWN2, amount, { from: UNKNOWN })
    const balance = new BigNumber(await token.balanceOf(UNKNOWN2))
    balance.should.be.bignumber.equals(amount)
  })

  it("should transfer all tokens from UNKNOWN2", async()=>{
    const currentBalance = new BigNumber(await token.balanceOf(UNKNOWN2))
    await token.transfer(accounts[9], parseInt(currentBalance), {from: UNKNOWN2})
    const balance = new BigNumber(await token.balanceOf(UNKNOWN2))
    balance.should.be.bignumber.equals(0)
  })

  it("should allow all operations after activation", async () => {
    const allowance = 15
    await token.approve(UNKNOWN2, 10, { from: UNKNOWN })
    await token.increaseApproval(UNKNOWN2, 10, { from: UNKNOWN })
    await token.decreaseApproval(UNKNOWN2, 5, { from: UNKNOWN })

    const res = new BigNumber(await token.allowance(UNKNOWN, UNKNOWN2))
    res.should.be.bignumber.equals(allowance)

    await token.transferFrom(UNKNOWN, UNKNOWN2, allowance, {from : UNKNOWN2})
    
    const balance = new BigNumber(await token.balanceOf(UNKNOWN2))
    balance.should.be.bignumber.equals(allowance)
  })

  it("should not allow founder1 transfer tokens", async () => {
    let amount = 100
    let promise = token.transfer(UNKNOWN, amount, {from: FOUNDER_1_ADDRESS})
    return promise.should.be.rejected
  })

  it("should not allow users make transfers from founder1 address", async () => {
    let user = accounts[5]
    let amount = 100
    await token.approve(user, amount, {from: FOUNDER_1_ADDRESS})
    let promise = token.transferFrom(FOUNDER_1_ADDRESS, UNKNOWN,amount, {from: user})
    return promise.should.be.rejected
  })

  it("should not allow founder2 transfer tokens", async () => {
    let amount = 100
    let promise = token.transfer(UNKNOWN, amount, {from: FOUNDER_2_ADDRESS})
    return promise.should.be.rejected
  })

  it("should not allow users make transfers from founder2 address", async () => {
    let user = accounts[5]
    let amount = 100
    await token.approve(user, amount, {from: FOUNDER_2_ADDRESS})
    let promise = token.transferFrom(FOUNDER_2_ADDRESS, UNKNOWN,amount, {from: user})
    return promise.should.be.rejected
  })

  it("should allow transfers from founder2 address", async () => {
    utils.increaseTime(LOCK_PERIOD_FOR_BUYERS)
    let amount = 100
    let previousBalance = new BigNumber(await token.balanceOf(UNKNOWN))
    await token.transfer(UNKNOWN, amount, {from: FOUNDER_2_ADDRESS})
    let balance = new BigNumber(await token.balanceOf(UNKNOWN))
    balance.should.be.bignumber.equals(previousBalance.plus(amount))
  })

  it("should not allow founder1 transfer tokens after 25 weeks", async () => {
    let amount = 100
    let promise = token.transfer(UNKNOWN, amount, {from: FOUNDER_1_ADDRESS})
    return promise.should.be.rejected
  })

  it("should allow transfer tokens from founder1 address after 2 years", async () => {
    let twoYears = 2 * 365 * 24 * 60 * 60 // 2 years
    utils.increaseTime(twoYears)
    let amount = 100
    let previousBalance = new BigNumber(await token.balanceOf(UNKNOWN))
    await token.transfer(UNKNOWN, amount, {from: FOUNDER_2_ADDRESS})
    let balance = new BigNumber(await token.balanceOf(UNKNOWN))
    balance.should.be.bignumber.equals(previousBalance.plus(amount))  
  })

})