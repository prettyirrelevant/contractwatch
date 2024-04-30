import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const initialSupply = ethers.parseEther("1000000");

export default buildModule("ContractWatch", (m) => {
  const watchToken = m.contract("WatchToken", [initialSupply]);
  const pricePerCredit = ethers.parseEther("0.5");

  const apiSubscription = m.contract("APISubscription", [watchToken, pricePerCredit])

  return { watchToken, apiSubscription };
});