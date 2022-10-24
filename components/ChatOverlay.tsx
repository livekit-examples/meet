import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Grid,
  GridItem,
  HStack,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import { DataPacket_Kind, Participant, Room, RoomEvent } from 'livekit-client';
import { useEffect, useState } from 'react';
import ChatEntry, { ChatData } from './ChatEntry';

interface ChatProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onUnreadChanged?: (num: number) => void;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const ChatOverlay = ({
  room,
  isOpen: extIsOpen,
  onClose: extOnClose,
  onUnreadChanged,
}: ChatProps) => {
  const { isOpen, onClose } = useDisclosure({ isOpen: extIsOpen, onClose: extOnClose });
  const [input, setInput] = useState<string>();
  const [messages, setMessages] = useState<ChatData[]>([]);
  const [numUnread, setNumUnread] = useState(0);

  useEffect(() => {
    const onDataReceived = (payload: Uint8Array, participant?: Participant) => {
      const data = decoder.decode(payload);
      setMessages((messages) => [
        ...messages,
        {
          sentAt: new Date(),
          message: data,
          from: participant,
        },
      ]);
      setNumUnread((numUnread) => numUnread + 1);
    };
    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
    };
  }, [room]);

  useEffect(() => {
    if (isOpen) {
      setNumUnread(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (onUnreadChanged) {
      onUnreadChanged(numUnread);
    }
  }, [numUnread, onUnreadChanged]);

  const sendMessage = () => {
    if (!input) {
      return;
    }
    room.localParticipant.publishData(encoder.encode(input), DataPacket_Kind.RELIABLE);
    setMessages((messages) => [
      ...messages,
      {
        sentAt: new Date(),
        message: input,
        from: room.localParticipant,
      },
    ]);
    setInput('');
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="sm" placement="left">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Chat</DrawerHeader>
        <DrawerBody>
          <Grid height="100%" templateColumns="1fr" templateRows="1fr min-content">
            <GridItem>
              {messages.map((message, idx) => (
                <ChatEntry key={idx} {...message} />
              ))}
            </GridItem>
            <GridItem>
              <HStack>
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2} />
                <Button onClick={sendMessage}>Send</Button>
              </HStack>
            </GridItem>
          </Grid>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default ChatOverlay;
