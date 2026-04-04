// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PostCoin is ERC20 {
    address public creator;
    bytes32 public contentHash;
    IERC20 public usdc;
    address public treasury;

    uint256 public constant CURVE_FACTOR = 1e18;
    uint256 public constant FEE_BPS = 200; // 2%
    uint256 public constant CREATOR_FEE_BPS = 150; // 1.5%
    uint256 public constant TREASURY_FEE_BPS = 50; // 0.5%
    uint256 public constant BPS = 10000;

    event Trade(
        address indexed trader,
        string tradeType,
        uint256 usdcAmount,
        uint256 tokenAmount,
        uint256 newPrice
    );

    constructor(
        address _creator,
        bytes32 _contentHash,
        address _usdc,
        address _treasury,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        creator = _creator;
        contentHash = _contentHash;
        usdc = IERC20(_usdc);
        treasury = _treasury;
    }

    /// @notice Current price based on bonding curve: price = totalSupply^2 / CURVE_FACTOR
    function getPrice() public view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 1; // base price 1 wei USDC
        return (supply * supply) / CURVE_FACTOR;
    }

    /// @notice Market cap = price * totalSupply
    function getMarketCap() public view returns (uint256) {
        return getPrice() * totalSupply() / 1e18;
    }

    /// @notice How many tokens you get for a given USDC amount
    function getBuyQuote(uint256 usdcAmount) public view returns (uint256 tokensOut) {
        uint256 usdcAfterFee = usdcAmount * (BPS - FEE_BPS) / BPS;
        uint256 supply = totalSupply();

        // Integrate curve: tokens = sqrt(supply^2 + usdcAfterFee * CURVE_FACTOR) - supply
        uint256 sumSq = supply * supply + usdcAfterFee * CURVE_FACTOR;
        tokensOut = _sqrt(sumSq) - supply;
    }

    /// @notice How much USDC you get for selling tokens
    function getSellQuote(uint256 tokenAmount) public view returns (uint256 usdcOut) {
        uint256 supply = totalSupply();
        require(tokenAmount <= supply, "Exceeds supply");

        uint256 newSupply = supply - tokenAmount;
        uint256 usdcBeforeFee = (supply * supply - newSupply * newSupply) / CURVE_FACTOR;
        usdcOut = usdcBeforeFee * (BPS - FEE_BPS) / BPS;
    }

    /// @notice Buy tokens with USDC
    function buy(uint256 usdcAmount) external {
        require(usdcAmount > 0, "Zero amount");

        uint256 tokensOut = getBuyQuote(usdcAmount);
        require(tokensOut > 0, "Too small");

        // Transfer USDC from buyer
        usdc.transferFrom(msg.sender, address(this), usdcAmount);

        // Split fees
        uint256 creatorFee = usdcAmount * CREATOR_FEE_BPS / BPS;
        uint256 treasuryFee = usdcAmount * TREASURY_FEE_BPS / BPS;
        usdc.transfer(creator, creatorFee);
        usdc.transfer(treasury, treasuryFee);

        // Mint tokens to buyer
        _mint(msg.sender, tokensOut);

        emit Trade(msg.sender, "buy", usdcAmount, tokensOut, getPrice());
    }

    /// @notice Sell tokens for USDC
    function sell(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Zero amount");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient balance");

        uint256 usdcOut = getSellQuote(tokenAmount);
        require(usdcOut > 0, "Too small");

        // Burn tokens
        _burn(msg.sender, tokenAmount);

        // Split fees
        uint256 creatorFee = usdcOut * CREATOR_FEE_BPS / BPS;
        uint256 treasuryFee = usdcOut * TREASURY_FEE_BPS / BPS;
        uint256 usdcToSeller = usdcOut - creatorFee - treasuryFee;

        usdc.transfer(creator, creatorFee);
        usdc.transfer(treasury, treasuryFee);
        usdc.transfer(msg.sender, usdcToSeller);

        emit Trade(msg.sender, "sell", usdcOut, tokenAmount, getPrice());
    }

    /// @dev Integer square root (Babylonian method)
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
