import hre, { ethers } from "hardhat";
import { APISubscription, WatchToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";

describe("APISubscription", function () {
  let apiSubscription: APISubscription;
  let watchToken: WatchToken;
  let admin: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  const initialSupply = ethers.parseEther("1000000");
  const pricePerCredit = ethers.parseEther("0.5");

  beforeEach(async function () {
    [admin, user] = await ethers.getSigners();
    watchToken = await (await ethers.getContractFactory("WatchToken")).connect(admin).deploy(initialSupply);
    await watchToken.connect(admin).transfer(user.address, ethers.parseEther("100000"));
    apiSubscription = await (await ethers.getContractFactory("APISubscription")).connect(admin).deploy(await watchToken.getAddress(), pricePerCredit);
    await watchToken.connect(admin).transfer(await apiSubscription.getAddress(), ethers.parseEther("100000"));
  });

  it("Should allow user to purchase credits", async function () {
    const creditAmount = 100;
    const totalCost = ethers.parseEther((100*0.5).toString());

    await watchToken.connect(user).approve(await apiSubscription.getAddress(), totalCost);
    await apiSubscription.connect(user).purchaseCredits(creditAmount);

    const creditsBalance = await apiSubscription.subscriptionCredits(user.address);
    expect(creditsBalance).to.equal(creditAmount);
  });

  it("Should deduct credits when consumed by admin", async function () {
    const creditAmount = 10;
    const deductAmount = 2;
    const totalCost = ethers.parseEther((creditAmount*0.5).toString());

    await watchToken.connect(user).approve(await apiSubscription.getAddress(), totalCost);
    await apiSubscription.connect(user).purchaseCredits(creditAmount);

    await apiSubscription.connect(admin).deductCredits(user.address, deductAmount);

    const creditsBalance = await apiSubscription.subscriptionCredits(user.address);
    expect(creditsBalance).to.equal(8);
  });

  it("Should allow admin to withdraw tokens", async function () {
    const amount = ethers.parseEther("1000");
    await apiSubscription.connect(admin).withdrawTokens(admin.address, amount);

    // Check admin's token balance
    const adminBalance = await watchToken.balanceOf(admin.address);
    expect(adminBalance).to.equal(ethers.parseEther("801000"));
  });

  it("Should allow admin to set new price per credit", async function () {
    const newPricePerCredit = ethers.parseEther("0.02");

    // Admin sets new price per credit
    await apiSubscription.connect(admin).setPricePerCredit(newPricePerCredit);

    // Check new price per credit
    const updatedPricePerCredit = await apiSubscription.pricePerCredit();
    expect(updatedPricePerCredit).to.equal(newPricePerCredit);
  });
});