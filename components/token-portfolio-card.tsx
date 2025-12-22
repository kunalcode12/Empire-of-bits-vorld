"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ExternalLink, RefreshCw, X } from "lucide-react";
import { TokenPrice } from "@/lib/jupiter-price-service";
import Image from "next/image";

interface TokenPortfolioCardProps {
  mintAddress: string;
  tokenName: string;
  tokenSymbol: string;
  balance: number;
  price: TokenPrice | null;
  usdValue: number;
  logoURI?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  onRemove?: () => void;
}

export default function TokenPortfolioCard({
  mintAddress,
  tokenName,
  tokenSymbol,
  balance,
  price,
  usdValue,
  logoURI,
  isLoading = false,
  onRefresh,
  onRemove,
}: TokenPortfolioCardProps) {
  const formatBalance = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + "M";
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(2) + "K";
    }
    if (value < 0.0001) {
      return value.toExponential(2);
    }
    return value.toFixed(4);
  };

  const formatPrice = (value: number) => {
    if (value < 0.01) {
      return value.toFixed(6);
    }
    if (value < 1) {
      return value.toFixed(4);
    }
    return value.toFixed(2);
  };

  const priceChange24h = price?.priceChange24h || 0;
  const priceChange7d = price?.priceChange7d || 0;
  const isPositive24h = priceChange24h >= 0;
  const isPositive7d = priceChange7d >= 0;

  const getExplorerUrl = (address: string) => {
    return `https://explorer.solana.com/address/${address}?cluster=devnet`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-3 border-foreground hover:border-[hsl(var(--accent-purple))] transition-all duration-300 bg-background/50 backdrop-blur-sm shadow-lg hover:shadow-xl group">
        <CardContent className="p-5">
          {/* Header with logo and actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {logoURI ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-secondary ring-2 ring-foreground/10 group-hover:ring-[hsl(var(--accent-purple))] transition-all">
                  <Image
                    src={logoURI}
                    alt={tokenSymbol}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-yellow-500 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-foreground/10 group-hover:ring-[hsl(var(--accent-purple))] transition-all">
                  {tokenSymbol.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xl truncate">{tokenSymbol}</h3>
                <p className="text-sm text-foreground/70 truncate">{tokenName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="p-1.5 hover:bg-red-500/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove token"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              )}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="p-1.5 hover:bg-secondary rounded transition-colors"
                  title="Refresh price"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Balance */}
          <div className="mb-4 p-3 bg-gradient-to-r from-secondary/50 to-transparent rounded-lg border border-foreground/10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/70">Balance</span>
              <span className="font-bold text-xl">{formatBalance(balance)}</span>
            </div>
          </div>

          {/* Price Info */}
          {price && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/70">Price</span>
                <span className="font-semibold text-lg">
                  {formatPrice(price.price)} {price.vsTokenSymbol}
                </span>
              </div>

              {/* Price Changes */}
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-lg ${
                  isPositive24h ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  <div className="flex items-center gap-1 mb-1">
                    {isPositive24h ? (
                      <TrendingUp className={`h-3 w-3 ${isPositive24h ? "text-green-500" : "text-red-500"}`} />
                    ) : (
                      <TrendingDown className={`h-3 w-3 ${isPositive24h ? "text-green-500" : "text-red-500"}`} />
                    )}
                    <span className="text-xs text-foreground/70">24h</span>
                  </div>
                  <span className={`text-sm font-bold ${
                    isPositive24h ? "text-green-500" : "text-red-500"
                  }`}>
                    {isPositive24h ? "+" : ""}{priceChange24h.toFixed(2)}%
                  </span>
                </div>

                <div className={`p-2 rounded-lg ${
                  isPositive7d ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  <div className="flex items-center gap-1 mb-1">
                    {isPositive7d ? (
                      <TrendingUp className={`h-3 w-3 ${isPositive7d ? "text-green-500" : "text-red-500"}`} />
                    ) : (
                      <TrendingDown className={`h-3 w-3 ${isPositive7d ? "text-green-500" : "text-red-500"}`} />
                    )}
                    <span className="text-xs text-foreground/70">7d</span>
                  </div>
                  <span className={`text-sm font-bold ${
                    isPositive7d ? "text-green-500" : "text-red-500"
                  }`}>
                    {isPositive7d ? "+" : ""}{priceChange7d.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* USD Value */}
          <div className="pt-4 border-t-2 border-foreground/20">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/70 font-semibold">Value</span>
              <motion.span
                key={usdValue}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="font-bold text-2xl bg-gradient-to-r from-[hsl(var(--accent-yellow))] to-[hsl(var(--accent-purple))] bg-clip-text text-transparent"
              >
                ${usdValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </motion.span>
            </div>
          </div>

          {/* Explorer Link */}
          <a
            href={getExplorerUrl(mintAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 mt-4 p-2 text-sm text-[hsl(var(--accent-purple))] hover:bg-[hsl(var(--accent-purple))]/10 rounded-lg transition-colors group/link"
          >
            <span>View on Explorer</span>
            <ExternalLink className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}
