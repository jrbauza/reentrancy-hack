import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Bank } from "../typechain-types";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

describe("Reentrancy", function () {

  async function deployBank() {
    const [owner, user1, user2] = await ethers.getSigners();
    const Bank = await ethers.getContractFactory("Bank");
    const bank = await Bank.deploy();
    await bank.deployed();
    return {bank, owner, user1, user2};
  }

  it("Should allow deposit a cryptocurrency amount", async function(){
    const {bank, user1, user2} = await loadFixture(deployBank);

    const INITIAL_BANK_BALANCE = await ethers.provider.getBalance(bank.address);

    const DEPOSITED_ETH_BY_USER1 = ethers.utils.parseEther("1");
    await bank.connect(user1).deposit({value: DEPOSITED_ETH_BY_USER1});
    expect(await ethers.provider.getBalance(bank.address)).to.equal(INITIAL_BANK_BALANCE.add(DEPOSITED_ETH_BY_USER1));

    const DEPOSITED_ETH_BY_USER2 = ethers.utils.parseEther("2");
    await bank.connect(user2).deposit({value: DEPOSITED_ETH_BY_USER2});
    expect(await ethers.provider.getBalance(bank.address)).to.equal(INITIAL_BANK_BALANCE.add(DEPOSITED_ETH_BY_USER1).add(DEPOSITED_ETH_BY_USER2));
  });

  it("Should send the amount selected by the user", async function () {
    const {bank, user1} = await loadFixture(deployBank);

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

  it("should increase user balance", async function () {
    const {bank, user1} = await loadFixture(deployBank);
    const FIRST_DEPOSIT_AMOUNT = ethers.utils.parseEther("1");
    const SECOND_DEPOSIT_AMOUNT = ethers.utils.parseEther("2");

    await bank.connect(user1).deposit({value:FIRST_DEPOSIT_AMOUNT});
    await bank.connect(user1).deposit({value:SECOND_DEPOSIT_AMOUNT});

    await expect(bank.connect(user1).withdraw(FIRST_DEPOSIT_AMOUNT.add(SECOND_DEPOSIT_AMOUNT))).not.reverted;
  });

  it("should not send an amount greater than the one deposited by the user", async function(){
    const {bank, user1, user2} = await loadFixture(deployBank);

    await bank.connect(user1).deposit({value:ethers.utils.parseEther("2")});
    await bank.connect(user2).deposit({value:ethers.utils.parseEther("1")});

    await expect(bank.connect(user2).withdraw(ethers.utils.parseEther("3"))).revertedWith("Your balance is insufficient.");
  });

  it("total balance in bank should be user balances sum", async function(){
    const {bank, user1, user2} = await loadFixture(deployBank);

    const INITIAL_BANK_BALANCE = await ethers.provider.getBalance(bank.address);
    const DEPOSITED_ETH_BY_USER1 = ethers.utils.parseEther("2");
    const DEPOSITED_ETH_BY_USER2 = ethers.utils.parseEther("1");
    await bank.connect(user1).deposit({value:DEPOSITED_ETH_BY_USER1});
    await bank.connect(user2).deposit({value:DEPOSITED_ETH_BY_USER2});

    expect(await ethers.provider.getBalance(bank.address)).to.equal(INITIAL_BANK_BALANCE.add(DEPOSITED_ETH_BY_USER1).add(DEPOSITED_ETH_BY_USER2));
  });

  it("Should revert transaction when reentrancy attack", async function () {
    const {bank, attackerContract, user1, user2, attackerUser} = await loadFixture(deployAttacker);

    const DEPOSITED_ETH_BY_USER1 = ethers.utils.parseEther("2");
    const DEPOSITED_ETH_BY_USER2 = ethers.utils.parseEther("1");

    await bank.connect(user1).deposit({value:DEPOSITED_ETH_BY_USER1});
    await bank.connect(user2).deposit({value:DEPOSITED_ETH_BY_USER2});

    await expect(attackerContract.connect(attackerUser).withdraw()).reverted;
  });

  async function deployAttacker() {
    const {bank, user1, user2} = await loadFixture(deployBank);
    const [attackerUser] = await ethers.getSigners();
    const Attacker = await ethers.getContractFactory("Attacker");
    const attackerContract = await Attacker.connect(attackerUser).deploy(bank.address, {value:ethers.utils.parseEther("1")});
    return {bank, attackerContract, attackerUser, user1, user2}
  }

  it("should allow withdraw after a reentrancy attack", async function () {
    const {bank, attackerContract, user1, user2, attackerUser} = await loadFixture(deployAttacker);

    const DEPOSITED_ETH_BY_USER1 = ethers.utils.parseEther("2");
    const DEPOSITED_ETH_BY_USER2 = ethers.utils.parseEther("1");

    await bank.connect(user1).deposit({value:DEPOSITED_ETH_BY_USER1});
    await bank.connect(user2).deposit({value:DEPOSITED_ETH_BY_USER2});

    await expect(attackerContract.connect(attackerUser).withdraw()).reverted;

    const USER_BALANCE = await user1.getBalance();
    const WITHDRAWN_ETH = withdrawnEth("1");
    const WITHDRAW_TX_ETH_SPENT = await withdrawTxEthSpent(bank, user1, WITHDRAWN_ETH);

    expect(await user1.getBalance()).to.equal(USER_BALANCE.sub(WITHDRAW_TX_ETH_SPENT).add(WITHDRAWN_ETH));
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