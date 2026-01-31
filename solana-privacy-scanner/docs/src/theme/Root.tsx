import React from 'react';
import { Analytics } from '@vercel/analytics/react';

// Root component wrapper for Docusaurus
// This wraps the entire app and is the perfect place for global providers
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
