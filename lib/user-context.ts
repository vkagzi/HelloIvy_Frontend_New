// lib/user-context.ts
// User context validation and security utilities

export interface UserContextValidator {
  validateUserSession(): Promise<boolean>;
  getUserId(): Promise<string | null>;
  clearUserData(): void;
  checkDataOwnership(data: any): boolean;
}

export class UserContext implements UserContextValidator {
  async validateUserSession(): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return false;

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch('/api/accounts/me', {
        credentials: 'include',
        headers,
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async getUserId(): Promise<string | null> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch('/api/accounts/me', {
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        const userData = await response.json();
        return userData.id?.toString() || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  clearUserData(): void {
    // Clear all potential user data from memory and storage
    try {
      // Clear localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('user_') ||
            key.includes('college_') ||
            key.includes('profile_'))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Clear sessionStorage
      sessionStorage.clear();

      console.log('User data cleared successfully');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  checkDataOwnership(data: any): boolean {
    // Check if data belongs to current user
    try {
      if (!data) return true; // Empty data is safe

      // Check for user field in data
      if (data.user && typeof data.user === 'number') {
        // Would need to validate against current user ID
        // This is a placeholder - actual implementation would need server validation
        return true;
      }

      // If no user field, assume it's safe (might be non-user-specific data)
      return true;
    } catch {
      return false;
    }
  }

  // Secure API call wrapper that ensures user context
  async secureApiCall(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const isValid = await this.validateUserSession();
    if (!isValid) {
      throw new Error('Invalid user session');
    }

    const token = localStorage.getItem('auth_token');
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    return fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });
  }

  // Monitor for user changes
  startUserMonitoring(
    onUserChange: () => void,
    intervalMs: number = 30000
  ): () => void {
    let currentUserId: string | null = null;

    const checkUser = async () => {
      const userId = await this.getUserId();

      if (currentUserId === null) {
        currentUserId = userId;
      } else if (currentUserId !== userId) {
        console.log('User context changed, triggering cleanup');
        this.clearUserData();
        onUserChange();
        currentUserId = userId;
      }
    };

    // Initial check
    checkUser();

    // Periodic check
    const interval = setInterval(checkUser, intervalMs);

    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  }
}

// Singleton instance
export const userContext = new UserContext();

// Hook for React components
export const useUserContext = () => {
  return userContext;
};

export default UserContext;
