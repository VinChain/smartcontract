pragma solidity ^0.4.15;

import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract PricingStrategy {

    using SafeMath for uint;

    uint[] public rates;
    uint[] public limits;

    function PricingStrategy(
        uint[] _rates,
        uint[] _limits
    ) public
    {
        require(_rates.length == _limits.length);
        rates = _rates;
        limits = _limits;
    }

    /** Interface declaration. */
    function isPricingStrategy() public view returns (bool) {
        return true;
    }

    /** Calculate the current price for buy in amount. */
    function calculateTokenAmount(uint weiAmount, uint weiRaised) public view returns (uint tokenAmount) {
        if (weiAmount == 0) {
            return 0;
        }

        var (rate, index) = currentRate(weiRaised);
        tokenAmount = weiAmount.mul(rate);

        // if we crossed slot border, recalculate remaining tokens according to next slot price
        if (weiRaised.add(weiAmount) > limits[index]) {
            uint currentSlotWei = limits[index].sub(weiRaised);
            uint currentSlotTokens = currentSlotWei.mul(rate);
            uint remainingWei = weiAmount.sub(currentSlotWei);
            tokenAmount = currentSlotTokens.add(calculateTokenAmount(remainingWei, limits[index]));
        }
    }

    function currentRate(uint weiRaised) public view returns (uint rate, uint8 index) {
        rate = rates[0];
        index = 0;

        while (weiRaised >= limits[index]) {
            rate = rates[++index];
        }
    }

}