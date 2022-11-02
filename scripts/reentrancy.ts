import { ethers } from "hardhat";

async function main() {
    const [owner, user1, user2, hacker] = await ethers.getSigners();
    const Bank = await ethers.getContractFactory("Bank");
    const bank = await Bank.deploy();

    const DEPOSITED_ETH_BY_USER1 = ethers.utils.parseEther("2");
    const DEPOSITED_ETH_BY_USER2 = ethers.utils.parseEther("1");

    await bank.connect(user1).deposit({value:DEPOSITED_ETH_BY_USER1});
    await bank.connect(user2).deposit({value:DEPOSITED_ETH_BY_USER2});

    const Attacker = await ethers.getContractFactory("Attacker");
    const attacker = await Attacker.connect(hacker).deploy(bank.address, {value:ethers.utils.parseEther("1")});

    console.log("********************************");
    await attacker.connect(hacker).withdraw();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });