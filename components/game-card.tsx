"use client";

import { motion } from "framer-motion";
import { Users, Coins, Zap } from "lucide-react";
import Image from "next/image";
import { AnimatedButton } from "./animated-button";
import { useTheme } from "./theme-provider";

interface GameCardProps {
  game: {
    id: number;
    title: string;
    category: string;
    minBet: number;
    maxPlayers: number;
    prize: number;
    players: number;
    status: string;
    image: string;
  };
  onHover?: () => void;
  onClick?: () => void;
  onJoinGame?: () => void;
}

export function GameCard({ game, onHover, onClick, onJoinGame }: GameCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getGameImage = (id: number) => {
    return `/game${id}.png`;
  };

  return (
    <motion.div
      className="group flex h-full flex-col bg-[hsl(var(--background))] border-3 border-[hsl(var(--foreground))] hover:border-[hsl(var(--accent-yellow))] transition-colors arcade-card"
      whileHover={{ y: -8 }}
      onMouseEnter={onHover}
      onClick={onClick}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b-3 border-[hsl(var(--foreground))] bg-[hsl(var(--secondary))]">
        <Image
          src={`${game.image}`}
          alt={game.title}
          width={500}
          height={300}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />

        {/* Scrim keeps the overlay badges readable on any screenshot */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/40" />

        <div className="absolute top-0 left-0 w-full p-2.5 sm:p-3 flex items-start justify-between gap-2">
          <span className="px-2.5 py-1 bg-black/70 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            {game.category}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
              game.status === "live"
                ? "bg-red-600 text-white"
                : "bg-yellow-600 text-white"
            }`}
          >
            {game.status === "live" && (
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            )}
            {game.status === "live" ? "LIVE" : "WAITING"}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-2.5 sm:p-3 flex items-end justify-between gap-2 text-[11px] sm:text-xs">
          <span className="px-2.5 py-1 bg-black/70 text-white font-bold flex items-center backdrop-blur-sm">
            <Coins className="h-3.5 w-3.5 mr-1.5 text-[hsl(var(--accent-yellow))]" />
            MIN BET: {game.minBet} SOL
          </span>

          <span className="px-2.5 py-1 bg-black/70 text-white font-bold flex items-center backdrop-blur-sm">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {game.players}/{game.maxPlayers}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5 lg:p-6">
        <h3 className="font-pixel text-[13px] sm:text-sm xl:text-base leading-relaxed mb-3 flex items-center gap-2.5">
          {game.title}
          {game.status === "live" && (
            <span className="inline-flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
        </h3>

        <div className="flex items-center text-sm sm:text-base text-[hsl(var(--foreground)/0.7)] mb-4 sm:mb-5">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[hsl(var(--accent-yellow))]" />
          Prize Pool: {game.prize} SOL
        </div>

        <AnimatedButton
          className={`mt-auto arcade-btn bg-[hsl(var(--accent-purple))] text-white px-5 py-3 sm:py-3.5 w-full border-3 border-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent-purple)/0.9)] transition-colors text-xs sm:text-sm`}
          onClick={onJoinGame ?? onClick}
        >
          {game.status === "live" ? "JOIN GAME" : "PLAY NOW"}
        </AnimatedButton>
      </div>
    </motion.div>
  );
}
