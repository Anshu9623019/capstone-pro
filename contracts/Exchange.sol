// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    uint256 public orderCount;
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) orders;

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(
        address token,
        address user,
        uint256 amount,
        uint256 balance
    );
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );

    struct _Order {
        // Attributes of an order
        uint256 id; // Unique identifier for order
        address user; // USer who made the order
        address tokenGet; // Addres of the token the receive
        uint256 amountGet; // Amount of the order they get
        address tokenGive; // address of the order they give
        uint256 amountGive; // Amount they give
        uint256 timestamp; // when the order created
    }

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Deposite Token
    function depositeToken(address _token, uint256 _amount) public {
        // Transfer tokens to exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));

        // Update user balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;

        // Emit an event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // Withdraw Token
    function withdrawToken(address _token, uint256 _amount) public {
        // Ensure user has enough tokens to withdraw
        require(tokens[_token][msg.sender] >= _amount);
        // Transfer tokens to user
        Token(_token).transfer(msg.sender, _amount);

        //Update user balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;

        // Emit an event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // Check Balance
    function balanceOf(
        address _token,
        address _user
    ) public view returns (uint256) {
        return tokens[_token][_user];
    }

    // ----- Make order Cancel Order

    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        // Token give (the token want to spend) - which token and how much?
        // token get (the token they want  to recieve) - which token, and how much?
        require(balanceOf(_tokenGive, msg.sender) >= _amountGive);
        orderCount = orderCount + 1;

        orders[orderCount] = _Order(
            orderCount, // id 1,2,3
            msg.sender, // user address
            _tokenGet, //tokenget
            _amountGet, // amountget
            _tokenGive, // tokenGive
            _amountGive, // amountgive
            block.timestamp // timestamp
        );

        //Emit event
        emit Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
    }
}
