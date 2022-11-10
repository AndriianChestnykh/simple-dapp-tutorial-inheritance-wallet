pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract Wallet {
    uint256 private constant CHAIN_ID = 31337; // for Hardhat local test net. Change it to suit your network.

    string private constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
    string private constant INHERITANCE_MESSAGE_TYPE =
        "InheritanceMessage(uint256 ownerID,address ownerAddress)";

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
    uint256 public gracePeriodBlocks;
    uint256 public ownerID;
    uint256 public heirID;
    uint256 public pendingOwnerID;
    address public pendingController;
    uint256 public pendingOwnerCommitBlock;

    struct InheritanceMessage {
        uint256 ownerID;
        address ownerAddress;
    }

    constructor(
        address _controler,
        uint256 _gracePeriodBlocks,
        uint256 _ownerID,
        uint256 _heirID
    ) payable {
        controller = payable(_controler);
        gracePeriodBlocks = _gracePeriodBlocks;
        ownerID = _ownerID;
        heirID = _heirID;
    }

    function changeControllerInstantly(
        address newController,
        uint256 id
    ) public {
        require(id == ownerID, "You are not the owner");
        controller = payable(newController);
    }

    event OwnershipTransferInitiated(
        uint256 indexed oldOwnerID,
        uint256 newOwnerID,
        address newController
    );

    function initControllerChange(
        address _newController,
        uint256 _newOwnerID,
        InheritanceMessage memory _im,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) public {
        require(
            ownerID == _im.ownerID,
            "The inheritance message is not from the owner"
        );
        require(
            address(this) == _im.ownerAddress,
            "The inheritance message is not for this wallet contract"
        );
        require(
            ecrecover(hashInheritanceMessage(_im), sigV, sigR, sigS) ==
                controller,
            "The inheritance message is not signed by the controller"
        );
        console.log(_im.ownerID, _im.ownerAddress);

        pendingController = _newController;
        pendingOwnerID = _newOwnerID;
        pendingOwnerCommitBlock = block.number;

        emit OwnershipTransferInitiated(ownerID, _newOwnerID, _newController);
    }

    function hashInheritanceMessage(
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
                            _msg.ownerID,
                            _msg.ownerAddress
                        )
                    )
                )
            );
    }

    function finalizeControllerChange() public {
        require(pendingOwnerID != 0, "No pending owner is waiting");
        require(
            block.number >= pendingOwnerCommitBlock + gracePeriodBlocks,
            "Grace period has not passed"
        );
        controller = payable(pendingController);
        ownerID = pendingOwnerID;
    }

    function cancelControllerChange(uint256 id) public {
        require(id == ownerID, "You are not the owner");

        pendingController = address(0);
        pendingOwnerID = 0;
        pendingOwnerCommitBlock = 0;
    }

    function transfer(address payable _to, uint256 _amount) public {
        require(msg.sender == controller, "You are not the controller");
        _to.transfer(_amount);
    }
}
