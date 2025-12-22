"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Check, RefreshCw, Sparkles, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PublicKey } from "@solana/web3.js";

interface AddTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToken: (mintAddress: string) => void;
  existingTokens: string[];
}

const POPULAR_TOKENS = [
  {
    name: "Jupiter",
    symbol: "JUP",
    address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    description: "Jupiter Exchange Token",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "USDC",
    symbol: "USDC",
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    description: "USD Coin",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "USDT",
    symbol: "USDT",
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    description: "Tether USD",
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "Bonk",
    symbol: "BONK",
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    description: "Bonk Token",
    color: "from-orange-500 to-red-500",
  },
];

export default function AddTokenDialog({
  isOpen,
  onClose,
  onAddToken,
  existingTokens,
}: AddTokenDialogProps) {
  const [mintAddress, setMintAddress] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMintAddress("");
      setIsValid(null);
    }
  }, [isOpen]);

  const validateAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddressChange = (value: string) => {
    setMintAddress(value);
    if (value.trim()) {
      setIsValid(validateAddress(value.trim()));
    } else {
      setIsValid(null);
    }
  };

  const handleAddToken = async () => {
    const trimmedAddress = mintAddress.trim();

    if (!trimmedAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a token mint address",
        variant: "destructive",
      });
      return;
    }

    if (!validateAddress(trimmedAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Solana address",
        variant: "destructive",
      });
      return;
    }

    if (existingTokens.includes(trimmedAddress)) {
      toast({
        title: "Token Already Added",
        description: "This token is already in your portfolio",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    try {
      onAddToken(trimmedAddress);
      toast({
        title: "🎉 Token Added Successfully!",
        description: "Token has been added to your portfolio and will appear shortly",
      });
      setMintAddress("");
      setIsValid(null);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add token",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleQuickAdd = (token: typeof POPULAR_TOKENS[0]) => {
    if (existingTokens.includes(token.address)) {
      toast({
        title: "Token Already Added",
        description: `${token.symbol} is already in your portfolio`,
        variant: "destructive",
      });
      return;
    }
    onAddToken(token.address);
    toast({
      title: "🎉 Token Added Successfully!",
      description: `${token.symbol} has been added to your portfolio and will appear shortly`,
    });
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  // Debug log
  useEffect(() => {
    if (isOpen) {
      console.log("AddTokenDialog: Dialog should be open");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] border-4 border-foreground bg-background text-foreground shadow-2xl ring-4 ring-purple-500/50 backdrop-blur-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--foreground))' }}>
            <DialogHeader className="pb-4 border-b-2 border-foreground/40">
              <DialogTitle className="flex items-center gap-3 text-3xl font-bold">
                <motion.div 
                  className="p-3 rounded-xl bg-gradient-to-r from-[hsl(var(--accent-purple))] to-[hsl(var(--accent-yellow))] shadow-lg"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Plus className="h-6 w-6 text-white" />
                </motion.div>
                <span className="text-foreground font-extrabold">
                  Add Token to Portfolio
                </span>
              </DialogTitle>
              <DialogDescription className="text-base mt-3 text-foreground font-medium">
                Add a token by entering its mint address or select from popular tokens below
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Manual Input */}
              <div className="p-5 rounded-xl bg-secondary/50 border-2 border-foreground/30">
                <Label htmlFor="mint-address" className="text-lg font-bold mb-4 block flex items-center gap-2 text-foreground">
                  <span>Token Mint Address</span>
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      id="mint-address"
                      placeholder="Enter token mint address..."
                      value={mintAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && isValid && !isValidating) {
                          handleAddToken();
                        }
                      }}
                      className={`font-mono text-base pr-12 h-14 border-3 bg-background text-foreground transition-all placeholder:text-foreground/50 ${
                        isValid === true
                          ? "border-green-500 focus:border-green-500 ring-2 ring-green-500/30"
                          : isValid === false
                          ? "border-red-500 focus:border-red-500 ring-2 ring-red-500/30"
                          : "border-foreground/50 focus:border-[hsl(var(--accent-purple))] focus:ring-2 focus:ring-[hsl(var(--accent-purple))]/30"
                      }`}
                    />
                    {mintAddress && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <span className="text-red-500 text-xs">Invalid</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleAddToken}
                    disabled={isValidating || !mintAddress.trim() || isValid !== true}
                    className="bg-gradient-to-r from-[hsl(var(--accent-purple))] to-[hsl(var(--accent-yellow))] hover:from-[hsl(var(--accent-purple))/90] hover:to-[hsl(var(--accent-yellow))/90] text-white font-bold px-8 h-14 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
                {mintAddress && isValid === false && (
                  <p className="text-sm text-red-500 mt-2">
                    Please enter a valid Solana address
                  </p>
                )}
              </div>

              {/* Popular Tokens */}
              <div>
                <Label className="text-base font-semibold mb-4 block flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Sparkles className="h-5 w-5 text-[hsl(var(--accent-yellow))]" />
                  </motion.div>
                  <span>Popular Tokens</span>
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {POPULAR_TOKENS.map((token) => {
                    const isAdded = existingTokens.includes(token.address);
                    return (
                      <motion.button
                        key={token.address}
                        onClick={() => !isAdded && handleQuickAdd(token)}
                        disabled={isAdded}
                        className={`relative p-6 rounded-xl border-3 transition-all text-left overflow-hidden group ${
                          isAdded
                            ? "border-green-500 bg-green-500/30 cursor-not-allowed shadow-lg shadow-green-500/30"
                            : `border-foreground/60 hover:border-[hsl(var(--accent-purple))] hover:bg-secondary/80 bg-background/90 hover:shadow-xl transition-all`
                        }`}
                        whileHover={!isAdded ? { scale: 1.03, y: -3 } : {}}
                        whileTap={!isAdded ? { scale: 0.97 } : {}}
                      >
                        {/* Background gradient effect */}
                        {!isAdded && (
                          <motion.div 
                            className={`absolute inset-0 bg-gradient-to-br ${token.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 0.2 }}
                          />
                        )}
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-bold text-xl text-foreground">{token.symbol}</p>
                                {isAdded && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                  >
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  </motion.div>
                                )}
                              </div>
                              <p className="text-sm text-foreground font-medium truncate">{token.name}</p>
                              <p className="text-xs text-foreground/70 mt-1 truncate">{token.description}</p>
                            </div>
                            {!isAdded && (
                              <motion.div
                                whileHover={{ rotate: 90, scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Plus className="h-6 w-6 text-foreground/50 group-hover:text-[hsl(var(--accent-purple))] transition-colors" />
                              </motion.div>
                            )}
                          </div>
                          
                          {/* Address display */}
                          <div className="pt-4 border-t-2 border-foreground/40">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-foreground truncate flex-1 bg-secondary/60 px-3 py-2 rounded-lg border-2 border-foreground/30">
                                {token.address.slice(0, 8)}...{token.address.slice(-6)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(token.address);
                                }}
                                className="p-2 hover:bg-secondary rounded-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 border border-foreground/30"
                                title="Copy address"
                              >
                                <Copy className="h-5 w-5 text-foreground hover:text-[hsl(var(--accent-purple))]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
  );
}
