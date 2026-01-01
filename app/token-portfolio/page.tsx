"use client";

import { useState, useEffect, useCallback } from "react";
import { useSolanaWallet } from "@/components/solana-wallet-provider";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TokenBalanceService, TokenBalance } from "@/lib/token-balance-service";
import TokenPortfolioCard from "@/components/token-portfolio-card";
import PortfolioSummary from "@/components/portfolio-summary";
import AddTokenDialog from "@/components/add-token-dialog";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Wallet, AlertCircle, Search, Filter, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const HELIUS_RPC_ENDPOINT = "https://devnet.helius-rpc.com/?api-key=a969d395-9864-418f-8a64-65c1ef2107f9";

interface TokenInfo {
  mintAddress: string;
  name: string;
  symbol: string;
  balance: number;
  decimals: number;
  logoURI?: string;
}

type SortOption = "name" | "balance";

export default function TokenPortfolioPage() {
  const { connected, walletAddress } = useSolanaWallet();
  const [connection] = useState(() => new Connection(HELIUS_RPC_ENDPOINT, "confirmed"));
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [manualTokens, setManualTokens] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const { toast } = useToast();

  // Load manual tokens from localStorage
  useEffect(() => {
    if (walletAddress) {
      const stored = localStorage.getItem(`manual_tokens_${walletAddress}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setManualTokens(parsed);
        } catch (e) {
          console.error("Error parsing manual tokens:", e);
        }
      }
    } else {
      setManualTokens([]);
    }
  }, [walletAddress]);

  // Fetch token balances
  const fetchPortfolio = useCallback(async () => {
    if (!connected || !walletAddress || !connection) {
      setTokens([]);
      setFilteredTokens([]);
      return;
    }

    setIsLoading(true);
    try {
      // Get SOL balance
      const publicKey = new PublicKey(walletAddress);
      const solBalance = await connection.getBalance(publicKey);
      const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;

      // Get SPL token balances
      const tokenBalances = await TokenBalanceService.getTokenBalances(
        connection,
        walletAddress
      );

      // Build token info array
      const tokenInfos: TokenInfo[] = [];

      // Add SOL (always show if balance > 0 or manually added)
      if (solBalanceInSol > 0 || manualTokens.includes("So11111111111111111111111111111111111111112")) {
        tokenInfos.push({
          mintAddress: "So11111111111111111111111111111111111111112",
          name: "Solana",
          symbol: "SOL",
          balance: solBalanceInSol,
          decimals: 9,
          logoURI:
            "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        });
      }

      // Add SPL tokens
      for (const tokenBalance of tokenBalances) {
        tokenInfos.push({
          mintAddress: tokenBalance.mintAddress,
          name: "Unknown Token",
          symbol: "UNKNOWN",
          balance: tokenBalance.balance,
          decimals: tokenBalance.decimals,
        });
      }

      // Add manually added tokens (even if balance is 0)
      for (const mintAddress of manualTokens) {
        if (
          !tokenInfos.find((t) => t.mintAddress === mintAddress) &&
          mintAddress !== "So11111111111111111111111111111111111111112"
        ) {
          const balance = await TokenBalanceService.getTokenBalance(
            connection,
            walletAddress,
            mintAddress
          );

          tokenInfos.push({
            mintAddress,
            name: "Unknown Token",
            symbol: "UNKNOWN",
            balance: balance?.balance || 0,
            decimals: balance?.decimals || 9,
          });
        }
      }

      setTokens(tokenInfos);
    } catch (error: any) {
      console.error("Error fetching portfolio:", error);
      toast({
        title: "Error",
        description: "Failed to fetch portfolio data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [connected, walletAddress, connection, manualTokens, toast]);

  // Fetch portfolio when dependencies change
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Filter and sort tokens
  useEffect(() => {
    let filtered = [...tokens];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (token) =>
          token.symbol.toLowerCase().includes(query) ||
          token.name.toLowerCase().includes(query) ||
          token.mintAddress.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.symbol.localeCompare(b.symbol);

        case "balance":
          return b.balance - a.balance;

        default:
          return 0;
      }
    });

    setFilteredTokens(filtered);
  }, [tokens, searchQuery, sortBy]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (connected) {
      const interval = setInterval(fetchPortfolio, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, fetchPortfolio]);

  const handleAddToken = async (mintAddress: string) => {
    if (walletAddress && !manualTokens.includes(mintAddress)) {
      const updated = [...manualTokens, mintAddress];
      setManualTokens(updated);
      localStorage.setItem(
        `manual_tokens_${walletAddress}`,
        JSON.stringify(updated)
      );
      
      toast({
        title: "Token Added",
        description: "Token has been added to your portfolio. Fetching data...",
      });
      
      // Immediately fetch portfolio to show the new token
      await fetchPortfolio();
    }
  };

  const handleRemoveToken = (mintAddress: string) => {
    if (walletAddress && manualTokens.includes(mintAddress)) {
      const updated = manualTokens.filter((addr) => addr !== mintAddress);
      setManualTokens(updated);
      localStorage.setItem(
        `manual_tokens_${walletAddress}`,
        JSON.stringify(updated)
      );
      
      // Remove from tokens list
      setTokens((prev) => prev.filter((t) => t.mintAddress !== mintAddress));
      
      toast({
        title: "Token Removed",
        description: "Token has been removed from your portfolio",
      });
    }
  };

  const calculateTotalValue = (): number => {
    // Price calculation removed - Jupiter service no longer available
    return 0;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
        {/* Animated background effects */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-purple-500 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
        </div>

        <div className="container mx-auto py-12 px-4 mt-28 relative z-10">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-500 via-yellow-500 to-purple-500 bg-clip-text text-transparent">
                  Token Portfolio
                </h1>
                <p className="text-xl text-foreground/70">
                  Track your Solana token holdings
                </p>
              </div>
              {connected && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-gradient-to-r from-[hsl(var(--accent-purple))] to-[hsl(var(--accent-yellow))] hover:from-[hsl(var(--accent-purple))/80] hover:to-[hsl(var(--accent-yellow))/80] text-white font-bold px-6 py-6 text-lg shadow-lg"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Token
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Search and Filter Bar */}
            {connected && tokens.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 mb-6"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/50" />
                  <Input
                    placeholder="Search tokens by name, symbol, or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 h-12 text-lg border-3 border-foreground bg-background/50 backdrop-blur-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/50" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="pl-10 pr-8 h-12 text-lg border-3 border-foreground bg-background/50 backdrop-blur-sm rounded-md appearance-none cursor-pointer"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="balance">Sort by Balance</option>
                  </select>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Content */}
          {!connected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-3 border-foreground bg-background/50 backdrop-blur-sm shadow-2xl">
                <CardContent className="p-16 text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Wallet className="h-24 w-24 mx-auto mb-6 text-[hsl(var(--accent-purple))]" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-3">Connect Your Wallet</h2>
                  <p className="text-foreground/70 mb-8 text-lg">
                    Connect your Solana wallet to view and track your token portfolio
                  </p>
                  <Button
                    onClick={() => {
                      window.dispatchEvent(new Event("wallet-connect-request"));
                    }}
                    className="bg-gradient-to-r from-[hsl(var(--accent-purple))] to-[hsl(var(--accent-yellow))] hover:from-[hsl(var(--accent-purple))/80] hover:to-[hsl(var(--accent-yellow))/80] text-white font-bold px-8 py-6 text-lg"
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : tokens.length === 0 && !isLoading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-3 border-foreground bg-background/50 backdrop-blur-sm shadow-2xl">
                <CardContent className="p-16 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Sparkles className="h-24 w-24 mx-auto mb-6 text-[hsl(var(--accent-yellow))]" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-3">No Tokens Found</h2>
                  <p className="text-foreground/70 mb-8 text-lg">
                    Your wallet doesn't have any tokens yet. Add tokens manually to track them, or receive some tokens to get started!
                  </p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-gradient-to-r from-[hsl(var(--accent-purple))] to-[hsl(var(--accent-yellow))] hover:from-[hsl(var(--accent-purple))/80] hover:to-[hsl(var(--accent-yellow))/80] text-white font-bold px-8 py-6 text-lg"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Your First Token
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              {/* Portfolio Summary */}
              <div className="mb-8">
                <PortfolioSummary
                  totalValue={calculateTotalValue()}
                  tokenCount={tokens.length}
                  isLoading={isLoading}
                  onRefresh={fetchPortfolio}
                />
              </div>

              {/* Tokens Grid */}
              {filteredTokens.length === 0 && searchQuery ? (
                <Card className="border-3 border-foreground bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 text-foreground/50" />
                    <h3 className="text-xl font-bold mb-2">No tokens found</h3>
                    <p className="text-foreground/70">
                      No tokens match your search query "{searchQuery}"
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredTokens.map((token, index) => {
                      return (
                        <motion.div
                          key={token.mintAddress}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <TokenPortfolioCard
                            mintAddress={token.mintAddress}
                            tokenName={token.name}
                            tokenSymbol={token.symbol}
                            balance={token.balance}
                            logoURI={token.logoURI}
                            isLoading={isLoading}
                            onRefresh={fetchPortfolio}
                            onRemove={
                              manualTokens.includes(token.mintAddress)
                                ? () => handleRemoveToken(token.mintAddress)
                                : undefined
                            }
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Token Dialog */}
        <AddTokenDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAddToken={handleAddToken}
          existingTokens={[
            ...tokens.map((t) => t.mintAddress),
            ...manualTokens,
          ]}
        />
      </div>
    </>
  );
}
