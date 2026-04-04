// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentFiVault
 * @notice Single contract that manages all post tokens via virtual AMM pools.
 *         No separate ERC-20 per post — balances tracked internally.
 *         Pricing is fully onchain and deterministic.
 *
 * Model:
 *   - Each post has a virtual pool with: supply, virtualUsdcReserve, virtualTokenReserve
 *   - Price follows constant-product formula: price = usdcReserve / tokenReserve
 *   - Starts at ~$0.001 per token, rises as people buy
 *   - Creator gets CREATOR_ALLOC tokens free at pool creation
 *   - 2% fee on every trade: 1.5% to creator, 0.5% to protocol
 *   - Slippage protection on every buy/sell
 */
contract AgentFiVault is ReentrancyGuard {
    IERC20 public usdc;
    address public treasury;
    address public backend;

    uint256 public constant CREATOR_ALLOC = 1000e18;       // 1000 tokens to creator
    uint256 public constant INITIAL_TOKEN_RESERVE = 100000e18; // 100k virtual tokens
    uint256 public constant INITIAL_USDC_RESERVE = 100e6;  // 100 USDC virtual ($0.001/token)
    uint256 public constant FEE_BPS = 200;                 // 2% total
    uint256 public constant CREATOR_FEE_BPS = 150;         // 1.5% to creator
    uint256 public constant PROTOCOL_FEE_BPS = 50;         // 0.5% to protocol
    uint256 public constant BPS = 10000;

    struct Pool {
        address creator;
        uint256 totalSupply;          // actual tokens minted (excluding virtual)
        uint256 virtualUsdcReserve;   // virtual USDC in pool
        uint256 virtualTokenReserve;  // virtual tokens in pool
        uint256 realUsdcBalance;      // actual USDC deposited
        bool active;
    }

    // postId (bytes32) => Pool
    mapping(bytes32 => Pool) public pools;

    // postId => user => token balance
    mapping(bytes32 => mapping(address => uint256)) public balanceOf;

    // postId => holder count
    mapping(bytes32 => uint256) public holderCount;

    // postId => user => bool (has/had tokens)
    mapping(bytes32 => mapping(address => bool)) private _isHolder;

    bytes32[] public allPools;

    event PoolCreated(bytes32 indexed postId, address indexed creator);
    event Trade(
        bytes32 indexed postId,
        address indexed trader,
        bool isBuy,
        uint256 usdcAmount,
        uint256 tokenAmount,
        uint256 newPrice
    );

    modifier onlyBackend() {
        require(msg.sender == backend, "Only backend");
        _;
    }

    constructor(address _usdc, address _treasury, address _backend) {
        usdc = IERC20(_usdc);
        treasury = _treasury;
        backend = _backend;
    }

    /// @notice Create a new token pool for a post. Called by backend after post is saved.
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

        // Mint creator allocation
        balanceOf[postId][creator] = CREATOR_ALLOC;
        _trackHolder(postId, creator);

        allPools.push(postId);
        emit PoolCreated(postId, creator);
    }

    /// @notice Buy tokens with USDC
    /// @param postId The post to buy tokens for
    /// @param usdcAmount Amount of USDC to spend
    /// @param minTokensOut Minimum tokens to receive (slippage protection)
    function buy(bytes32 postId, uint256 usdcAmount, uint256 minTokensOut) external nonReentrant {
        Pool storage pool = pools[postId];
        require(pool.active, "Pool not active");
        require(usdcAmount > 0, "Zero amount");

        // Calculate fees
        uint256 creatorFee = usdcAmount * CREATOR_FEE_BPS / BPS;
        uint256 protocolFee = usdcAmount * PROTOCOL_FEE_BPS / BPS;
        uint256 usdcAfterFee = usdcAmount - creatorFee - protocolFee;

        // Calculate tokens out using constant product
        // dy = (y * dx) / (x + dx) where x = usdcReserve, y = tokenReserve
        uint256 tokensOut = (pool.virtualTokenReserve * usdcAfterFee) /
                           (pool.virtualUsdcReserve + usdcAfterFee);

        require(tokensOut > 0, "Too small");
        require(tokensOut >= minTokensOut, "Slippage exceeded");
        require(tokensOut <= pool.virtualTokenReserve / 2, "Buy too large");

        // Transfer USDC from buyer
        usdc.transferFrom(msg.sender, address(this), usdcAmount);

        // Pay fees
        usdc.transfer(pool.creator, creatorFee);
        usdc.transfer(treasury, protocolFee);

        // Update pool reserves
        pool.virtualUsdcReserve += usdcAfterFee;
        pool.virtualTokenReserve -= tokensOut;
        pool.totalSupply += tokensOut;
        pool.realUsdcBalance += usdcAfterFee;

        // Mint tokens to buyer
        balanceOf[postId][msg.sender] += tokensOut;
        _trackHolder(postId, msg.sender);

        emit Trade(postId, msg.sender, true, usdcAmount, tokensOut, getPrice(postId));
    }

    /// @notice Sell tokens for USDC
    /// @param postId The post to sell tokens for
    /// @param tokenAmount Amount of tokens to sell
    /// @param minUsdcOut Minimum USDC to receive (slippage protection)
    function sell(bytes32 postId, uint256 tokenAmount, uint256 minUsdcOut) external nonReentrant {
        Pool storage pool = pools[postId];
        require(pool.active, "Pool not active");
        require(tokenAmount > 0, "Zero amount");
        require(balanceOf[postId][msg.sender] >= tokenAmount, "Insufficient balance");

        // Calculate USDC out using constant product
        // dx = (x * dy) / (y + dy) where x = usdcReserve, y = tokenReserve
        uint256 usdcBeforeFee = (pool.virtualUsdcReserve * tokenAmount) /
                                (pool.virtualTokenReserve + tokenAmount);

        require(usdcBeforeFee > 0, "Too small");
        require(usdcBeforeFee <= pool.realUsdcBalance, "Insufficient liquidity");

        // Calculate fees
        uint256 creatorFee = usdcBeforeFee * CREATOR_FEE_BPS / BPS;
        uint256 protocolFee = usdcBeforeFee * PROTOCOL_FEE_BPS / BPS;
        uint256 usdcAfterFee = usdcBeforeFee - creatorFee - protocolFee;

        require(usdcAfterFee >= minUsdcOut, "Slippage exceeded");

        // Burn tokens
        balanceOf[postId][msg.sender] -= tokenAmount;

        // Update pool reserves
        pool.virtualUsdcReserve -= usdcBeforeFee;
        pool.virtualTokenReserve += tokenAmount;
        pool.totalSupply -= tokenAmount;
        pool.realUsdcBalance -= usdcBeforeFee;

        // Pay out
        usdc.transfer(msg.sender, usdcAfterFee);
        usdc.transfer(pool.creator, creatorFee);
        usdc.transfer(treasury, protocolFee);

        emit Trade(postId, msg.sender, false, usdcAfterFee, tokenAmount, getPrice(postId));
    }

    // ── View functions ──

    /// @notice Current price = usdcReserve / tokenReserve (in USDC 6 decimals per 1e18 tokens)
    function getPrice(bytes32 postId) public view returns (uint256) {
        Pool storage pool = pools[postId];
        if (!pool.active) return 0;
        // Price in USDC (6 dec) per token (18 dec)
        return (pool.virtualUsdcReserve * 1e18) / pool.virtualTokenReserve;
    }

    /// @notice Market cap = price * totalSupply
    function getMarketCap(bytes32 postId) public view returns (uint256) {
        Pool storage pool = pools[postId];
        if (!pool.active) return 0;
        return (getPrice(postId) * pool.totalSupply) / 1e18;
    }

    /// @notice Quote: how many tokens for X USDC
    function getBuyQuote(bytes32 postId, uint256 usdcAmount) external view returns (uint256) {
        Pool storage pool = pools[postId];
        if (!pool.active) return 0;
        uint256 usdcAfterFee = usdcAmount * (BPS - FEE_BPS) / BPS;
        return (pool.virtualTokenReserve * usdcAfterFee) / (pool.virtualUsdcReserve + usdcAfterFee);
    }

    /// @notice Quote: how much USDC for X tokens
    function getSellQuote(bytes32 postId, uint256 tokenAmount) external view returns (uint256) {
        Pool storage pool = pools[postId];
        if (!pool.active) return 0;
        uint256 usdcBeforeFee = (pool.virtualUsdcReserve * tokenAmount) / (pool.virtualTokenReserve + tokenAmount);
        return usdcBeforeFee * (BPS - FEE_BPS) / BPS;
    }

    function getPool(bytes32 postId) external view returns (Pool memory) {
        return pools[postId];
    }

    function getPoolCount() external view returns (uint256) {
        return allPools.length;
    }

    function setBackend(address _backend) external onlyBackend {
        backend = _backend;
    }

    function setTreasury(address _treasury) external onlyBackend {
        treasury = _treasury;
    }

    // ── Internal ──

    function _trackHolder(bytes32 postId, address user) internal {
        if (!_isHolder[postId][user]) {
            _isHolder[postId][user] = true;
            holderCount[postId]++;
        }
    }
}
