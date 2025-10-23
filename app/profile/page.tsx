"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Star,
  Gamepad2,
  Coins,
  Clock,
  LogOut,
  User,
  Shield,
  Wallet,
} from "lucide-react";
import RetroBackground from "@/components/retro-background";
import AvatarSelector from "@/components/avatar-selector";
import { TerminalText } from "@/components/terminal-text";
import { formatNumber } from "@/lib/utils";
import { motion } from "framer-motion";
import { Scanlines } from "@/components/scanlines";
import { Glitch } from "@/components/glitch";
import { VorldAuthService } from "@/lib/authservice";

interface GameData {
  success: boolean;
  userId: string;
  games: {
    CandyCrush: {
      totalPoints: number;
      currentLevel: number;
      levels: {
        levelNumber: number;
        cleared: boolean;
        stars: number;
        pointsEarned: number;
        maxPoints: number;
        _id: string;
      }[];
    } | null;
    battleship: {
      totalPoints: number;
      totalGames: number;
      gamesWon: number;
      gameHistory: {
        difficulty: string;
        won: boolean;
        pointsEarned: number;
        movesUsed: number;
        playedAt: string;
        _id: string;
      }[];
    } | null;
    spaceinvaders: {
      totalPoints: number;
      highScore: number;
      totalGames: number;
      gameHistory: {
        score: number;
        level: number;
        enemiesDestroyed: number;
        playedAt: string;
        _id: string;
      }[];
    } | null;
    platformer: null;
  };
}

interface VorldProfile {
  authMethods: string[];
  connectedAccounts: {
    provider: string;
    isConnected: boolean;
  }[];
  connectionSummary: {
    connectedProviders: string[];
    totalConnected: number;
  };
  createdAt: string;
  defaultWallet: {
    address: string;
    nickname: string | null;
  };
  email: string;
  lastLogin: string;
  states: {
    activeUser: string;
    airdroper: string;
    developer: string;
    gameDeveloper: string;
    gamer: string;
    streamer: string;
  };
  status: string;
  streamUrl: string | null;
  totalConnectedAccounts: number;
  username: string;
  verified: boolean;
  walletAddress: string | null;
  wallets: {
    address: string;
    createdAt: string;
    id: string;
    isDefault: boolean;
    nickname: string | null;
  }[];
  walletsCount: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userName, setUserName] = useState<string>("PLAYER ONE");
  const [isLoading, setIsLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [totalPoints, setTotalPoints] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);
  const [vorldProfile, setVorldProfile] = useState<VorldProfile | null>(null);
  const [vorldLoading, setVorldLoading] = useState(false);
  const [vorldError, setVorldError] = useState<string | null>(null);
  const authService = new VorldAuthService();

  useEffect(() => {
    // Simulate boot sequence
    setTimeout(() => {
      setBootComplete(true);
    }, 1000);

    // Check if wallet is connected
    const storedWalletAddress = localStorage.getItem("walletAddress");
    const storedUserName = localStorage.getItem("userName");

    if (!storedWalletAddress) {
      router.push("/");
      return;
    }

    setWalletAddress(storedWalletAddress);
    if (storedUserName) {
      setUserName(storedUserName);
      setNameInput(storedUserName);
    }

    // Fetch game data
    fetchGameData(storedWalletAddress);

    // Auto-fetch Vorld profile if authenticated
    if (authService.isAuthenticated()) {
      fetchVorldProfile();
    }
  }, [router]);

  const fetchGameData = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/v1/users/${userId}/games`
      );
      const data = await response.json();
      console.log("Game data fetched:", data);
      setGameData(data);

      // Calculate total points across all games
      let points = 0;
      if (data.games?.candycrush) points += data.games?.candycrush?.totalPoints;
      if (data.games?.battleship) points += data.games?.battleship?.totalPoints;
      if (data.games?.spaceinvaders)
        points += data.games?.spaceinvaders?.totalPoints;
      setTotalPoints(data.userId.points);

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching game data:", error);
      setIsLoading(false);
    }
  };

  const fetchVorldProfile = async () => {
    try {
      setVorldLoading(true);
      setVorldError(null);

      // Check if user is authenticated first
      if (!authService.isAuthenticated()) {
        setVorldError("Not authenticated. Please login to view Vorld profile.");
        return;
      }

      const result = await authService.getProfile();

      if (result.success) {
        console.log("result.data", result.data);
        setVorldProfile(result.data.data.profile);
      } else {
        setVorldError(result.error);
      }
    } catch (error) {
      console.error("Vorld profile loading failed:", error);
      setVorldError("Failed to load Vorld profile");
    } finally {
      setVorldLoading(false);
    }
  };

  console.log("vorldProfile:", vorldProfile);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim().toUpperCase());
      localStorage.setItem("userName", nameInput.trim().toUpperCase());
    }
    setEditingName(false);
  };

  const handleLogout = () => {
    // localStorage.removeItem("walletAddress");
    router.push("/");
  };

  if (!bootComplete || isLoading) {
    return (
      <RetroBackground>
        <Scanlines />
        <div className="min-h-screen flex items-center justify-center">
          <div className="terminal-window p-8 border-2 border-white bg-black text-white font-mono">
            <TerminalText
              text={[
                "LOADING USER PROFILE...",
                "ACCESSING DATABASE...",
                "RETRIEVING GAME DATA...",
                "PLEASE WAIT...",
              ]}
              className="mb-4"
            />
            <div className="flex justify-center">
              <div className="loading-bar w-64 h-4 border border-white relative overflow-hidden">
                <div className="loading-bar-progress absolute top-0 left-0 h-full bg-white animate-loading-bar"></div>
              </div>
            </div>
          </div>
        </div>
      </RetroBackground>
    );
  }

  return (
    <RetroBackground>
      <Scanlines />
      <div className="min-h-screen p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="terminal-window max-w-6xl mx-auto p-4 md:p-8 border-2 border-white bg-black text-white font-mono relative"
        >
          {/* Header with wallet and logout */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="terminal-header border-b border-white pb-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <div className="flex items-center gap-2">
              <Glitch
                text="TERMINAL ARCADE"
                className="text-xl md:text-2xl font-bold tracking-widest"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs md:text-sm bg-black border border-white p-2 truncate max-w-[200px]">
                {walletAddress}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-black hover:bg-white hover:text-black text-white border border-white font-mono"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                EXIT
              </Button>
            </div>
          </motion.div>

          {/* Profile section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Avatar and name */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="terminal-section border border-white p-4 flex flex-col items-center"
            >
              <AvatarSelector />

              <div className="mt-4 w-full text-center">
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      maxLength={12}
                      className="bg-black border border-white text-white p-2 font-mono text-center w-full"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-black hover:bg-white hover:text-black text-white border border-white font-mono"
                      onClick={handleSaveName}
                    >
                      SAVE
                    </Button>
                  </div>
                ) : (
                  <div
                    className="text-xl text-white cursor-pointer hover:text-gray-300 transition-colors"
                    onClick={() => {
                      setEditingName(true);
                      setNameInput(vorldProfile?.username || userName);
                    }}
                  >
                    {vorldProfile?.username || userName}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">CLICK TO EDIT</div>

                {/* Vorld Profile Details */}
                {vorldProfile && (
                  <div className="mt-4 space-y-2 text-left">
                    <div className="text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>EMAIL:</span>
                        <span className="text-white font-mono text-xs">
                          {vorldProfile.email}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>STATUS:</span>
                        <span
                          className={`font-mono text-xs ${
                            vorldProfile.status === "active"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {vorldProfile.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>VERIFIED:</span>
                        <span
                          className={`font-mono text-xs ${
                            vorldProfile.verified
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {vorldProfile.verified ? "YES" : "NO"}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>WALLETS:</span>
                        <span className="text-white font-mono text-xs">
                          {vorldProfile.walletsCount}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>LAST LOGIN:</span>
                        <span className="text-white font-mono text-xs">
                          {new Date(
                            vorldProfile.lastLogin
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total points */}
              <div className="mt-6 w-full">
                <div className="text-center mb-2">
                  <div className="text-xs text-gray-400">TOTAL POINTS</div>
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                      duration: 0.5,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 5,
                    }}
                    className="text-3xl text-white"
                  >
                    {formatNumber(totalPoints)}
                  </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="bg-black hover:bg-white hover:text-black text-white border border-white font-mono"
                    onClick={() => router.push("/")}
                  >
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    PLAY
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-black hover:bg-white hover:text-black text-white border border-white font-mono"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    RANKS
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Game stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="md:col-span-2"
            >
              <Tabs defaultValue="games" className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-4 bg-black border border-white">
                  <TabsTrigger
                    value="games"
                    className="font-mono text-white data-[state=active]:bg-white data-[state=active]:text-black"
                  >
                    GAME STATS
                  </TabsTrigger>
                  <TabsTrigger
                    value="vorld"
                    className="font-mono text-white data-[state=active]:bg-white data-[state=active]:text-black"
                    onClick={fetchVorldProfile}
                  >
                    VORLD PROFILE
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="games" className="mt-0">
                  <div className="terminal-section border border-white p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Candy Crush */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.02 }}
                        className="game-card border border-white p-3"
                      >
                        <h3 className="text-lg text-white font-mono mb-2 border-b border-white pb-1">
                          CANDY CRUSH
                        </h3>
                        {gameData?.games.CandyCrush ? (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-300">
                                LEVEL
                              </span>
                              <span className="text-xs text-white">
                                {gameData.games.CandyCrush.currentLevel}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-300">
                                POINTS
                              </span>
                              <span className="text-xs text-white">
                                {formatNumber(
                                  gameData.games.CandyCrush.totalPoints
                                )}
                              </span>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-300">
                                  PROGRESS
                                </span>
                                <div className="flex">
                                  {[...Array(3)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        gameData.games.CandyCrush &&
                                        i <
                                          (gameData.games.CandyCrush.levels[0]
                                            ?.stars || 0)
                                          ? "text-white"
                                          : "text-gray-600"
                                      }`}
                                      fill={
                                        gameData.games.CandyCrush &&
                                        i <
                                          (gameData.games.CandyCrush.levels[0]
                                            ?.stars || 0)
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="w-full h-2 border border-white relative">
                                <div
                                  className="absolute top-0 left-0 h-full bg-white"
                                  style={{
                                    width: `${
                                      (gameData.games.CandyCrush.levels[0]
                                        ?.pointsEarned /
                                        gameData.games.CandyCrush.levels[0]
                                          ?.maxPoints) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-300">
                            NO DATA AVAILABLE
                          </div>
                        )}
                      </motion.div>

                      {/* Battleship */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                        className="game-card border border-white p-3"
                      >
                        <h3 className="text-lg text-white font-mono mb-2 border-b border-white pb-1">
                          BATTLESHIP
                        </h3>
                        {gameData?.games.battleship ? (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-300">
                                GAMES
                              </span>
                              <span className="text-xs text-white">
                                {gameData.games.battleship.totalGames}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-300">
                                WINS
                              </span>
                              <span className="text-xs text-white">
                                {gameData.games.battleship.gamesWon}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-300">
                                POINTS
                              </span>
                              <span className="text-xs text-white">
                                {formatNumber(
                                  gameData.games.battleship.totalPoints
                                )}
                              </span>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-300">
                                  WIN RATE
                                </span>
                                <span className="text-xs text-white">
                                  {gameData.games.battleship.totalGames > 0
                                    ? Math.round(
                                        (gameData.games.battleship.gamesWon /
                                          gameData.games.battleship
                                            .totalGames) *
                                          100
                                      )
                                    : 0}
                                  %
                                </span>
                              </div>
                              <div className="w-full h-2 border border-white relative">
                                <div
                                  className="absolute top-0 left-0 h-full bg-white"
                                  style={{
                                    width: `${
                                      gameData.games.battleship.totalGames > 0
                                        ? (gameData.games.battleship.gamesWon /
                                            gameData.games.battleship
                                              .totalGames) *
                                          100
                                        : 0
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-300">
                            NO DATA AVAILABLE
                          </div>
                        )}
                      </motion.div>

                      {/* Space Invaders */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        whileHover={{ scale: 1.02 }}
                        className="game-card border border-white p-3"
                      >
                        <h3 className="text-lg text-white font-mono mb-2 border-b border-white pb-1">
                          SPACE INVADERS
                        </h3>
                        {gameData?.games.spaceinvaders ? (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-300">
                                GAMES
                              </span>
                              <span className="text-xs text-white">
                                {gameData.games.spaceinvaders.totalGames}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-300">
                                HIGH SCORE
                              </span>
                              <span className="text-xs text-white">
                                {formatNumber(
                                  gameData.games.spaceinvaders.highScore
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-300">
                                TOTAL POINTS
                              </span>
                              <span className="text-xs text-white">
                                {formatNumber(
                                  gameData.games.spaceinvaders.totalPoints
                                )}
                              </span>
                            </div>
                            <div className="text-xs text-gray-300 mt-1">
                              LAST PLAYED:{" "}
                              {new Date(
                                gameData.games.spaceinvaders.gameHistory[0]
                                  ?.playedAt || Date.now()
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-300">
                            NO DATA AVAILABLE
                          </div>
                        )}
                      </motion.div>

                      {/* Platformer */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ scale: 1.02 }}
                        className="game-card border border-white p-3"
                      >
                        <h3 className="text-lg text-white font-mono mb-2 border-b border-white pb-1">
                          PLATFORMER
                        </h3>
                        <div className="text-xs text-gray-300">
                          GAME COMING SOON!
                        </div>
                        <Button
                          variant="outline"
                          className="bg-black hover:bg-white hover:text-black text-white border border-white font-mono mt-4 w-full"
                          disabled
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          UNLOCK SOON
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="vorld" className="mt-0">
                  <div className="terminal-section border border-white p-4">
                    {vorldLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <TerminalText
                          text={[
                            "LOADING VORLD PROFILE...",
                            "ACCESSING AUTHENTICATION SERVER...",
                            "PLEASE WAIT...",
                          ]}
                          className="mb-4"
                        />
                        <div className="flex justify-center">
                          <div className="loading-bar w-64 h-4 border border-white relative overflow-hidden">
                            <div className="loading-bar-progress absolute top-0 left-0 h-full bg-white animate-loading-bar"></div>
                          </div>
                        </div>
                      </div>
                    ) : vorldError ? (
                      <div className="text-center py-8">
                        <div className="text-red-400 mb-4">
                          <Shield className="h-12 w-12 mx-auto mb-2" />
                          <div className="text-lg font-mono">
                            AUTHENTICATION ERROR
                          </div>
                        </div>
                        <div className="text-sm text-gray-300 mb-4">
                          {vorldError}
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            className="bg-black hover:bg-white hover:text-black text-white border border-white font-mono"
                            onClick={fetchVorldProfile}
                          >
                            RETRY CONNECTION
                          </Button>
                          {vorldError.includes("login") && (
                            <Button
                              variant="outline"
                              className="bg-black hover:bg-white hover:text-black text-white border border-white font-mono"
                              onClick={() => router.push("/signup")}
                            >
                              GO TO LOGIN
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : vorldProfile ? (
                      <div className="space-y-6">
                        {/* Basic Information */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="game-card border border-white p-4"
                        >
                          <h3 className="text-lg text-white font-mono mb-4 border-b border-white pb-2 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            BASIC INFORMATION
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  USERNAME
                                </span>
                                <span className="text-xs text-white font-mono">
                                  {vorldProfile.username}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  EMAIL
                                </span>
                                <span className="text-xs text-white font-mono">
                                  {vorldProfile.email}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  VERIFIED
                                </span>
                                <span
                                  className={`text-xs font-mono ${
                                    vorldProfile.verified
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {vorldProfile.verified ? "YES" : "NO"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  STATUS
                                </span>
                                <span
                                  className={`text-xs font-mono ${
                                    vorldProfile.status === "active"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {vorldProfile.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  CREATED
                                </span>
                                <span className="text-xs text-white font-mono">
                                  {new Date(
                                    vorldProfile.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  LAST LOGIN
                                </span>
                                <span className="text-xs text-white font-mono">
                                  {new Date(
                                    vorldProfile.lastLogin
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  WALLETS
                                </span>
                                <span className="text-xs text-white font-mono">
                                  {vorldProfile.walletsCount}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  CONNECTED
                                </span>
                                <span className="text-xs text-white font-mono">
                                  {
                                    vorldProfile.connectionSummary
                                      .totalConnected
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Authentication Methods */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="game-card border border-white p-4"
                        >
                          <h3 className="text-lg text-white font-mono mb-4 border-b border-white pb-2 flex items-center">
                            <Shield className="h-5 w-5 mr-2" />
                            AUTHENTICATION METHODS
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {vorldProfile.authMethods.map((method, index) => (
                              <motion.span
                                key={method}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * index }}
                                className="px-3 py-1 bg-white text-black rounded text-sm font-mono"
                              >
                                {method.toUpperCase()}
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>

                        {/* Account Status */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="game-card border border-white p-4"
                        >
                          <h3 className="text-lg text-white font-mono mb-4 border-b border-white pb-2">
                            ACCOUNT STATUS
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  ACTIVE USER
                                </span>
                                <span
                                  className={`text-xs font-mono ${
                                    vorldProfile.states.activeUser === "enabled"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {vorldProfile.states.activeUser === "enabled"
                                    ? "ENABLED"
                                    : "DISABLED"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  DEVELOPER
                                </span>
                                <span
                                  className={`text-xs font-mono ${
                                    vorldProfile.states.developer === "enabled"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {vorldProfile.states.developer === "enabled"
                                    ? "ENABLED"
                                    : "DISABLED"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  GAME DEVELOPER
                                </span>
                                <span
                                  className={`text-xs font-mono ${
                                    vorldProfile.states.gameDeveloper ===
                                    "enabled"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {vorldProfile.states.gameDeveloper ===
                                  "enabled"
                                    ? "ENABLED"
                                    : "DISABLED"}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  GAMER
                                </span>
                                <span
                                  className={`text-xs font-mono ${
                                    vorldProfile.states.gamer === "enabled"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {vorldProfile.states.gamer === "enabled"
                                    ? "ENABLED"
                                    : "DISABLED"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  STREAMER
                                </span>
                                <span
                                  className={`text-xs font-mono ${
                                    vorldProfile.states.streamer === "enabled"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {vorldProfile.states.streamer === "enabled"
                                    ? "ENABLED"
                                    : "DISABLED"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-300">
                                  AIRDROPER
                                </span>
                                <span
                                  className={`text-xs font-mono ${
                                    vorldProfile.states.airdroper === "enabled"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {vorldProfile.states.airdroper === "enabled"
                                    ? "ENABLED"
                                    : "DISABLED"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Connected Accounts */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="game-card border border-white p-4"
                        >
                          <h3 className="text-lg text-white font-mono mb-4 border-b border-white pb-2 flex items-center">
                            <Shield className="h-5 w-5 mr-2" />
                            CONNECTED ACCOUNTS
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {vorldProfile.connectedAccounts.map(
                              (account, index) => (
                                <motion.div
                                  key={account.provider}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 * index }}
                                  className={`p-2 border rounded text-center ${
                                    account.isConnected
                                      ? "border-green-400 bg-green-400/10"
                                      : "border-gray-600 bg-gray-600/10"
                                  }`}
                                >
                                  <div className="text-xs font-mono text-white">
                                    {account.provider.toUpperCase()}
                                  </div>
                                  <div
                                    className={`text-xs ${
                                      account.isConnected
                                        ? "text-green-400"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {account.isConnected
                                      ? "CONNECTED"
                                      : "NOT CONNECTED"}
                                  </div>
                                </motion.div>
                              )
                            )}
                          </div>
                        </motion.div>

                        {/* Wallets */}
                        {vorldProfile.wallets &&
                          vorldProfile.wallets.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              className="game-card border border-white p-4"
                            >
                              <h3 className="text-lg text-white font-mono mb-4 border-b border-white pb-2 flex items-center">
                                <Wallet className="h-5 w-5 mr-2" />
                                CONNECTED WALLETS
                              </h3>
                              <div className="space-y-2">
                                {vorldProfile.wallets.map((wallet, index) => (
                                  <motion.div
                                    key={wallet.address}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="flex justify-between items-center border border-white/30 p-2"
                                  >
                                    <div>
                                      <div className="text-xs text-white font-mono">
                                        {wallet.address.slice(0, 8)}...
                                        {wallet.address.slice(-8)}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {wallet.nickname || "No nickname"}
                                        {wallet.isDefault && " (DEFAULT)"}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Created:{" "}
                                        {new Date(
                                          wallet.createdAt
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                    {wallet.isDefault && (
                                      <div className="text-xs text-green-400 font-mono">
                                        DEFAULT
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-4">
                          <User className="h-12 w-12 mx-auto mb-2" />
                          <div className="text-lg font-mono">
                            NO VORLD PROFILE
                          </div>
                        </div>
                        <div className="text-sm text-gray-300 mb-4">
                          Click the VORLD PROFILE tab to load your profile
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Recent activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="terminal-section border border-white p-4"
          >
            <h2 className="text-xl text-white font-mono mb-4 border-b border-white pb-2">
              RECENT ACTIVITY
            </h2>
            <div className="space-y-2 terminal-log">
              {gameData?.games.battleship?.gameHistory.map((game, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex justify-between items-center border-b border-white/30 pb-2"
                >
                  <div>
                    <span className="text-sm text-white">BATTLESHIP</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {game.difficulty.toUpperCase()} MODE
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-white mr-2">
                      +{game.pointsEarned}
                    </span>
                    <Coins className="h-4 w-4 text-white" />
                  </div>
                </motion.div>
              ))}

              {gameData?.games.spaceinvaders?.gameHistory.map((game, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay:
                      0.1 *
                      (index +
                        (gameData?.games.battleship?.gameHistory.length || 0)),
                  }}
                  className="flex justify-between items-center border-b border-white/30 pb-2"
                >
                  <div>
                    <span className="text-sm text-white">SPACE INVADERS</span>
                    <span className="text-xs text-gray-400 ml-2">
                      LEVEL {game.level}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-white mr-2">
                      +{game.score}
                    </span>
                    <Coins className="h-4 w-4 text-white" />
                  </div>
                </motion.div>
              ))}

              {!gameData?.games.battleship?.gameHistory.length &&
                !gameData?.games.spaceinvaders?.gameHistory.length && (
                  <div className="text-sm text-white">NO RECENT ACTIVITY</div>
                )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-xs text-gray-400 mt-8 text-center border-t border-white pt-4"
          >
            <TerminalText
              text={["©️ 2025 TERMINAL ARCADE • ALL RIGHTS RESERVED"]}
              typing={false}
            />
          </motion.div>
        </motion.div>
      </div>
    </RetroBackground>
  );
}
