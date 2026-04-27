'use client';
import * as React from 'react';
import { useWatchTogether } from './WatchTogetherContext';
import { UrlPlayer } from './UrlPlayer';
import { YouTubePlayer } from './YouTubePlayer';

export function EmbedTile() {
  const { embed, stopEmbed, sendSync, subscribe } = useWatchTogether();
  if (!embed.active) return null;

  return (
    <div className="lk-watch-together-tile">
      {embed.kind === 'youtube' ? (
        <YouTubePlayer
          videoId={embed.src}
          hostIdentity={embed.hostIdentity}
          isHost={embed.isHost}
          sendSync={sendSync}
          subscribe={subscribe}
        />
      ) : (
        <UrlPlayer
          src={embed.src}
          hostIdentity={embed.hostIdentity}
          isHost={embed.isHost}
          sendSync={sendSync}
          subscribe={subscribe}
        />
      )}
      {embed.isHost && (
        <div className="lk-watch-together-overlay">
          <button type="button" className="lk-button lk-watch-together-stop" onClick={stopEmbed}>
            Stop
          </button>
        </div>
      )}
    </div>
  );
}
