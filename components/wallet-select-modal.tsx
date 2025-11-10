"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { useSolanaWallet } from "./solana-wallet-provider";
import { useEffect } from "react";

interface WalletSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Wallet metadata with logo URLs
const WALLET_METADATA: Record<
  string,
  { name: string; icon: string; installUrl: string }
> = {
  Phantom: {
    name: "Phantom",
    icon: "https://academy-public.coinmarketcap.com/optimized-uploads/242264094c2f476983512c1ead9bd3d6.png",
    installUrl: "https://phantom.app/",
  },
  Solflare: {
    name: "Solflare",
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBQwXV8TrXVS6K7QxfdLc9qpG3H22aYivwXw&s",
    installUrl: "https://solflare.com/",
  },
  Backpack: {
    name: "Backpack",
    icon: "https://play-lh.googleusercontent.com/oU0hWlCk3ZT_5dng09QaxdcIUpY2m5GkZGDa4TrbJ36zG6zxKL2yFPyC9jvnMeecRPA",
    installUrl: "https://www.backpack.app/",
  },
};

export function WalletSelectModal({ isOpen, onClose }: WalletSelectModalProps) {
  const { availableWallets, connectWallet, connecting } = useSolanaWallet();

  // Refresh wallet detection when modal opens
  useEffect(() => {
    if (isOpen) {
      // Trigger a wallet detection refresh by dispatching a custom event
      // This will be handled by the wallet provider if needed
      window.dispatchEvent(new Event("wallet-detection-refresh"));
    }
  }, [isOpen]);

  const handleWalletSelect = async (provider: any, walletName: string) => {
    if (!provider) {
      console.error("No provider available for", walletName);
      return;
    }
    
    try {
      await connectWallet(provider);
      onClose();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      // Error is already handled by the wallet provider's toast
    }
  };

  // Only show installed wallets
  const allWallets = availableWallets.map((wallet) => ({
    ...wallet,
    metadata: WALLET_METADATA[wallet.name] || {
      name: wallet.name,
      icon: wallet.icon || "",
      installUrl: "",
    },
    isInstalled: true,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 backdrop-blur-md border-4 border-purple-500/30 dark:border-purple-400/30 rounded-2xl p-8 max-w-lg w-full relative shadow-2xl"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative gradient blobs */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-500/30 rounded-full blur-3xl pointer-events-none"></div>

            {/* Close button */}
            <button
              className="absolute top-6 right-6 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              onClick={onClose}
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-500 via-yellow-500 to-purple-500 bg-clip-text text-transparent">
                Connect Wallet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Choose your preferred Solana wallet to continue
              </p>
            </div>

            {/* Wallet list */}
            <div className="space-y-3 mb-6">
              {allWallets.map((wallet, index) => (
                <motion.button
                  key={wallet.name}
                  className="w-full relative group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    if (wallet.provider) {
                      handleWalletSelect(wallet.provider, wallet.name);
                    }
                  }}
                  disabled={connecting}
                >
                  <motion.div
                    className="flex items-center justify-between p-5 border-2 border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/20"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Wallet Icon */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-yellow-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative w-14 h-14 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden shadow-sm">
                          <img
                            src={wallet.metadata.icon || wallet.icon}
                            alt={wallet.name}
                            className="w-12 h-12 object-contain"
                            style={{ display: 'block' }}
                            onError={(e) => {
                              // Fallback to wallet icon if metadata icon fails
                              const target = e.target as HTMLImageElement;
                              console.error('Failed to load wallet icon:', wallet.metadata.icon);
                              if (wallet.icon && wallet.icon !== wallet.metadata.icon) {
                                target.src = wallet.icon;
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Wallet Name */}
                      <div className="text-left flex-1">
                        <span className="font-bold text-lg text-gray-900 dark:text-white">
                          {wallet.metadata.name}
                        </span>
                      </div>
                    </div>

                    {/* Arrow icon */}
                    <motion.div
                      className="text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors"
                      animate={{
                        x: [0, 5, 0],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut",
                      }}
                    >
                      <ArrowRight className="h-6 w-6" />
                    </motion.div>
                  </motion.div>
                </motion.button>
              ))}
            </div>

            {/* Loading overlay */}
            {connecting && (
              <motion.div
                className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    Connecting wallet...
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

