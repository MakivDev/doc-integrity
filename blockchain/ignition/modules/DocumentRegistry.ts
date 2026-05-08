import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "ethers";

const DocumentRegistryModule = buildModule("DocumentRegistryModule", (m) => {
  // Початкова комісія: 0.001 ETH
  const initialFee = m.getParameter("initialFee", parseEther("0.001"));

  const documentRegistry = m.contract("DocumentRegistry", [initialFee]);

  return { documentRegistry };
});

export default DocumentRegistryModule;