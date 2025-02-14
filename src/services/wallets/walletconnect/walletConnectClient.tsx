// walletConnectWallet.ts
import { useCallback, useContext, useEffect } from "react";
import { WalletConnectContext } from "../../../contexts/WalletConnectContext";
import { WalletInterface } from "../walletInterface";
import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  TransactionId,
  Transaction,
  Client,
  LedgerId,
  AccountId
} from "@hashgraph/sdk";
import {
  DAppConnector,
  HederaJsonRpcMethod,
  HederaSessionEvent,
  HederaChainId,
  SignAndExecuteTransactionParams,
  transactionToBase64String
} from "@hashgraph/hedera-wallet-connect";
import { appConfig } from "../../../config";
import EventEmitter from "events";

const refreshEvent = new EventEmitter();
const walletConnectProjectId = "377d75bb6f86a2ffd427d032ff6ea7d3";
const currentNetworkConfig = appConfig.networks.testnet;
const hederaNetwork = currentNetworkConfig.network;
const hederaClient = Client.forName(hederaNetwork);

const metadata = {
  name: "Hedera CRA Template",
  description: "Hedera CRA Template",
  url: window.location.origin,
  icons: [window.location.origin + "/logo192.png"]
};

export const dappConnector = new DAppConnector(
  metadata,
  LedgerId.fromString(hederaNetwork),
  walletConnectProjectId,
  Object.values(HederaJsonRpcMethod),
  [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
  [HederaChainId.Testnet]
);

let walletConnectInitPromise: Promise<void> | undefined;
const initializeWalletConnect = async () => {
  if (!walletConnectInitPromise) {
    walletConnectInitPromise = dappConnector.init();
  }
  await walletConnectInitPromise;
};

export const openWalletConnectModal = async () => {
  await initializeWalletConnect();
  await dappConnector.openModal().then(() => {
    refreshEvent.emit("sync");
  });
};

class WalletConnectWallet implements WalletInterface {
  private accountId() {
    return AccountId.fromString(dappConnector.signers[0].getAccountId().toString());
  }

  private freezeTx(transaction: Transaction) {
    const nodeAccountIds = hederaClient._network.getNodeAccountIdsForExecute();
    return transaction
      .setTransactionId(TransactionId.generate(this.accountId()))
      .setNodeAccountIds(nodeAccountIds)
      .freeze();
  }

  private async signAndExecuteTransaction(transaction: Transaction) {
    const params: SignAndExecuteTransactionParams = {
      signerAccountId: `::${this.accountId().toString()}`,
      transactionList: transactionToBase64String(transaction)
    };
    try {
      const result = await dappConnector.signAndExecuteTransaction(params);
      return result.result;
    } catch {
      return null;
    }
  }

  async createTopic(memo: string) {
    const tx = new TopicCreateTransaction().setTopicMemo(memo);
    const frozenTx = this.freezeTx(tx);
    const txResult = await this.signAndExecuteTransaction(frozenTx);
    return txResult ? txResult.transactionId : null;
  }

  async submitMessage(topicId: string, message: string) {
    const parsedTopicId = TopicId.fromString(topicId);
    const tx = new TopicMessageSubmitTransaction().setTopicId(parsedTopicId).setMessage(message);
    const frozenTx = this.freezeTx(tx);
    const txResult = await this.signAndExecuteTransaction(frozenTx);
    return txResult ? txResult.transactionId : null;
  }

  disconnect() {
    dappConnector.disconnectAll().then(() => {
      refreshEvent.emit("sync");
    });
  }
}

export const walletConnectWallet = new WalletConnectWallet();

export const WalletConnectClient = () => {
  const { setAccountId, setIsConnected } = useContext(WalletConnectContext);

  const syncWithWalletConnectContext = useCallback(() => {
    const account = dappConnector.signers[0]?.getAccountId()?.toString();
    if (account) {
      setAccountId(account);
      setIsConnected(true);
    } else {
      setAccountId("");
      setIsConnected(false);
    }
  }, [setAccountId, setIsConnected]);

  useEffect(() => {
    refreshEvent.addListener("sync", syncWithWalletConnectContext);
    initializeWalletConnect().then(() => {
      syncWithWalletConnectContext();
    });
    return () => {
      refreshEvent.removeListener("sync", syncWithWalletConnectContext);
    };
  }, [syncWithWalletConnectContext]);

  return null;
};
