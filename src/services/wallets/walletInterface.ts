import { TransactionId } from "@hashgraph/sdk";

export interface WalletInterface {
  createTopic: (memo: string) => Promise<TransactionId | string | null>;
  submitMessage: (topicId: string, message: string) => Promise<TransactionId | string | null>;
  disconnect: () => void;
}