'use client';

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface TransitionProviderProps {
  children: React.ReactNode;
}

export function TransitionProvider({ children }: TransitionProviderProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <React.Fragment key={pathname}>{children}</React.Fragment>
    </AnimatePresence>
  );
}
