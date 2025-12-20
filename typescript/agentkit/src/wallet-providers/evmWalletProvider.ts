import { toAccount } from "viem/accounts";
import { WalletProvider } from "./walletProvider";
import {
  TransactionRequest,
  ReadContractParameters,
  ReadContractReturnType,
  ContractFunctionName,
  Abi,
  ContractFunctionArgs,
  Address,
  Account,
  TransactionReceipt,
} from "viem";

/**
 * EvmWalletProvider is the abstract base class for all EVM wallet providers.
 *
 * @abstract
 */
export abstract class EvmWalletProvider extends WalletProvider {
  /**
   * Convert the wallet provider to a Signer.
   *
   * @returns The signer.
   */
  toSigner(): Account {
    return toAccount({
      address: this.getAddress() as Address,
      signMessage: async ({ message }) => {
        return this.signMessage(message as string | Uint8Array);
      },
      signTransaction: async transaction => {
        return this.signTransaction(transaction as TransactionRequest);
      },
      signTypedData: async typedData => {
        if (!typedData.domain || !typedData.types || !typedData.primaryType || !typedData.message) {
          throw new Error("Invalid typed data: missing required fields");
        }
        return this.signTypedData({
          domain: typedData.domain as Record<string, unknown>,
          types: typedData.types as Record<string, Array<{ name: string; type: string }>>,
          primaryType: typedData.primaryType,
          message: typedData.message as Record<string, unknown>,
        });
      },
    });
  }

  /**
   * Sign a message.
   *
   * @param message - The message to sign.
   * @returns The signed message.
   */
  abstract signMessage(message: string | Uint8Array): Promise<`0x${string}`>;

  /**
   * Sign typed data according to EIP-712.
   *
   * @param typedData - The typed data to sign.
   * @param typedData.domain - The domain object containing contract and chain information.
   * @param typedData.types - The type definitions for the structured data.
   * @param typedData.primaryType - The primary type being signed.
   * @param typedData.message - The actual data to sign.
   * @returns The signed typed data.
   */
  abstract signTypedData(typedData: {
    domain: Record<string, unknown>;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }): Promise<`0x${string}`>;

  /**
   * Sign a transaction.
   *
   * @param transaction - The transaction to sign.
   * @returns The signed transaction.
   */
  abstract signTransaction(transaction: TransactionRequest): Promise<`0x${string}`>;

  /**
   * Send a transaction.
   *
   * @param transaction - The transaction to send.
   * @returns The transaction hash.
   */
  abstract sendTransaction(transaction: TransactionRequest): Promise<`0x${string}`>;

  /**
   * Wait for a transaction receipt.
   *
   * @param txHash - The transaction hash.
   * @returns The transaction receipt.
   */
  abstract waitForTransactionReceipt(txHash: `0x${string}`): Promise<TransactionReceipt>;

  /**
   * Read a contract.
   *
   * @param params - The parameters to read the contract.
   * @returns The response from the contract.
   */
  abstract readContract<
    const abi extends Abi | readonly unknown[],
    functionName extends ContractFunctionName<abi, "pure" | "view">,
    const args extends ContractFunctionArgs<abi, "pure" | "view", functionName>,
  >(
    params: ReadContractParameters<abi, functionName, args>,
  ): Promise<ReadContractReturnType<abi, functionName, args>>;
}
