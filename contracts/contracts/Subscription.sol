//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract APISubscription {
    address public admin;
    IERC20 public watchToken;
    uint256 public pricePerCredit;
    mapping (address => uint256) public subscriptionCredits;

    event CreditsPurchased(address indexed subscriber, uint256 amount, uint256 pricePerCredit);
    event CreditsConsumed(address indexed subscriber, uint256 amount);
    
    constructor(address _token, uint256 _pricePerCredit) {
        admin = msg.sender;
        watchToken = IERC20(_token);
        pricePerCredit = _pricePerCredit;
    }

    modifier onlyAdmin {
        require(msg.sender == admin, "Not Permitted");
        _;
    }

    function purchaseCredits(uint256 _amount) external {
        uint256 totalCost = _amount * pricePerCredit;
        require(watchToken.balanceOf(msg.sender) >= totalCost, "Insufficient balance");
        require(watchToken.allowance(msg.sender, address(this)) >= totalCost, "Insufficient allowance");

        watchToken.transferFrom(msg.sender, address(this), totalCost);
        subscriptionCredits[msg.sender] += _amount;

        emit CreditsPurchased(msg.sender, _amount, pricePerCredit);
    }

    function deductCredits(address subscriber, uint256 amount) external onlyAdmin {
        require(subscriptionCredits[subscriber] > amount, "Insufficient credits");
        subscriptionCredits[subscriber] -= amount;

        emit CreditsConsumed(subscriber, amount);
    }

    function withdrawTokens(address _to, uint256 _amount) external onlyAdmin {
        watchToken.transfer(_to, _amount);
    }

    function setPricePerCredit(uint256 _newPrice) external onlyAdmin {
        pricePerCredit = _newPrice;
    }
}