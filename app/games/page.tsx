"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Gamepad2,
  Filter,
  Search,
  Wallet,
  Coins,
  Users,
  Trophy,
  Clock,
  X,
  Menu,
  AlertTriangle,
  User,
  LogOut,
  Shield,
  Loader2,
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { AnimatedButton } from "@/components/animated-button";
import { ParticleButton } from "@/components/particle-button";
import BuyPointsDialog from "@/components/buyPointsDialog";
import SellPointsDialog from "@/components/sellPointsDialog";
import { useToast } from "@/components/ui/use-toast";
import { VorldAuthService } from "../../lib/authservice";
import { ArenaGameService, type GameState } from "@/lib/arenaGameService";

export default function GamesPage() {
  const [streamUrl, setStreamUrl] = useState("");
  const [showStreamDialog, setShowStreamDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [cryptoBalance, setCryptoBalance] = useState("0.00");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [scrolled, setScrolled] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useMobile();
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [points, setPoints] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { toast } = useToast();
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const authService = new VorldAuthService();
  const router = useRouter();
  const arenaServiceRef = useRef<ArenaGameService | null>(null);
  const [arenaGameState, setArenaGameState] = useState<GameState | null>(null);
  const [arenaInitializing, setArenaInitializing] = useState(false);
  const [arenaInitMessage, setArenaInitMessage] = useState(
    "INITIALIZING ARENA..."
  );

  const categories = [
    "All",
    "Action",
    "Racing",
    "Fighting",
    "Puzzle",
    "Adventure",
    "Strategy",
  ];

  const games = [
    {
      id: 1,
      title: "Space Invaders",
      category: "Adventure",
      image: "/images/spaceInvaders.jpg",
      pointsRequired: 15,
      maxPlayers: 4,
      prize: 0.12,
      players: 1,
      status: "waiting",
      route: "https://spaceinvaders.empireofbits.fun/",
    },
    {
      id: 2,
      title: "Chess Empire",
      category: "Puzzle",
      image: "/images/chess.jpeg",
      pointsRequired: 15,
      maxPlayers: 2,
      prize: 0.2,
      players: 0,
      status: "live",
      route: "https://chess.empireofbits.fun/",
    },
    {
      id: 3,
      title: "Candy Crush",
      image: "/images/candyCrush.jpg",
      category: "Arcade",
      pointsRequired: 15,
      maxPlayers: 8,
      prize: 0.25,
      players: 6,
      status: "live",
      route: "/levels-candycrush",
    },
    {
      id: 4,
      title: "Battle Ship",
      category: "Fighting",
      image: "/images/battleShip.jpg",
      pointsRequired: 15,
      maxPlayers: 2,
      prize: 0.15,
      players: 2,
      status: "live",
      route: "https://battleship.empireofbits.fun/",
    },

    {
      id: 5,
      title: "Platformer",
      category: "Action",
      image: "/images/platformer.jpg",
      pointsRequired: 15,
      maxPlayers: 6,
      prize: 0.18,
      players: 4,
      status: "coming-soon",
      route: "/coming-soon-games",
    },
    {
      id: 77,
      title: "Axe Ascend",
      category: "3D and VR",
      image: "/images/axeAscend.jpg",
      pointsRequired: 15,
      maxPlayers: 4,
      prize: 0.3,
      players: 3,
      status: "live",
      route: "https://axeascend.empireofbits.fun/",
    },
    {
      id: 78,
      title: "RC Crypto Car",
      category: "3D and VR",
      image: "/images/rcCrypto.jpg",
      pointsRequired: 15,
      maxPlayers: 1,
      prize: 0.3,
      players: 0,
      status: "coming-soon",
      route: "/coming-soon-games",
    },
    {
      id: 6,
      title: "Retro Racer",
      category: "Racing",
      image: "/images/comingSoon.jpeg",
      pointsRequired: 75,
      maxPlayers: 4,
      prize: 0.3,
      players: 0,
      status: "coming-soon",
      route: "/coming-soon-games",
    },

    // {
    //   id: 7,
    //   title: "Strategy Wars",
    //   category: "Strategy",
    //   image: "/images/comingSoon.jpeg",
    //   pointsRequired: 60,
    //   maxPlayers: 8,
    //   prize: 0.35,
    //   players: 0,
    //   status: "coming-soon",
    //   route: "/coming-soon",
    // },
    // {
    //   id: 8,
    //   title: "Neon Fighter",
    //   category: "Fighting",
    //   image: "/images/comingSoon.jpeg",
    //   pointsRequired: 55,
    //   maxPlayers: 6,
    //   prize: 0.28,
    //   players: 0,
    //   status: "coming-soon",
    //   route: "/coming-soon",
    // },
  ];

  const filteredGames = games
    .filter(
      (game) => selectedCategory === "All" || game.category === selectedCategory
    )
    .filter((game) =>
      game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const playSound = (sound: string) => {
    if (audioRef.current) {
      audioRef.current.src = `/sounds/${sound}.mp3`;
      audioRef.current
        .play()
        .catch((e) => console.log("Audio play prevented:", e));
    }
  };

  const fetchUserPoints = async () => {
    console.log("Fetching user points...");
    try {
      const walletAddress = localStorage.getItem("walletAddress");

      // Make API call to your backend
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
      console.log(data);

      if (data.success) {
        setPoints(data.data.points);
      } else {
        console.error("Failed to fetch user:", data.message);
      }
    } catch (error) {
      console.error("Error in user data operation:", error);
    }
  };

  // New function to update points in backend
  const updateUserPointsInBackend = async (
    userId: string,
    points: number,
    operation: string
  ) => {
    try {
      const response = await fetch(
        `https://backend.empireofbits.fun/api/v1/users/${userId}/points`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            points,
            operation,
          }),
        }
      );

      const data = await response.json();
      console.log(data);

      if (!data.success) {
        throw new Error(data.error || "Failed to update points in backend");
      }

      return data;
    } catch (error) {
      console.error("Error updating points in backend:", error);
      throw error;
    }
  };

  interface Game {
    id: number;
    title: string;
    category: string;
    pointsRequired: number;
    maxPlayers: number;
    prize: number;
    players: number;
    status: string;
    route: string;
  }

  const handlePlayGame = async (game: Game): Promise<void> => {
    try {
      // Check authentication first
      if (!isAuthenticated) {
        setShowAuthModal(true);
        playSound("error");
        return;
      }

      if (points < game.pointsRequired) {
        toast({
          title: "Insufficient Points",
          description: `You need ${game.pointsRequired} points to play this game.`,
          variant: "destructive",
          duration: 3000,
        });
        playSound("error");
        return;
      }

      const walletAddress = localStorage.getItem("walletAddress");

      // Deduct points
      await updateUserPointsInBackend(
        walletAddress as string,
        game.pointsRequired,
        "deduct"
      );

      // Update local state
      setPoints(points - game.pointsRequired);

      // Close dialog
      setShowGameDialog(false);

      // Show success message
      toast({
        title: "Game Started!",
        description: `${game.pointsRequired} points deducted. Enjoy the game!`,
        duration: 3000,
      });

      playSound("success");

      // Navigate to game
      if (game.title === "Candy Crush") {
        window.location.href = game.route;
      } else {
        const wallet = walletAddress || "";
        const authToken = localStorage.getItem("authToken") || "";
        const su = localStorage.getItem("streamUrl") || "";

        const url = `${game.route}?wallet=${encodeURIComponent(
          wallet
        )}&authToken=${encodeURIComponent(authToken)}${
          su ? `&streamUrl=${encodeURIComponent(su)}` : ""
        }`;
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error playing game:", error);
      toast({
        title: "Error",
        description: "Failed to start the game. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      playSound("error");
    }
  };

  useEffect(() => {
    checkAuthentication();
    arenaServiceRef.current = new ArenaGameService();
    return () => {
      arenaServiceRef.current?.disconnect();
      arenaServiceRef.current = null;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const walletAddress = localStorage.getItem("walletAddress");
        const profile = await authService.getProfile();

        if (walletAddress && !profile.success) {
          // Has wallet but not authenticated, redirect to signup
          router.push("/signup");
        } else if (!walletAddress && profile.success) {
          // No wallet but authenticated, redirect to home
          router.push("/");
        } else if (!walletAddress && !profile.success) {
          // Neither wallet nor authenticated, redirect to home
          router.push("/");
        }
      } catch {
        // On error, check wallet address only
        const walletAddress = localStorage.getItem("walletAddress");
        if (!walletAddress) {
          router.push("/");
        }
      }
    })();
  }, [router]);

  const checkAuthentication = async () => {
    try {
      setLoading(true);
      const existingStream = localStorage.getItem("streamUrl") || "";
      setStreamUrl(existingStream);
      const profile = await authService.getProfile();
      console.log("profile:", profile);
      if (profile.success) {
        setUserProfile(profile.data.data.profile);
        setIsAuthenticated(true);
        // Fetch user points after authentication
        await fetchUserPoints();
      } else {
        setIsAuthenticated(false);

        setUserProfile(null);
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      setIsAuthenticated(false);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserProfile(null);
    setPoints(0);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      duration: 3000,
    });
    playSound("success");
  };

  const handleSignIn = () => {
    router.push("/signup");
  };

  const handleBuyPoints = async (amount: number) => {
    try {
      // In a real application, you would make an API call here
      // const response = await fetch('/api/user/points/buy', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount })
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || 'Failed to buy points');

      // Simulating successful API response
      const newPoints = points + amount;
      setPoints(newPoints);
      setShowBuyDialog(false);

      // if (onPointsUpdate) {
      //   onPointsUpdate(newPoints);
      // }

      toast({
        title: "Points Purchased!",
        description: `You have successfully purchased ${amount} points.`,
        duration: 3000,
      });
      playSound("success");
    } catch (error) {
      console.error("Error buying points:", error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase.",
        variant: "destructive",
        duration: 3000,
      });
      playSound("error");
    }
  };

  const handleSellPoints = async (amount: number) => {
    if (points >= amount) {
      try {
        // In a real application, you would make an API call here
        // const response = await fetch('/api/user/points/sell', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ amount })
        // });
        // const data = await response.json();
        // if (!response.ok) throw new Error(data.message || 'Failed to sell points');

        // Simulating successful API response
        const newPoints = points - amount;
        setPoints(newPoints);
        setShowSellDialog(false);

        // if (onPointsUpdate) {
        //   onPointsUpdate(newPoints);
        // }

        toast({
          title: "Points Sold!",
          description: `You have successfully sold ${amount} points.`,
          duration: 3000,
        });
        playSound("success");
      } catch (error) {
        console.error("Error selling points:", error);
        toast({
          title: "Transaction Failed",
          description: "There was an error processing your transaction.",
          variant: "destructive",
          duration: 3000,
        });
        playSound("error");
      }
    } else {
      toast({
        title: "Insufficient Points",
        description: "You don't have enough points to sell.",
        variant: "destructive",
        duration: 3000,
      });
      playSound("error");
    }
  };

  const handleConnectWallet = () => {
    // Simulate wallet connection
    setShowWalletModal(false);
    setWalletConnected(true);
    setCryptoBalance("1.45");
    setTokenBalance("500");
    playSound("success");
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleGameClick = (game: Game) => {
    if (game.status === "coming-soon") {
      toast({
        title: "Coming Soon",
        description: "This game will be available soon!",
        duration: 3000,
      });
      playSound("error");
      return;
    }

    setSelectedGame(game);
    setShowGameDialog(true);
    playSound("click");
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Audio element for sound effects */}
      <audio ref={audioRef} className="hidden" />

      {/* CRT and scanline effects */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-radial-gradient opacity-20"></div>
        <div className="absolute inset-0 crt-effect"></div>
      </div>

      {/* Pixel grid overlay */}
      <div className="absolute inset-0 bg-[url('/pixel-grid.png')] opacity-5 pointer-events-none z-0"></div>

      {/* Custom cursor (desktop only) */}
      {!isMobile && (
        <motion.div
          className="fixed w-12 h-12 pointer-events-none z-50 mix-blend-difference hidden md:block"
          animate={{ x: cursorPosition.x - 24, y: cursorPosition.y - 24 }}
          transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
        >
          <div className="w-full h-full border-3 border-white rotate-45 animate-pulse"></div>
        </motion.div>
      )}

      {/* Sticky Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "py-3 bg-black/90 backdrop-blur-md border-b-4 border-white"
            : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center arcade-btn-large"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              <ChevronLeft className="h-8 w-8 mr-3" />
              <span className="text-xl">BACK</span>
            </Link>
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight glitch-text-sm"
            data-text="GAMES"
          >
            GAMES
          </h1>

          {/* User Profile Section */}
          <div className="flex items-center gap-4 h-28">
            {loading ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[hsl(var(--accent-purple))] rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              </div>
            ) : (
              <>
                {isAuthenticated && userProfile ? (
                  <div className="hidden md:flex items-center gap-4 bg-gray-900 p-3 border-3 border-white rounded-lg">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[hsl(var(--accent-purple))] rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {userProfile.email || "User"}
                        </div>
                        <div className="text-xs text-gray-400">VORLD USER</div>
                      </div>
                    </div>

                    {/* Points Display */}
                    <div className="flex items-center gap-2 border-l-2 border-white/20 pl-4">
                      <Image
                        src="/images/cryptoCoin1.png"
                        width={24}
                        height={24}
                        alt="Points"
                        className="mr-1"
                      />
                      <span className="text-base font-bold text-[hsl(var(--accent-yellow))]">
                        {points}
                      </span>
                    </div>

                    {/* Stream URL quick badge */}
                    <div className="flex items-center gap-2 border-l-2 border-white/20 pl-4 max-w-xs">
                      <span className="text-xs text-gray-400">STREAM</span>
                      <span className="text-xs font-bold truncate max-w-[160px]">
                        {streamUrl || "Not set"}
                      </span>
                      <motion.button
                        className="px-2 py-1 bg-[hsl(var(--accent-purple))] text-white text-xs font-bold rounded-md border-2 border-white"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setShowStreamDialog(true);
                          playSound("click");
                        }}
                        onMouseEnter={() => playSound("hover")}
                      >
                        SET
                      </motion.button>
                    </div>

                    {/* Logout Button */}
                    <motion.button
                      className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        handleLogout();
                        playSound("click");
                      }}
                      onMouseEnter={() => playSound("hover")}
                    >
                      <LogOut className="h-4 w-4" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-4">
                    <AnimatedButton
                      className="bg-blue-700 text-white px-4 py-3 text-sm font-bold border-3 border-blue-500"
                      onClick={() => {
                        setShowStreamDialog(true);
                        playSound("click");
                      }}
                      onHover={() => playSound("hover")}
                    >
                      SET STREAM URL
                    </AnimatedButton>
                    <AnimatedButton
                      className="bg-[hsl(var(--accent-purple))] text-white px-6 py-3 text-lg font-bold border-3 border-[hsl(var(--accent-purple)/0.7)]"
                      onClick={() => {
                        handleSignIn();
                        playSound("click");
                      }}
                      onHover={() => playSound("hover")}
                    >
                      <Shield className="mr-2 h-5 w-5" />
                      SIGN IN WITH VORLD
                    </AnimatedButton>
                  </div>
                )}

                {/* Mobile menu button */}
                <motion.button
                  className="md:hidden arcade-btn-large p-3 border-3 border-white"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMenuOpen(!menuOpen);
                    playSound("click");
                  }}
                >
                  {menuOpen ? (
                    <X className="h-7 w-7" />
                  ) : (
                    <Menu className="h-7 w-7" />
                  )}
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="md:hidden bg-black border-t-2 border-white/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <nav className="p-4">
                <ul className="space-y-4">
                  {isAuthenticated && userProfile ? (
                    <>
                      {/* User Profile for mobile */}
                      <li className="py-2">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-[hsl(var(--accent-purple))] rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">
                              {userProfile.email || "User"}
                            </div>
                            <div className="text-xs text-gray-400">
                              VORLD USER
                            </div>
                          </div>
                        </div>
                      </li>

                      {/* Points for mobile */}
                      <li className="py-2">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center">
                            <Image
                              src="/images/cryptoCoin1.png"
                              width={24}
                              height={24}
                              alt="Points"
                              className="mr-2"
                            />
                            <span className="text-base font-bold">
                              POINTS: {points}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-md w-full"
                              onClick={() => {
                                setShowBuyDialog(true);
                                setMenuOpen(false);
                                playSound("click");
                              }}
                            >
                              BUY POINTS
                            </button>

                            <button
                              className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-md w-full"
                              onClick={() => {
                                setShowSellDialog(true);
                                setMenuOpen(false);
                                playSound("click");
                              }}
                            >
                              SELL POINTS
                            </button>
                          </div>
                        </div>
                      </li>

                      {/* Logout for mobile */}
                      <li className="py-2">
                        <button
                          className="w-full px-3 py-2 bg-red-600 text-white text-sm font-bold rounded-md flex items-center justify-center"
                          onClick={() => {
                            handleLogout();
                            setMenuOpen(false);
                            playSound("click");
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          LOGOUT
                        </button>
                      </li>
                    </>
                  ) : (
                    <li className="py-2">
                      <button
                        className="w-full px-3 py-2 bg-[hsl(var(--accent-purple))] text-white text-sm font-bold rounded-md flex items-center justify-center"
                        onClick={() => {
                          handleSignIn();
                          setMenuOpen(false);
                          playSound("click");
                        }}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        SIGN IN WITH VORLD
                      </button>
                    </li>
                  )}
                </ul>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Wallet Connection Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 border-4 border-white p-8 max-w-md w-full relative"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                onClick={() => {
                  setShowWalletModal(false);
                  playSound("click");
                }}
              >
                <ChevronLeft className="h-8 w-8 rotate-180" />
              </button>

              <h2
                className="text-3xl font-bold mb-8 text-center glitch-text-sm"
                data-text="CONNECT WALLET"
              >
                CONNECT WALLET
              </h2>

              <div className="grid gap-5">
                <AnimatedButton
                  className="flex items-center justify-between p-5 border-3 border-white hover:border-yellow-400 hover:bg-gray-800 transition-colors"
                  onClick={handleConnectWallet}
                >
                  <div className="flex items-center">
                    <Image
                      src="/metamask.png"
                      width={40}
                      height={40}
                      alt="MetaMask"
                      className="mr-4"
                    />
                    <span className="font-bold text-xl">MetaMask</span>
                  </div>
                  <ChevronLeft className="h-6 w-6 rotate-180" />
                </AnimatedButton>

                <AnimatedButton
                  className="flex items-center justify-between p-5 border-3 border-white hover:border-yellow-400 hover:bg-gray-800 transition-colors"
                  onClick={handleConnectWallet}
                >
                  <div className="flex items-center">
                    <Image
                      src="/walletconnect.png"
                      width={40}
                      height={40}
                      alt="WalletConnect"
                      className="mr-4"
                    />
                    <span className="font-bold text-xl">WalletConnect</span>
                  </div>
                  <ChevronLeft className="h-6 w-6 rotate-180" />
                </AnimatedButton>

                <AnimatedButton
                  className="flex items-center justify-between p-5 border-3 border-white hover:border-yellow-400 hover:bg-gray-800 transition-colors"
                  onClick={handleConnectWallet}
                >
                  <div className="flex items-center">
                    <Image
                      src="/coinbase.png"
                      width={40}
                      height={40}
                      alt="Coinbase Wallet"
                      className="mr-4"
                    />
                    <span className="font-bold text-xl">Coinbase Wallet</span>
                  </div>
                  <ChevronLeft className="h-6 w-6 rotate-180" />
                </AnimatedButton>
              </div>

              <p className="text-sm text-gray-400 mt-8 text-center">
                By connecting your wallet, you agree to our Terms of Service and
                Privacy Policy
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Games Page Content */}
      <div className="py-28 px-4 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
            <h2 className="text-4xl font-bold flex items-center">
              <Gamepad2 className="mr-3 h-8 w-8 text-yellow-400" />
              GAMES LIBRARY
            </h2>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="SEARCH GAMES"
                className="bg-black border-3 border-white pl-12 pr-5 py-3 focus:border-yellow-400 outline-none w-full md:w-80 arcade-btn text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Filter className="mr-3 h-5 w-5" />
              <h3 className="font-bold text-xl">CATEGORIES</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <AnimatedButton
                  key={category}
                  className={`px-6 py-3 border-3 text-lg ${
                    selectedCategory === category
                      ? "border-yellow-400 bg-yellow-400 bg-opacity-20 text-yellow-400"
                      : "border-white hover:border-yellow-400"
                  }`}
                  onClick={() => {
                    setSelectedCategory(category);
                    playSound("click");
                  }}
                  onHover={() => playSound("hover")}
                >
                  {category}
                </AnimatedButton>
              ))}
            </div>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGames.map((game) => (
              <motion.div
                key={game.id}
                className={`bg-black border-3 ${
                  game.status === "coming-soon"
                    ? "border-purple-400 opacity-90"
                    : "border-white hover:border-yellow-400"
                } transition-colors arcade-card`}
                whileHover={{ y: -8 }}
                onMouseEnter={() => playSound("hover")}
              >
                <div className="bg-gray-900 h-56 relative overflow-hidden">
                  <Image
                    src={`${game.image}`}
                    alt={game.title}
                    width={500}
                    height={300}
                    className={`object-cover w-full h-full ${
                      game.status === "coming-soon" ? "grayscale" : ""
                    }`}
                  />

                  <div className="absolute top-0 left-0 w-full p-3 flex justify-between">
                    <span className="px-3 py-1.5 bg-black/80 text-base font-bold">
                      {game.category}
                    </span>

                    <span
                      className={`px-3 py-1.5 text-base font-bold ${
                        game.status === "live"
                          ? "bg-red-600"
                          : game.status === "waiting"
                          ? "bg-yellow-600"
                          : "bg-purple-600"
                      }`}
                    >
                      {game.status === "live"
                        ? "LIVE"
                        : game.status === "waiting"
                        ? "WAITING"
                        : "COMING SOON"}
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-3 flex justify-between text-sm">
                    <span className="px-3 py-1.5 bg-black/80 font-bold flex items-center">
                      <Coins className="h-4 w-4 mr-2 text-yellow-400" />
                      POINTS: {game.pointsRequired}
                    </span>

                    <span className="px-3 py-1.5 bg-black/80 font-bold flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {game.players}/{game.maxPlayers}
                    </span>
                  </div>

                  {game.status === "coming-soon" && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="bg-purple-600 px-6 py-3 text-xl font-bold border-3 border-purple-400 transform rotate-[-5deg]">
                        COMING SOON
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-3 flex items-center">
                    {game.title}
                    {game.status === "live" && (
                      <span className="ml-3 inline-flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </h3>

                  <div className="flex justify-between items-center text-base text-gray-400 mb-5">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                      Prize Pool: {game.prize} Sol
                    </div>

                    {game.status === "live" && (
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        In Progress
                      </div>
                    )}
                  </div>
                  {game.status !== "coming-soon" ? (
                    <ParticleButton
                      onClick={() => handleGameClick(game)}
                      className={`arcade-btn text-white px-5 py-3 w-full border-3 text-lg ${
                        game.status === "coming-soon"
                          ? "bg-purple-700 border-purple-600 hover:bg-purple-600"
                          : "bg-purple-700 border-purple-600 hover:bg-purple-600"
                      }`}
                    >
                      {game.status === "live"
                        ? "JOIN GAME"
                        : game.status === "waiting"
                        ? "PLAY NOW"
                        : "COMING SOON"}
                    </ParticleButton>
                  ) : (
                    <Link href={"/coming-soon-games"}>
                      <ParticleButton
                        className={`arcade-btn text-white px-5 py-3 w-full border-3 text-lg ${
                          game.status === "coming-soon"
                            ? "bg-purple-700 border-purple-600 hover:bg-purple-600"
                            : "bg-purple-700 border-purple-600 hover:bg-purple-600"
                        }`}
                      >
                        COMING SOON
                      </ParticleButton>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredGames.length === 0 && (
            <div className="text-center py-16 border-3 border-white p-10">
              <p className="text-2xl mb-6">
                No games found matching your criteria.
              </p>
              <AnimatedButton
                className="arcade-btn-outline text-lg px-8 py-4 border-3"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                  playSound("click");
                }}
                onHover={() => playSound("hover")}
              >
                SHOW ALL GAMES
              </AnimatedButton>
            </div>
          )}
        </div>
      </div>

      {/* Game Play Dialog */}
      <AnimatePresence>
        {showGameDialog && selectedGame && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 border-4 border-white p-6 max-w-md w-full relative mx-auto my-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "linear-gradient(to bottom, #1a1a1a, #000000)",
                boxShadow:
                  "0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 0, 255, 0.1)",
              }}
            >
              {/* Close button */}
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                onClick={() => {
                  setShowGameDialog(false);
                  playSound("click");
                }}
              >
                <X className="h-6 w-6" />
              </button>

              {/* CRT scanline effect for the dialog */}
              <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-20 pointer-events-none"></div>
              <div className="absolute inset-0 crt-effect pointer-events-none"></div>

              {/* Title with glitch effect */}
              <div className="text-center mb-4">
                <h2
                  className="text-2xl font-bold glitch-text"
                  data-text={selectedGame.title}
                >
                  {selectedGame.title}
                </h2>
                <div className="mt-1 inline-block bg-red-600 px-2 py-0.5 text-sm">
                  {selectedGame.status === "live" ? "LIVE" : "WAITING"}
                </div>
              </div>

              {/* Game details */}
              <div className="space-y-4 mb-6">
                <div className="text-center">
                  <div className="inline-block bg-black border-2 border-white p-4 rounded-md relative">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-black px-3 text-sm">
                      ENTRY FEE
                    </div>
                    <div className="flex items-center justify-center">
                      <Image
                        src="/images/cryptoCoin1.png"
                        width={28}
                        height={28}
                        alt="Points"
                        className="mr-2"
                      />
                      <span className="text-2xl font-bold text-yellow-400">
                        {selectedGame.pointsRequired}
                      </span>
                    </div>
                    <div className="text-xs mt-1 text-gray-400">POINTS</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-black/50 border-2 border-white p-2">
                    <div className="text-xs text-gray-400">PLAYERS</div>
                    <div className="flex items-center justify-center mt-1">
                      <Users className="h-4 w-4 mr-1 text-blue-400" />
                      <span className="text-lg">
                        {selectedGame.players}/{selectedGame.maxPlayers}
                      </span>
                    </div>
                  </div>

                  <div className="bg-black/50 border-2 border-white p-2">
                    <div className="text-xs text-gray-400">PRIZE POOL</div>
                    <div className="flex items-center justify-center mt-1">
                      <Trophy className="h-4 w-4 mr-1 text-yellow-400" />
                      <span className="text-lg">{selectedGame.prize} Sol</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/50 border-2 border-white p-3 text-center">
                  <div className="text-xs text-gray-400">YOUR BALANCE</div>
                  <div className="flex items-center justify-center mt-1">
                    <Image
                      src="/images/cryptoCoin1.png"
                      width={24}
                      height={24}
                      alt="Points"
                      className="mr-2"
                    />
                    <span className="text-xl font-bold">{points}</span>
                  </div>
                </div>

                {/* Stream URL Notice */}
                {!streamUrl && (
                  <div className="bg-yellow-900/40 border-2 border-yellow-500 p-2 text-center text-yellow-200 text-sm">
                    <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                    Stream URL not set. To play with Vorld-enabled games, please
                    add your Stream URL.
                    <div className="mt-2">
                      <AnimatedButton
                        className="px-3 py-1 border-2 border-yellow-400 text-yellow-200"
                        onClick={() => {
                          setShowStreamDialog(true);
                          playSound("click");
                        }}
                        onHover={() => playSound("hover")}
                      >
                        ADD STREAM URL
                      </AnimatedButton>
                    </div>
                  </div>
                )}

                {points < selectedGame.pointsRequired && (
                  <div className="bg-red-900/30 border-2 border-red-500 p-2 text-center text-red-300 text-sm">
                    <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                    You need {selectedGame.pointsRequired - points} more points
                    to play
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <AnimatedButton
                  className="arcade-btn-outline border-2 py-2 px-4 text-base font-bold"
                  onClick={() => {
                    setShowGameDialog(false);
                    playSound("click");
                  }}
                  onHover={() => playSound("hover")}
                >
                  CANCEL
                </AnimatedButton>

                <AnimatedButton
                  className={`py-2 px-4 text-base font-bold border-2 ${
                    points >= selectedGame.pointsRequired &&
                    (!!streamUrl || selectedGame.title === "Candy Crush")
                      ? "arcade-btn bg-green-600 border-green-500 text-white"
                      : "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (
                      points >= selectedGame.pointsRequired &&
                      (!!streamUrl || selectedGame.title === "Candy Crush")
                    ) {
                      handlePlayGame(selectedGame);
                      playSound("click");
                    } else {
                      if (!streamUrl && selectedGame.title !== "Candy Crush") {
                        setShowStreamDialog(true);
                      }
                      playSound("error");
                    }
                  }}
                  onHover={() => {
                    if (
                      points >= selectedGame.pointsRequired &&
                      (!!streamUrl || selectedGame.title === "Candy Crush")
                    ) {
                      playSound("hover");
                    }
                  }}
                >
                  PLAY NOW
                </AnimatedButton>
              </div>

              {/* Bottom note */}
              <p className="text-xs text-gray-500 mt-4 text-center">
                {selectedGame.pointsRequired} points will be deducted from your
                account when you start the game
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stream URL Modal */}
      <AnimatePresence>
        {showStreamDialog && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 border-4 border-white p-6 max-w-md w-full relative mx-auto my-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "linear-gradient(to bottom, #1a1a1a, #000000)",
                boxShadow:
                  "0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 0, 255, 0.1)",
              }}
            >
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                onClick={() => {
                  setShowStreamDialog(false);
                  playSound("click");
                }}
              >
                <X className="h-6 w-6" />
              </button>
              <div className="text-center mb-4">
                <h2
                  className="text-2xl font-bold glitch-text"
                  data-text="SET STREAM URL"
                >
                  SET STREAM URL
                </h2>
              </div>
              <div className="space-y-4 mb-4">
                <label className="block text-sm text-gray-300">
                  Enter your Stream URL (Twitch, YouTube etc.)
                </label>
                <input
                  type="url"
                  placeholder="https://twitch.tv/yourchannel"
                  className="w-full bg-black border-3 border-white px-3 py-2 text-white outline-none focus:border-yellow-400"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <AnimatedButton
                  className="arcade-btn-outline border-2 py-2 px-4 text-base font-bold"
                  onClick={() => {
                    setShowStreamDialog(false);
                    playSound("click");
                  }}
                  onHover={() => playSound("hover")}
                >
                  CANCEL
                </AnimatedButton>
                <AnimatedButton
                  className="arcade-btn bg-[hsl(var(--accent-purple))] border-2 border-[hsl(var(--accent-purple)/0.7)] py-2 px-4 text-base font-bold text-white"
                  onClick={() => {
                    localStorage.setItem("streamUrl", streamUrl || "");
                    toast({
                      title: "Stream URL Saved",
                      description: streamUrl
                        ? "Your stream URL has been saved."
                        : "Stream URL cleared.",
                      duration: 2500,
                    });
                    setShowStreamDialog(false);
                    playSound("success");
                  }}
                  onHover={() => playSound("hover")}
                >
                  SAVE
                </AnimatedButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BuyPointsDialog
        isOpen={showBuyDialog}
        onClose={() => setShowBuyDialog(false)}
        onBuy={handleBuyPoints}
        currentPoints={points}
      />

      {/* Sell Points Dialog */}
      <SellPointsDialog
        isOpen={showSellDialog}
        onClose={() => setShowSellDialog(false)}
        onSell={handleSellPoints}
        currentPoints={points}
      />

      {/* Authentication Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 border-4 border-white p-8 max-w-md w-full relative mx-auto my-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "linear-gradient(to bottom, #1a1a1a, #000000)",
                boxShadow:
                  "0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 0, 255, 0.1)",
              }}
            >
              {/* Close button */}
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                onClick={() => {
                  setShowAuthModal(false);
                  playSound("click");
                }}
              >
                <X className="h-6 w-6" />
              </button>

              {/* CRT scanline effect for the dialog */}
              <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-20 pointer-events-none"></div>
              <div className="absolute inset-0 crt-effect pointer-events-none"></div>

              {/* Title with glitch effect */}
              <div className="text-center mb-6 relative z-10">
                <Shield className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--accent-yellow))]" />
                <h2
                  className="text-3xl font-bold glitch-text"
                  data-text="AUTHENTICATION REQUIRED"
                >
                  AUTHENTICATION REQUIRED
                </h2>
                <p className="text-lg text-gray-300 mt-2">
                  You need to sign in with Vorld to play games
                </p>
              </div>

              {/* Content */}
              <div className="space-y-6 mb-8 relative z-10">
                <div className="bg-black/50 border-2 border-white p-4 text-center">
                  <div className="text-sm text-gray-400 mb-2">ACCESS LEVEL</div>
                  <div className="text-2xl font-bold text-[hsl(var(--accent-yellow))]">
                    VORLD USER REQUIRED
                  </div>
                </div>

                <div className="text-center text-gray-300">
                  <p className="mb-4">
                    Sign in with your Vorld account to access the gaming
                    platform and start earning points.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-[hsl(var(--accent-green))]" />
                    <span>Secure authentication</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 relative z-10">
                <AnimatedButton
                  className="arcade-btn-outline border-2 py-3 px-4 text-base font-bold"
                  onClick={() => {
                    setShowAuthModal(false);
                    playSound("click");
                  }}
                  onHover={() => playSound("hover")}
                >
                  CANCEL
                </AnimatedButton>

                <AnimatedButton
                  className="arcade-btn bg-[hsl(var(--accent-purple))] border-2 border-[hsl(var(--accent-purple)/0.7)] py-3 px-4 text-base font-bold text-white"
                  onClick={() => {
                    setShowAuthModal(false);
                    handleSignIn();
                    playSound("click");
                  }}
                  onHover={() => playSound("hover")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  SIGN IN
                </AnimatedButton>
              </div>

              {/* Bottom note */}
              <p className="text-xs text-gray-500 mt-4 text-center relative z-10">
                Vorld authentication is required to access gaming features
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arena Initialization Loader */}
      <AnimatePresence>
        {arenaInitializing && (
          <motion.div
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* CRT and scanline effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-30"></div>
              <div className="absolute inset-0 crt-effect"></div>
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "linear-gradient(#ffffff22 1px, transparent 1px), linear-gradient(90deg, #ffffff22 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              ></div>
            </div>

            {/* Main content */}
            <div className="relative z-10 text-center">
              {/* Animated spinner */}
              <motion.div
                className="mx-auto mb-8"
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{
                  rotate: {
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear",
                  },
                  scale: {
                    duration: 0.5,
                  },
                }}
              >
                <div className="relative w-32 h-32 mx-auto">
                  {/* Outer ring */}
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                  {/* Inner ring */}
                  <motion.div
                    className="absolute inset-4 border-4 border-purple-500 rounded-full border-b-transparent"
                    animate={{ rotate: 360 }}
                    transition={{
                      rotate: {
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear",
                        repeatType: "reverse",
                      },
                    }}
                  ></motion.div>
                  {/* Center glow */}
                  <div className="absolute inset-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                </div>
              </motion.div>

              {/* Glitch text effect */}
              <motion.h2
                className="text-5xl md:text-6xl font-bold mb-6 glitch-text-sm"
                data-text={arenaInitMessage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={arenaInitMessage}
                transition={{ duration: 0.3 }}
                style={{
                  textShadow:
                    "0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(147, 51, 234, 0.5), 2px 2px 0px #00ffff, -2px -2px 0px #9333ea",
                }}
              >
                {arenaInitMessage}
              </motion.h2>

              {/* Progress dots */}
              <motion.div
                className="flex justify-center gap-2 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-blue-400 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>

              {/* Particle effects */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-blue-400 rounded-full"
                    initial={{
                      x: "50%",
                      y: "50%",
                      opacity: 0,
                    }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 100}%`,
                      y: `${50 + (Math.random() - 0.5) * 100}%`,
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-black border-t-4 border-white py-10 px-4 mt-16 relative z-20">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-lg">
          &copy; {new Date().getFullYear()} Empire of Bits. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
