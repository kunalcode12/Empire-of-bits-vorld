"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, RefreshCw } from "lucide-react";
import GameBoard from "@/components/game-board";
import LevelInfo from "@/components/level-info";
import GameOverModal from "@/components/game-over-modal";
import { useAudio } from "@/hooks/use-audio";
import { ArenaGameService, type GameState } from "@/lib/arenaGameService";
import WebSocketEventHandler from "@/components/webSocket-event-handler";
import { useToast } from "@/components/ui/use-toast";
import BoostCelebrationPopup from "./BoostCelebrationPopup";
import ItemDropCelebrationPopup from "./ItemDropCelebrationPopup";
import { Scanlines } from "./scanlines";
import {
  Zap,
  Gift,
  Timer,
  Users,
  Star,
  Pause,
  Play,
  Coins,
  CheckCircle,
} from "lucide-react";
import { ParticlesContainer } from "./particles-container";

type MonitorEvent = { type: string; data: any; timestamp: Date };

export default function Games() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const levelId = Number.parseInt(searchParams.get("level") || "1");
  console.log(levelId);

  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(15);
  const [gameOver, setGameOver] = useState(false);
  const [stars, setStars] = useState(0);
  interface LevelData {
    levelNumber: number;
    maxPoints: number;
    cleared: boolean;
    stars: number;
  }

  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showBoostPopup, setShowBoostPopup] = useState<{
    amount: number;
    name?: string;
  } | null>(null);
  const [showItemDrop, setShowItemDrop] = useState<{
    name: string;
    image?: string;
  } | null>(null);
  const [arenaLoader, setArenaLoader] = useState(false);
  const [showSpecialMove, setShowSpecialMove] = useState(false);

  // Replace with your actual user ID or get it from your auth system
  const userId = localStorage.getItem("walletAddress"); // You should replace this with actual user ID from your auth system

  const { playSound } = useAudio();
  const { toast } = useToast();

  // Arena Arcade integration
  const arenaServiceRef = useRef<ArenaGameService | null>(null);
  const [arenaGameState, setArenaGameState] = useState<GameState | null>(null);
  const [arenaActive, setArenaActive] = useState(false);
  const [arenaCountdown, setArenaCountdown] = useState<number | null>(null);
  const [showArenaPanel, setShowArenaPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpdateStreamModal, setShowUpdateStreamModal] = useState(false);
  const [currentStreamUrl, setCurrentStreamUrl] = useState("");
  const [newStreamUrl, setNewStreamUrl] = useState("");

  // Monitoring bar/events state
  const [monitorEvents, setMonitorEvents] = useState<MonitorEvent[]>([]); // {type, data, timestamp}
  const [monitorCountdown, setMonitorCountdown] = useState<number | null>(null);
  const [monitorArenaActive, setMonitorArenaActive] = useState(false);
  const [monitorBoostData, setMonitorBoostData] = useState<any>(null);
  const [monitorPackageDrops, setMonitorPackageDrops] = useState<any[]>([]);
  const [monitorGameEvents, setMonitorGameEvents] = useState<any[]>([]);

  // Add additional state:
  const [statusLabel, setStatusLabel] = useState<
    "pending" | "live" | "completed" | "stopped"
  >("pending");
  const [currentCycle, setCurrentCycle] = useState<number | null>(null);
  const [lastBoost, setLastBoost] = useState<any>(null);
  const [lastJoin, setLastJoin] = useState<any>(null);
  const [lastDrop, setLastDrop] = useState<any>(null);
  const [lastGameEvent, setLastGameEvent] = useState<any>(null);
  const [lastCountdown, setLastCountdown] = useState<number | null>(null);
  const [lastBoostCycleUpdate, setLastBoostCycleUpdate] = useState<any>(null);

  // At start, pending. On arena_begins: live. On game_completed/game_stopped: completed/stopped.

  // Map for colored icons and labels
  const monitorIcons: Record<string, any> = {
    arena_countdown_started: <Timer className="text-blue-400" size={20} />,
    countdown_update: <Timer className="text-sky-400" size={20} />,
    arena_begins: <Play className="text-red-400 animate-pulse" size={20} />,
    player_boost_activated: (
      <Zap className="text-green-400 animate-pulse" size={20} />
    ),
    boost_cycle_update: <Coins className="text-yellow-300" size={20} />,
    boost_cycle_complete: (
      <Gift className="text-emerald-400 animate-bounce" size={20} />
    ),
    package_drop: <Gift className="text-blue-400 animate-bounce" size={20} />,
    immediate_item_drop: (
      <Gift className="text-pink-400 animate-pulse" size={20} />
    ),
    event_triggered: (
      <Star className="text-indigo-400 animate-spin" size={20} />
    ),
    player_joined: <Users className="text-cyan-400" size={20} />,
    game_completed: (
      <CheckCircle className="text-green-400 animate-pulse" size={20} />
    ),
    game_stopped: <Pause className="text-gray-400 animate-pulse" size={20} />,
  };

  useEffect(() => {
    arenaServiceRef.current = new ArenaGameService();
    return () => {
      arenaServiceRef.current?.disconnect();
      arenaServiceRef.current = null;
    };
  }, []);

  // Fetch level data when component mounts
  useEffect(() => {
    const fetchLevelData = async () => {
      try {
        // Get game data to get this level's target score
        const response = await fetch(
          "http://localhost:3001/api/v1/games/candycrush",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          }
        );
        const data = await response.json();
        console.log("Game data fetched:", data);
        const gameData = data.data;

        // Find the current level in the game data
        interface GameLevel {
          levelNumber: number;
          maxPoints: number;
          cleared: boolean;
          stars: number;
        }

        interface GameData {
          levels: GameLevel[];
        }

        const game: GameData = gameData;

        const currentLevel: GameLevel | undefined = game.levels.find(
          (level) => level.levelNumber === levelId
        );

        if (currentLevel) {
          setLevelData(currentLevel);
        } else {
          // Fallback if level not found
          setLevelData({
            levelNumber: levelId,
            maxPoints: 1000 * levelId,
            cleared: false,
            stars: 0,
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching level data:", err);
        // Fallback if API call fails
        setLevelData({
          levelNumber: levelId,
          maxPoints: 1000 * levelId,
          cleared: false,
          stars: 0,
        });
        setLoading(false);
      }
    };

    fetchLevelData();
  }, [levelId, userId]);

  useEffect(() => {
    // Reset game state when level changes
    setScore(0);
    setMovesLeft(15 + Math.floor(levelId / 2));
    setGameOver(false);

    // Clear any existing redirect timer
    if (redirectTimer) {
      clearTimeout(redirectTimer);
      setRedirectTimer(null);
    }
  }, [levelId]);

  useEffect(() => {
    // Check if game is over
    if (movesLeft <= 0) {
      setGameOver(true);
      calculateStars();
      playSound("gameOver");
    }
  }, [movesLeft]);

  // Disconnect Arena when game ends
  useEffect(() => {
    if (gameOver && arenaServiceRef.current && arenaGameState) {
      arenaServiceRef.current.disconnect();
      setArenaGameState(null);
      setArenaActive(false);
      setArenaCountdown(null);
      setShowArenaPanel(false);
      toast({
        title: "Arena Disconnected",
        description: "Arena connection closed after game ended.",
      });
    }
  }, [gameOver, arenaGameState, toast]);

  // Attach socket event handlers
  useEffect(() => {
    const arena = arenaServiceRef.current;
    console.log("Attaching arena events to arenaServiceRef", arena);
    if (!arena) return;
    console.log("Attaching arena events to arenaServiceRef", arena);
    // --- Attach all arena events ---
    arena.onArenaCountdownStarted = (data) => {
      setStatusLabel("pending");
      setMonitorCountdown(60);
      setLastCountdown(60);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "arena_countdown_started", data, timestamp: new Date() },
      ]);
    };
    arena.onCountdownUpdate = (data) => {
      setMonitorCountdown(data.secondsRemaining);
      setLastCountdown(data.secondsRemaining);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "countdown_update", data, timestamp: new Date() },
      ]);
    };
    arena.onArenaBegins = (data) => {
      setStatusLabel("live");
      setMonitorArenaActive(true);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "arena_begins", data, timestamp: new Date() },
      ]);
    };
    arena.onPlayerBoostActivated = (data) => {
      setLastBoost(data);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "player_boost_activated", data, timestamp: new Date() },
      ]);

      const boostAmount =
        Number(data?.boostAmount) || Number(data?.currentCyclePoints) || 0;
      const boosterName = data?.boosterUsername || data?.playerName || "Viewer";

      // Always show popup for any boost
      setShowBoostPopup({ amount: boostAmount, name: boosterName });

      // Base feedback
      playSound("score");

      // Rules by amount
      if (boostAmount >= 50 && boostAmount < 51) {
        // exactly 50
        setMovesLeft((prev) => prev + 2);
        setScore((prev) => prev + 20);
      } else if (boostAmount >= 25 && boostAmount < 26) {
        // exactly 25
        setMovesLeft((prev) => prev + 1);
      }

      if (boostAmount > 50) {
        // Big celebration + special move overlay and big random score bonus (>200)
        setShowSpecialMove(true);
        const bonus = 200 + Math.floor(Math.random() * 201); // 200–400
        setScore((prev) => prev + bonus);
        // Hide overlay after a short duration
        setTimeout(() => setShowSpecialMove(false), 1800);
      } else {
        // Small/normal boosts also add their raw amount
        if (boostAmount > 0) {
          setScore((prev) => prev + boostAmount);
        }
      }
    };
    arena.onBoostCycleUpdate = (data) => {
      console.log("Boost cycle update: [Games]", data);
      setCurrentCycle(data?.currentCycle || data?.cycle || null);
      setLastBoostCycleUpdate(data);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "boost_cycle_update", data, timestamp: new Date() },
      ]);
    };
    arena.onBoostCycleComplete = (data) => {
      setMonitorEvents((prev) => [
        ...prev,
        { type: "boost_cycle_complete", data, timestamp: new Date() },
      ]);
    };
    arena.onPackageDrop = (data) => {
      setLastDrop(data?.packages?.[0] || null);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "package_drop", data, timestamp: new Date() },
      ]);
    };
    arena.onImmediateItemDrop = (data) => {
      setLastDrop(data);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "immediate_item_drop", data, timestamp: new Date() },
      ]);
    };
    arena.onEventTriggered = (data) => {
      setLastGameEvent(data?.event);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "event_triggered", data, timestamp: new Date() },
      ]);
    };
    arena.onPlayerJoined = (data) => {
      setLastJoin(data);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "player_joined", data, timestamp: new Date() },
      ]);
    };
    arena.onGameCompleted = (data) => {
      setStatusLabel("completed");
      setArenaActive(false);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "game_completed", data, timestamp: new Date() },
      ]);
    };
    arena.onGameStopped = (data) => {
      setStatusLabel("stopped");
      setArenaActive(false);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "game_stopped", data, timestamp: new Date() },
      ]);
    };
    return () => {
      // Clean up: remove all handlers
      if (arena) {
        arena.onArenaCountdownStarted = undefined;
        arena.onCountdownUpdate = undefined;
        arena.onArenaBegins = undefined;
        arena.onPlayerBoostActivated = undefined;
        arena.onBoostCycleUpdate = undefined;
        arena.onBoostCycleComplete = undefined;
        arena.onPackageDrop = undefined;
        arena.onImmediateItemDrop = undefined;
        arena.onEventTriggered = undefined;
        arena.onPlayerJoined = undefined;
        arena.onGameCompleted = undefined;
        arena.onGameStopped = undefined;
      }
    };
  }, [arenaServiceRef.current]);

  // Auto-hide boost banner after a short duration
  useEffect(() => {
    if (showBoostPopup) {
      const t = setTimeout(() => setShowBoostPopup(null), 2000);
      return () => clearTimeout(t);
    }
  }, [showBoostPopup]);

  // Buttons visibility
  const showArenaButtons =
    statusLabel === "completed" || statusLabel === "stopped" || !arenaGameState;
  const showDisconnect =
    arenaGameState && statusLabel !== "completed" && statusLabel !== "stopped";

  // Monitoring box style helpers
  function statusBoxClass() {
    return statusLabel === "live"
      ? "bg-green-900/70 border-green-400 text-green-300"
      : statusLabel === "pending"
      ? "bg-pink-900/50 border-pink-400 text-yellow-200"
      : statusLabel === "completed"
      ? "bg-blue-900/50 border-blue-300 text-blue-200"
      : "bg-gray-800 border-gray-500 text-gray-300";
  }

  const handleStartArena = async () => {
    const arena = arenaServiceRef.current;
    if (!arena) return;
    setArenaLoader(true);
    try {
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        "";

      console.log("Token:", token);

      const streamUrl = "https://twitch.tv/empireofbits";
      const result = await arena.initializeGame(streamUrl, token);
      setArenaLoader(false);
      if (result.success && result.data) {
        setArenaGameState(result.data);
        setShowArenaPanel(true);
        setCurrentStreamUrl(streamUrl);
        toast({
          title: "Arena Ready",
          description: `Game ID: ${result.data.gameId}`,
        });
      } else {
        toast({
          title: "Arena Init Failed",
          description: result.error || "Unknown error",
        });
      }
    } catch (e: any) {
      setArenaLoader(false);
      toast({
        title: "Arena Init Error",
        description: e?.message || "Failed to initialize",
      });
    }
  };

  const handleDisconnect = () => {
    const arena = arenaServiceRef.current;
    if (arena && arenaGameState) {
      arena.disconnect();
      setArenaGameState(null);
      setArenaActive(false);
      setArenaCountdown(null);
      setShowArenaPanel(false);
      setShowUpdateStreamModal(false);

      // Reset monitoring and boost related UI to initial state
      setMonitorEvents([]);
      setMonitorCountdown(null);
      setMonitorArenaActive(false);
      setMonitorBoostData(null);
      setMonitorPackageDrops([]);
      setMonitorGameEvents([]);
      setStatusLabel("pending");
      setCurrentCycle(null);
      setLastBoost(null);
      setLastJoin(null);
      setLastDrop(null);
      setLastGameEvent(null);
      setLastCountdown(null);
      setLastBoostCycleUpdate(null);
      setShowSpecialMove(false);
      setShowBoostPopup(null);

      toast({
        title: "Arena Disconnected",
        description: "Arena connection has been closed.",
      });
    }
  };

  const handleOpenUpdateStream = () => {
    if (!arenaGameState) return;
    setNewStreamUrl(currentStreamUrl || "");
    setShowUpdateStreamModal(true);
  };

  const handleSubmitUpdateStream = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const arena = arenaServiceRef.current;
    if (!arena || !arenaGameState) return;
    if (!newStreamUrl || newStreamUrl === currentStreamUrl) {
      setShowUpdateStreamModal(false);
      return;
    }
    try {
      const res = await arena.updateStreamUrl(
        arenaGameState.gameId,
        newStreamUrl,
        currentStreamUrl
      );
      if (res.success) {
        setCurrentStreamUrl(newStreamUrl);
        setShowUpdateStreamModal(false);
        toast({
          title: "Stream URL updated",
          description: "New stream URL applied.",
        });
      } else {
        toast({
          title: "Update failed",
          description: res.error || "Unknown error",
        });
      }
    } catch (err: any) {
      toast({
        title: "Update error",
        description: err?.message || "Failed to update stream URL",
      });
    }
  };

  const calculateStars = () => {
    const targetScore = levelData?.maxPoints || 1000 * levelId;

    if (score >= targetScore * 1.5) {
      setStars(3);
    } else if (score >= targetScore) {
      setStars(2);
    } else if (score >= targetScore * 0.5) {
      setStars(1);
    } else {
      setStars(0);
    }
  };

  const handleScoreUpdate = (points: number) => {
    setScore((prev) => prev + points);
    playSound("score");
  };

  const handleMoveComplete = () => {
    setMovesLeft((prev) => prev - 1);
    // playSound("move")
  };

  const handleNextLevel = () => {
    router.push(`/play-candy?level=${levelId + 1}`);
  };

  const handleRetryLevel = () => {
    setScore(0);
    setMovesLeft(15 + Math.floor(levelId / 2));
    setGameOver(false);
  };

  const updateLevelProgressInBackend = async () => {
    const targetScore = levelData?.maxPoints || 1000 * levelId;
    const isLevelCompleted = score >= targetScore;

    try {
      const response = await fetch(
        `http://localhost:3001/api/v1/games/candycrush/${userId}/level`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            levelNumber: levelId,
            score,
            stars,
            cleared: isLevelCompleted,
          }),
        }
      );

      // Update points earned for display in the modal
      const data = await response.json();
      console.log("Level progress updated:", data);
      if (data.pointsEarned) {
        setPointsEarned(data.pointsEarned);
      }

      // Start the redirect timer if level was completed
      if (isLevelCompleted) {
        const timer = setTimeout(() => {
          router.push(
            `/?gameWon=true&gameName=candycrush&pointsEarned=${data.pointsEarned}`
          );
        }, 2000);
        setRedirectTimer(timer);
      }

      return data;
    } catch (err) {
      console.error("Error updating level progress:", err);
      return null;
    }
  };

  // Update backend when game is over
  useEffect(() => {
    if (gameOver) {
      updateLevelProgressInBackend();
    }
  }, [gameOver]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [redirectTimer]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-800 to-purple-950 p-4 text-white flex items-center justify-center">
        <div className="text-2xl">Loading level...</div>
      </main>
    );
  }

  const targetScore = levelData?.maxPoints || 1000 * levelId;
  const gameId = lastBoostCycleUpdate?.gameId || arenaGameState?.gameId || "--";

  return (
    <main className="min-h-screen w-full flex flex-col md:flex-row">
      {/* LEFT: Monitoring Dashboard */}
      <section className="md:w-1/3 w-full p-3 flex flex-col gap-4 bg-black/90 border-r-2 border-yellow-700 min-h-screen">
        {/* Arena Status Box */}
        <div
          className={`rounded-lg px-4 py-5 border-2 font-bold text-lg flex items-center gap-4 shadow-xl ${statusBoxClass()}`}
        >
          {statusLabel === "live" && (
            <Zap className="text-green-300 animate-pulse" />
          )}
          {statusLabel === "completed" && (
            <CheckCircle className="text-blue-200 animate-bounce" />
          )}
          {statusLabel === "stopped" && (
            <Pause className="text-gray-300 animate-pulse" />
          )}
          <span>ARENA STATUS: {statusLabel.toUpperCase()}</span>
        </div>
        {/* Countdown Box */}
        <div className="rounded-lg px-4 py-4 border-2 border-blue-400 text-blue-200 font-bold flex items-center gap-3 shadow-md bg-blue-900/60">
          <Timer />
          COUNTDOWN:&nbsp;{lastCountdown !== null ? `${lastCountdown}s` : "--"}
        </div>
        {/* Cycle Box w/ reset */}
        <div className="rounded-lg px-4 py-4 border-2 border-yellow-400 text-yellow-300 font-bold flex flex-col gap-1 shadow-md bg-yellow-900/40">
          <span className="flex items-center gap-3">
            <Coins />
            CURRENT CYCLE
          </span>
          <div className="flex gap-3 items-center mt-2">
            <span className="text-2xl font-extrabold">
              {currentCycle !== null ? currentCycle : "--"}
            </span>
            {lastBoostCycleUpdate?.timeUntilReset !== undefined && (
              <span className="text-lg text-yellow-100 border-l-2 border-yellow-300 pl-3">
                Reset:&nbsp;
                <span className="font-mono">
                  {lastBoostCycleUpdate.timeUntilReset}s
                </span>
              </span>
            )}
          </div>
        </div>
        {/* Latest Boost */}
        <div className="rounded-lg px-4 py-4 border-2 border-green-500 text-green-300 font-bold flex flex-col gap-1 shadow-md bg-green-900/30">
          <span className="flex items-center gap-2">
            <Zap /> LATEST BOOST
          </span>
          {lastBoost ? (
            <div>
              Player:{" "}
              <span className="text-yellow-200">{lastBoost.playerName}</span>{" "}
              <br />
              Amount:{" "}
              <span className="text-green-400">
                +{lastBoost.boostAmount || lastBoost.currentCyclePoints}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">None yet</span>
          )}
        </div>
        {/* Latest Player Join */}
        <div className="rounded-lg px-4 py-4 border-2 border-cyan-400 text-cyan-200 font-bold flex flex-col gap-1 shadow-md bg-cyan-900/30">
          <span className="flex items-center gap-2">
            <Users /> LATEST JOIN
          </span>
          {lastJoin ? (
            <div>
              Player:{" "}
              <span className="text-white">
                {lastJoin.playerName || lastJoin.name}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">No new players</span>
          )}
        </div>
        {/* Last Drop Box */}
        <div className="rounded-lg px-4 py-4 border-2 border-pink-400 text-pink-200 font-bold flex flex-col gap-1 shadow-md bg-pink-900/20">
          <span className="flex items-center gap-2">
            <Gift /> LAST DROP
          </span>
          {lastDrop ? (
            <div>
              Item:{" "}
              <span className="text-yellow-200">
                {lastDrop.itemName || lastDrop.name}
              </span>
              {lastDrop.type && (
                <>
                  <br />
                  Type: <span className="text-blue-200">{lastDrop.type}</span>
                </>
              )}
            </div>
          ) : (
            <span className="text-gray-400">No drops yet</span>
          )}
        </div>
        {/* Last Game Event Box */}
        <div className="rounded-lg px-4 py-4 border-2 border-indigo-400 text-indigo-200 font-bold flex flex-col gap-1 shadow-md bg-indigo-900/30">
          <span className="flex items-center gap-2">
            <Star /> LAST GAME EVENT
          </span>
          {lastGameEvent ? (
            <div>
              Event:{" "}
              <span className="text-yellow-200">
                {lastGameEvent.eventName || "--"}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">No special events</span>
          )}
        </div>
        {/* All status/events as tickers/history */}
        <div className="mt-4 text-xs text-gray-400 max-h-32 overflow-y-auto">
          {monitorEvents
            .slice(-10)
            .reverse()
            .map((ev, i) => (
              <div key={i} className="my-1">
                [{ev.timestamp.toLocaleTimeString()}]&nbsp;
                <span className="font-semibold text-yellow-200">
                  {ev.type.replace(/_/g, " ")}
                </span>
                &nbsp;—&nbsp;
                <span className="text-gray-300">
                  {ev.data &&
                    (ev.data.playerName ||
                      ev.data.eventName ||
                      ev.data.itemName ||
                      "")}
                </span>
              </div>
            ))}
        </div>
        {/* GAME ID at bottom of monitor */}
        <div className="mt-auto rounded-lg px-4 py-6 border-2 border-indigo-400 text-indigo-300 font-extrabold text-lg flex items-center gap-3 shadow-lg bg-indigo-900/80 tracking-wider justify-center">
          <Star className="text-yellow-300" /> Game ID:{" "}
          <span className="font-mono text-yellow-200 text-2xl">{gameId}</span>
        </div>
      </section>
      {/* RIGHT: Game Arena/Board/Controls/etc */}
      <section className="md:w-2/3 w-full flex-grow p-4 flex flex-col gap-4 bg-gradient-to-b from-[#220a23] to-[#17112c] border-l-0 md:border-l-4 border-purple-900 min-h-screen relative">
        {/* Retro gridlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              "repeating-linear-gradient(90deg,rgba(255,255,255,0.04) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(180deg,rgba(255,255,255,0.04) 1px, transparent 1px, transparent 40px)",
          }}
        ></div>
        <div className="flex items-center mb-4">
          <Link href="/levels">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-purple-700 active:translate-y-1 transition-transform"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1
            className="text-2xl font-bold text-center flex-1 text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] pixelated"
            style={{
              textShadow: "2px 2px 0px #ff00ff, -2px -2px 0px #00ffff",
            }}
          >
            LEVEL {levelId}
          </h1>
          <div className="w-10"></div>
        </div>

        <LevelInfo
          score={score}
          targetScore={targetScore}
          movesLeft={movesLeft}
        />

        {/* Arena actions */}
        <div className="mt-3 flex items-center gap-2">
          {showArenaButtons && (
            <>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleStartArena}
              >
                Play with Vorld
              </Button>
              <Button
                variant="outline"
                className="border-blue-400 text-blue-300"
                onClick={handleStartArena}
              >
                Arena On
              </Button>
            </>
          )}
          {showDisconnect && (
            <Button
              variant="outline"
              className="border-red-400 text-red-300 hover:bg-red-900/30"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          )}
        </div>

        {/* Monitoring Bar - top of arena content */}
        <div className="w-full sticky top-0 z-50 p-2 px-4 bg-black/90 border-b-4 border-yellow-400 flex flex-wrap gap-4 items-center font-pixel text-sm shadow-lg animate-in-fade slide-in-down">
          <div>
            <span
              className={
                monitorArenaActive
                  ? "text-green-400"
                  : "text-pink-400 font-bold"
              }
            >
              {monitorArenaActive
                ? "ARENA LIVE!"
                : monitorCountdown !== null
                ? `ARENA COUNTDOWN: ${monitorCountdown}s`
                : arenaGameState?.status?.toUpperCase() || "WAITING"}
            </span>
          </div>
          {/* Most recent up to 4 events */}
          {monitorEvents
            .slice(-4)
            .reverse()
            .map((ev, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1 rounded bg-gray-800/60 border border-gray-700 mx-1"
              >
                {monitorIcons[ev.type] || (
                  <Star className="text-pink-200" size={16} />
                )}
                <span
                  className="uppercase font-bold"
                  style={{ fontSize: "0.9em" }}
                >
                  {ev.type.replace(/_/g, " ")}
                </span>
                <span className="text-gray-400">
                  {ev.timestamp &&
                    (typeof ev.timestamp === "string"
                      ? new Date(ev.timestamp)
                      : ev.timestamp
                    ).toLocaleTimeString()}
                </span>
                {/* Compact: eg. for player_joined, show name */}
                {ev.type === "player_joined" && (
                  <span className="text-cyan-400">{ev.data?.playerName}</span>
                )}
                {ev.type === "player_boost_activated" && (
                  <span className="text-green-500">
                    +{ev.data?.boostAmount || ev.data?.currentCyclePoints}{" "}
                  </span>
                )}
                {ev.type === "package_drop" && (
                  <span className="text-blue-300">DROP</span>
                )}
                {ev.type === "game_completed" && (
                  <span className="text-green-400 font-bold">🏁</span>
                )}
                {ev.type === "game_stopped" && (
                  <span className="text-gray-300 font-bold">⏹</span>
                )}
              </div>
            ))}
        </div>

        <div
          className="mt-4 bg-purple-900/50 p-2 rounded-lg border-4 border-purple-700"
          style={{
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.5), 0 4px 0 #6b21a8",
          }}
        >
          {/* 3D effects: Pixel shadow/glow around board area */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl shadow-black/40 shadow-2xl ring-4 ring-purple-800 ring-inset"
            style={{
              filter:
                "drop-shadow(0 8px 14px #38006b) drop-shadow(0 1px 0 #9253af)",
            }}
          />
          <div className="relative" style={{ maxWidth: 410 }}>
            {showSpecialMove && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60 animate-pulse" />
                <div className="relative z-10 text-center">
                  <div className="text-3xl font-extrabold text-yellow-300 drop-shadow animate-bounce">
                    SPECIAL MOVE!
                  </div>
                </div>
                <ParticlesContainer />
              </div>
            )}
            <GameBoard
              level={levelId}
              onScoreUpdate={handleScoreUpdate}
              onMoveComplete={handleMoveComplete}
            />
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl shadow-black/40 shadow-2xl ring-4 ring-purple-800 ring-inset"
              style={{
                filter:
                  "drop-shadow(0 8px 14px #38006b) drop-shadow(0 1px 0 #9253af)",
              }}
            />
          </div>
        </div>
      </section>

      {gameOver && (
        <GameOverModal
          score={score}
          targetScore={targetScore}
          stars={stars}
          pointsEarned={pointsEarned}
          redirecting={redirectTimer !== null}
          onNextLevel={handleNextLevel}
          onRetry={handleRetryLevel}
        />
      )}

      {/* Arena loader overlay */}
      {arenaLoader && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] bg-black/95">
          <Scanlines />
          <div className="flex flex-col items-center gap-5">
            <div className="text-2xl md:text-4xl text-yellow-400 font-pixel animate-pulse">
              Connecting to Arena…
            </div>
            <div className="w-32 h-32 border-8 border-yellow-300 rounded-full animate-spin blur-sm opacity-40"></div>
            <div className="font-mono text-gray-400 text-lg">
              Retro Arcade Loader
            </div>
          </div>
        </div>
      )}
      {/* Boost celebration overlay */}
      {showBoostPopup && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[180] px-4 py-2 bg-black/85 border-2 border-yellow-400 text-yellow-200 rounded shadow-xl font-pixel flex items-center gap-3">
          <Zap className="text-yellow-300" />
          <span className="uppercase">+{showBoostPopup.amount} points</span>
          <span className="text-gray-300">
            by {showBoostPopup.name || "Viewer"}
          </span>
        </div>
      )}
      {/* Item drop overlay */}
      {showItemDrop && (
        <ItemDropCelebrationPopup
          itemName={showItemDrop.name}
          itemImage={showItemDrop.image}
          onClose={() => setShowItemDrop(null)}
        />
      )}
    </main>
  );
}
