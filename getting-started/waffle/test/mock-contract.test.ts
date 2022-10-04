import {expect, use} from 'chai';
import {Wallet} from 'ethers';
import {solidity, deployContract} from 'ethereum-waffle';
import {OptimismProvider} from '@ethereum-waffle/optimism';
import { MockContract__factory, MockContract } from '../build/types';

use(solidity);

describe('Optimism', () => {
  const provider = new OptimismProvider('https://goerli.optimism.io');
  let wallet: Wallet;
  let contract: MockContract;

  before(async () => {
    wallet = Wallet.fromMnemonic('insert your mnemonic here').connect(provider)
  });

  beforeEach(async () => {
    contract = await deployContract(wallet, MockContract__factory, []);
  });

  it('Emits One', async () => {
    await expect(contract.doEmitOne()).to.emit(contract, 'One').withArgs(1);
  });

  it('Reverts', async () => {
    await expect(contract.doRevert()).to.be.revertedWith('Revert cause');
  });
});