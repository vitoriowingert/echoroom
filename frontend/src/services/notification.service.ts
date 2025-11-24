/**
 * Notification service for browser notifications
 */
class NotificationService {
  private permission: NotificationPermission = 'default';
  private notificationsEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Set whether notifications are enabled
   */
  setNotificationsEnabled(enabled: boolean) {
    this.notificationsEnabled = enabled;
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are available and enabled
   */
  canNotify(): boolean {
    // Update permission from browser in case it changed
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
    
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      this.permission === 'granted' &&
      this.notificationsEnabled
    );
  }

  /**
   * Show a notification
   */
  async showNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<Notification | null> {
    // Update permission from browser in case it changed
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }

    if (!this.canNotify()) {
      console.log('Cannot notify:', {
        hasWindow: typeof window !== 'undefined',
        hasNotification: typeof window !== 'undefined' && 'Notification' in window,
        permission: this.permission,
        notificationsEnabled: this.notificationsEnabled,
      });
      return null;
    }

    // Don't show notification if the window is focused (optional - can be removed for testing)
    // For now, we'll allow notifications even when focused, but you can uncomment this for production
    // if (document.hasFocus()) {
    //   return null;
    // }

    try {
      console.log('Showing notification:', { title, body: options.body });
      const notification = new Notification(title, {
        icon: '/favicon.ico', // You can customize this
        badge: '/favicon.ico',
        tag: options.tag || 'echoroom-notification',
        requireInteraction: false,
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click to focus window
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Handle errors
      notification.onerror = (error) => {
        console.error('Notification error:', error);
      };

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  /**
   * Show a message notification
   */
  async showMessageNotification(
    username: string,
    message: string,
    roomName?: string
  ): Promise<Notification | null> {
    const title = roomName ? `${username} in ${roomName}` : username;
    const body = message.length > 100 ? message.substring(0, 100) + '...' : message;

    return this.showNotification(title, {
      body,
      tag: `message-${Date.now()}`, // Unique tag to allow multiple notifications
    });
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = new NotificationService();

