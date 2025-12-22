"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, RefreshCw, Sparkles } from "lucide-react";

interface PortfolioSummaryProps {
  totalValue: number;
  tokenCount: number;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function PortfolioSummary({
  totalValue,
  tokenCount,
  isLoading = false,
  onRefresh,
}: PortfolioSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-3 border-foreground bg-gradient-to-br from-background via-secondary/30 to-background shadow-2xl overflow-hidden relative">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-yellow-500/10 to-purple-500/10 opacity-50" style={{
          backgroundSize: "200% 200%",
          animation: "gradient 3s ease infinite"
        }}></div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[hsl(var(--accent-purple))] to-[hsl(var(--accent-yellow))]">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              Portfolio Summary
            </CardTitle>
            {onRefresh && (
              <motion.button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-3 hover:bg-secondary rounded-lg transition-colors border-2 border-foreground/20 hover:border-[hsl(var(--accent-purple))]"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw
                  className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
                />
              </motion.button>
            )}
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-6">
            {/* Total Value */}
            <div>
              <p className="text-sm text-foreground/70 mb-2 font-semibold uppercase tracking-wide">
                Total Portfolio Value
              </p>
              <motion.div
                key={totalValue}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-5xl font-bold bg-gradient-to-r from-[hsl(var(--accent-yellow))] via-[hsl(var(--accent-purple))] to-[hsl(var(--accent-yellow))] bg-clip-text text-transparent">
                  ${totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-foreground/20">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-[hsl(var(--accent-purple))]" />
                  <p className="text-sm text-foreground/70 font-semibold">Tokens Tracked</p>
                </div>
                <p className="text-3xl font-bold">{tokenCount}</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-[hsl(var(--accent-yellow))]" />
                  <p className="text-sm text-foreground/70 font-semibold">Status</p>
                </div>
                <p className="text-3xl font-bold text-green-500">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
