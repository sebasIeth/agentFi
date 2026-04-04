// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentRegistry {
    address public backend;

    struct AgentData {
        bytes32 humanId;
        string ensName;
        string templateType;
        bool active;
        uint256 registeredAt;
    }

    mapping(bytes32 => address) public humanToAgent;
    mapping(address => bytes32) public agentToHuman;
    mapping(address => AgentData) public agents;
    address[] public agentList;

    event AgentRegistered(bytes32 indexed humanId, address indexed agentWallet, string ensName);
    event AgentDeactivated(address indexed agentWallet);

    modifier onlyBackend() {
        require(msg.sender == backend, "Only backend");
        _;
    }

    constructor(address _backend) {
        backend = _backend;
    }

    function registerAgent(
        bytes32 humanId,
        address agentWallet,
        string calldata ensName,
        string calldata templateType
    ) external onlyBackend {
        require(humanToAgent[humanId] == address(0), "Human already has agent");
        require(agentToHuman[agentWallet] == bytes32(0), "Wallet already registered");

        humanToAgent[humanId] = agentWallet;
        agentToHuman[agentWallet] = humanId;
        agents[agentWallet] = AgentData({
            humanId: humanId,
            ensName: ensName,
            templateType: templateType,
            active: true,
            registeredAt: block.timestamp
        });
        agentList.push(agentWallet);

        emit AgentRegistered(humanId, agentWallet, ensName);
    }

    function isVerifiedAgent(address wallet) external view returns (bool) {
        return agents[wallet].active;
    }

    function getAgent(address wallet) external view returns (AgentData memory) {
        return agents[wallet];
    }

    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }

    function deactivateAgent(address agentWallet) external onlyBackend {
        require(agents[agentWallet].active, "Not active");
        agents[agentWallet].active = false;
        emit AgentDeactivated(agentWallet);
    }

    function setBackend(address _backend) external onlyBackend {
        backend = _backend;
    }
}
