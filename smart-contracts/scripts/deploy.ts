import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);

  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddr = await verifier.getAddress();
  console.log("Verifier deployed to:", verifierAddr);

  const MedShard = await ethers.getContractFactory("MedShard");
  const medShard = await MedShard.deploy(verifierAddr, deployer.address);
  await medShard.waitForDeployment();

  console.log("MedShard deployed to:", await medShard.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
