pragma solidity ^0.8.17;

import "hardhat/console.sol";

//interface IVerifier {
//    function verifyProof(
//        uint[2] memory a,
//        uint[2][2] memory b,
//        uint[2] memory c,
//        uint[1] memory input
//    ) external view returns (bool r);
//}

contract Wallet {
    address payable public controller;
    uint256 public gracePeriodBlocks;
    //    IVerifier public ownerAuthVerifier;
    //    IVerifier public heirAuthVerifier;
    uint256 public ownerID;
    uint256 public heirID;
    uint256 public pendingOwnerID;
    address public pendingController;
    uint256 public pendingOwnerStartBlock;

    constructor(
    //        address _ownerAuthVerifier,
    //        address _heirAuthVerifier,
        address _controler,
        uint256 _gracePeriodBlocks,
        uint256 _ownerID,
        uint256 _heirID
    ) payable {
        //        ownerAuthVerifier = IVerifier(_ownerAuthVerifier);
        //        heirAuthVerifier = IVerifier(_heirAuthVerifier);
        controller = payable(_controler);
        gracePeriodBlocks = _gracePeriodBlocks;
        ownerID = _ownerID;
        heirID = _heirID;
    }

    function changeControllerInstantly(
        address newController,
        uint256 id,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) public {
        uint256[1] memory input = [id];
        require(id == ownerID, "You are not the owner");
        //        require(
        //            ownerAuthVerifier.verifyProof(a, b, c, input),
        //            "Invalid owner proof"
        //        );

        controller = payable(newController);
    }

    struct InheritanceMessage {
        uint256 ownerID;
        address ownerAddress;
    }

    uint256 constant chainId = 31337;  // for Hardhat local test net. Change it to suit your network.

    string private constant EIP712_DOMAIN  = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
    string private constant INHERITANCE_MESSAGE_TYPE = "InheritanceMessage(uint256 ownerID,address ownerAddress)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(abi.encodePacked(EIP712_DOMAIN));
    bytes32 private constant INHERITANCE_MESSAGE_TYPEHASH = keccak256(abi.encodePacked(INHERITANCE_MESSAGE_TYPE));

    bytes32 private DOMAIN_SEPARATOR = keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            keccak256("InheritanceMessage"),  // string name
            keccak256("1"),  // string version
            chainId,  // uint256 chainId
            address(this)  // address verifyingContract
        ));

    function hashInheritanceMessage(InheritanceMessage memory _msg) private view returns (bytes32) {
        return keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(
                    INHERITANCE_MESSAGE_TYPEHASH,
                    _msg.ownerID,
                    _msg.ownerAddress
                ))
            ));
    }

    event OwnershipTransferInitiated(uint256 indexed oldOwnerID, uint256 newOwnerID, address newController);

    function initControllerChange(
        address _newController,
        uint256 _newOwnerID,
        InheritanceMessage memory _im,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) public {
        require(ownerID == _im.ownerID, "The inheritance message is not from the owner");
        require(address(this) == _im.ownerAddress, "The inheritance message is not for this wallet contract");
        require(
            ecrecover(hashInheritanceMessage(_im), sigV, sigR, sigS) == controller,
            "The inheritance message is not signed by the controller"
        );
        console.log(_im.ownerID, _im.ownerAddress);

        pendingController = _newController;
        pendingOwnerID = _newOwnerID;
        pendingOwnerStartBlock = block.number;

        emit OwnershipTransferInitiated(ownerID, _newOwnerID, _newController);
    }

    function finalizeControllerChange() public {
        require(pendingOwnerID != 0, "No pending owner is waiting");
        require(
            block.number >= pendingOwnerStartBlock + gracePeriodBlocks,
            "Grace period has not passed"
        );
        controller = payable(pendingController);
        ownerID = pendingOwnerID;
    }

    function cancelControllerChange(
        uint256 id,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) public {
        //        uint256[1] memory input = [id];
        require(id == ownerID, "You are not the owner");
        //        require(
        //            ownerAuthVerifier.verifyProof(a, b, c, input),
        //            "Invalid owner proof"
        //        );

        pendingController = address(0);
        pendingOwnerID = 0;
        pendingOwnerStartBlock = 0;
    }

    function transfer(address payable _to, uint256 _amount) public {
        require(msg.sender == controller, "You are not the controller");
        _to.transfer(_amount);
    }
}
