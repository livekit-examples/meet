import { ethers } from 'ethers'
import { Authenticator, AuthIdentity } from '@dcl/crypto'
import { getConnectedProvider } from 'decentraland-dapps/dist/lib/eth'
import { Provider } from 'decentraland-dapps/dist/modules/wallet/types'

const ONE_MONTH_IN_MINUTES = 31 * 24 * 60

export async function getEth(): Promise<ethers.BrowserProvider> {
  const provider: Provider | null = await getConnectedProvider()

  if (!provider) {
    throw new Error('Could not get a valid connected Wallet')
  }

  return new ethers.BrowserProvider(provider)
}

export async function generateIdentity(address: string): Promise<AuthIdentity> {
  const eth: ethers.BrowserProvider = await getEth()
  const account = ethers.Wallet.createRandom()

  const payload = {
    address: account.address.toString(),
    publicKey: ethers.hexlify(account.publicKey),
    privateKey: ethers.hexlify(account.privateKey)
  }

  const signer = await eth.getSigner()

  return Authenticator.initializeAuthChain(address, payload, ONE_MONTH_IN_MINUTES, message => signer.signMessage(message))
}
