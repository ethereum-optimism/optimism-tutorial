pragma solidity >=0.6.0 <0.8.0;

import { L2ERC20 } from "./L2ERC20.sol";
import { ERC20 } from "./ERC20.sol";
import { iAbs_BaseCrossDomainMessenger } from "@eth-optimism/contracts/build/contracts/iOVM/bridge/messenging/iAbs_BaseCrossDomainMessenger.sol";

contract L1ERC20Deposit {

    event Deposit(address indexed account, uint256 amount);

    address l2ERC20Address;
    ERC20 l1ERC20;
    iAbs_BaseCrossDomainMessenger internal messenger;

    constructor (
        address _L1ERC20Address,
        address _L2ERC20Address,
        address _messenger
    ) public {
        l1ERC20 = ERC20(_L1ERC20Address);
        l2ERC20Address = _L2ERC20Address;
        messenger = iAbs_BaseCrossDomainMessenger(_messenger);
    }

    function deposit(
        uint256 _amount
    ) public {
        l1ERC20.transferFrom(
            msg.sender,
            address(this),
            _amount
        );

        // Generate encoded calldata to be executed on L2.
        bytes memory message = abi.encodeWithSignature(
            "mint(address,uint256)",
            msg.sender,
            _amount
        );
        messenger.sendMessage(l2ERC20Address, message, 5000000); //TODO: meter this, find a lower-bounded value
        emit Deposit(msg.sender, _amount);
    }

    function withdraw(
        address _withdrawer,
        uint256 _amount
    ) public {
        require(l2ERC20Address == messenger.xDomainMessageSender());
        require(msg.sender == address(messenger), "Only messages relayed by the L1CrossDomainMessenger can withdraw");
        l1ERC20.transfer(_withdrawer, _amount);
    }
}