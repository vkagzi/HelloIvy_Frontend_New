'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getToken, me, removeToken } from '@/lib/api';

type UserAuthContextType = {
  isAuthenticated: boolean;
  logout: () => void;
  userDetails: {
    email: string;
    name: string;
    id: number;
  };
};

const UserAuthContext = createContext<UserAuthContextType | undefined>(
  undefined
);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/', '/essay-evaluator'];

export const UserAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userDetails, setUserDetails] = useState<{
    email: string;
    name: string;
    id: number;
  }>({
    email: '',
    name: '',
    id: 0,
  });

  const checkForAuthentication = async (): Promise<void> => {
    const token = await getToken();
    const isPublicRoute = pathname ? PUBLIC_ROUTES.includes(pathname) : true;
    
    console.log(
      'Checking authentication, token:',
      token ? 'present' : 'missing',
      'pathname:',
      pathname,
      'isPublicRoute:',
      isPublicRoute
    );

    if (token) {
      try {
        const _userDetails = await me();
        console.log('User details fetched successfully:', _userDetails);
        console.log('Raw user name from API:', _userDetails.name);
        console.log('Raw user email from API:', _userDetails.email);

        // Clear any previous user data to prevent contamination
        setUserDetails({
          email: '',
          name: '',
          id: 0,
        });

        // Set new user details
        setUserDetails({
          ..._userDetails,
          name: _userDetails.name || _userDetails.email, // Use email as fallback for name
        });
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Authentication check failed:', error);
        // If API call fails, clear token and redirect to login only if on protected route
        removeToken();
        setIsAuthenticated(false);
        setIsLoading(false);
        if (!isPublicRoute) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    } else {
      console.log('No token found');
      setIsAuthenticated(false);
      setIsLoading(false);
      // Only redirect to login if trying to access a protected route
      if (!isPublicRoute) {
        console.log('Redirecting to login from protected route:', pathname);
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
  };

  useEffect(() => {
    checkForAuthentication();
  }, [pathname]);

  const logout = (): void => {
    // Clear user data before logout
    setUserDetails({
      email: '',
      name: '',
      id: 0,
    });
    removeToken();
    setIsAuthenticated(false);

    // Clear any cached user data
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing storage on logout:', error);
    }
  };

  const isPublicRoute = pathname ? PUBLIC_ROUTES.includes(pathname) : true;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <UserAuthContext.Provider value={{ isAuthenticated, logout, userDetails }}>
      {(isAuthenticated || isPublicRoute) && children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = (): UserAuthContextType => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};
