"use client";

import { motion } from "framer-motion";
import { Trophy, Users, Clock, Coins } from "lucide-react";
import Link from "next/link";
import { AnimatedButton } from "./animated-button";
import { useTheme } from "./theme-provider";

interface TournamentCardProps {
  tournament: {
    id: number;
    title: string;
    game: string;
    entryFee: number;
    prize: number;
    players: number;
    status: string;
    timeLeft: string;
  };
  onHover?: () => void;
  onClick?: () => void;
}

export function TournamentCard({
  tournament,
  onHover,
  onClick,
}: TournamentCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      className="h-full bg-[hsl(var(--background))] border-3 border-[hsl(var(--foreground))] hover:border-[hsl(var(--accent-yellow))] transition-colors arcade-card"
      whileHover={{ y: -8 }}
      onMouseEnter={onHover}
      onClick={onClick}
    >
      <div className="flex h-full flex-col p-5 sm:p-6 lg:p-8">
        <div className="flex justify-between items-start gap-3 mb-5 lg:mb-6">
          <div className="min-w-0">
            <h3 className="font-pixel text-[13px] sm:text-base lg:text-lg leading-relaxed">
              {tournament.title}
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-[hsl(var(--foreground)/0.65)] mt-1.5">
              {tournament.game}
            </p>
          </div>
          <div
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white ${
              tournament.status === "live"
                ? "bg-red-600"
                : tournament.status === "registering"
                ? "bg-green-600"
                : "bg-yellow-600"
            }`}
          >
            {tournament.status === "live" && (
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            )}
            {tournament.status.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-6 lg:mb-8">
          <div className="bg-[hsl(var(--foreground)/0.04)] p-3 sm:p-4 border-2 border-[hsl(var(--foreground)/0.15)]">
            <div className="text-[11px] sm:text-xs lg:text-sm text-[hsl(var(--foreground)/0.65)] mb-1.5 sm:mb-2 flex items-center">
              <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
              PRIZE POOL
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[hsl(var(--accent-purple))]">
              {tournament.prize} Sol
            </div>
          </div>

          <div className="bg-[hsl(var(--foreground)/0.04)] p-3 sm:p-4 border-2 border-[hsl(var(--foreground)/0.15)]">
            <div className="text-[11px] sm:text-xs lg:text-sm text-[hsl(var(--foreground)/0.65)] mb-1.5 sm:mb-2 flex items-center">
              <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
              ENTRY FEE
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {tournament.entryFee} SOL
            </div>
          </div>

          <div className="bg-[hsl(var(--foreground)/0.04)] p-3 sm:p-4 border-2 border-[hsl(var(--foreground)/0.15)]">
            <div className="text-[11px] sm:text-xs lg:text-sm text-[hsl(var(--foreground)/0.65)] mb-1.5 sm:mb-2 flex items-center">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
              PLAYERS
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {tournament.players}
            </div>
          </div>

          <div className="bg-[hsl(var(--foreground)/0.04)] p-3 sm:p-4 border-2 border-[hsl(var(--foreground)/0.15)]">
            <div className="text-[11px] sm:text-xs lg:text-sm text-[hsl(var(--foreground)/0.65)] mb-1.5 sm:mb-2 flex items-center">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
              TIME LEFT
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {tournament.timeLeft}
            </div>
          </div>
        </div>

        <Link href={`/coming-soon`} className="mt-auto block">
          <AnimatedButton className="arcade-btn bg-[hsl(var(--accent-purple))] text-white px-5 py-3 sm:py-3.5 w-full border-3 border-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent-purple)/0.9)] transition-colors text-xs sm:text-sm">
            {tournament.status === "registering"
              ? "REGISTER NOW"
              : "VIEW DETAILS"}
          </AnimatedButton>
        </Link>
      </div>
    </motion.div>
  );
}
