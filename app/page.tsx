"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  ChevronRight,
  Trophy,
  Users,
  Gamepad2,
  Zap,
  Wallet,
  Bell,
  Menu,
  X,
  ArrowRight,
  Coins,
  BarChart3,
  Award,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { GameCard } from "@/components/game-card";
import { TournamentCard } from "@/components/tournament-card";
import { useMobile } from "@/hooks/use-mobile";
import { AnimatedButton } from "@/components/animated-button";
import { ParticleButton } from "@/components/particle-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import RetroWelcomePopup from "@/components/retroWelcomePopup";
import RetroGameCompletionPopup from "@/components/GameComplitionPopup";
import { VorldAuthService } from "../lib/authservice";
import { WalletSelectModal } from "@/components/wallet-select-modal";
import { useSolanaWallet } from "@/components/solana-wallet-provider";

// Deterministic positions so the server and client render identical markup
const ctaParticles = Array.from({ length: 30 }, (_, i) => ({
  top: (i * 37 + 11) % 100,
  left: (i * 53 + 23) % 100,
  duration: 3 + ((i * 7) % 8),
  delay: ((i * 13) % 50) / 10,
}));

const outlineButtonClass =
  "w-full sm:w-auto inline-flex items-center justify-center gap-2 border-3 border-[hsl(var(--foreground))] bg-[hsl(var(--background))] px-6 py-4 text-xs sm:text-sm shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:border-[hsl(var(--accent-purple))] hover:text-[hsl(var(--accent-purple))] transition-colors";

export default function Home() {
  const [isHovering, setIsHovering] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("featured");
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Use actual wallet provider
  const {
    walletAddress,
    connected: walletConnected,
    balance: cryptoBalance,
    availableWallets,
  } = useSolanaWallet();
  const [scrolled, setScrolled] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [showRetroWelcome, setShowRetroWelcome] = useState(false);
  const [showConnectWalletPrompt, setShowConnectWalletPrompt] = useState(false);
  const [gameCompletionInfo, setGameCompletionInfo] = useState<{
    pointsEarned: number;
    gameWon: boolean;
    gameName: string;
  } | null>(null);

  const authService = new VorldAuthService();

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Tournament Starting",
      message: "WEEKEND WARRIOR tournament starts in 30 minutes!",
    },
    {
      id: 2,
      title: "New Game Added",
      message: "CRYPTO PUZZLER is now available to play!",
    },
    {
      id: 3,
      title: "Bonus Tokens",
      message: "You received 50 bonus tokens for daily login!",
    },
  ]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useMobile();
  const { theme } = useTheme();
  const { toast } = useToast();

  // Simulated data
  const featuredGames = [
    {
      id: 1,
      title: "Reactive Chess",
      category: "Puzzle",
      image: "/images/chess.jpeg",
      minBet: 0.01,
      maxPlayers: 2,
      prize: 0.25,
      players: 0,
      status: "live",
    },
    {
      id: 2,
      title: "Battle Ship",
      category: "Fighting",
      image: "/images/battleShip.jpg",
      minBet: 0.05,
      maxPlayers: 2,
      prize: 0.15,
      players: 2,
      status: "live",
    },
    {
      id: 3,
      title: "Space Invaders",
      category: "Adventure",
      image: "/images/spaceInvaders.jpg",
      minBet: 0.02,
      maxPlayers: 4,
      prize: 0.12,
      players: 1,
      status: "live",
    },
  ];

  const featureAccreditationImages = [
    "/images/feature/Indiesonsolana.png",
    "/images/feature/Superteam.png",
    "/images/feature/biks.png",
    "/images/feature/bk.png",
    "/images/feature/bkayush.png",
    "/images/feature/bkk.png",
    "/images/feature/himanshu.png",
    "/images/feature/indies.png",
    "/images/feature/indieskunal.png",
    "/images/feature/indiessol.png",
    "/images/feature/semi.png",
    "/images/feature/solanadevs.png",
    "/images/feature/solanagaming.png",
    "/images/feature/super.jpg",
    "/images/feature/vorld.png",
  ];

  const firstRowAccreditations = featureAccreditationImages.slice(0, 7);
  const secondRowAccreditations =
    featureAccreditationImages.slice(7).length > 0
      ? featureAccreditationImages.slice(7)
      : featureAccreditationImages;

  const tournaments = [
    {
      id: 1,
      title: "WEEKEND WARRIOR",
      game: "MULTI-GAME",
      entryFee: 0.1,
      prize: 5.0,
      players: 64,
      status: "registering",
      timeLeft: "1d 12h",
    },
    {
      id: 2,
      title: "CRYPTO CUP",
      game: "CRYPTO RACER",
      entryFee: 0.25,
      prize: 10.0,
      players: 32,
      status: "live",
      timeLeft: "ongoing",
    },
  ];

  const leaderboardData = [
    {
      rank: 1,
      player: "CryptoKing",
      game: "PIXEL WARRIORS",
      score: 98750,
      earnings: 12.45,
    },
    {
      rank: 2,
      player: "BlockchainBeast",
      game: "CRYPTO RACER",
      score: 87320,
      earnings: 8.72,
    },
    {
      rank: 3,
      player: "NFTNinja",
      game: "NFT HUNTERS",
      score: 76540,
      earnings: 7.21,
    },
    {
      rank: 4,
      player: "TokenTitan",
      game: "CRYPTO RACER",
      score: 65980,
      earnings: 5.89,
    },
    {
      rank: 5,
      player: "MetaMaster",
      game: "PIXEL WARRIORS",
      score: 54320,
      earnings: 4.32,
    },
  ];

  const tickerItems = [
    "PLAY",
    "BET",
    "WIN",
    ...featuredGames.map((game) => game.title.toUpperCase()),
  ];

  const sectionTabs = [
    {
      key: "featured",
      label: "FEATURED GAMES",
      shortLabel: "FEATURED",
      icon: Zap,
    },
    {
      key: "tournaments",
      label: "TOURNAMENTS",
      shortLabel: "TOURNAMENTS",
      icon: Trophy,
    },
    {
      key: "leaderboard",
      label: "LEADERBOARD",
      shortLabel: "LEADERBOARD",
      icon: BarChart3,
    },
  ];

  const howItWorksSteps = [
    {
      title: "CONNECT WALLET",
      icon: Wallet,
      description:
        "Connect your Solana wallet to unlock a world of retro gaming and digital rewards. Your wallet is the key to depositing funds, tracking your assets, and collecting your hard-earned winnings.",
    },
    {
      title: "Choose Your Challenge",
      icon: Gamepad2,
      description:
        "Select from a lineup of classic arcade games. Place your bets, compete against other players, and feel the thrill of retro gaming.",
    },
    {
      title: "WIN POINTS",
      icon: Coins,
      description:
        "Win matches, top the leaderboards, and watch yourself grow with every victory.",
    },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    // Use window.location to get search params
    const params = new URLSearchParams(window.location.search);
    console.log(params.toString());
    const pointsEarned = params.get("pointsEarned");
    const gameWon = params.get("gameWon");
    const gameName = params.get("gameName");

    if (pointsEarned && gameWon && gameName) {
      // Set game completion info
      setGameCompletionInfo({
        pointsEarned: parseInt(pointsEarned),
        gameWon: gameWon === "true",
        gameName: gameName,
      });

      // Update user points
      if (parseInt(pointsEarned) > 0) {
        setUserPoints((prev) => prev + parseInt(pointsEarned));
      }

      // Clean up URL params after processing
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const handleCloseGameCompletion = () => {
    setGameCompletionInfo(null);
  };

  const handlePointsUpdate = (newPoints: number) => {
    setUserPoints(newPoints);
    // Here you would typically make an API call to update the points on your backend
    // Example: await fetch('/api/user/points', { method: 'PUT', body: JSON.stringify({ points: newPoints }) });
  };

  // Show welcome toast on first load
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setTimeout(() => {
        toast({
          title: "Welcome to Empire of Bits!",
          description:
            "The ultimate Web3 arcade gaming platform. Connect your wallet to start playing!",
          duration: 5000,
        });
        localStorage.setItem("hasSeenWelcome", "true");
      }, 1000);
    }
  }, [toast]);

  const playSound = (sound: string) => {
    if (sound === "hover" || sound === "click") {
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = `/sounds/${sound}.mp3`;
      audioRef.current
        .play()
        .catch((e) => console.log("Audio play prevented:", e));
    }
  };

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const user = await authService.getProfile();
  //       console.log("profile:", user);
  //       // handle user if needed
  //     } catch (err) {
  //       console.error("Failed to fetch profile", err);
  //     }
  //   })();
  // }, []);

  // Wallet connection is now handled by WalletSelectModal component

  const ensureWalletConnected = () => {
    const storedWalletAddress =
      typeof window !== "undefined"
        ? localStorage.getItem("walletAddress")
        : null;

    if (!storedWalletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
        className: "bg-red-600 text-white border-red-700",
      });
      setShowWalletModal(true);
      return false;
    }

    return true;
  };

  const handleProtectedNavigation = async (href: string) => {
    if (!ensureWalletConnected()) {
      return;
    }

    try {
      const profile = await authService.getProfile();
      console.log("profile:", profile);
      if (profile.success) {
        window.location.href = href;
      } else {
        window.location.href = "/signup";
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      window.location.href = "/signup";
    }
  };

  const handlePlayGamesClick = () => {
    if (!ensureWalletConnected()) {
      return;
    }
    window.location.href = "/games";
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-mono overflow-hidden relative">
      <AnimatePresence>
        {showRetroWelcome && (
          <RetroWelcomePopup onClose={() => setShowRetroWelcome(false)} />
        )}

        {gameCompletionInfo && (
          <RetroGameCompletionPopup
            pointsEarned={gameCompletionInfo.pointsEarned}
            gameWon={gameCompletionInfo.gameWon}
            gameName={gameCompletionInfo.gameName}
            onClose={handleCloseGameCompletion}
          />
        )}
      </AnimatePresence>
      {/* Audio element for sound effects */}
      <audio ref={audioRef} className="hidden" />

      {/* Theme-specific effects */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {theme === "dark" ? (
          <>
            {/* Dark theme effects */}
            <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-10"></div>
            <div className="absolute inset-0 bg-radial-gradient opacity-20"></div>
            <div className="absolute inset-0 crt-effect"></div>
          </>
        ) : (
          <>
            {/* Light theme effects */}
            <div className="absolute inset-0 dot-pattern"></div>
            <div className="absolute inset-0 animated-gradient"></div>
          </>
        )}
      </div>

      {/* Noise overlay */}
      <div className="noise"></div>

      {/* Custom cursor (desktop only) */}
      {!isMobile && (
        <motion.div
          className="fixed w-12 h-12 pointer-events-none z-50 mix-blend-difference hidden md:block"
          animate={{ x: cursorPosition.x - 24, y: cursorPosition.y - 24 }}
          transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
        >
          <div className="w-full h-full border-3 border-current rotate-45 animate-pulse"></div>
        </motion.div>
      )}

      {/* Sticky Header */}
      <Header userPoints={userPoints} onPointsUpdate={handlePointsUpdate} />

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 bg-background z-40 md:hidden pt-20"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col h-full px-6 py-8">
              <Link
                href="/"
                className="py-5 border-b-2 border-foreground/20 text-2xl font-bold"
                onClick={() => {
                  setMenuOpen(false);
                  playSound("click");
                }}
              >
                HOME
              </Link>
              <Link
                href="/games"
                className="py-5 border-b-2 border-foreground/20 text-2xl font-bold"
                onClick={(e) => {
                  if (!ensureWalletConnected()) {
                    e.preventDefault();
                    setMenuOpen(false);
                    return;
                  }
                  setMenuOpen(false);
                  playSound("click");
                }}
              >
                GAMES
              </Link>
              <Link
                href="/coming-soon"
                className="py-5 border-b-2 border-foreground/20 text-2xl font-bold"
                onClick={() => {
                  setMenuOpen(false);
                  playSound("click");
                }}
              >
                TOURNAMENTS
              </Link>
              <Link
                href="/marketplace"
                className="py-5 border-b-2 border-foreground/20 text-2xl font-bold"
                onClick={() => {
                  setMenuOpen(false);
                  playSound("click");
                }}
              >
                MARKETPLACE
              </Link>

              {!walletConnected && (
                <AnimatedButton
                  className="mt-8 flex items-center justify-center gap-3 bg-[hsl(var(--accent-purple))] py-4 border-3 border-[hsl(var(--accent-purple)/0.7)] text-xl font-bold text-white"
                  onClick={() => {
                    setShowWalletModal(true);
                    setMenuOpen(false);
                    playSound("click");
                  }}
                >
                  <Wallet className="h-6 w-6" />
                  <span>CONNECT WALLET</span>
                </AnimatedButton>
              )}

              {walletConnected && (
                <div className="mt-8 p-6 border-3 border-foreground bg-secondary">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-foreground/70 text-lg">WALLET</span>
                    <span className="text-base">0x71...3F4d</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="flex items-center text-lg">
                      <Image
                        src="/sol.png"
                        width={20}
                        height={20}
                        alt="Sol"
                        className="mr-2"
                      />
                      SOL Balance
                    </span>
                    <span className="font-bold text-lg">{cryptoBalance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-lg">
                      <Image
                        src="/token.png"
                        width={20}
                        height={20}
                        alt="Game Token"
                        className="mr-2"
                      />
                      EOB Tokens
                    </span>
                    <span className="font-bold text-lg">0</span>
                  </div>
                </div>
              )}

              {/* Theme toggle in mobile menu */}
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-4">
                  <span className="text-lg">THEME:</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Connection Modal */}
      <WalletSelectModal
        isOpen={showWalletModal}
        onClose={() => {
          setShowWalletModal(false);
        }}
      />

      <MotionConfig reducedMotion="user">
        <main className="landing-page flex-1 relative z-10 pt-20 md:pt-28">
          {/* Hero Section */}
          <section className="relative overflow-hidden px-4 pt-8 pb-12 sm:pt-12 md:pt-16 md:pb-20 text-center">
            {/* Animated background elements */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              aria-hidden="true"
            >
              <div className="absolute -top-24 -left-24 h-72 w-72 md:h-[28rem] md:w-[28rem] rounded-full bg-[hsl(var(--accent-purple)/0.2)] blur-3xl"></div>
              <div className="absolute top-16 -right-28 h-72 w-72 md:h-[26rem] md:w-[26rem] rounded-full bg-[hsl(var(--accent-yellow)/0.25)] blur-3xl"></div>
              <div className="absolute inset-x-0 bottom-0 h-40 md:h-64 landing-grid-floor"></div>
              <div className="absolute top-[12%] left-[5%] md:left-[16%] w-4 h-4 md:w-8 md:h-8 bg-[hsl(var(--accent-purple))] rotate-45 animate-float"></div>
              <div className="absolute top-[30%] right-[6%] md:top-[12%] md:right-[16%] w-3.5 h-3.5 md:w-6 md:h-6 bg-[hsl(var(--accent-yellow))] rotate-45 animate-float-delay"></div>
              <div className="absolute top-[44%] left-[6%] md:top-auto md:bottom-[42%] md:left-[7%] w-3 h-3 md:w-7 md:h-7 bg-[hsl(var(--accent-green))] rotate-45 animate-float-slow"></div>
              <div className="absolute top-[54%] right-[7%] md:top-auto md:bottom-[36%] md:right-[7%] w-3 h-3 md:w-5 md:h-5 bg-red-500 rotate-45 animate-float-slower"></div>
            </div>

            <div className="max-w-7xl mx-auto relative">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-7 md:mb-9"
              >
                <span className="inline-flex items-center gap-2.5 px-3 py-2 sm:px-4 bg-[hsl(var(--accent-purple))] text-white border-3 border-[hsl(var(--foreground))] shadow-[3px_3px_0_0_hsl(var(--foreground))] font-pixel text-[9px] sm:text-[11px] uppercase">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--accent-yellow))] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--accent-yellow))]"></span>
                  </span>
                  Solana ARCADE GAMING
                </span>
              </motion.div>

              <motion.h2
                className="font-pixel text-[clamp(2.3rem,12.5vw,3.75rem)] md:text-[2.75rem] lg:text-6xl xl:text-7xl leading-[1.3] md:leading-tight mb-6 md:mb-8"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <span className="block md:inline">
                  <span
                    className="font-pixel glitch-text-lg isolate"
                    data-text="PLAY."
                  >
                    PLAY.
                  </span>
                </span>{" "}
                <span className="block md:inline">
                  <span
                    className="font-pixel glitch-text-lg isolate text-[hsl(var(--accent-purple))]"
                    data-text="BET."
                  >
                    BET.
                  </span>
                </span>{" "}
                <span className="block md:inline">
                  <span className="inline-block bg-[hsl(var(--accent-yellow))] px-2 md:px-3 text-black shadow-[4px_4px_0_0_hsl(var(--foreground))]">
                    <span
                      className="font-pixel glitch-text-lg isolate"
                      data-text="WIN."
                    >
                      WIN.
                    </span>
                  </span>
                </span>
              </motion.h2>

              <motion.p
                className="text-base sm:text-xl md:text-2xl mb-8 md:mb-10 text-[hsl(var(--foreground)/0.75)] max-w-3xl mx-auto"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Relive the classics, earn the future.
              </motion.p>

              <div className="mx-auto flex w-full max-w-sm flex-col items-stretch gap-4 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-5">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  onMouseEnter={() => {
                    setIsHovering("games");
                    playSound("hover");
                  }}
                  onMouseLeave={() => setIsHovering("")}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <ParticleButton
                    className="w-full bg-[hsl(var(--accent-purple))] text-white px-8 py-4 sm:px-10 sm:py-5 border-3 border-[hsl(var(--foreground))] shadow-[5px_5px_0_0_hsl(var(--foreground))] relative overflow-hidden group"
                    onClick={() => {
                      playSound("click");
                      handlePlayGamesClick();
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3 font-pixel text-sm sm:text-base">
                      PLAY GAMES
                      <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-2 transition-transform" />
                    </span>
                  </ParticleButton>
                  {/* Pixel effect on hover */}
                  {isHovering === "games" && (
                    <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-[hsl(var(--accent-yellow))]"></div>
                  )}
                </motion.div>

                {!walletConnected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <button
                      className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 sm:py-5 border-3 border-[hsl(var(--foreground))] bg-[hsl(var(--background)/0.85)] backdrop-blur-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent-yellow))] hover:text-black transition-colors"
                      onClick={() => {
                        setShowWalletModal(true);
                        playSound("click");
                      }}
                    >
                      <Wallet className="h-5 w-5 shrink-0" />
                      <span className="text-sm sm:text-base font-semibold">
                        Connect wallet to start earning
                      </span>
                    </button>
                  </motion.div>
                )}
              </div>

              <motion.div
                className="mt-10 md:mt-14 max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.7 }}
              >
                <div className="relative overflow-hidden rounded-2xl border-2 border-[hsl(var(--foreground)/0.12)] bg-gradient-to-br from-[hsl(var(--accent-purple)/0.1)] via-[hsl(var(--background)/0.85)] to-[hsl(var(--accent-yellow)/0.14)] px-4 py-5 sm:px-6 md:px-8 md:py-7 shadow-[0_10px_35px_rgba(124,58,237,0.12)] backdrop-blur-md">
                  <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

                  <p className="text-center text-lg sm:text-xl md:text-2xl font-semibold tracking-tight leading-snug text-[hsl(var(--foreground)/0.9)]">
                    Fast matches. Fair competition. Rewards worth your time.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-[13px] sm:text-sm md:text-base">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--accent-purple)/0.35)] bg-[hsl(var(--accent-purple)/0.08)] px-3 py-1.5 text-[hsl(var(--foreground)/0.9)]">
                      <Zap className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--accent-purple))]" />
                      No long waiting lobbies
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--accent-yellow)/0.6)] bg-[hsl(var(--accent-yellow)/0.12)] px-3 py-1.5 text-[hsl(var(--foreground)/0.9)]">
                      <Target className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                      Skill-first gameplay
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--accent-green)/0.4)] bg-[hsl(var(--accent-green)/0.1)] px-3 py-1.5 text-[hsl(var(--foreground)/0.9)]">
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--accent-green))]" />
                      Real reward progression
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2.5">
                    <div className="flex -space-x-1" aria-hidden="true">
                      <span className="h-4 w-4 border-2 border-[hsl(var(--background))] bg-[hsl(var(--accent-purple))]"></span>
                      <span className="h-4 w-4 border-2 border-[hsl(var(--background))] bg-[hsl(var(--accent-yellow))]"></span>
                      <span className="h-4 w-4 border-2 border-[hsl(var(--background))] bg-[hsl(var(--accent-green))]"></span>
                      <span className="h-4 w-4 border-2 border-[hsl(var(--background))] bg-red-500"></span>
                    </div>
                    <p className="text-sm md:text-base text-[hsl(var(--foreground)/0.7)] italic">
                      Loved by 300+ gamers
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Arcade ticker */}
          <div
            className="relative overflow-hidden py-5 md:py-8"
            aria-hidden="true"
          >
            <div className="-mx-6 -rotate-2 md:-rotate-1 bg-[hsl(var(--foreground))] py-3 md:py-4 shadow-[0_5px_0_0_hsl(var(--accent-purple))]">
              <motion.div
                className="flex w-max"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                  duration: 28,
                  ease: "linear",
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                {[...tickerItems, ...tickerItems].map((item, index) => (
                  <span
                    key={`ticker-${index}`}
                    className="flex shrink-0 items-center gap-5 md:gap-7 pr-5 md:pr-7 whitespace-nowrap text-[hsl(var(--background))]"
                  >
                    <span className="font-pixel text-[11px] md:text-sm">
                      {item}
                    </span>
                    <span className="inline-block h-2 w-2 md:h-2.5 md:w-2.5 rotate-45 bg-[hsl(var(--accent-yellow))]"></span>
                  </span>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Game Showcase Section */}
          <section className="py-10 md:py-20 px-4 relative overflow-hidden">
            {/* Section background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--accent-purple)/0.07)] to-transparent pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative">
              {/* Section tabs */}
              <div className="mb-8 md:mb-12 flex justify-center">
                <div className="grid w-full max-w-md grid-cols-3 gap-1.5 border-3 border-[hsl(var(--foreground))] bg-[hsl(var(--background))] p-1.5 shadow-[4px_4px_0_0_hsl(var(--foreground))] md:flex md:w-auto md:max-w-none md:gap-2 md:p-2">
                  {sectionTabs.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeSection === tab.key;

                    return (
                      <AnimatedButton
                        key={tab.key}
                        className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2.5 px-1 py-2.5 md:px-6 md:py-4 transition-colors ${
                          isActive
                            ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                            : "bg-transparent text-[hsl(var(--foreground)/0.75)] hover:bg-[hsl(var(--foreground)/0.06)]"
                        }`}
                        onClick={() => {
                          setActiveSection(tab.key);
                          playSound("click");
                        }}
                      >
                        <TabIcon
                          className={`h-4 w-4 md:h-5 md:w-5 shrink-0 ${
                            isActive ? "text-[hsl(var(--accent-yellow))]" : ""
                          }`}
                        />
                        <span className="md:hidden text-[10.5px] font-bold uppercase tracking-wider leading-none">
                          {tab.shortLabel}
                        </span>
                        <span className="hidden md:inline font-pixel text-[11px] lg:text-xs whitespace-nowrap">
                          {tab.label}
                        </span>
                      </AnimatedButton>
                    );
                  })}
                </div>
              </div>

              {/* Featured Games */}
              <AnimatePresence mode="wait">
                {activeSection === "featured" && (
                  <motion.div
                    key="featured"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 md:gap-6 overflow-x-auto px-4 pt-2 pb-6 scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:px-0 lg:pb-2 lg:snap-none">
                      {featuredGames.map((game) => (
                        <div
                          key={game.id}
                          className="w-[80%] max-w-[320px] shrink-0 snap-start sm:w-[46%] sm:max-w-[340px] lg:w-auto lg:max-w-none"
                        >
                          <GameCard
                            game={game}
                            onHover={() => playSound("hover")}
                            onClick={() => playSound("click")}
                            onJoinGame={() => {
                              playSound("click");
                              handlePlayGamesClick();
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <p
                      className="lg:hidden flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--foreground)/0.5)]"
                      aria-hidden="true"
                    >
                      Swipe
                      <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
                    </p>

                    <div className="text-center mt-6 md:mt-12">
                      <Link
                        href="/games"
                        className="block sm:inline-block"
                        onClick={(e) => {
                          if (!ensureWalletConnected()) {
                            e.preventDefault();
                            return;
                          }
                          playSound("click");
                        }}
                      >
                        <AnimatedButton
                          className={outlineButtonClass}
                          onHover={() => playSound("hover")}
                        >
                          VIEW ALL GAMES
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        </AnimatedButton>
                      </Link>
                    </div>
                  </motion.div>
                )}

                {/* Tournaments */}
                {activeSection === "tournaments" && (
                  <motion.div
                    key="tournaments"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-2 pb-6 scrollbar-hide md:mx-0 md:grid md:grid-cols-2 md:gap-8 md:overflow-visible md:px-0 md:pb-2 md:snap-none">
                      {tournaments.map((tournament) => (
                        <div
                          key={tournament.id}
                          className="w-[86%] max-w-[380px] shrink-0 snap-start md:w-auto md:max-w-none"
                        >
                          <TournamentCard
                            tournament={tournament}
                            onHover={() => playSound("hover")}
                            onClick={() => playSound("click")}
                          />
                        </div>
                      ))}
                    </div>

                    <p
                      className="md:hidden flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--foreground)/0.5)]"
                      aria-hidden="true"
                    >
                      Swipe
                      <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
                    </p>

                    <div className="text-center mt-6 md:mt-12">
                      <Link
                        href="/coming-soon"
                        className="block sm:inline-block"
                      >
                        <AnimatedButton
                          className={outlineButtonClass}
                          onHover={() => playSound("hover")}
                          onClick={() => playSound("click")}
                        >
                          VIEW ALL TOURNAMENTS
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        </AnimatedButton>
                      </Link>
                    </div>
                  </motion.div>
                )}

                {/* Leaderboard */}
                {activeSection === "leaderboard" && (
                  <motion.div
                    key="leaderboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="overflow-hidden bg-[hsl(var(--background))] border-3 border-[hsl(var(--foreground))] retro-shadow">
                      <div className="flex items-center justify-between bg-[hsl(var(--foreground))] px-4 py-3 text-[9px] text-[hsl(var(--accent-yellow))] md:hidden">
                        <span className="font-pixel">RANK / PLAYER</span>
                        <span className="font-pixel">SCORE</span>
                      </div>
                      <div className="hidden md:grid grid-cols-5 gap-6 bg-[hsl(var(--foreground))] px-6 py-4 text-xs text-[hsl(var(--accent-yellow))]">
                        <div className="font-pixel">RANK</div>
                        <div className="font-pixel">PLAYER</div>
                        <div className="font-pixel">GAME</div>
                        <div className="font-pixel">SCORE</div>
                        <div className="font-pixel">EARNINGS</div>
                      </div>

                      {leaderboardData.map((entry, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-3 px-4 py-3.5 md:grid md:grid-cols-5 md:gap-6 md:px-6 md:py-4 border-b-2 border-[hsl(var(--foreground)/0.1)] last:border-b-0 md:text-lg"
                          whileHover={{
                            backgroundColor: "hsl(var(--foreground) / 0.1)",
                          }}
                          onMouseEnter={() => playSound("hover")}
                        >
                          <div className="font-bold flex shrink-0 items-center gap-2">
                            <span
                              className={`flex h-9 w-9 items-center justify-center border-2 font-pixel text-xs ${
                                entry.rank === 1
                                  ? "bg-[hsl(var(--accent-yellow))] border-black text-black"
                                  : entry.rank === 2
                                    ? "bg-gray-300 border-black text-black"
                                    : entry.rank === 3
                                      ? "bg-amber-600 border-black text-white"
                                      : "border-[hsl(var(--foreground)/0.25)]"
                              }`}
                            >
                              {entry.rank}
                            </span>
                            {entry.rank === 1 && (
                              <Award className="h-5 w-5 text-[hsl(var(--accent-yellow))]" />
                            )}
                            {entry.rank === 2 && (
                              <Award className="h-5 w-5 text-gray-400" />
                            )}
                            {entry.rank === 3 && (
                              <Award className="h-5 w-5 text-amber-700" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold text-[hsl(var(--foreground))]">
                              {entry.player}
                            </div>
                            <div className="truncate text-xs text-[hsl(var(--foreground)/0.6)] md:hidden">
                              {entry.game}
                            </div>
                          </div>
                          <div className="hidden md:block text-[hsl(var(--foreground)/0.7)]">
                            {entry.game}
                          </div>
                          <div className="shrink-0 text-right md:text-left">
                            <div className="font-bold tabular-nums text-[hsl(var(--foreground))]">
                              {entry.score.toLocaleString()}
                            </div>
                            <div className="text-xs font-semibold text-[hsl(var(--accent-green))] md:hidden">
                              {entry.earnings} SOL
                            </div>
                          </div>
                          <div className="hidden md:block font-semibold text-[hsl(var(--accent-green))]">
                            {entry.earnings} SOL
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="text-center mt-8 md:mt-12">
                      <Link
                        href="/coming-soon"
                        className="block sm:inline-block"
                      >
                        <AnimatedButton
                          className={outlineButtonClass}
                          onHover={() => playSound("hover")}
                          onClick={() => playSound("click")}
                        >
                          VIEW FULL LEADERBOARD
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        </AnimatedButton>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <section className="relative overflow-hidden py-10 md:py-20">
            {/* Achievement banner */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              viewport={{ once: true }}
              className="relative overflow-hidden border-y-4 border-[hsl(var(--foreground))] bg-zinc-950 text-white"
            >
              <Image
                src="/images/hackathon-winner.webp"
                alt=""
                aria-hidden="true"
                fill
                className="object-cover scale-110 blur-2xl opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/45 to-[hsl(var(--accent-purple)/0.45)]" />
              <div className="absolute inset-0 landing-pixel-grid" />

              <div className="relative max-w-7xl mx-auto grid items-center gap-7 px-4 py-10 sm:py-12 md:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
                <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
                  <div className="relative aspect-video overflow-hidden border-3 border-white shadow-[6px_6px_0_0_hsl(var(--accent-purple))] md:shadow-[10px_10px_0_0_hsl(var(--accent-purple))]">
                    <Image
                      src="/images/hackathon-winner.webp"
                      alt="Winner at the Underdog Hackathon by Indies on Solana"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="text-center lg:order-first lg:text-left">
                  <span className="inline-flex items-center gap-2 border-2 border-[hsl(var(--accent-yellow))] bg-black/40 px-3 py-1.5 font-pixel text-[9px] sm:text-[10px] uppercase text-[hsl(var(--accent-yellow))]">
                    <Trophy className="h-3.5 w-3.5" />
                    Achievement
                  </span>
                  <h3 className="mt-4 md:mt-5 font-pixel text-lg sm:text-2xl xl:text-[2rem] leading-snug xl:leading-tight text-white">
                    Winner at the Underdog Hackathon
                  </h3>
                  <p className="mt-3 md:mt-4 text-lg sm:text-xl md:text-2xl text-white/85">
                    by Indies on Solana
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Community accreditations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="pt-10 md:pt-16 space-y-4 md:space-y-6"
            >
              <p className="px-4 text-center font-pixel text-[10px] sm:text-xs uppercase text-[hsl(var(--foreground)/0.6)]">
                Community Accreditations
              </p>

              <div className="landing-fade-x relative overflow-hidden py-1">
                <motion.div
                  className="flex w-max"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{
                    duration: 34,
                    ease: "linear",
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  {[...firstRowAccreditations, ...firstRowAccreditations].map(
                    (image, index) => (
                      <div
                        key={`accreditation-top-${index}`}
                        className="shrink-0 pr-3 md:pr-5"
                      >
                        <div className="overflow-hidden rounded-xl md:rounded-2xl border-2 border-[hsl(var(--foreground)/0.12)] bg-black shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                          <Image
                            src={image}
                            alt={`Accreditation screenshot ${index + 1}`}
                            width={600}
                            height={150}
                            className="h-20 sm:h-24 md:h-32 w-auto max-w-none"
                          />
                        </div>
                      </div>
                    ),
                  )}
                </motion.div>
              </div>

              <div className="landing-fade-x relative overflow-hidden py-1">
                <motion.div
                  className="flex w-max"
                  animate={{ x: ["-50%", "0%"] }}
                  transition={{
                    duration: 40,
                    ease: "linear",
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  {[...secondRowAccreditations, ...secondRowAccreditations].map(
                    (image, index) => (
                      <div
                        key={`accreditation-bottom-${index}`}
                        className="shrink-0 pr-3 md:pr-5"
                      >
                        <div className="overflow-hidden rounded-xl md:rounded-2xl border-2 border-[hsl(var(--foreground)/0.12)] bg-black shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                          <Image
                            src={image}
                            alt={`Accreditation screenshot ${index + 1}`}
                            width={600}
                            height={150}
                            className="h-20 sm:h-24 md:h-32 w-auto max-w-none"
                          />
                        </div>
                      </div>
                    ),
                  )}
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* How It Works Section */}
          <section className="py-12 md:py-24 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10 md:mb-16">
                <h2
                  className="font-pixel text-xl sm:text-2xl md:text-4xl mb-4 md:mb-6 glitch-text-sm isolate"
                  data-text="HOW IT WORKS"
                >
                  HOW IT WORKS
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-[hsl(var(--foreground)/0.7)] max-w-3xl mx-auto">
                  Empire of Bits combines retro arcade gaming
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                {howItWorksSteps.map((step, index) => {
                  const StepIcon = step.icon;

                  return (
                    <motion.div
                      key={step.title}
                      className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4 bg-[hsl(var(--background))] border-3 border-[hsl(var(--foreground))] p-5 sm:p-6 retro-shadow md:block md:p-8"
                      whileHover={{ y: -8 }}
                      onMouseEnter={() => playSound("hover")}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.4, delay: index * 0.08 }}
                    >
                      <div className="col-start-1 row-start-1 flex h-11 w-11 items-center justify-center bg-[hsl(var(--accent-purple))] font-pixel text-base text-white md:absolute md:-top-6 md:-left-6 md:h-12 md:w-12 md:text-lg">
                        {index + 1}
                      </div>
                      <StepIcon className="col-start-3 row-start-1 h-9 w-9 text-[hsl(var(--accent-yellow))] md:mb-6 md:h-16 md:w-16" />
                      <h3 className="col-start-2 row-start-1 font-pixel text-[13px] sm:text-sm uppercase leading-relaxed md:mb-4 md:text-lg">
                        {step.title}
                      </h3>
                      <p className="col-span-3 text-[15px] sm:text-base md:text-lg leading-relaxed text-[hsl(var(--foreground)/0.7)]">
                        {step.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Live Games Section */}
          <section className="relative overflow-hidden border-t-4 border-[hsl(var(--foreground))] bg-zinc-950 px-4 py-12 text-white md:py-20">
            <div
              className="pointer-events-none absolute inset-0 landing-pixel-grid"
              aria-hidden="true"
            ></div>
            <div
              className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[40rem] max-w-[150vw] -translate-x-1/2 rounded-full bg-[hsl(var(--accent-purple)/0.35)] blur-3xl"
              aria-hidden="true"
            ></div>

            <div className="relative max-w-7xl mx-auto">
              <h2 className="font-pixel text-xl sm:text-2xl md:text-4xl mb-8 md:mb-12 flex items-center">
                <Users className="mr-3 h-6 w-6 md:h-8 md:w-8 shrink-0 text-[hsl(var(--accent-yellow))]" />
                LIVE GAMES
                <span className="ml-4 inline-flex h-3 w-3 md:h-4 md:w-4 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-red-500"></span>
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {[1, 2].map((stream) => (
                  <motion.div
                    key={stream}
                    className="group bg-zinc-900 border-3 border-white/90 p-3 sm:p-4 md:p-5 shadow-[6px_6px_0_0_hsl(var(--accent-purple))]"
                    whileHover={{ scale: 1.03 }}
                    onMouseEnter={() => playSound("hover")}
                  >
                    <div className="relative aspect-video mb-4 md:mb-5 overflow-hidden bg-black">
                      <Image
                        src={
                          stream === 1
                            ? "/images/candyCrush.jpg"
                            : "/images/chess.jpeg"
                        }
                        width={500}
                        height={300}
                        alt={stream === 1 ? "Candy Crush" : "Chess"}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                      <div className="absolute top-3 left-3 bg-red-600 px-2.5 py-1 text-xs sm:text-sm font-bold flex items-center text-white">
                        <span className="mr-2 inline-flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        LIVE
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="font-pixel text-sm sm:text-base md:text-lg flex flex-wrap items-center gap-x-3 gap-y-2">
                          {stream === 1 ? "CANDY CRUSH" : "CHESS"}
                          {stream === 1 && (
                            <span className="inline-block px-2 py-1 bg-[hsl(var(--accent-green))] text-black text-[11px] sm:text-xs font-bold tracking-wider">
                              POPULAR
                            </span>
                          )}
                        </h3>
                        <p className="text-sm sm:text-base text-white/65 flex items-center mt-2">
                          <Users className="h-4 w-4 mr-2" />
                          {stream === 1 ? "Single Player" : "Two Player"}
                        </p>
                      </div>
                      <a
                        href="https://www.twitch.tv/empireofbits"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => playSound("click")}
                        className="block shrink-0 sm:inline-block"
                      >
                        <AnimatedButton className="w-full sm:w-auto bg-[hsl(var(--accent-purple))] border-3 border-white px-6 py-3.5 text-xs sm:text-sm text-white shadow-[3px_3px_0_0_hsl(var(--accent-yellow))]">
                          SPECTATE
                        </AnimatedButton>
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-14 md:py-28 px-4 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
            >
              <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[hsl(var(--background))] to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[hsl(var(--background))] to-transparent"></div>

              {/* Animated particles */}
              <div className="absolute inset-0">
                {ctaParticles.map((particle, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 md:w-3 md:h-3 bg-[hsl(var(--foreground))] opacity-20 rotate-45"
                    style={{
                      top: `${particle.top}%`,
                      left: `${particle.left}%`,
                      animation: `float ${particle.duration}s infinite linear`,
                      animationDelay: `${particle.delay}s`,
                    }}
                  ></div>
                ))}
              </div>
            </div>

            <div className="max-w-5xl mx-auto relative">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="relative overflow-hidden bg-[hsl(var(--accent-purple))] text-white border-3 md:border-4 border-[hsl(var(--foreground))] px-5 py-10 sm:p-10 md:p-16 shadow-[6px_6px_0_0_hsl(var(--foreground))] md:shadow-[10px_10px_0_0_hsl(var(--foreground))]"
              >
                <div
                  className="pointer-events-none absolute inset-0 landing-pixel-grid"
                  aria-hidden="true"
                ></div>
                <div
                  className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[hsl(var(--accent-yellow)/0.35)] blur-3xl"
                  aria-hidden="true"
                ></div>
                <div
                  className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-fuchsia-400/30 blur-3xl"
                  aria-hidden="true"
                ></div>

                <div className="relative">
                  <Sparkles className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-6 md:mb-8 text-[hsl(var(--accent-yellow))]" />

                  <h2
                    className="font-pixel text-xl sm:text-3xl md:text-4xl leading-snug mb-5 md:mb-8 glitch-text isolate"
                    data-text="JOIN THE ARCADE REVOLUTION"
                  >
                    JOIN THE ARCADE REVOLUTION
                  </h2>

                  <p className="text-base sm:text-xl md:text-2xl text-white/85 mb-8 md:mb-10 max-w-3xl mx-auto">
                    Experience the fusion of retro gaming. Play, compete, and
                    earn like never before.
                  </p>

                  {!walletConnected ? (
                    <ParticleButton
                      className="w-full sm:w-auto bg-[hsl(var(--accent-yellow))] text-black px-6 py-4 sm:px-10 sm:py-5 border-3 border-black shadow-[4px_4px_0_0_#000] relative overflow-hidden group"
                      onHover={() => playSound("hover")}
                      onClick={() => {
                        setShowWalletModal(true);
                        playSound("click");
                      }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3 font-pixel text-[11px] sm:text-sm leading-relaxed text-balance">
                        CONNECT WALLET TO START
                        <ArrowRight className="h-5 w-5 shrink-0 group-hover:translate-x-2 transition-transform" />
                      </span>
                    </ParticleButton>
                  ) : (
                    <Link href="/games" className="block sm:inline-block">
                      <ParticleButton
                        className="w-full sm:w-auto bg-[hsl(var(--accent-yellow))] text-black px-6 py-4 sm:px-10 sm:py-5 border-3 border-black shadow-[4px_4px_0_0_#000] relative overflow-hidden group"
                        onHover={() => playSound("hover")}
                        onClick={() => playSound("click")}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3 font-pixel text-[11px] sm:text-sm leading-relaxed">
                          START PLAYING NOW
                          <ArrowRight className="h-5 w-5 shrink-0 group-hover:translate-x-2 transition-transform" />
                        </span>
                      </ParticleButton>
                    </Link>
                  )}
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="relative z-10 bg-[hsl(var(--background))] border-t-4 border-[hsl(var(--foreground))] px-4 pt-12 pb-32 md:pt-16 md:pb-12">
          <div className="max-w-7xl mx-auto grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-10">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-5 md:mb-6">
                <div className="flex h-11 w-11 md:h-12 md:w-12 shrink-0 items-center justify-center border-3 border-[hsl(var(--foreground))] bg-[hsl(var(--accent-purple))] text-white shadow-[3px_3px_0_0_hsl(var(--foreground))]">
                  <Gamepad2 className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <h3 className="font-pixel text-base sm:text-xl md:text-2xl">
                  <span className="font-pixel">EMPIRE</span>{" "}
                  <span className="font-pixel text-[hsl(var(--accent-yellow))] [text-shadow:2px_2px_0_hsl(var(--foreground))]">
                    OF
                  </span>{" "}
                  <span className="font-pixel text-[hsl(var(--accent-purple))]">
                    BITS
                  </span>
                </h3>
              </div>
              <p className="text-base md:text-lg text-[hsl(var(--foreground)/0.7)] mb-6 md:mb-8 max-w-md">
                The ultimate Empire of bits arcade gaming platform. Compete in
                retro-style games, bet points, and win big in tournaments.
              </p>
              <div className="flex gap-3 md:gap-4">
                <motion.a
                  href="https://x.com/empireofbits"
                  className="w-11 h-11 md:w-12 md:h-12 border-3 border-[hsl(var(--foreground))] flex items-center justify-center hover:border-[hsl(var(--accent-purple))] hover:text-[hsl(var(--accent-purple))] transition-colors arcade-btn-large"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => playSound("hover")}
                  onClick={() => playSound("click")}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Empire of Bits on X (Twitter)"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </motion.a>
                <motion.a
                  href="https://github.com/kunalcode12/Empire-of-bits-vorld"
                  className="w-11 h-11 md:w-12 md:h-12 border-3 border-[hsl(var(--foreground))] flex items-center justify-center hover:border-[hsl(var(--accent-purple))] hover:text-[hsl(var(--accent-purple))] transition-colors arcade-btn-large"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => playSound("hover")}
                  onClick={() => playSound("click")}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View Empire of Bits on GitHub"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 .296c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.207 11.387.6.111.82-.261.82-.58 0-.287-.01-1.044-.016-2.05-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.303-5.467-1.334-5.467-5.93 0-1.31.468-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 013.004-.404c1.02.004 2.047.138 3.004.404 2.29-1.552 3.296-1.23 3.296-1.23.655 1.653.243 2.874.12 3.176.77.84 1.234 1.911 1.234 3.221 0 4.61-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.604-.015 2.896-.015 3.289 0 .322.216.697.825.579C20.565 22.092 24 17.592 24 12.296c0-6.627-5.373-12-12-12z" />
                  </svg>
                </motion.a>
              </div>
            </div>

            <div className="md:pt-2">
              <h3 className="font-pixel text-[10px] md:text-xs mb-4 md:mb-6 border-b-2 border-[hsl(var(--foreground)/0.15)] pb-3">
                NAVIGATION
              </h3>
              <ul className="space-y-1.5 md:space-y-3">
                <li>
                  <Link
                    href="/"
                    className="group flex items-center py-1 text-[15px] md:text-base text-[hsl(var(--foreground)/0.65)] hover:text-[hsl(var(--foreground))] transition-colors"
                    onMouseEnter={() => playSound("hover")}
                  >
                    <ChevronRight className="h-4 w-4 mr-1.5 shrink-0 text-[hsl(var(--accent-purple))] opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/games"
                    className="group flex items-center py-1 text-[15px] md:text-base text-[hsl(var(--foreground)/0.65)] hover:text-[hsl(var(--foreground))] transition-colors"
                    onMouseEnter={() => playSound("hover")}
                    onClick={(e) => {
                      e.preventDefault();
                      handleProtectedNavigation("/games");
                    }}
                  >
                    <ChevronRight className="h-4 w-4 mr-1.5 shrink-0 text-[hsl(var(--accent-purple))] opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                    Games
                  </Link>
                </li>
                <li>
                  <Link
                    href="/coming-soon"
                    className="group flex items-center py-1 text-[15px] md:text-base text-[hsl(var(--foreground)/0.65)] hover:text-[hsl(var(--foreground))] transition-colors"
                    onMouseEnter={() => playSound("hover")}
                  >
                    <ChevronRight className="h-4 w-4 mr-1.5 shrink-0 text-[hsl(var(--accent-purple))] opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link
                    href="/points-exchange"
                    className="group flex items-center py-1 text-[15px] md:text-base text-[hsl(var(--foreground)/0.65)] hover:text-[hsl(var(--foreground))] transition-colors"
                    onMouseEnter={() => playSound("hover")}
                    onClick={(e) => {
                      e.preventDefault();
                      handleProtectedNavigation("/points-exchange");
                    }}
                  >
                    <ChevronRight className="h-4 w-4 mr-1.5 shrink-0 text-[hsl(var(--accent-purple))] opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                    Points Exchange
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="group flex items-center py-1 text-[15px] md:text-base text-[hsl(var(--foreground)/0.65)] hover:text-[hsl(var(--foreground))] transition-colors"
                    onMouseEnter={() => playSound("hover")}
                    onClick={(e) => {
                      e.preventDefault();
                      handleProtectedNavigation("/profile");
                    }}
                  >
                    <ChevronRight className="h-4 w-4 mr-1.5 shrink-0 text-[hsl(var(--accent-purple))] opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                    Profile
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:pt-2">
              <h3 className="font-pixel text-[10px] md:text-xs mb-4 md:mb-6 border-b-2 border-[hsl(var(--foreground)/0.15)] pb-3">
                LEGAL
              </h3>
              <ul className="space-y-1.5 md:space-y-3">
                <li>
                  <Link
                    href="/terms-of-use"
                    className="group flex items-center py-1 text-[15px] md:text-base text-[hsl(var(--foreground)/0.65)] hover:text-[hsl(var(--foreground))] transition-colors"
                    onMouseEnter={() => playSound("hover")}
                    onClick={() => playSound("click")}
                  >
                    <ChevronRight className="h-4 w-4 mr-1.5 shrink-0 text-[hsl(var(--accent-purple))] opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="group flex items-center py-1 text-[15px] md:text-base text-[hsl(var(--foreground)/0.65)] hover:text-[hsl(var(--foreground))] transition-colors"
                    onMouseEnter={() => playSound("hover")}
                    onClick={() => playSound("click")}
                  >
                    <ChevronRight className="h-4 w-4 mr-1.5 shrink-0 text-[hsl(var(--accent-purple))] opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-10 md:mt-14 pt-6 md:pt-8 border-t-2 border-[hsl(var(--foreground)/0.12)] text-center">
            <p className="text-sm md:text-base text-[hsl(var(--foreground)/0.55)]">
              &copy; {new Date().getFullYear()} Empire of Bits. All rights
              reserved.
            </p>
          </div>
        </footer>

        {/* Sticky mobile action bar */}
        <AnimatePresence>
          {scrolled && (
            <motion.div
              className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 md:hidden"
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
              initial={{ y: "120%" }}
              animate={{ y: 0 }}
              exit={{ y: "120%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <div className="flex items-center gap-2 border-3 border-[hsl(var(--foreground))] bg-[hsl(var(--background)/0.92)] p-2 shadow-[4px_4px_0_0_hsl(var(--foreground))] backdrop-blur-md">
                {!walletConnected && (
                  <button
                    type="button"
                    aria-label="Connect wallet"
                    className="flex h-12 w-12 shrink-0 items-center justify-center border-3 border-[hsl(var(--foreground))] bg-[hsl(var(--accent-yellow))] text-black active:translate-y-0.5"
                    onClick={() => {
                      setShowWalletModal(true);
                      playSound("click");
                    }}
                  >
                    <Wallet className="h-5 w-5" />
                  </button>
                )}
                <button
                  type="button"
                  className="flex h-12 flex-1 items-center justify-center gap-2 border-3 border-[hsl(var(--foreground))] bg-[hsl(var(--accent-purple))] text-white active:translate-y-0.5"
                  onClick={() => {
                    playSound("click");
                    handlePlayGamesClick();
                  }}
                >
                  <span className="font-pixel text-[11px]">PLAY GAMES</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
}
