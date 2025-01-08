"use client"
import React, { ReactNode, useEffect } from 'react';
import AppWrappers from './AppWrappers';
// import '@asseinfo/react-kanban/dist/styles.css';
// import '/public/styles/Plugins.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Ensure dark mode is applied by default when the app is loaded
    if (typeof window !== 'undefined') {
      document.body.classList.add('dark');
    }
  }, []);

  return (
    <html lang="en">
      <body id={'root'}>
        <AppWrappers>{children}</AppWrappers>
      </body>
    </html>
  );
}
