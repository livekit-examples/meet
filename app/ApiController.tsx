import { useState } from 'react';

const apiUrl = 'http://localhost:3001/api';

export default function ApiController() {
  const [roomDetails, setRoomDetails] = useState<any>(null);

  const handleConnect = async () => {
    try {
      // First API call to create room token
      console.log('Connecting...');
      const tokenResponse = await fetch(`${apiUrl}/create-room-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: 'test-meet-room',
          participantName: 'participant-name',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to create room token');
      }

      const tokenData = await tokenResponse.json();
      const token = tokenData.token;

      // Second API call to connect with the token
      const connectResponse = await fetch(`${apiUrl}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!connectResponse.ok) {
        throw new Error('Failed to connect');
      }

      console.log('Successfully connected');
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      const disconnectResponse = await fetch(`${apiUrl}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!disconnectResponse.ok) {
        throw new Error('Failed to disconnect');
      }
      console.log('Successfully disconnected');
    } catch (error) {
      console.error('Connection error:', error);
    }
  }

  const handleGetRoomDetails = async () => {
    try {
      const response = await fetch(`${apiUrl}/room`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get room details');
      }

      const data = await response.json();
      setRoomDetails(data);
    } catch (error) {
      console.error('Error getting room details:', error);
      setRoomDetails({ error: 'Failed to get room details' });
    }
  };

  const handleStartTransmit = async () => {
    try {
      const response = await fetch(`${apiUrl}/start-transmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start transmit');
      }

      console.log('Successfully started transmit');
    } catch (error) {
      console.error('Start transmit error:', error);
    }
  };

  const handleStopTransmit = async () => {
    try {
      const response = await fetch(`${apiUrl}/stop-transmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to stop transmit');
      }

      console.log('Successfully stopped transmit');
    } catch (error) {
      console.error('Stop transmit error:', error);
    }
  };

  const handleStartReceive = async () => {
    try {
      const response = await fetch(`${apiUrl}/start-receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start receive');
      }

      console.log('Successfully started receive');
    } catch (error) {
      console.error('Start receive error:', error);
    }
  };

  const handleStopReceive = async () => {
    try {
      const response = await fetch(`${apiUrl}/stop-receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to stop receive');
      }

      console.log('Successfully stopped receive');
    } catch (error) {
      console.error('Stop receive error:', error);
    }
  };

  return (
    <div>
      <div>
        <button onClick={handleGetRoomDetails}>Get room details</button>
        <button onClick={handleConnect}>Connect</button>
        <button onClick={handleDisconnect}>Disconnect</button>
        <button onClick={handleStartTransmit}>Start Transmit</button>
        <button onClick={handleStopTransmit}>Stop Transmit</button>
        <button onClick={handleStartReceive}>Start Receive</button>
        <button onClick={handleStopReceive}>Stop Receive</button>
      </div>
      {roomDetails && (
        <pre style={{
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px',
          overflow: 'auto',
          fontSize: '12px'
        }}>
          {JSON.stringify(roomDetails, null, 2)}
        </pre>
      )}
    </div>
  );
}