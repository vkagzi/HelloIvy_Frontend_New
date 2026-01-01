// lib/user-storage.ts
// Utility for user-specific localStorage operations to prevent cross-user data contamination

export class UserStorage {
  private static getCurrentUserId(): string | null {
    try {
      // Try to decode the JWT token to get user ID
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      // Simple base64 decode of JWT payload (not secure validation, just for user ID)
      const payload = token.split('.')[1];
      if (!payload) return null;

      const decoded = JSON.parse(atob(payload));
      return decoded.user_id?.toString() || decoded.sub?.toString() || null;
    } catch {
      return null;
    }
  }

  private static getUserKey(key: string): string {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.warn('No user ID found for storage operation');
      return key; // Fallback to non-user-specific key
    }
    return `user_${userId}_${key}`;
  }

  public static setItem(key: string, value: string): void {
    try {
      const userKey = this.getUserKey(key);
      localStorage.setItem(userKey, value);
    } catch (error) {
      console.error('Failed to set user-specific localStorage item:', error);
    }
  }

  public static getItem(key: string): string | null {
    try {
      const userKey = this.getUserKey(key);
      return localStorage.getItem(userKey);
    } catch (error) {
      console.error('Failed to get user-specific localStorage item:', error);
      return null;
    }
  }

  public static removeItem(key: string): void {
    try {
      const userKey = this.getUserKey(key);
      localStorage.removeItem(userKey);
    } catch (error) {
      console.error('Failed to remove user-specific localStorage item:', error);
    }
  }

  public static clearUserData(): void {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      const prefix = `user_${userId}_`;
      const keysToRemove: string[] = [];

      // Find all keys for current user
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      // Remove all user-specific keys
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Also clear generic keys that might contain user data
      localStorage.removeItem('college_conversation_transcript');
      localStorage.removeItem('college_preferences_snapshot');

      console.log(
        `Cleared ${keysToRemove.length} user-specific localStorage items`
      );
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // Check if current user matches stored user for a key
  public static validateUserContext(key: string): boolean {
    try {
      const currentUserId = this.getCurrentUserId();
      const userKey = this.getUserKey(key);
      const hasData = localStorage.getItem(userKey) !== null;

      return currentUserId !== null && hasData;
    } catch {
      return false;
    }
  }
}

export default UserStorage;
