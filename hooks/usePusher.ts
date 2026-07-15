// hooks/usePusher.ts
import { useEffect } from 'react';
import { pusherClient } from '@/lib/pusherClient';

export function usePusherEvent<T>(
  channelName: string,
  eventName: string,
  callback: (data: T) => void
) {
  useEffect(() => {
    const channel = pusherClient.subscribe(channelName);
    channel.bind(eventName, callback);

    return () => {
      channel.unbind(eventName, callback);
      pusherClient.unsubscribe(channelName);
    };
  }, [channelName, eventName, callback]);
}