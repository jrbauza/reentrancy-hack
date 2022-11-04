// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import "hardhat/console.sol";
contract Bank{

    mapping (address => uint) private balances;

    function deposit() public payable {
        balances[msg.sender] = msg.value;
    }

    function withdraw(uint amount) public {
        require(amount <= balances[msg.sender], "Your balance is insufficient.");
        
        console.log("Bank balance: %s", address(this).balance);
        console.log("Amount to withdraw %s", amount);
        balances[msg.sender] = balances[msg.sender] - amount;
        (bool success, ) = msg.sender.call{value:amount}("");
        require(success, "Failed to withdraw eth");
    }
}