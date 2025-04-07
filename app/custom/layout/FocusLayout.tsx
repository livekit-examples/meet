import * as React from 'react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import type { ParticipantClickEvent } from '@livekit/components-core';
import { ParticipantTile } from '@/lib/ParticipantTile';

export interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FocusLayoutContainer(props: FocusLayoutContainerProps) {
  return (
    <div className="lk-focus-layout" {...props}>
      {props.children}
    </div>
  );
}

export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
  trackRef?: TrackReferenceOrPlaceholder;

  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusLayout({ trackRef, ...htmlProps }: FocusLayoutProps) {
  return <ParticipantTile trackRef={trackRef} {...htmlProps} />;
}
