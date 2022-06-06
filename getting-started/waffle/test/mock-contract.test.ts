import {expect, use} from 'chai';
import {Wallet} from 'ethers';
import {solidity, deployContract} from 'ethereum-waffle';
import {OptimismProvider} from '@ethereum-waffle/optimism';
import { MockContract__factory, MockContract } from '../build/types';

use(solidity);

describe('Optimism', () => {
  const provider = new OptimismProvider('http://localhost:8545');
  let wallet: Wallet;
  let contract: MockContract;

  before(async () => {
    const wallets = provider.getWallets();
    wallet = wallets[0];
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