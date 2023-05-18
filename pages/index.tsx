import { useRouter } from 'next/router';
import React  from 'react';
import styles from '../styles/Home.module.css';
import { useMetaMask } from "metamask-react";
import { flatFetch } from '../lib/flat-fetch'
import { signedFetch, loginUsingEthereumProvider } from '../lib/auth'

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

const Home = () => {
    const router = useRouter();

    const { status, connect, ethereum } = useMetaMask();
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
