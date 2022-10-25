pragma solidity ^0.8.17;

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

    function initControllerChange(
        address newController,
        uint256 id,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) public {
        uint256[1] memory input = [id];
        require(id == heirID, "You are not the heir");
//        require(
//            heirAuthVerifier.verifyProof(a, b, c, input),
//            "Invalid heir proof"
//        );

        pendingController = newController;
        pendingOwnerID = id;
        pendingOwnerStartBlock = block.number;




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
