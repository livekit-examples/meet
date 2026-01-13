import * as React from 'react';
import { PageClientImpl } from './PageClientImpl';
import { isVideoCodec } from '@/lib/types';

export default async function DualRoomSessionPage({
  searchParams,
}: {
  searchParams: Promise<{
    primary?: string;
    secondary?: string;
    region?: string;
    hq?: string;
    codec?: string;
  }>;
}) {
  const _searchParams = await searchParams;

  const primaryRoom = _searchParams.primary || 'primary-room';
  const secondaryRoom = _searchParams.secondary || 'secondary-room';

  const codec =
    typeof _searchParams.codec === 'string' && isVideoCodec(_searchParams.codec)
      ? _searchParams.codec
      : 'vp9';
  const hq = _searchParams.hq === 'true' ? true : false;

  return (
    <PageClientImpl
      primaryRoomName={primaryRoom}
      secondaryRoomName={secondaryRoom}
      region={_searchParams.region}
      hq={hq}
      codec={codec}
    />
  );
}
