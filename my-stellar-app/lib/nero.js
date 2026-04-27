import { ethers } from "ethers";
// Import the generated ABI after hardhat compile
import ServiceRequestArtifact from "../artifacts/contracts/ServiceRequest.sol/ServiceRequestSystem.json" with { type: "json" };

// Replace with your deployed contract address on Nero Chain testnet
export const CONTRACT_ADDRESS = "0x8d2695a6a0f8cf928f76E0407C166ea6aeA691C0"; 
export const NETWORK_CHAIN_ID = 689; // Nero Chain Testnet

let provider = null;
let signer = null;
let contract = null;

const getProvider = () => {
    if (typeof window !== "undefined" && window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
};

const getContract = async (withSigner = false) => {
    if (!provider) provider = getProvider();
    if (!provider) throw new Error("No web3 provider found (e.g. MetaMask)");

    if (withSigner) {
        if (!signer) signer = await provider.getSigner();
        return new ethers.Contract(CONTRACT_ADDRESS, ServiceRequestArtifact.abi, signer);
    } else {
        return new ethers.Contract(CONTRACT_ADDRESS, ServiceRequestArtifact.abi, provider);
    }
};

export const checkConnection = async () => {
    try {
        const _provider = getProvider();
        if (!_provider) return null;
        
        const accounts = await _provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
            signer = await _provider.getSigner();
            const network = await _provider.getNetwork();
            if (Number(network.chainId) !== NETWORK_CHAIN_ID) {
                try {
                    await _provider.send("wallet_switchEthereumChain", [{ chainId: ethers.toQuantity(NETWORK_CHAIN_ID) }]);
                } catch (e) {
                    console.error("Failed to switch network", e);
                }
            }
            return { publicKey: accounts[0] };
        }
        return null;
    } catch (e) {
        console.error("Connection error:", e);
        return null;
    }
};

const waitForTx = async (txResponse) => {
    try {
        const receipt = await txResponse.wait();
        if (receipt.status === 0) throw new Error("Transaction failed on-chain");
        return receipt;
    } catch (error) {
        throw new Error(error.reason || error.message || "Transaction failed");
    }
};

export const createRequest = async (payload) => {
    if (!payload?.id) throw new Error("id is required");
    const instance = await getContract(true);
    
    // Account Abstraction (AA) Integration Point:
    // If using a smart account (e.g. Biconomy), you would build the userOp here
    // and send it via the bundler instead of using the standard signer.
    
    const tx = await instance.createRequest(
        payload.id,
        payload.title || "",
        payload.description || "",
        Number(payload.priority) || 1,
        payload.category || "general",
        ethers.parseUnits((payload.budget || 0).toString(), "gwei") // Convert budget if necessary
    );
    return waitForTx(tx);
};

export const acceptRequest = async (payload) => {
    if (!payload?.id) throw new Error("id is required");
    const instance = await getContract(true);
    const tx = await instance.acceptRequest(payload.id);
    return waitForTx(tx);
};

export const submitWork = async (payload) => {
    if (!payload?.id) throw new Error("id is required");
    const instance = await getContract(true);
    const tx = await instance.submitWork(payload.id, payload.workNotes || "");
    return waitForTx(tx);
};

export const approveWork = async (payload) => {
    if (!payload?.id) throw new Error("id is required");
    const instance = await getContract(true);
    const tx = await instance.approveWork(payload.id);
    return waitForTx(tx);
};

export const rejectWork = async (payload) => {
    if (!payload?.id) throw new Error("id is required");
    const instance = await getContract(true);
    const tx = await instance.rejectWork(payload.id, payload.reason || "");
    return waitForTx(tx);
};

// Returns BigInts converted to strings or numbers for UI friendliness
const formatRequest = (req) => {
    const statuses = ["Open", "Accepted", "Submitted", "Approved", "Rejected"];
    return {
        id: req.id,
        requester: req.requester,
        provider: req.provider,
        title: req.title,
        description: req.description,
        priority: Number(req.priority),
        category: req.category,
        budget: req.budget.toString(),
        status: statuses[Number(req.status)],
        workNotes: req.workNotes,
        rejectionReason: req.rejectionReason
    };
};

export const getRequest = async (id) => {
    if (!id) throw new Error("id is required");
    const instance = await getContract(false);
    const req = await instance.getRequest(id);
    if (req.requester === ethers.ZeroAddress) throw new Error("Request not found");
    return formatRequest(req);
};

export const listRequests = async () => {
    const instance = await getContract(false);
    const reqs = await instance.listRequests();
    return reqs.map(formatRequest);
};
