// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Wallet {
    uint256 private constant CHAIN_ID = 31337; // for Hardhat local test net. Change it to suit your network.

    string private constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
    string private constant INHERITANCE_MESSAGE_TYPE =
        "InheritanceMessage(address heirAddress)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));
    bytes32 private constant INHERITANCE_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(INHERITANCE_MESSAGE_TYPE));

    bytes32 private domainSeparator =
        keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256("InheritanceMessage"), // string name
                keccak256("1"), // string version
                CHAIN_ID, // uint256 chainId
                address(this) // address verifyingContract
            )
        );

    address payable public controller;
    uint256 private _gracePeriodBlocks;
    address public pendingController;
    uint256 public pendingControllerCommitBlock;

    struct InheritanceMessage {
        address heirAddress;
    }

    event ControllerTransferInitiated(address indexed newController);

    event ControllerTransferFinalized(address indexed newController);

    constructor(address controler, uint256 gracePeriodBlocks) payable {
        controller = payable(controler);
        _gracePeriodBlocks = gracePeriodBlocks;
    }

    function changeControllerInstantly(address newController) public {
        controller = payable(newController);
    }

    function initControllerChange(
        address newController,
        InheritanceMessage memory im,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) public {
        require(
            msg.sender == im.heirAddress,
            "Only the heir can initiate a controller change"
        );
        require(
            ecrecover(_hashInheritanceMessage(im), sigV, sigR, sigS) ==
                controller,
            "The inheritance message is not signed by the controller"
        );

        pendingController = newController;
        pendingControllerCommitBlock = block.number;

        emit ControllerTransferInitiated(newController);
    }

    function finalizeControllerChange() public {
        require(
            pendingController != address(0),
            "No pending controller is waiting"
        );
        require(
            block.number >= pendingControllerCommitBlock + _gracePeriodBlocks,
            "Grace period has not passed yet"
        );
        controller = payable(pendingController);

        emit ControllerTransferFinalized(pendingController);
    }

    function cancelControllerChange() public {
        pendingController = address(0);
        pendingControllerCommitBlock = 0;
    }

    function send(address payable to, uint256 amount) public {
        require(msg.sender == controller, "Controller check failed");
        to.transfer(amount);
    }

    function transferERC20(
        address erc20contract,
        address to,
        uint256 amount
    ) public {
        require(msg.sender == controller, "Controller check failed");
        IERC20(erc20contract).transfer(to, amount);
    }

    function transferERC721(
        address erc721contract,
        address to,
        uint256 tokenId
    ) public {
        require(msg.sender == controller, "Controller check failed");
        IERC721(erc721contract).transferFrom(address(this), to, tokenId);
    }

    function _hashInheritanceMessage(
        InheritanceMessage memory _msg
    ) private view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    domainSeparator,
                    keccak256(
                        abi.encode(
                            INHERITANCE_MESSAGE_TYPEHASH,
                            _msg.heirAddress
                        )
                    )
                )
            );
    }
}
