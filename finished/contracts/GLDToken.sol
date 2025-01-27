// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GLDToken is ERC20 {
    constructor(address account, uint256 initialSupply) ERC20("Gold", "GLD") {
        _mint(account, initialSupply);
    }
}
