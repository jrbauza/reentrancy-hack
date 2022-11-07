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
        balances[msg.sender] = balances[msg.sender] + msg.value;
    }

    function withdraw(uint amount) public lockable{
        require(amount <= balances[msg.sender], "Your balance is insufficient.");

        (bool success,) = msg.sender.call{value:amount}("");
        balances[msg.sender] = balances[msg.sender] - amount;
        require(success);
    }

    modifier lockable {
        require(!locked, "Feature locked!");
        locked = true;
        _;
        locked = false;
    }
}