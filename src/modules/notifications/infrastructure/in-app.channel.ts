import { NotificationChannel, NotificationPayload } from '../domain/notification-channel.interface';
import { NotificationModel } from './notification.model';
import { connectDB } from '@/shared/lib/db';

/**
 * InAppChannel — stores notifications in MongoDB for in-app display.
 */
export class InAppChannel implements NotificationChannel {
  readonly key = 'in_app';

  async deliver(params: NotificationPayload): Promise<void> {
    await connectDB();
    await NotificationModel.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      isRead: false,
    });
  }
}
