// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import "hardhat/console.sol";
contract Bank{

    mapping (address => uint) private balances;
    bool private locked;

    constructor(){
        locked = false;
    }

    function deposit() public payable {
        balances[msg.sender] = msg.value;
    }

    function withdraw(uint amount) public{
        require(!locked, "Reentrant not avaialable");
        locked = true;
        require(balances[msg.sender] >= amount, "Your balance is insufficient.");
        console.log("Bank balance: %s", address(this).balance);
        console.log("Amount to withdraw %s", amount);
        (bool success, ) = msg.sender.call{value:amount}("");
        balances[msg.sender] = balances[msg.sender] - amount;
        require(success, "Failed to withdraw eth");
        locked = false;
    }
}