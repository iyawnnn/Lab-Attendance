import { useEffect, useRef } from 'react';
import { pusherClient } from '@/lib/pusherClient';

export function usePusherEvent<T>(
  channelName: string,
  eventName: string,
  callback: (data: T) => void
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Safety guard: do not execute on server side or if initialization isn't ready
    if (!pusherClient) return;

    const channel = pusherClient.subscribe(channelName);
    
    const handler = (data: T) => {
      callbackRef.current(data);
    };

    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
      pusherClient.unsubscribe(channelName);
    };
  }, [channelName, eventName]);
}