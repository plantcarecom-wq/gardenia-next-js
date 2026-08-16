/**
 * NotificationChannel interface — abstracts how notifications are delivered.
 * Phase 5 ships with InAppChannel; future channels (email, SMS, push) implement the same contract.
 */
export interface NotificationChannel {
  /** Unique channel key */
  readonly key: string;

  /** Deliver a notification to the user */
  deliver(params: NotificationPayload): Promise<void>;
}

export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
}
