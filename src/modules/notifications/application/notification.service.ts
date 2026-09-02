import { NotificationChannel, NotificationPayload } from '../domain/notification-channel.interface';
import { InAppChannel } from '../infrastructure/in-app.channel';
import { EmailChannel } from '../infrastructure/email.channel';

/**
 * NotificationService — the single entry point for emitting notifications.
 * All modules call `notify()` instead of writing directly to the notification collection.
 */
class NotificationServiceClass {
  private channels: NotificationChannel[] = [];

  constructor() {
    // Register default channels. EmailChannel is always registered — it
    // safely no-ops to a console log via the mailer's dev fallback when SMTP
    // isn't configured, so no env-based branching is needed here.
    this.channels.push(new InAppChannel());
    this.channels.push(new EmailChannel());
  }

  /**
   * Register an additional notification channel (e.g. email, SMS).
   */
  addChannel(channel: NotificationChannel): void {
    this.channels.push(channel);
  }

  /**
   * Send a notification to a user through all registered channels.
   */
  async notify(payload: NotificationPayload): Promise<void> {
    const results = await Promise.allSettled(
      this.channels.map((channel) => channel.deliver(payload))
    );
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(
          `NotificationService: ${this.channels[i].constructor.name} failed to deliver "${payload.type}" to user ${payload.userId}:`,
          result.reason
        );
      }
    });
  }
}

// Singleton
export const NotificationService = new NotificationServiceClass();
