import { NotificationChannel, NotificationPayload } from '../domain/notification-channel.interface';
import { UserModel } from '@/modules/users/infrastructure/user.model';
import { sendEmail } from '@/shared/lib/mailer';
import { connectDB } from '@/shared/lib/db';

/**
 * EmailChannel — mirrors every in-app notification to email. A second
 * implementation of NotificationChannel (see notification-channel.interface.ts),
 * added without touching InAppChannel, per the Open/Closed abstraction the
 * notification system was designed for.
 */
export class EmailChannel implements NotificationChannel {
  readonly key = 'email';

  async deliver(params: NotificationPayload): Promise<void> {
    await connectDB();
    const user = await UserModel.findById(params.userId).select('email name').lean();
    if (!user) return;

    await sendEmail({
      to: (user as { email: string }).email,
      subject: params.title,
      html: `<p>Hi ${(user as { name?: string }).name || 'there'},</p><p>${params.body}</p>`,
      text: params.body,
    });
  }
}
