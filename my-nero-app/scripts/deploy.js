import hre from "hardhat";

async function main() {
  const ServiceRequestSystem = await hre.ethers.getContractFactory("ServiceRequestSystem");
  console.log("Deploying ServiceRequestSystem...");
  
  const serviceRequest = await ServiceRequestSystem.deploy();
  await serviceRequest.waitForDeployment();

  console.log(`ServiceRequestSystem deployed to: ${await serviceRequest.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
