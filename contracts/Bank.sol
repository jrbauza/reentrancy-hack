// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

contract Bank{

    mapping (address => uint) private balances;

    function deposit() public payable {
        balances[msg.sender] = msg.value;
    }

    function balance() public view returns(uint){
        return balances[msg.sender];
    }

    function withdraw(uint amount) public {
        balances[msg.sender] = balances[msg.sender] - amount;
        (bool success, ) = msg.sender.call{value:amount}("");
        require(success, "Failed to withdraw eth");
    }
}