pragma solidity ^0.8.17;

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
    uint256 public gracePeriodBlocks;
    address public pendingController;
    uint256 public pendingControllerCommitBlock;

    struct InheritanceMessage {
        address heirAddress;
    }

    constructor(address _controler, uint256 _gracePeriodBlocks) payable {
        controller = payable(_controler);
        gracePeriodBlocks = _gracePeriodBlocks;
    }

    function changeControllerInstantly(
        address newController
    ) public {
        controller = payable(newController);
    }

    event ControllerTransferInitiated(address indexed newController);

    event ControllerTransferFinalized(address indexed newController);

    function initControllerChange(
        address _newController,
        InheritanceMessage memory _im,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) public {
        require(
            msg.sender == _im.heirAddress,
            "Only the heir can initiate a controller change"
        );
        require(
            ecrecover(hashInheritanceMessage(_im), sigV, sigR, sigS) ==
                controller,
            "The inheritance message is not signed by the controller"
        );

        pendingController = _newController;
        pendingControllerCommitBlock = block.number;

        emit ControllerTransferInitiated(_newController);
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
                            _msg.heirAddress
                        )
                    )
                )
            );
    }

    function finalizeControllerChange() public {
        require(pendingController != address(0), "No pending controller is waiting");
        require(
            block.number >= pendingControllerCommitBlock + gracePeriodBlocks,
            "Grace period has not passed"
        );
        controller = payable(pendingController);

        emit ControllerTransferFinalized(pendingController);
    }

    function cancelControllerChange() public {
        pendingController = address(0);
        pendingControllerCommitBlock = 0;
    }

    function send(address payable _to, uint256 _amount) public {
        require(msg.sender == controller, "You are not the controller");
        _to.transfer(_amount);
    }
}
