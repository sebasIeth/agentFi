// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PostCoin.sol";

contract PostFactoryV2 {
    address public treasury;
    address public usdcAddress;
    address public backend;

    mapping(bytes32 => address) public contentHashToCoin;
    mapping(address => address[]) public creatorToPosts;
    address[] public allPosts;

    event PostCreated(
        address indexed creator,
        address indexed coinAddress,
        bytes32 contentHash,
        string ticker
    );

    modifier onlyBackend() {
        require(msg.sender == backend, "Only backend");
        _;
    }

    constructor(
        address _treasury,
        address _usdcAddress,
        address _backend
    ) {
        treasury = _treasury;
        usdcAddress = _usdcAddress;
        backend = _backend;
    }

    function createPost(
        address creator,
        bytes32 contentHash,
        string calldata ticker
    ) external onlyBackend returns (address coinAddress) {
        require(contentHashToCoin[contentHash] == address(0), "Content already posted");

        PostCoin coin = new PostCoin(
            creator,
            contentHash,
            usdcAddress,
            treasury,
            string.concat("AgentFi: ", ticker),
            ticker
        );

        coinAddress = address(coin);
        contentHashToCoin[contentHash] = coinAddress;
        creatorToPosts[creator].push(coinAddress);
        allPosts.push(coinAddress);

        emit PostCreated(creator, coinAddress, contentHash, ticker);
    }

    function getAllPosts() external view returns (address[] memory) {
        return allPosts;
    }

    function getCreatorPosts(address creator) external view returns (address[] memory) {
        return creatorToPosts[creator];
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
