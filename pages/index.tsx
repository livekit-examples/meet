import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import styles from '../styles/Home.module.css';
import { useMetaMask } from "metamask-react";
import { hexToBytes, bytesToHex, RequestManager } from 'eth-connect'
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



interface TabsProps {children: ReactElement[];
  selectedIndex?: number;
  onTabSelected?: (index: number) => void;
}

function Tabs(props: TabsProps) {
  const activeIndex = props.selectedIndex ?? 0;
  if (!props.children) {
    return <></>;
  }

  let tabs = React.Children.map(props.children, (child, index) => {
    return (
      <button
        className="lk-button"
        onClick={() => {
          if (props.onTabSelected) props.onTabSelected(index);
        }}
        aria-pressed={activeIndex === index}
      >
        {child?.props.label}
      </button>
    );
  });
  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabSelect}>{tabs}</div>
      {props.children[activeIndex]}
    </div>
  );
}

function DemoMeetingTab({ label }: { label: string }) {
  const router = useRouter();
  const startMeeting = () => {
    router.push(`/rooms/${generateRoomId()}`);
  };
  return (
    <div className={styles.tabContent}>
      <p style={{ marginTop: 0 }}>Try LiveKit Meet for free with our live demo project.</p>
      <button className="lk-button" onClick={startMeeting}>
        Start Meeting
      </button>
    </div>
  );
}

async function livekitConnect(provider: any) {
    const identity = await loginUsingEthereumProvider(provider)
    const worldServer = 'https://worlds-content-server.decentraland.zone'
    const worldName = 'hugoarregui.dcl.eth'
    const aboutResponse = await flatFetch(`${worldServer}/world/${worldName}/about`, {
        responseBodyType: 'json'
    })
    const url = aboutResponse.json['comms']['fixedAdapter'].replace('signed-login:', '').replace('get-comms-adapter', 'meet-adapter')
    const response = await signedFetch(url, identity.authChain, {
        method: 'POST',
        responseBodyType: 'json'
    }, {
        'signer': 'dcl:explorer',
        'intent': 'dcl:explorer:comms-handshake'
    })

    const connStr = response.json['fixedAdapter']
    return new URL(connStr.replace('livekit:', ''))
}

export const getServerSideProps: GetServerSideProps<{ tabIndex: number }> = async ({
  query,
  res,
}) => {
  res.setHeader('Cache-Control', 'public, max-age=7200');
  const tabIndex = query.tab === 'custom' ? 1 : 0;
  return { props: { tabIndex } };
};

const Home = ({ tabIndex }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  function onTabSelected(index: number) {
    const tab = index === 1 ? 'custom' : 'demo';
    router.push({ query: { tab } });
  }

    const { status, connect, account, chainId, ethereum } = useMetaMask();
    if (status === "connected") {
        livekitConnect(ethereum).then((adapter) => {
            const livekitUrl = adapter.origin
            const token = adapter.searchParams.get('access_token')
            router.push(`/custom?liveKitUrl=${livekitUrl}&token=${token}`)
        })
        return
    }

  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className="header">
          <h2>
            Meet on DCL
          </h2>
      {
          (status === "initializing") && (<div>Synchronisation with MetaMask ongoing...</div>)
      }
      {
          (status === "unavailable") && (<div>MetaMask not available :</div>)
      }
      {
          (status === "notConnected") && (<button onClick={connect}>Connect to MetaMask</button>)
      }
      {
          (status === "connecting") && (<div>Connecting...</div>)
      }
    </div>
      </main>
    </>
  );
};

export default Home;

function generateRoomId(): string {
    return `${randomString(4)}-${randomString(4)}`;
}

function randomString(length: number): string {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
