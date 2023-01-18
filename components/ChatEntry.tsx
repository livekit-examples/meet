import { HStack, Text } from '@chakra-ui/react';
import { Participant } from 'livekit-client';
import createUrlRegExp from 'url-regex';
import createEmailRegExp from 'email-regex';
import Prism from 'prismjs';
import React, { useMemo } from 'react';

const GRAMMAR: Prism.Grammar = {
  email: createEmailRegExp(),
  url: createUrlRegExp({ strict: false }),
};

export interface ChatData {
  sentAt: Date;
  message: string;
  from?: Participant;
}

const ChatEntry = ({ message, from }: ChatData) => {
  const formattedMessage = useMemo<React.ReactNode[]>(() => {
    return Prism.tokenize(message, GRAMMAR).map((tok, i) => {
      if (typeof tok === `string`) {
        return tok;
      } else {
        const content = tok.content.toString();
        const href =
          tok.type === `url`
            ? /^http(s?):\/\//.test(content)
              ? content
              : `https://${content}`
            : `mailto:${content}`;
        return (
          <a className="lk-chat-link" key={i} href={href} target="_blank" rel="noreferrer">
            {content}
          </a>
        );
      }
    });
  }, [message]);

  return (
    <HStack>
      {from ? <Text fontWeight={600}>{`${from.name || from.identity}`}:</Text> : null}
      <Text>{formattedMessage}</Text>
    </HStack>
  );
};

export default ChatEntry;
