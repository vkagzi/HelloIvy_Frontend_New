'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface NavbarContextValue {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const NavbarContext = createContext<NavbarContextValue | undefined>(undefined);

export const NavbarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const openDrawer = useCallback((): void => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback((): void => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(
    (): void => setIsDrawerOpen((prev) => !prev),
    []
  );

  return (
    <NavbarContext.Provider
      value={{ isDrawerOpen, openDrawer, closeDrawer, toggleDrawer }}
    >
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = (): NavbarContextValue => {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
};
