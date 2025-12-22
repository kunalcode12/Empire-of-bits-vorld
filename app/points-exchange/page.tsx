"use client";

import { useState, useEffect, useCallback } from "react";
import { useSolanaWallet } from "@/components/solana-wallet-provider";
import PointsManager from "@/components/points-manager";
import WalletStatus from "@/components/wallet-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Coins, AlertTriangle, Info, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { WalletSelectModal } from "@/components/wallet-select-modal";
import Link from "next/link";

export default function PointsExchangePage() {
  const { connected, walletAddress } = useSolanaWallet();
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const updateUserPointsInBackend = useCallback(
    async (delta: number) => {
      if (!walletAddress || delta === 0) {
        return;
      }

      try {
        setIsSyncing(true);
        const operation = delta > 0 ? "add" : "deduct";

        const response = await fetch(
          `https://backend.empireofbits.fun/api/v1/users/${walletAddress}/points`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              points: Math.abs(delta),
              operation,
            }),
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to update points in backend");
        }
      } catch (error) {
        console.error("Error updating points in backend:", error);
        throw error;
      } finally {
        setIsSyncing(false);
      }
    },
    [walletAddress]
  );

  const fetchUserPoints = useCallback(async () => {
    if (!walletAddress) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "https://backend.empireofbits.fun/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: walletAddress,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setUserPoints(data.data.points);
      } else {
        console.error("Failed to fetch user points:", data.message);
        setUserPoints(0);
      }
    } catch (error) {
      console.error("Error fetching points:", error);
      setUserPoints(0);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (connected && walletAddress) {
      fetchUserPoints();
    } else {
      setUserPoints(0);
      setIsLoading(false);
    }
  }, [connected, walletAddress, fetchUserPoints]);

  // Update user points
  const handlePointsUpdate = (newPoints: number) => {
    const delta = newPoints - userPoints;
    setUserPoints(newPoints);

    if (delta !== 0) {
      updateUserPointsInBackend(delta).catch(() => {
        // Revert to previous points on failure
        setUserPoints(userPoints);
      });
    }
  };

  return (
    <>
      {/* Back button */}
      <div className="fixed top-4 left-4 z-50">
        <Link href="/">
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-md border border-foreground/10 rounded-full hover:border-foreground/30 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </motion.button>
        </Link>
      </div>

      {/* Wallet Select Modal */}
      {!connected && (
        <WalletSelectModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      )}

      <div className="container mx-auto py-12 px-4 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2">Points Exchange</h1>
          <p className="text-xl text-foreground/70 mb-8">
            Buy and sell points using your Solana wallet
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Wallet status */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <WalletStatus onConnectClick={() => setShowWalletModal(true)} />
            </motion.div>
          </div>

          {/* Middle column - Points exchange */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Coins className="mr-2 h-6 w-6 text-[hsl(var(--accent-yellow))]" />
                    Points Exchange
                  </CardTitle>
                  <CardDescription>
                    Buy and sell points using your Solana wallet on devnet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!connected ? (
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Wallet not connected</AlertTitle>
                      <AlertDescription>
                        Please connect your Solana wallet to buy and sell points
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="mb-6">
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                          <div className="flex items-center">
                            <Coins className="h-6 w-6 mr-2 text-[hsl(var(--accent-yellow))]" />
                            <span className="text-2xl font-bold">
                              {isLoading || isSyncing ? "..." : userPoints}
                            </span>
                            <span className="ml-2 text-foreground/70">
                              points
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <PointsManager
                          userPoints={userPoints}
                          onPointsUpdate={handlePointsUpdate}
                        />

                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>Exchange Rate</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc list-inside text-sm">
                              <li>Buy: 150 points for 0.01 SOL</li>
                              <li>Sell: 150 points for 0.01 SOL</li>
                            </ul>
                          </AlertDescription>
                        </Alert>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Transaction history card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    Your recent point transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {connected ? (
                    <div className="text-center py-6 text-foreground/70">
                      <p>No transactions yet</p>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-foreground/70">
                      <p>Connect your wallet to view transaction history</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
