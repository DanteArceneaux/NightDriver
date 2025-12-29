/**
 * Safe localStorage wrapper with quota error handling
 */

export class SafeStorage {
  /**
   * Safely set item in localStorage with quota error handling
   */
  static setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof DOMException && (error.code === 22 || error.name === 'QuotaExceededError')) {
        console.warn('⚠️ localStorage quota exceeded, attempting cleanup...');
        this.cleanup();
        
        // Try again after cleanup
        try {
          localStorage.setItem(key, value);
          console.log('✅ Successfully saved after cleanup');
          return true;
        } catch (retryError) {
          console.error('❌ Still cannot save after cleanup:', retryError);
          return false;
        }
      }
      console.error('localStorage.setItem error:', error);
      return false;
    }
  }

  /**
   * Safely get item from localStorage
   */
  static getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage.getItem error:', error);
      return null;
    }
  }

  /**
   * Safely remove item from localStorage
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage.removeItem error:', error);
    }
  }

  /**
   * Clean up old or unnecessary localStorage data
   */
  static cleanup(): void {
    console.log('🧹 Cleaning up localStorage...');
    
    try {
      // Get all keys
      const keys = Object.keys(localStorage);
      console.log(`Found ${keys.length} items in localStorage`);

      // Remove old card grid layouts (keep only the most recent)
      const gridKeys = keys.filter(k => k.includes('card-grid'));
      if (gridKeys.length > 10) {
        console.log(`Removing ${gridKeys.length - 5} old grid layouts`);
        gridKeys.slice(0, gridKeys.length - 5).forEach(key => {
          localStorage.removeItem(key);
        });
      }

      // Remove old cockpit layouts
      const cockpitKeys = keys.filter(k => k.includes('cockpit-layout'));
      if (cockpitKeys.length > 5) {
        console.log(`Removing ${cockpitKeys.length - 2} old cockpit layouts`);
        cockpitKeys.slice(0, cockpitKeys.length - 2).forEach(key => {
          localStorage.removeItem(key);
        });
      }

      // Check storage usage
      let totalSize = 0;
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      });

      console.log(`📊 localStorage usage: ${(totalSize / 1024).toFixed(2)} KB`);

      // If still over 4MB, do aggressive cleanup
      if (totalSize > 4 * 1024 * 1024) {
        console.warn('⚠️ Storage still over 4MB, doing aggressive cleanup');
        keys.forEach(key => {
          // Keep only essential data
          if (!key.includes('version') && !key.includes('locked') && !key.includes('vehicleType')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get storage info for debugging
   */
  static getStorageInfo(): { keys: number; estimatedSize: number } {
    try {
      const keys = Object.keys(localStorage);
      let totalSize = 0;
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      });

      return {
        keys: keys.length,
        estimatedSize: totalSize
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { keys: 0, estimatedSize: 0 };
    }
  }

  /**
   * Clear all localStorage (emergency use only)
   */
  static clearAll(): void {
    try {
      localStorage.clear();
      console.log('🗑️ localStorage cleared');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

// Auto-cleanup on page load if storage is getting full
if (typeof window !== 'undefined') {
  const info = SafeStorage.getStorageInfo();
  console.log(`📦 localStorage: ${info.keys} items, ${(info.estimatedSize / 1024).toFixed(2)} KB`);
  
  // If over 3MB, do cleanup
  if (info.estimatedSize > 3 * 1024 * 1024) {
    console.warn('⚠️ localStorage over 3MB, cleaning up...');
    SafeStorage.cleanup();
  }
}




