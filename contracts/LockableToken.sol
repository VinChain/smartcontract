pragma solidity ^0.4.15;

import "zeppelin-solidity/contracts/token/ERC20.sol";


contract LockableToken is ERC20 {
    function addToTimeLockedList(address addr) external returns (bool);
}