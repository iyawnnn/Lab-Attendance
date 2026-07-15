import Pusher from 'pusher-js';

// Fallback logic to resolve the constructor across different build systems/environments
const PusherConstructor = (Pusher as any).default ?? Pusher;

export const pusherClient = typeof window !== 'undefined'
  ? new PusherConstructor(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      forceTLS: true,
    })
  : null;