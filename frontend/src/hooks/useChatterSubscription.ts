import { useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

const onChatterSubscription = `
  subscription OnChatter {
    onChatter {
      id
      timestamp
      source
      detailType
      detail
    }
  }
`;

interface ChatterMessage {
  id: string;
  timestamp: string;
  source: string;
  detailType: string;
  detail: any;
}

export function useChatterSubscription(
  onMessage: (message: ChatterMessage) => void,
  enabled: boolean = true
) {
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    console.log('Setting up chatter subscription...');

    const subscription = client
      .graphql({
        query: onChatterSubscription,
      })
      .subscribe({
        next: ({ data }: any) => {
          console.log('Received chatter message:', data);
          if (data?.onChatter) {
            onMessage(data.onChatter);
          }
        },
        error: (error: any) => {
          console.error('Chatter subscription error:', error);
        },
      });

    subscriptionRef.current = subscription;

    return () => {
      console.log('Cleaning up chatter subscription...');
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [enabled, onMessage]);

  return subscriptionRef;
}
