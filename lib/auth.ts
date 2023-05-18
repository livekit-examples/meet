import { RequestManager } from 'eth-connect'
import { createUnsafeIdentity } from '@dcl/crypto/dist/crypto'
import { FlatFetchInit, flatFetch } from '../lib/flat-fetch'
import { AuthChain, AuthIdentity, Authenticator } from "@dcl/crypto"

const ephemeralLifespanMinutes = 10_000

export type ExplorerIdentity = {
  // public address of the first elemement of the authChain
  address: string
  // is the address an ephemeral address? used to determine if the user is a guest
  isGuest: boolean
  // the authChain is the chain of signatures that prove the ownership of the address
  authChain: AuthIdentity
  // the signer function will be used to sign messages using the last element of the authChain
  signer: (message: string) => Promise<string>
}

export async function getUserAccount(requestManager: RequestManager, returnChecksum: boolean): Promise<string | undefined> {
    try {
        const accounts = await requestManager.eth_accounts()
        
        if (!accounts || accounts.length === 0) {
            return undefined
        }
        
        return returnChecksum ? accounts[0] : accounts[0].toLowerCase()
    } catch (error: any) {
        throw new Error(`Could not access eth_accounts: "${error.message}"`)
    }
}

// this function creates a Decentraland AuthChain using a provider (like metamask)
export async function loginUsingEthereumProvider(provider: any): Promise<ExplorerIdentity> {
    const requestManager = new RequestManager(provider)
    
    const address = await getUserAccount(requestManager, false)
    
    if (!address) throw new Error("Couldn't get an address from the Ethereum provider")
    
    async function signer(message: string): Promise<string> {
        while (true) {
            const result = await requestManager.personal_sign(message, address!, '')
            if (!result) continue
            return result
        }
    }
    
    return identityFromSigner(address, signer)
}
const AUTH_CHAIN_HEADER_PREFIX = 'x-identity-auth-chain-'
const AUTH_TIMESTAMP_HEADER = 'x-identity-timestamp'
const AUTH_METADATA_HEADER = 'x-identity-metadata'

export function getAuthChainSignature(
  method: string,
  path: string,
  metadata: string,
  chainProvider: (payload: string) => AuthChain
) {
  const timestamp = Date.now()
  const payloadParts = [method.toLowerCase(), path.toLowerCase(), timestamp.toString(), metadata]
  const payloadToSign = payloadParts.join(':').toLowerCase()
  const authChain = chainProvider(payloadToSign)

  return {
    authChain,
    metadata,
    timestamp
  }
}

export function getSignedHeaders(
  method: string,
  path: string,
  metadata: Record<string, any>,
  chainProvider: (payload: string) => AuthChain
) {
  const headers: Record<string, string> = {}
  const signature = getAuthChainSignature(method, path, JSON.stringify(metadata), chainProvider)
  signature.authChain.forEach((link, index) => {
    headers[`${AUTH_CHAIN_HEADER_PREFIX}${index}`] = JSON.stringify(link)
  })

  headers[AUTH_TIMESTAMP_HEADER] = signature.timestamp.toString()
  headers[AUTH_METADATA_HEADER] = signature.metadata
  return headers
}

export function signedFetch(
  url: string,
  identity: AuthIdentity,
  init?: FlatFetchInit,
  additionalMetadata: Record<string, any> = {}
) {
  const path = new URL(url).pathname

  const actualInit = {
    ...init,
    headers: {
      ...getSignedHeaders(
        init?.method ?? 'get',
        path,
        {
          origin: location.origin,
          ...additionalMetadata
        },
        (payload) => Authenticator.signPayload(identity, payload)
      ),
      ...init?.headers
    }
  } as FlatFetchInit

  return flatFetch(url, actualInit)
}

// this function creates a Decentraland AuthChain using a signer function.
// the signer function is only used once, to sign the ephemeral private key. after that,
// the ephemeral private key is used to sign the rest of the authChain and subsequent
// messages. this is a good way to not over-expose the real user accounts to excessive
// signing requests.
export async function identityFromSigner(address: string, signer: (message: string) => Promise<string>): Promise<ExplorerIdentity> {
    const ephemeral = createUnsafeIdentity()
    
    const authChain = await Authenticator.initializeAuthChain(address, ephemeral, ephemeralLifespanMinutes, signer)
    
    return {
        address,
        signer,
        authChain,
        isGuest: true
    }
}

