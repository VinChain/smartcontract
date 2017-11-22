pragma solidity 0.4.15;

import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract PricingStrategy {

    using SafeMath for uint;

    uint[6] public limits;
    uint[6] public rates;

    function PricingStrategy(
        uint[6] _limits,
        uint[6] _rates
    ) public 
    {
        require(_limits.length == _rates.length);
        
        limits = _limits;
        rates = _rates;
    }

    /** Interface declaration. */
    function isPricingStrategy() public constant returns (bool) {
        return true;
    }

    /** Calculate the current price for buy in amount. */
    function calculateTokenAmount(uint weiAmount, uint tokensSold) public constant returns (uint tokenAmount) {
        uint rate = 0;

        for (uint8 i = 0; i < limits.length; i++) {
            if (tokensSold >= limits[i]) {
                rate = rates[i];
            }
        }

        return weiAmount.mul(rate);
    }
}