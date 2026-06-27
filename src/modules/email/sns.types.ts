export interface SnsEnvelope {
  Type: 'SubscriptionConfirmation' | 'Notification' | 'UnsubscribeConfirmation';
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  SubscribeURL?: string;
  UnsubscribeURL?: string;
}

interface MailMeta {
  messageId: string;
  tags?: Record<string, string[]>;
}

export interface SesBounceNotification {
  notificationType: 'Bounce';
  bounce: {
    bounceType: 'Permanent' | 'Transient' | 'Undetermined';
    bounceSubType: string;
    bouncedRecipients: { emailAddress: string }[];
    timestamp: string;
  };
  mail: MailMeta;
}

export interface SesComplaintNotification {
  notificationType: 'Complaint';
  complaint: {
    complainedRecipients: { emailAddress: string }[];
    timestamp: string;
    complaintFeedbackType?: string;
  };
  mail: MailMeta;
}

export interface SesDeliveryNotification {
  notificationType: 'Delivery';
  delivery: {
    recipients: string[];
    timestamp: string;
  };
  mail: MailMeta;
}

export type SesNotification =
  | SesBounceNotification
  | SesComplaintNotification
  | SesDeliveryNotification;