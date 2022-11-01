// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

contract Bank{

    mapping (address => uint) private balances;

    function deposit() public payable {
        balances[msg.sender] = msg.value;
    }

    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount, "Your balance is insufficient.");

        balances[msg.sender] = balances[msg.sender] - amount;
        (bool success, ) = msg.sender.call{value:amount}("");
        require(success, "Failed to withdraw eth");
    }
}