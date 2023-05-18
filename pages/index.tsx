import { useRouter } from 'next/router';
import React  from 'react';
import styles from '../styles/Home.module.css';
import { useMetaMask } from "metamask-react";
import { flatFetch } from '../lib/flat-fetch'
import { signedFetch, loginUsingEthereumProvider } from '../lib/auth'

async function livekitConnect(provider: any, worldServer: string, worldName: string) {
    const identity = await loginUsingEthereumProvider(provider)
    const aboutResponse = await flatFetch(`${worldServer}/world/${worldName}/about`, {
        responseBodyType: 'json'
    })
    console.log(aboutResponse.json)
    const url = aboutResponse.json['comms']['fixedAdapter'].replace('signed-login:', '').replace('get-comms-adapter', 'meet-adapter')
    const response = await signedFetch(url, identity.authChain, {
        method: 'POST',
        responseBodyType: 'json'
    }, {
        'signer': 'dcl:explorer',
        'intent': 'dcl:explorer:comms-handshake'
    })

    if (response.status === 200) {
      const connStr = response.json['fixedAdapter']
      console.log(connStr);
      return new URL(connStr.replace('livekit:', ''))
    }
    throw Error(`Failed to connect to LiveKit: ${JSON.stringify(response.text || response.json?.message)}`)
  }

function JoinScreen(provider: any) {
    const router = useRouter();
    const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        const formData = new FormData(event.target as HTMLFormElement);
        const worldServer = formData.get('worldServer')?.toString();
        const worldName = formData.get('worldName')?.toString();

        livekitConnect(provider, worldServer!, worldName!).then((adapter) => {
            const livekitUrl = adapter.origin
            const token = adapter.searchParams.get('access_token')
            router.push(`/custom?liveKitUrl=${livekitUrl}&token=${token}`)
        })
    };

    return (
        <form className={styles.tabContent} onSubmit={onSubmit}>
            <p style={{ marginTop: 0 }}>
                Connect LiveKit Meet with a custom server using LiveKit Cloud or LiveKit Server.
            </p>
            <input
                id="worldServer"
                name="worldServer"
                type="url"
                placeholder="World Server URL: https://worlds-content-server.decentraland.zone"
                required
            />
            <input
                id="worldName"
                name="worldName"
                type="string"
                placeholder="World Name: <name>.dcl.eth"
                required
            />
            <hr
                style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.15)', marginBlock: '1rem' }}
            />
            <button
                style={{ paddingInline: '1.25rem', width: '100%' }}
                className="lk-button"
                type="submit"
            >
                Connect
            </button>
        </form>
    );
}



const Home = () => {
    const { status, connect, ethereum } = useMetaMask();
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
      {
          (status === "connected") && JoinScreen(ethereum)
      }
    </div>
      </main>
    </>
  );
};

export default Home;
