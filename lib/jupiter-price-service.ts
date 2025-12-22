/**
 * Jupiter Price API Service
 * Fetches real-time token prices from Jupiter Exchange API
 */

export interface TokenPrice {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
  priceChange24h?: number;
  priceChange7d?: number;
}

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

const JUPITER_PRICE_API = "https://price.jup.ag/v4";

export class JupiterPriceService {
  /**
   * Get price for a specific token
   */
  static async getTokenPrice(
    mintAddress: string,
    vsToken: string = "So11111111111111111111111111111111111111112" // SOL
  ): Promise<TokenPrice | null> {
    try {
      const response = await fetch(
        `${JUPITER_PRICE_API}/price?ids=${mintAddress}&vsToken=${vsToken}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch price: ${response.statusText}`);
      }

      const data = await response.json();
      const priceData = data.data?.[mintAddress];

      if (!priceData) {
        return null;
      }

      return {
        id: mintAddress,
        mintSymbol: priceData.mintSymbol || "UNKNOWN",
        vsToken: vsToken,
        vsTokenSymbol: priceData.vsTokenSymbol || "SOL",
        price: priceData.price || 0,
        priceChange24h: priceData.priceChange24h || 0,
        priceChange7d: priceData.priceChange7d || 0,
      };
    } catch (error) {
      console.error("Error fetching token price:", error);
      return null;
    }
  }

  /**
   * Get prices for multiple tokens
   */
  static async getTokenPrices(
    mintAddresses: string[],
    vsToken: string = "So11111111111111111111111111111111111111112"
  ): Promise<Map<string, TokenPrice>> {
    try {
      if (mintAddresses.length === 0) {
        return new Map();
      }

      const ids = mintAddresses.join(",");
      const response = await fetch(
        `${JUPITER_PRICE_API}/price?ids=${ids}&vsToken=${vsToken}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
      }

      const data = await response.json();
      const prices = new Map<string, TokenPrice>();

      for (const [mintAddress, priceData] of Object.entries(data.data || {})) {
        const priceInfo = priceData as any;
        prices.set(mintAddress, {
          id: mintAddress,
          mintSymbol: priceInfo.mintSymbol || "UNKNOWN",
          vsToken: vsToken,
          vsTokenSymbol: priceInfo.vsTokenSymbol || "SOL",
          price: priceInfo.price || 0,
          priceChange24h: priceInfo.priceChange24h || 0,
          priceChange7d: priceInfo.priceChange7d || 0,
        });
      }

      return prices;
    } catch (error) {
      console.error("Error fetching token prices:", error);
      return new Map();
    }
  }

  /**
   * Get token metadata from Jupiter token list
   */
  static async getTokenMetadata(mintAddress: string): Promise<TokenMetadata | null> {
    try {
      // Try to get from Jupiter's token list
      const response = await fetch(
        `https://token.jup.ag/strict`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch token list: ${response.statusText}`);
      }

      const tokens = await response.json();
      const token = tokens.find((t: any) => t.address === mintAddress);

      if (token) {
        return {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          logoURI: token.logoURI,
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching token metadata:", error);
      return null;
    }
  }

  /**
   * Get SOL price in USD
   */
  static async getSOLPrice(): Promise<number> {
    try {
      const response = await fetch(
        `${JUPITER_PRICE_API}/price?ids=So11111111111111111111111111111111111111112`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch SOL price: ${response.statusText}`);
      }

      const data = await response.json();
      // Jupiter returns price in USD by default when no vsToken is specified
      return data.data?.["So11111111111111111111111111111111111111112"]?.price || 0;
    } catch (error) {
      console.error("Error fetching SOL price:", error);
      return 0;
    }
  }
}

