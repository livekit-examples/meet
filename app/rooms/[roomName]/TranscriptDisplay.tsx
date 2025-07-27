import * as React from 'react';
import { useEnsureRoom, useLocalParticipant } from '@livekit/components-react';

export interface Transcript {
  id: string;
  text: string;
  isTranslation: boolean;
  participantId?: string;
  timestamp: number;
  complete?: boolean;
}

export interface TranscriptDisplayProps {
}

/**
 * TranscriptDisplay component shows captions of what users are saying
 * It displays up to two different transcripts (original and translation)
 * and removes them after 5 seconds of no changes or when new transcripts arrive
 */
export function TranscriptDisplay() {
  const [visibleTranscripts, setVisibleTranscripts] = React.useState<Transcript[]>([]);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const transcriptsRef = React.useRef<Record<string, Transcript>>({});
  
  const room = useEnsureRoom();
  const {localParticipant} = useLocalParticipant();

  const currentLanguage = localParticipant?.attributes?.language;

  const updateTranscriptState = React.useCallback(() => {
    const allTranscripts = Object.values(transcriptsRef.current);
    
    // Sort by timestamp (newest first) and take the most recent 2
    // One original and one translation if available
    const sortedTranscripts = allTranscripts
      .sort((a, b) => b.timestamp - a.timestamp);
    
    // Find the most recent original transcript
    const originalTranscript = sortedTranscripts.find(t => !t.isTranslation);
    // Find the most recent translation transcript
    const translationTranscript = sortedTranscripts.find(t => t.isTranslation);
    
    // Combine them into the visible transcripts array
    const newVisibleTranscripts: Transcript[] = [];
    if (originalTranscript) newVisibleTranscripts.push(originalTranscript);
    if (translationTranscript) newVisibleTranscripts.push(translationTranscript);
    
    setVisibleTranscripts(newVisibleTranscripts);
    
    // Reset the timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set timeout to clear transcripts after 5 seconds
    timeoutRef.current = setTimeout(() => {
      setVisibleTranscripts([]);
      // Also clear the transcripts reference
      transcriptsRef.current = {};
    }, 5000);
  }, []);

  React.useEffect(() => {
    if (room) {
      room.registerTextStreamHandler('lk.transcription', async (reader, participantInfo) => {
        const info = reader.info;
        const isTranslation = info.attributes?.translated === "true";

        // ignore translations for other languages
        // if (isTranslation && info.attributes?.language !== currentLanguage) {
        //   return;
        // }

        const id = info.id;
        const participantId = participantInfo?.identity;
        const isFinal = info.attributes?.["lk.transcription_final"] === "true";
        console.log("transcript", id, isFinal);
        
        // Create or update the transcript in our reference object
        if (!transcriptsRef.current[id]) {
          transcriptsRef.current[id] = {
            id,
            text: '',
            isTranslation,
            participantId,
            timestamp: Date.now(),
          };
        }

        try {
          for await (const chunk of reader) {
            // Update the transcript with the new chunk
            if (chunk) {
              const transcript = transcriptsRef.current[id];
              transcript.text += chunk;
              transcript.timestamp = Date.now();
              transcript.complete = isFinal;
              
              updateTranscriptState();
            }
          }
          
          if (transcriptsRef.current[id]) {
            transcriptsRef.current[id].complete = true;
            updateTranscriptState();
          }
        } catch (e) {
          console.error('Error processing transcript stream:', e);
        }
      });
      
      return () => {
        room.unregisterTextStreamHandler('lk.transcription');
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [room, currentLanguage, updateTranscriptState]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!currentLanguage) {
    return null;
  }

  if (visibleTranscripts.length === 0) {
    return null;
  }

  return (
    <div className="lk-transcript-container">
      {visibleTranscripts.map((transcript) => (
        <div 
          key={transcript.id} 
          className={`lk-transcript ${transcript.isTranslation ? 'lk-transcript-translation' : 'lk-transcript-original'}`}
        >
          {transcript.text}
        </div>
      ))}
      <style jsx>{`
        .lk-transcript-container {
          position: absolute;
          bottom: 80px;
          left: 20%;
          right: 20%;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 10;
        }
        
        .lk-transcript {
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 16px;
          margin-bottom: 8px;
          border-radius: 4px;
          max-width: 100%;
          text-align: center;
          font-size: 1rem;
          line-height: 1.5;
        }
        
        .lk-transcript-translation {
          font-style: italic;
          background-color: rgba(0, 0, 0, 0.6);
        }
      `}</style>
    </div>
  );
} 