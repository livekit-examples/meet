import { HStack, Text } from '@chakra-ui/react';
import { Participant } from 'livekit-client';

export interface ChatData {
  sentAt: Date;
  message: string;
  from?: Participant;
}

const ChatEntry = ({ message, from }: ChatData) => {
  return (
    <HStack>
      {from ? <Text fontWeight={600}>{`${from.name || from.identity}`}:</Text> : null}
      <Text>{message}</Text>
    </HStack>
  );
};

export default ChatEntry;
