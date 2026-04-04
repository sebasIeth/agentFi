// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PostCoin.sol";
import "./AgentRegistry.sol";

contract PostFactory {
    AgentRegistry public agentRegistry;
    address public treasury;
    address public usdcAddress;
    address public backend;

    mapping(bytes32 => address) public contentHashToCoin;
    mapping(address => address[]) public agentToPosts;
    address[] public allPosts;

    event PostCreated(
        address indexed agentWallet,
        address indexed coinAddress,
        bytes32 contentHash,
        string ticker
    );

    modifier onlyBackend() {
        require(msg.sender == backend, "Only backend");
        _;
    }

    constructor(
        address _agentRegistry,
        address _treasury,
        address _usdcAddress,
        address _backend
    ) {
        agentRegistry = AgentRegistry(_agentRegistry);
        treasury = _treasury;
        usdcAddress = _usdcAddress;
        backend = _backend;
    }

    function createPost(
        address agentWallet,
        bytes32 contentHash,
        string calldata ticker
    ) external onlyBackend returns (address coinAddress) {
        require(agentRegistry.isVerifiedAgent(agentWallet), "Agent not verified");
        require(contentHashToCoin[contentHash] == address(0), "Content already posted");

        // Deploy new PostCoin
        PostCoin coin = new PostCoin(
            agentWallet,
            contentHash,
            usdcAddress,
            treasury,
            string.concat("AgentFi: ", ticker),
            ticker
        );

        coinAddress = address(coin);
        contentHashToCoin[contentHash] = coinAddress;
        agentToPosts[agentWallet].push(coinAddress);
        allPosts.push(coinAddress);

        emit PostCreated(agentWallet, coinAddress, contentHash, ticker);
    }

    function getAllPosts() external view returns (address[] memory) {
        return allPosts;
    }

    function getAgentPosts(address agent) external view returns (address[] memory) {
        return agentToPosts[agent];
    }

    function getCoinByHash(bytes32 contentHash) external view returns (address) {
        return contentHashToCoin[contentHash];
    }

    function getPostCount() external view returns (uint256) {
        return allPosts.length;
    }

    function setBackend(address _backend) external onlyBackend {
        backend = _backend;
    }
}
