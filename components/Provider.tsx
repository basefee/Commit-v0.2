"use client";

import React, { ReactNode } from 'react';
import { config } from '../wagmi';
import {
  RainbowKitProvider,
  darkTheme, // or lightTheme, midnightTheme
} from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { State, WagmiProvider } from 'wagmi';

// Setup queryClient
const queryClient = new QueryClient();

export function ContextProvider({
  children,
  initialState
}: {
  children: ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({ // Use any theme you prefer
            accentColor: '#33bbcf', // Custom accent color
            accentColorForeground: 'white', // Foreground color for the accent
            borderRadius: 'medium', // Border radius setting
            fontStack: 'system', // Font stack
            overlayBlur: 'small', // Overlay blur effect
          })}
          modalSize="compact" // Set the modal size to compact
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
