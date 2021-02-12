import { Provider } from '@ethersproject/providers'
import { Wallet, ContractFactory, Contract } from 'ethers'

import * as ERC20 from '../artifacts/contracts/ERC20.sol/ERC20.json'
import * as ABI__OVM_L1ERC20Gateway from '@eth-optimism/contracts/build/artifacts/contracts/optimistic-ethereum/OVM/bridge/ERC20/OVM_L1ERC20Gateway.sol/OVM_L1ERC20Gateway.json'
import * as ABI__OVM_L2ERC20Gateway from '@eth-optimism/contracts/build/artifacts/contracts/optimistic-ethereum/OVM/bridge/ERC20/OVM_L2ERC20Gateway.sol/OVM_L2ERC20Gateway.ovm.json'

export type ConfiguredGateway = {
    L1_ERC20: Contract
    OVM_L1ERC20Gateway: Contract
    OVM_L2ERC20Gateway: Contract
}

export type ERC20Config = {
    name: string
    ticker: string
    decimals: number
    initialSupply: number
}

export const defaultERC20Config: ERC20Config = {
    name: 'REEERC20',
    ticker: 'REE',
    decimals: 18,
    initialSupply: 1000
}

export const getDeployedERC20Config = async(
    provider: Provider,
    erc20: Contract
): Promise<ERC20Config> => {
    // TODO: actually grab from the contract's fields
    return defaultERC20Config
}

export const deployNewGateway = async (
    l1Wallet: Wallet,
    l2Wallet: Wallet,
    l1ERC20: Contract,
    l1MessengerAddress: string,
    l2MessengerAddress: string,
): Promise<{
    OVM_L1ERC20Gateway: Contract,
    OVM_L2ERC20Gateway: Contract,
}> => {
    let OVM_L1ERC20Gateway
    let OVM_L2ERC20Gateway

    const ERC20Config: ERC20Config = await getDeployedERC20Config(l1Wallet.provider, l1ERC20)

    // Deploy L2 ERC20 Gateway
    const Factory__OVM_L2ERC20Gateway = new ContractFactory(ABI__OVM_L2ERC20Gateway.abi, ABI__OVM_L2ERC20Gateway.bytecode, l2Wallet)
    OVM_L2ERC20Gateway = await Factory__OVM_L2ERC20Gateway.deploy(
        l2MessengerAddress,
        ERC20Config.decimals,
        'OVM_' + ERC20Config.name,
        'ovm' + ERC20Config.ticker
    )
    await OVM_L2ERC20Gateway.deployTransaction.wait()
    console.log('L2_WETH deployed to:', OVM_L2ERC20Gateway.address)

    // Deploy L1 ERC20 Gateway
    const Factory__OVM_L1ERC20Gateway = new ContractFactory(ABI__OVM_L1ERC20Gateway.abi, ABI__OVM_L1ERC20Gateway.bytecode, l1Wallet)
    OVM_L1ERC20Gateway = await Factory__OVM_L1ERC20Gateway.deploy(
        l1ERC20.address,
        OVM_L2ERC20Gateway.address,
        l1MessengerAddress
    )
    await OVM_L1ERC20Gateway.deployTransaction.wait()
    console.log('OVM_L1ERC20Gateway deployed to:', OVM_L1ERC20Gateway.address)

    // Init L2 ERC20 Gateway
    console.log('Connecting L2 WETH with L1 Deposit contract...')
    const initTx = await OVM_L2ERC20Gateway.init(OVM_L1ERC20Gateway.address)
    await initTx.wait()

    return {
        OVM_L1ERC20Gateway,
        OVM_L2ERC20Gateway
    }
}

export const setupOrRetrieveGateway = async (
    l1Wallet: Wallet,
    l2Wallet: Wallet,
    l1ERC20Address?: string,
    l1ERC20GatewayAddress?: string,
    l1MessengerAddress?: string,
    l2MessengerAddress?: string,
    ERC20Config: ERC20Config = defaultERC20Config,
): Promise<ConfiguredGateway> => {
    // Deploy or retrieve L1 ERC20
    let L1_ERC20: Contract
    if (
        !l1ERC20Address
    ) {
        console.log('No L1 ERC20 specified--deploying a new test ERC20 on L1.')
        const L1ERC20Factory = new ContractFactory(ERC20.abi, ERC20.bytecode, l1Wallet)
        L1_ERC20 = await L1ERC20Factory.deploy(ERC20Config.initialSupply, ERC20Config.name, ERC20Config.decimals)
        console.log('New L1_ERC20 deployed to:', L1_ERC20.address)
        l1ERC20Address = L1_ERC20.address
    } else {
        console.log('Connecting to existing L1 ERC20 at:', l1ERC20Address)
        L1_ERC20 = new Contract(l1ERC20Address, ERC20.abi, l1Wallet)
    }

    let OVM_L1ERC20Gateway: Contract
    let OVM_L2ERC20Gateway: Contract
    if (!l1ERC20GatewayAddress) {
        console.log('No gateway contract specified, deploying a new one...')
        const newGateway = await deployNewGateway(l1Wallet, l2Wallet, L1_ERC20, l1MessengerAddress, l2MessengerAddress)
        OVM_L1ERC20Gateway = newGateway.OVM_L1ERC20Gateway
        OVM_L2ERC20Gateway = newGateway.OVM_L2ERC20Gateway
    } else {
        OVM_L1ERC20Gateway = new Contract(l1ERC20GatewayAddress, ABI__OVM_L1ERC20Gateway.abi, l1Wallet)
        const l2ERC20GatewayAddress = await OVM_L1ERC20Gateway.l2ERC20Gateway()
        OVM_L2ERC20Gateway = new Contract(l2ERC20GatewayAddress, ABI__OVM_L2ERC20Gateway.abi, l2Wallet)
    }

    console.log('Completed getting full ERC20 gateway.')
    return {
        L1_ERC20,
        OVM_L1ERC20Gateway,
        OVM_L2ERC20Gateway
    }
}