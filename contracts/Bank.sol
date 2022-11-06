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
        
        console.log("Bank balance: %s", address(this).balance);
        console.log("Amount to withdraw %s", amount);
        (bool success, bytes memory data) = msg.sender.call{value:amount}("");
        balances[msg.sender] = balances[msg.sender] - amount;
        console.log("DATA: %s, SIZE: %s", string(data), data.length);
        if (!success) {
            console.log("Not success");
            (string memory mes, string memory message) = abi.decode(data, (string, string));
            console.log("D: %s, S: %s", message, mes);
            require(success, message);
        }
    }

    modifier lockable {
        require(!locked, "Feature locked!");
        locked = true;
        _;
        locked = false;
    }
}