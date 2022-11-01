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

    const INITIAL_BANK_BALANCE = await ethers.provider.getBalance(bank.address);

    const DEPOSITED_ETH_BY_USER1 = ethers.utils.parseEther("1");
    await bank.connect(user1).deposit({value: DEPOSITED_ETH_BY_USER1});
    expect(await ethers.provider.getBalance(bank.address)).to.equal(INITIAL_BANK_BALANCE.add(DEPOSITED_ETH_BY_USER1));

    const DEPOSITED_ETH_BY_USER2 = ethers.utils.parseEther("2");
    await bank.connect(user2).deposit({value: DEPOSITED_ETH_BY_USER2});
    expect(await ethers.provider.getBalance(bank.address)).to.equal(INITIAL_BANK_BALANCE.add(DEPOSITED_ETH_BY_USER1).add(DEPOSITED_ETH_BY_USER2));
  });

  it("Should send the amount selected by the user", async function () {
    const [owner, user1] = await ethers.getSigners();
    const Bank = await ethers.getContractFactory("Bank");
    const bank = await Bank.deploy();

    const INITIAL_USER_BALANCE = await user1.getBalance();
    const DEPOSIT_TX_ETH_SPENT = await depositTxEthSpent(bank, user1, depositedEth("1"));
    const WITHDRAW_TX_ETH_SPENT = await withdrawTxEthSpent(bank, user1, withdrawnEth("0.5"));
    expect
    (
      await user1.getBalance(), "Unexpected user balance after withdraw"
    )
    .to.equal
    (
      INITIAL_USER_BALANCE
      .sub(depositedEth("1"))
      .sub(DEPOSIT_TX_ETH_SPENT)
      .add(withdrawnEth("0.5"))
      .sub(WITHDRAW_TX_ETH_SPENT)
    );
  });

  it("should not send an amount greater than the one deposited by the user", async function(){
    const [owner, user1, user2] = await ethers.getSigners();
    const Bank = await ethers.getContractFactory("Bank");
    const bank = await Bank.deploy();

    await bank.connect(user1).deposit({value:ethers.utils.parseEther("2")});
    await bank.connect(user2).deposit({value:ethers.utils.parseEther("1")});

    await expect(bank.connect(user2).withdraw(ethers.utils.parseEther("3"))).revertedWith("Your balance is insufficient.");
  });

  it("should add all user deposits in bank balance", async function(){
    const [owner, user1, user2] = await ethers.getSigners();
    const Bank = await ethers.getContractFactory("Bank");
    const bank = await Bank.deploy();

    const INITIAL_BANK_BALANCE = await ethers.provider.getBalance(bank.address);
    const DEPOSITED_ETH_BY_USER1 = ethers.utils.parseEther("2");
    const DEPOSITED_ETH_BY_USER2 = ethers.utils.parseEther("1");
    await bank.connect(user1).deposit({value:DEPOSITED_ETH_BY_USER1});
    await bank.connect(user2).deposit({value:DEPOSITED_ETH_BY_USER2});

    expect(await ethers.provider.getBalance(bank.address)).to.equal(INITIAL_BANK_BALANCE.add(DEPOSITED_ETH_BY_USER1).add(DEPOSITED_ETH_BY_USER2));
  });
});

async function withdrawTxEthSpent(bank: Bank, user: SignerWithAddress, amount: BigNumber) {
  const withdrawTx = await bank.connect(user).withdraw(amount);
  const withdrawReceipt = await withdrawTx.wait();
  const withdrawTxEthSpent = withdrawReceipt.gasUsed.mul(withdrawReceipt.effectiveGasPrice);
  return withdrawTxEthSpent;
}

function depositedEth(amount:string){
  return ethers.utils.parseEther(amount);
}

function withdrawnEth(amount:string){
  return ethers.utils.parseEther(amount);
}

async function depositTxEthSpent(bank: Bank, user : SignerWithAddress, depositedEth : BigNumber) {
  const depositTx = await bank.connect(user).deposit({ value: depositedEth });
  const depositReceipt = await depositTx.wait();
  return depositReceipt.gasUsed.mul(depositReceipt.effectiveGasPrice);
}