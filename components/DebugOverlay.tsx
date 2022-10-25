import {
  Badge,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Heading,
  HStack,
  Select,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { RemoteTrackPublication, Room, RoomEvent } from 'livekit-client';
import { useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

interface DebugProps {
  room: Room;
}

export const DebugOverlay = ({ room }: DebugProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [, setRender] = useState({});
  const toast = useToast();

  useEffect(() => {
    if (window) {
      const unsubscribe = tinykeys(window, {
        'Shift+D': () => {
          if (isOpen) {
            onClose();
          } else {
            onOpen();
          }
        },
      });

      // timer to re-render
      const interval = setInterval(() => {
        setRender({});
      }, 1000);

      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, [isOpen]);

  if (typeof window === 'undefined' || !isOpen) {
    return null;
  }

  const handleSimulate = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    if (value == '') {
      return;
    }
    onClose();

    event.target.value = '';
    let isReconnect = false;
    switch (value) {
      case 'signal-reconnect':
      case 'migration':
        isReconnect = true;

      // fall through
      default:
        room.simulateScenario(value);
    }

    if (isReconnect && room.engine) {
      toast({
        title: 'Reconnecting...',
        description: `current server: ${room.engine.connectedServerAddress}`,
        status: 'info',
        duration: 3000,
      });
      room.once(RoomEvent.Reconnected, () => {
        toast({
          title: 'Reconnected',
          description: `reconnected server: ${room.engine.connectedServerAddress}`,
          status: 'success',
          duration: 3000,
        });
      });
    }
  };

  const lp = room.localParticipant;

  const roomInfo = (
    <Table variant="simple">
      <Tbody>
        <Tr>
          <Td>Room</Td>
          <Td>
            {room.name}&nbsp;
            <Badge>{room.sid}</Badge>
          </Td>
        </Tr>
        <Tr>
          <Td>Participant</Td>
          <Td>
            {lp.identity}&nbsp;
            <Badge>{lp.sid}</Badge>
          </Td>
        </Tr>
        <Tr>
          <Td>Simulate</Td>
          <Td>
            <Select placeholder="choose" onChange={handleSimulate}>
              <option value="signal-reconnect">Signal reconnect</option>
              <option value="speaker">Speaker update</option>
              <option value="server-leave">Server booted</option>
              <option value="migration">Migration (Cloud-only)</option>
            </Select>
          </Td>
        </Tr>
      </Tbody>
    </Table>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Debug</DrawerHeader>
        <DrawerBody>
          {roomInfo}
          <Box>
            <Stack spacing="1rem">
              <Box borderWidth="1px" borderRadius="lg" padding="1rem" mb="1rem">
                <Heading fontSize="lg" mb="0.5rem">
                  Published Tracks
                </Heading>
                <Stack spacing="0.5rem">
                  {Array.from(lp.tracks.values()).map((t) => (
                    <>
                      <HStack>
                        <Text>
                          {t.source.toString()}
                          &nbsp;<Badge>{t.trackSid}</Badge>
                        </Text>
                      </HStack>
                      <Table variant="simple">
                        <Tbody>
                          <Tr>
                            <Td>Kind</Td>
                            <Td>
                              {t.kind}&nbsp;
                              {t.kind === 'video' && (
                                <Badge>
                                  {t.track?.dimensions?.width}x{t.track?.dimensions?.height}
                                </Badge>
                              )}
                            </Td>
                          </Tr>
                          <Tr>
                            <Td>Bitrate</Td>
                            <Td>{Math.ceil(t.track!.currentBitrate / 1000)} kbps</Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </>
                  ))}
                </Stack>
              </Box>
              {Array.from(room.participants.values()).map((p) => (
                <Box key={p.sid} borderWidth="1px" borderRadius="lg" padding="1rem" mb="1rem">
                  <Heading fontSize="lg" mb="0.5rem">
                    {p.identity}
                    <Badge></Badge>
                  </Heading>
                  <Stack spacing="0.5rem">
                    {Array.from(p.tracks.values()).map((t) => (
                      <>
                        <HStack>
                          <Text>
                            {t.source.toString()}
                            &nbsp;<Badge>{t.trackSid}</Badge>
                          </Text>
                        </HStack>
                        <Table variant="simple">
                          <Tbody>
                            <Tr>
                              <Td>Kind</Td>
                              <Td>
                                {t.kind}&nbsp;
                                {t.kind === 'video' && (
                                  <Badge>
                                    {t.dimensions?.width}x{t.dimensions?.height}
                                  </Badge>
                                )}
                              </Td>
                            </Tr>
                            <Tr>
                              <Td>Status</Td>
                              <Td>{trackStatus(t)}</Td>
                            </Tr>
                            {t.track && (
                              <Tr>
                                <Td>Bitrate</Td>
                                <Td>{Math.ceil(t.track.currentBitrate / 1000)} kbps</Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

function trackStatus(t: RemoteTrackPublication): string {
  if (t.isSubscribed) {
    return t.isEnabled ? 'enabled' : 'disabled';
  } else {
    return 'unsubscribed';
  }
}

export default DebugOverlay;
