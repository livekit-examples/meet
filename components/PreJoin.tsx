import { AspectRatio, Box, Button, Center, Grid, GridItem, Link, Text } from '@chakra-ui/react';
import { typography } from '@livekit/livekit-chakra-theme';
import { AudioSelectButton, VideoRenderer, VideoSelectButton } from '@livekit/react-components';
import {
  createLocalAudioTrack,
  createLocalVideoTrack,
  LocalAudioTrack,
  LocalVideoTrack,
  VideoPresets,
} from 'livekit-client';
import { ReactElement, useEffect, useState } from 'react';
import { SessionProps } from '../lib/types';
import styles from '../styles/Room.module.css';
import TextField from './TextField';

interface PreJoinProps {
  roomName: string;
  numParticipants: number;
  // use a passed in identity
  identity?: string;
  startSession: (props: SessionProps) => void;
}

const PreJoin = ({
  startSession,
  roomName,
  numParticipants,
  identity: existingIdentity,
}: PreJoinProps) => {
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack>();
  const [audioTrack, setAudioTrack] = useState<LocalAudioTrack>();
  const [videoDevice, setVideoDevice] = useState<MediaDeviceInfo>();
  const [audioDevice, setAudioDevice] = useState<MediaDeviceInfo>();
  const [joinEnabled, setJoinEnabled] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const [identity, setIdentity] = useState<string | undefined>(existingIdentity);

  // indicate that it's now on the client side
  useEffect(() => {
    setCanRender(true);
  }, []);

  useEffect(() => {
    if (identity && identity.length > 1) {
      setJoinEnabled(true);
    } else {
      setJoinEnabled(false);
    }
  }, [identity]);

  const toggleVideo = async () => {
    if (videoTrack) {
      videoTrack.stop();
      setVideoTrack(undefined);
    } else {
      const track = await createLocalVideoTrack({
        deviceId: videoDevice?.deviceId,
        resolution: VideoPresets.h720.resolution,
      });
      setVideoTrack(track);
    }
  };

  const toggleAudio = async () => {
    if (audioTrack) {
      audioTrack.stop();
      setAudioTrack(undefined);
    } else {
      const track = await createLocalAudioTrack({
        deviceId: audioDevice?.deviceId,
      });
      setAudioTrack(track);
    }
  };

  // recreate video track when device changes
  useEffect(() => {
    if (videoTrack) {
      videoTrack.stop();
      setVideoTrack(undefined);
    }
    // enable video by default
    createLocalVideoTrack({
      deviceId: videoDevice?.deviceId,
      resolution: VideoPresets.h720.resolution,
    }).then((track) => {
      setVideoTrack(track);
    });
  }, [videoDevice]);

  // recreate audio track when device changes
  useEffect(() => {
    // enable audio by default
    createLocalAudioTrack({
      deviceId: audioDevice?.deviceId,
    }).then((track) => {
      setAudioTrack(track);
    });
  }, [audioDevice]);

  const onJoin = () => {
    if (!identity) {
      return;
    }
    startSession({
      roomName,
      identity,
      audioTrack,
      videoTrack,
    });
  };

  let videoElement: ReactElement;
  if (videoTrack) {
    videoElement = <VideoRenderer track={videoTrack} isLocal={true} />;
  } else {
    videoElement = <div className={styles.placeholder} />;
  }

  if (!canRender) {
    return null;
  }

  let currentParticipantsText = 'You will be the first person in the meeting';
  if (numParticipants > 0) {
    currentParticipantsText = `${numParticipants} people are in the meeting`;
  }

  return (
    <Box className={styles.prejoin} bg="cld.bg1" minH="100vh">
      <main>
        <Box>
          <AspectRatio ratio={16 / 9}>{videoElement}</AspectRatio>
          <Grid
            mt="1rem"
            gap="0.75rem"
            templateColumns="min-content min-content"
            placeContent="end center"
          >
            <GridItem>
              <AudioSelectButton
                isMuted={!audioTrack}
                onClick={toggleAudio}
                onSourceSelected={setAudioDevice}
              />
            </GridItem>
            <GridItem>
              <VideoSelectButton
                isEnabled={videoTrack !== undefined}
                onClick={toggleVideo}
                onSourceSelected={setVideoDevice}
              />
            </GridItem>
          </Grid>
        </Box>
        <Box>
          <Text textStyle="h4" color="cld.fg1" textAlign="center" mb={['2rem', null]}>
            What is your name?
          </Text>

          <Box ml="1rem" mr="1rem" mb="2rem">
            <TextField
              domId="identity"
              label="name"
              placeholder=""
              inputType="text"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
            />
          </Box>

          <Center>
            <Button
              onClick={onJoin}
              disabled={!joinEnabled}
              variant="primary"
              py="0.75rem"
              px="2rem"
              {...typography.textStyles['h5-mono']}
              _hover={{ backgroundColor: '#4963B0' }}
            >
              {numParticipants > 0 ? 'Join' : 'Start'} Meeting
            </Button>
          </Center>

          <Center height="5rem">
            <Text textStyle="body2" color="cld.fg2">
              {currentParticipantsText}
            </Text>
          </Center>
        </Box>
      </main>
      <footer>
        <Center>
          <Text textStyle="body2" color="cld.fg2">
            Built with{' '}
            <Link href="https://livekit.io">
              <Text as="span" color="v2.red">
                LiveKit
              </Text>
            </Link>
            .{' '}
            <Link href="https://github.com/livekit/meet">
              see{' '}
              <Text as="span" color="v2.red">
                source
              </Text>
            </Link>
          </Text>
        </Center>
      </footer>
    </Box>
  );
};

export default PreJoin;
