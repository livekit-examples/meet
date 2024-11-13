'use client';
import {'use client';
import {
 LiveKitRoom,
 VideoConference,
 formatChatMessageLinks,
 useToken,
 LocalUserChoices,
 PreJoin,
} from '@livekit/components-react';
import {
 DeviceUnsupportedError,
 ExternalE2EEKeyProvider,
 Room,
 RoomConnectOptions,
 RoomOptions,
 VideoCodec,
 VideoPresets,
 setLogLevel,
} from 'livekit-client';


import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import * as React from 'react';
import { DebugMode } from '../../lib/Debug';
import { decodePassphrase, useServerUrl } from '../../lib/client-utils';
import { SettingsMenu } from '../../lib/SettingsMenu';


const Home: NextPage = () => {
 const router = useRouter();
 const { name: roomName } = router.query;


 const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
   undefined,
 );


 const preJoinDefaults = React.useMemo(() => {
   return {
     username: '',
     videoEnabled: true,
     audioEnabled: true,
   };
 }, []);


 const handlePreJoinSubmit = React.useCallback((values: LocalUserChoices) => {
   setPreJoinChoices(values);
 }, []);


 const onPreJoinError = React.useCallback((e: any) => {
   console.error(e);
 }, []);


 const onLeave = React.useCallback(() => router.push('/'), []);


  return (
   <>
     <Head>
       <title>LiveKit Meet</title>
       <link rel="icon" href="/favicon.ico" />
     </Head>


     <main data-lk-theme="default">
       {roomName && !Array.isArray(roomName) && preJoinChoices ? (
         <ActiveRoom
           roomName={roomName}
           userChoices={preJoinChoices}
           onLeave={onLeave}
         ></ActiveRoom>
       ) : (
         <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
           <PreJoin
             onError={onPreJoinError}
             defaults={preJoinDefaults}
             onSubmit={handlePreJoinSubmit}
           ></PreJoin>
         </div>
       )}
     </main>
   </>
 );
};


export default Home;


type ActiveRoomProps = {
 userChoices: LocalUserChoices;
 roomName: string;
 region?: string;
 onLeave?: () => void;
};
const ActiveRoom = ({ roomName, userChoices, onLeave }: ActiveRoomProps) => {


 const [isRecording, setIsRecording] = useState(false);


 const tokenOptions = React.useMemo(() => {
   return {
     userInfo: {
       identity: userChoices.username,
       name: userChoices.username,
     },
   };
 }, [userChoices.username]);
 const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, tokenOptions);


 const router = useRouter();
 const { region, hq, codec } = router.query;


 const e2eePassphrase =
   typeof window !== 'undefined' && decodePassphrase(location.hash.substring(1));


 const liveKitUrl = useServerUrl(region as string | undefined);


 const worker =
   typeof window !== 'undefined' &&
   e2eePassphrase &&
   new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));


 const e2eeEnabled = !!(e2eePassphrase && worker);
 const keyProvider = new ExternalE2EEKeyProvider();
 const roomOptions = React.useMemo((): RoomOptions => {
   let videoCodec: VideoCodec | undefined = (
     Array.isArray(codec) ? codec[0] : codec ?? 'vp9'
   ) as VideoCodec;
   if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
     videoCodec = undefined;
   }
   return {
     videoCaptureDefaults: {
       deviceId: userChoices.videoDeviceId ?? undefined,
       resolution: hq === 'true' ? VideoPresets.h2160 : VideoPresets.h720,
     },
     publishDefaults: {
       dtx: false,
       videoSimulcastLayers:
         hq === 'true'
           ? [VideoPresets.h1080, VideoPresets.h720]
           : [VideoPresets.h540, VideoPresets.h216],
       red: !e2eeEnabled,
       videoCodec,
     },
     audioCaptureDefaults: {
       deviceId: userChoices.audioDeviceId ?? undefined,
     },
     adaptiveStream: { pixelDensity: 'screen' },
     dynacast: true,
     e2ee: e2eeEnabled
       ? {
           keyProvider,
           worker,
         }
       : undefined,
   };
   // @ts-ignore
   setLogLevel('debug', 'lk-e2ee');
 }, [userChoices, hq, codec]);


 const room = React.useMemo(() => new Room(roomOptions), []);


 if (e2eeEnabled) {
   keyProvider.setKey(decodePassphrase(e2eePassphrase));
   room.setE2EEEnabled(true).catch((e) => {
     if (e instanceof DeviceUnsupportedError) {
       alert(
         `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
       );
       console.error(e);
     }
   });
 }
 const connectOptions = React.useMemo((): RoomConnectOptions => {
   return {
     autoSubscribe: true,
   };
 }, []);


 const startRecording = useCallback(async () => {
   if (!isRecording) {
     try {
       const response = await fetch(`http://localhost:7880/rooms/${roomName}/start_recording`, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ url: 'http://localhost:8080/recording', format: 'mp4' }),
       });
      
       if (response.ok) setIsRecording(true);
     } catch (error) {
       console.error("Error starting recording", error);
     }
   }
 }, [roomName, token, isRecording]);


 const stopAndSaveRecording = useCallback(async () => {
   if (isRecording) {
     try {
       const stopResponse = await fetch(`http://localhost:7880/rooms/${roomName}/stop_recording`, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json',
         },
       });


       if (stopResponse.ok) {
         setIsRecording(false);
         const recordingBlob = await stopResponse.blob(); // Assume the API returns recording data as Blob


         // Send recording to external endpoint
         const formData = new FormData();
         formData.append("recording", recordingBlob, `${roomName}.mp4`);


         await fetch('https://recruitangle.com/api/expert/save/recording', {
           method: 'POST',
           body: formData,
         });
       }
     } catch (error) {
       console.error("Error stopping/saving recording", error);
     }
   }
 }, [roomName, token, isRecording]);


 useEffect(() => {
   // Start recording once the room connects
   if (liveKitUrl) {
     startRecording();
   }
  
   return () => {
     // Stop and save recording on disconnect
     stopAndSaveRecording();
   };
 }, [liveKitUrl, startRecording, stopAndSaveRecording]);


 return (
   <>
     {liveKitUrl && (
       <LiveKitRoom
         room={room}
         token={token}
         serverUrl={liveKitUrl}
         connectOptions={connectOptions}
         video={userChoices.videoEnabled}
         audio={userChoices.audioEnabled}
         onDisconnected={() => {
           stopAndSaveRecording();
           onLeave?.();
         }}
       >
         <VideoConference
           chatMessageFormatter={formatChatMessageLinks}
           SettingsComponent={
             process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU === 'true' ? SettingsMenu : undefined
           }
         />
         <DebugMode />
       </LiveKitRoom>
     )}
   </>
 );
};


 LiveKitRoom,
 VideoConference,
 formatChatMessageLinks,
 useToken,
 LocalUserChoices,
 PreJoin,
} from '@livekit/components-react';
import {
 DeviceUnsupportedError,
 ExternalE2EEKeyProvider,
 Room,
 RoomConnectOptions,
 RoomOptions,
 VideoCodec,
 VideoPresets,
 setLogLevel,
} from 'livekit-client';


import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import * as React from 'react';
import { DebugMode } from '../../lib/Debug';
import { decodePassphrase, useServerUrl } from '../../lib/client-utils';
import { SettingsMenu } from '../../lib/SettingsMenu';


const Home: NextPage = () => {
 const router = useRouter();
 const { name: roomName } = router.query;


 const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
   undefined,
 );


 const preJoinDefaults = React.useMemo(() => {
   return {
     username: '',
     videoEnabled: true,
     audioEnabled: true,
   };
 }, []);


 const handlePreJoinSubmit = React.useCallback((values: LocalUserChoices) => {
   setPreJoinChoices(values);
 }, []);


 const onPreJoinError = React.useCallback((e: any) => {
   console.error(e);
 }, []);


 const onLeave = React.useCallback(() => router.push('/'), []);


  return (
   <>
     <Head>
       <title>LiveKit Meet</title>
       <link rel="icon" href="/favicon.ico" />
     </Head>


     <main data-lk-theme="default">
       {roomName && !Array.isArray(roomName) && preJoinChoices ? (
         <ActiveRoom
           roomName={roomName}
           userChoices={preJoinChoices}
           onLeave={onLeave}
         ></ActiveRoom>
       ) : (
         <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
           <PreJoin
             onError={onPreJoinError}
             defaults={preJoinDefaults}
             onSubmit={handlePreJoinSubmit}
           ></PreJoin>
         </div>
       )}
     </main>
   </>
 );
};


export default Home;


type ActiveRoomProps = {
 userChoices: LocalUserChoices;
 roomName: string;
 region?: string;
 onLeave?: () => void;
};
const ActiveRoom = ({ roomName, userChoices, onLeave }: ActiveRoomProps) => {


 const [isRecording, setIsRecording] = useState(false);


 const tokenOptions = React.useMemo(() => {
   return {
     userInfo: {
       identity: userChoices.username,
       name: userChoices.username,
     },
   };
 }, [userChoices.username]);
 const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, tokenOptions);


 const router = useRouter();
 const { region, hq, codec } = router.query;


 const e2eePassphrase =
   typeof window !== 'undefined' && decodePassphrase(location.hash.substring(1));


 const liveKitUrl = useServerUrl(region as string | undefined);


 const worker =
   typeof window !== 'undefined' &&
   e2eePassphrase &&
   new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));


 const e2eeEnabled = !!(e2eePassphrase && worker);
 const keyProvider = new ExternalE2EEKeyProvider();
 const roomOptions = React.useMemo((): RoomOptions => {
   let videoCodec: VideoCodec | undefined = (
     Array.isArray(codec) ? codec[0] : codec ?? 'vp9'
   ) as VideoCodec;
   if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
     videoCodec = undefined;
   }
   return {
     videoCaptureDefaults: {
       deviceId: userChoices.videoDeviceId ?? undefined,
       resolution: hq === 'true' ? VideoPresets.h2160 : VideoPresets.h720,
     },
     publishDefaults: {
       dtx: false,
       videoSimulcastLayers:
         hq === 'true'
           ? [VideoPresets.h1080, VideoPresets.h720]
           : [VideoPresets.h540, VideoPresets.h216],
       red: !e2eeEnabled,
       videoCodec,
     },
     audioCaptureDefaults: {
       deviceId: userChoices.audioDeviceId ?? undefined,
     },
     adaptiveStream: { pixelDensity: 'screen' },
     dynacast: true,
     e2ee: e2eeEnabled
       ? {
           keyProvider,
           worker,
         }
       : undefined,
   };
   // @ts-ignore
   setLogLevel('debug', 'lk-e2ee');
 }, [userChoices, hq, codec]);


 const room = React.useMemo(() => new Room(roomOptions), []);


 if (e2eeEnabled) {
   keyProvider.setKey(decodePassphrase(e2eePassphrase));
   room.setE2EEEnabled(true).catch((e) => {
     if (e instanceof DeviceUnsupportedError) {
       alert(
         `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
       );
       console.error(e);
     }
   });
 }
 const connectOptions = React.useMemo((): RoomConnectOptions => {
   return {
     autoSubscribe: true,
   };
 }, []);


 const startRecording = useCallback(async () => {
   if (!isRecording) {
     try {
       const response = await fetch(`http://localhost:7880/rooms/${roomName}/start_recording`, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ url: 'http://localhost:8080/recording', format: 'mp4' }),
       });
      
       if (response.ok) setIsRecording(true);
     } catch (error) {
       console.error("Error starting recording", error);
     }
   }
 }, [roomName, token, isRecording]);


 const stopAndSaveRecording = useCallback(async () => {
   if (isRecording) {
     try {
       const stopResponse = await fetch(`http://localhost:7880/rooms/${roomName}/stop_recording`, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json',
         },
       });


       if (stopResponse.ok) {
         setIsRecording(false);
         const recordingBlob = await stopResponse.blob(); // Assume the API returns recording data as Blob


         // Send recording to external endpoint
         const formData = new FormData();
         formData.append("recording", recordingBlob, `${roomName}.mp4`);


         await fetch('https://recruitangle.com/api/expert/save/recording', {
           method: 'POST',
           body: formData,
         });
       }
     } catch (error) {
       console.error("Error stopping/saving recording", error);
     }
   }
 }, [roomName, token, isRecording]);


 useEffect(() => {
   // Start recording once the room connects
   if (liveKitUrl) {
     startRecording();
   }
  
   return () => {
     // Stop and save recording on disconnect
     stopAndSaveRecording();
   };
 }, [liveKitUrl, startRecording, stopAndSaveRecording]);


 return (
   <>
     {liveKitUrl && (
       <LiveKitRoom
         room={room}
         token={token}
         serverUrl={liveKitUrl}
         connectOptions={connectOptions}
         video={userChoices.videoEnabled}
         audio={userChoices.audioEnabled}
         onDisconnected={() => {
           stopAndSaveRecording();
           onLeave?.();
         }}
       >
         <VideoConference
           chatMessageFormatter={formatChatMessageLinks}
           SettingsComponent={
             process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU === 'true' ? SettingsMenu : undefined
           }
         />
         <DebugMode />
       </LiveKitRoom>
     )}
   </>
 );
};
