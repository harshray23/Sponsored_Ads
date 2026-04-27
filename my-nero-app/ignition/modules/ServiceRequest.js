import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ServiceRequestModule", (m) => {
  const serviceRequest = m.contract("ServiceRequestSystem");

  return { serviceRequest };
});
