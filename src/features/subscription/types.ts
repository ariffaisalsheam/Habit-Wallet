export type SubscriptionTier = "free" | "pro";
export type SubscriptionPaymentStatus = "pending" | "approved" | "rejected";

export type SubscriptionRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tier: "pro";
  amount: number;
  months: number;
  method: "bkash";
  senderNumber: string;
  transactionId: string;
  status: SubscriptionPaymentStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
};

export type SubscriptionRequestInput = {
  amount: number;
  months: number;
  senderNumber: string;
  transactionId: string;
};

export type SubscriptionRequester = {
  userId: string;
  userName: string;
  userEmail: string;
};
