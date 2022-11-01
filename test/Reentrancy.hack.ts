import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Bank } from "../typechain-types";
import { BigNumber } from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers"

describe("Reentrancy", function () {

  it("Should allow deposit a cryptocurrency amount", async function(){
    const [owner, user1, user2] = await ethers.getSigners();
    const Bank = await ethers.getContractFactory("Bank");
    const bank = await Bank.deploy();

    bank.connect(user1);
    await bank.deposit({value: ethers.utils.parseEther("1")});
    expect(await bank.balance()).to.equal(ethers.utils.parseEther("1"));

    bank.connect(user2);
    await bank.deposit({value: ethers.utils.parseEther("2")});
    expect(await bank.balance()).to.equal(ethers.utils.parseEther("2"));
  });

  it("Should allow withdraw a cryptocurrency amount",async function () {
    const [owner, user1] = await ethers.getSigners();
    const Bank = await ethers.getContractFactory("Bank");
    const bank = await Bank.deploy();

    const INITIAL_USER_BALANCE = await user1.getBalance();
    const DEPOSIT_TX_ETH_SPENT = await depositTxEthSpent(bank, user1, depositedEth("1"));
    const WITHDRAW_TX_ETH_SPENT = await withdrawTxEthSpent(bank, user1, withdrawnEth("0.5"));
    expect(
      await user1.getBalance(),
      "Unexpected balance after withdraw"
      ).to.equal(
        INITIAL_USER_BALANCE
      .sub(depositedEth("1"))
      .sub(DEPOSIT_TX_ETH_SPENT)
      .add(withdrawnEth("0.5"))
      .sub(WITHDRAW_TX_ETH_SPENT));
  });
});


async function withdrawTxEthSpent(bank: Bank, user1: SignerWithAddress, amount: BigNumber) {
  const withdrawTx = await bank.connect(user1).withdraw(amount);
  const withdrawReceipt = await withdrawTx.wait();
  const withdrawTxEthSpent = withdrawReceipt.gasUsed.mul(withdrawReceipt.effectiveGasPrice);
  return withdrawTxEthSpent;
}

function depositedEth(amount:string){
  return eth(amount);
}

function withdrawnEth(amount:string){
  return eth(amount);
}

function eth(amount : string) {
  return ethers.utils.parseEther(amount);
}

async function depositTxEthSpent(bank: Bank, user : SignerWithAddress, depositedEth : BigNumber) {
  const depositTx = await bank.connect(user).deposit({ value: depositedEth });
  const depositReceipt = await depositTx.wait();
  return depositReceipt.gasUsed.mul(depositReceipt.effectiveGasPrice);
}
