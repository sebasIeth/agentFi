// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentFiVaultV2
 * @notice Tuned virtual AMM — small reserves so micro-buys move the price.
 *         $0.01 USDC buy = ~1% price impact.
 */
contract AgentFiVaultV2 is ReentrancyGuard {
    IERC20 public usdc;
    address public treasury;
    address public backend;

    uint256 public constant CREATOR_ALLOC = 100e18;            // 100 tokens to creator
    uint256 public constant INITIAL_TOKEN_RESERVE = 10000e18;  // 10k virtual tokens
    uint256 public constant INITIAL_USDC_RESERVE = 1e6;        // 1 USDC virtual ($0.0001/token)
    uint256 public constant FEE_BPS = 200;
    uint256 public constant CREATOR_FEE_BPS = 150;
    uint256 public constant PROTOCOL_FEE_BPS = 50;
    uint256 public constant BPS = 10000;

    struct Pool {
        address creator;
        uint256 totalSupply;
        uint256 virtualUsdcReserve;
        uint256 virtualTokenReserve;
        uint256 realUsdcBalance;
        bool active;
    }

    mapping(bytes32 => Pool) public pools;
    mapping(bytes32 => mapping(address => uint256)) public balanceOf;
    mapping(bytes32 => uint256) public holderCount;
    mapping(bytes32 => mapping(address => bool)) private _isHolder;
    bytes32[] public allPools;

    event PoolCreated(bytes32 indexed postId, address indexed creator);
    event Trade(bytes32 indexed postId, address indexed trader, bool isBuy, uint256 usdcAmount, uint256 tokenAmount, uint256 newPrice);

    modifier onlyBackend() { require(msg.sender == backend, "Only backend"); _; }

    constructor(address _usdc, address _treasury, address _backend) {
        usdc = IERC20(_usdc);
        treasury = _treasury;
        backend = _backend;
    }

    function createPool(bytes32 postId, address creator) external onlyBackend {
        require(!pools[postId].active, "Pool exists");
        require(creator != address(0), "Invalid creator");

        pools[postId] = Pool({
            creator: creator,
            totalSupply: CREATOR_ALLOC,
            virtualUsdcReserve: INITIAL_USDC_RESERVE,
            virtualTokenReserve: INITIAL_TOKEN_RESERVE,
            realUsdcBalance: 0,
            active: true
        });

        balanceOf[postId][creator] = CREATOR_ALLOC;
        _trackHolder(postId, creator);
        allPools.push(postId);
        emit PoolCreated(postId, creator);
    }

    function buy(bytes32 postId, uint256 usdcAmount, uint256 minTokensOut) external nonReentrant {
        Pool storage pool = pools[postId];
        require(pool.active, "Pool not active");
        require(usdcAmount > 0, "Zero amount");

        uint256 creatorFee = usdcAmount * CREATOR_FEE_BPS / BPS;
        uint256 protocolFee = usdcAmount * PROTOCOL_FEE_BPS / BPS;
        uint256 usdcAfterFee = usdcAmount - creatorFee - protocolFee;

        uint256 tokensOut = (pool.virtualTokenReserve * usdcAfterFee) / (pool.virtualUsdcReserve + usdcAfterFee);
        require(tokensOut > 0, "Too small");
        require(tokensOut >= minTokensOut, "Slippage exceeded");
        require(tokensOut <= pool.virtualTokenReserve / 2, "Buy too large");

        usdc.transferFrom(msg.sender, address(this), usdcAmount);
        usdc.transfer(pool.creator, creatorFee);
        usdc.transfer(treasury, protocolFee);

        pool.virtualUsdcReserve += usdcAfterFee;
        pool.virtualTokenReserve -= tokensOut;
        pool.totalSupply += tokensOut;
        pool.realUsdcBalance += usdcAfterFee;

        balanceOf[postId][msg.sender] += tokensOut;
        _trackHolder(postId, msg.sender);

        emit Trade(postId, msg.sender, true, usdcAmount, tokensOut, getPrice(postId));
    }

    function sell(bytes32 postId, uint256 tokenAmount, uint256 minUsdcOut) external nonReentrant {
        Pool storage pool = pools[postId];
        require(pool.active, "Pool not active");
        require(tokenAmount > 0, "Zero amount");
        require(balanceOf[postId][msg.sender] >= tokenAmount, "Insufficient balance");

        uint256 usdcBeforeFee = (pool.virtualUsdcReserve * tokenAmount) / (pool.virtualTokenReserve + tokenAmount);
        require(usdcBeforeFee > 0, "Too small");
        require(usdcBeforeFee <= pool.realUsdcBalance, "Insufficient liquidity");

        uint256 creatorFee = usdcBeforeFee * CREATOR_FEE_BPS / BPS;
        uint256 protocolFee = usdcBeforeFee * PROTOCOL_FEE_BPS / BPS;
        uint256 usdcAfterFee = usdcBeforeFee - creatorFee - protocolFee;
        require(usdcAfterFee >= minUsdcOut, "Slippage exceeded");

        balanceOf[postId][msg.sender] -= tokenAmount;

        pool.virtualUsdcReserve -= usdcBeforeFee;
        pool.virtualTokenReserve += tokenAmount;
        pool.totalSupply -= tokenAmount;
        pool.realUsdcBalance -= usdcBeforeFee;

        usdc.transfer(msg.sender, usdcAfterFee);
        usdc.transfer(pool.creator, creatorFee);
        usdc.transfer(treasury, protocolFee);

        emit Trade(postId, msg.sender, false, usdcAfterFee, tokenAmount, getPrice(postId));
    }

    function getPrice(bytes32 postId) public view returns (uint256) {
        Pool storage pool = pools[postId];
        if (!pool.active) return 0;
        return (pool.virtualUsdcReserve * 1e18) / pool.virtualTokenReserve;
    }

    function getMarketCap(bytes32 postId) public view returns (uint256) {
        Pool storage pool = pools[postId];
        if (!pool.active) return 0;
        return (getPrice(postId) * pool.totalSupply) / 1e18;
    }

    function getBuyQuote(bytes32 postId, uint256 usdcAmount) external view returns (uint256) {
        Pool storage pool = pools[postId];
        if (!pool.active) return 0;
        uint256 usdcAfterFee = usdcAmount * (BPS - FEE_BPS) / BPS;
        return (pool.virtualTokenReserve * usdcAfterFee) / (pool.virtualUsdcReserve + usdcAfterFee);
    }

    function getSellQuote(bytes32 postId, uint256 tokenAmount) external view returns (uint256) {
        Pool storage pool = pools[postId];
        if (!pool.active) return 0;
        uint256 usdcBeforeFee = (pool.virtualUsdcReserve * tokenAmount) / (pool.virtualTokenReserve + tokenAmount);
        return usdcBeforeFee * (BPS - FEE_BPS) / BPS;
    }

    function getPool(bytes32 postId) external view returns (Pool memory) { return pools[postId]; }
    function getPoolCount() external view returns (uint256) { return allPools.length; }
    function setBackend(address _backend) external onlyBackend { backend = _backend; }
    function setTreasury(address _treasury) external onlyBackend { treasury = _treasury; }

    function _trackHolder(bytes32 postId, address user) internal {
        if (!_isHolder[postId][user]) {
            _isHolder[postId][user] = true;
            holderCount[postId]++;
        }
    }
}
