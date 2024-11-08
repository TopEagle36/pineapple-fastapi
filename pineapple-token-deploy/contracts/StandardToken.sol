// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import {ERC20} from './library/ERC20.sol';

import {Ownable} from './library/Ownable.sol';

contract StandardToken is ERC20, Ownable {

    uint8 private _decimals;
    uint256 private _totalSupply;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_
    ) payable ERC20(name_, symbol_) Ownable(msg.sender) {
        _decimals = decimals_;
        _totalSupply = totalSupply_;
        _mint(msg.sender, totalSupply_);
    }
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }
    receive() external payable {}
}