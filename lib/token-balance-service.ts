/**
 * Token Balance Service
 * Fetches SPL token balances from Solana wallet
 */

import { Connection, PublicKey } from "@solana/web3.js";

export interface TokenBalance {
  mintAddress: string;
  balance: number;
  decimals: number;
  tokenAccount?: string;
}

export class TokenBalanceService {
  /**
   * Get all SPL token balances for a wallet
   */
  static async getTokenBalances(
    connection: Connection,
    walletAddress: string
  ): Promise<TokenBalance[]> {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Get all token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        }
      );

      const balances: TokenBalance[] = [];

      for (const accountInfo of tokenAccounts.value) {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        const tokenAmount = parsedInfo.tokenAmount;

        // Only include tokens with non-zero balance
        if (tokenAmount.uiAmount > 0) {
          balances.push({
            mintAddress,
            balance: tokenAmount.uiAmount,
            decimals: tokenAmount.decimals,
            tokenAccount: accountInfo.pubkey.toString(),
          });
        }
      }

      return balances;
    } catch (error) {
      console.error("Error fetching token balances:", error);
      return [];
    }
  }

  /**
   * Get balance for a specific token
   */
  static async getTokenBalance(
    connection: Connection,
    walletAddress: string,
    mintAddress: string
  ): Promise<TokenBalance | null> {
    try {
      const balances = await this.getTokenBalances(connection, walletAddress);
      return balances.find((b) => b.mintAddress === mintAddress) || null;
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return null;
    }
  }
}

