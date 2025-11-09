"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAudio } from "@/hooks/use-audio";

// Candy types
const CANDY_TYPES = ["red", "orange", "yellow", "green", "blue", "purple"];
const CANDY_COLORS = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
};

interface GameBoardProps {
  level: number;
  onScoreUpdate: (points: number) => void;
  onMoveComplete: () => void;
  specialEffect?: {
    type:
      | "colour_bomb"
      | "striped"
      | "wrapped"
      | "sweet_teeth"
      | "lollipop_hammer"
      | "free_switch";
    targetColor?: string;
    itemData?: {
      name?: string;
      image?: string;
      stats?: Array<{
        name: string;
        description: string;
      }>;
    };
  } | null;
  onSpecialEffectComplete?: () => void;
  automaticMoves?: {
    count: number;
    onComplete?: () => void;
  } | null;
}

export default function GameBoard({
  level,
  onScoreUpdate,
  onMoveComplete,
  specialEffect,
  onSpecialEffectComplete,
  automaticMoves,
}: GameBoardProps) {
  const BOARD_SIZE = 8;
  const [board, setBoard] = useState<string[][]>([]);
  const [selectedCandy, setSelectedCandy] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [animations, setAnimations] = useState<
    { row: number; col: number; type: string }[]
  >([]);
  const [dragStart, setDragStart] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [showColorBombEffect, setShowColorBombEffect] = useState(false);
  const [showSweetTeethEffect, setShowSweetTeethEffect] = useState(false);
  const [sweetTeethPosition, setSweetTeethPosition] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [showLollipopHammerEffect, setShowLollipopHammerEffect] =
    useState(false);
  const [hammerDestroysLeft, setHammerDestroysLeft] = useState(0);
  const [hammerDestroyedCandies, setHammerDestroyedCandies] = useState<
    { row: number; col: number }[]
  >([]);
  const [showFreeSwitchEffect, setShowFreeSwitchEffect] = useState(false);
  const [freeSwitchUsed, setFreeSwitchUsed] = useState(false);
  const [showAutoMoveEffect, setShowAutoMoveEffect] = useState(false);
  const [autoMoveProgress, setAutoMoveProgress] = useState(0);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const effectInProgressRef = useRef(false);
  const boardStateRef = useRef<string[][]>([]);
  const autoMoveInProgressRef = useRef(false);

  const { playSound } = useAudio();

  // Initialize the board
  useEffect(() => {
    initializeBoard();
  }, [level]);

  // Store board in ref for latest access in async callbacks
  useEffect(() => {
    boardStateRef.current = board;
  }, [board]);

  // Handle automatic moves
  useEffect(() => {
    if (
      automaticMoves &&
      automaticMoves.count > 0 &&
      board.length > 0 &&
      !autoMoveInProgressRef.current
    ) {
      autoMoveInProgressRef.current = true;
      executeAutomaticMoves(automaticMoves.count, automaticMoves.onComplete);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [automaticMoves]);

  const executeAutomaticMoves = async (
    moveCount: number,
    onComplete?: () => void
  ) => {
    setShowAutoMoveEffect(true);
    setAutoMoveProgress(0);

    for (let i = 0; i < moveCount; i++) {
      setAutoMoveProgress(i + 1);

      // Get current board state
      const currentBoard = boardStateRef.current;
      if (currentBoard.length === 0) break;

      // Find a random valid move
      const validMoves: Array<{
        row1: number;
        col1: number;
        row2: number;
        col2: number;
      }> = [];

      // Check all possible adjacent swaps
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          // Check right neighbor
          if (col < BOARD_SIZE - 1) {
            validMoves.push({ row1: row, col1: col, row2: row, col2: col + 1 });
          }
          // Check bottom neighbor
          if (row < BOARD_SIZE - 1) {
            validMoves.push({ row1: row, col1: col, row2: row + 1, col2: col });
          }
        }
      }

      if (validMoves.length === 0) break;

      // Pick a random move
      const randomMove =
        validMoves[Math.floor(Math.random() * validMoves.length)];

      // Execute the move (don't count as user move)
      await executeAutoMove(
        randomMove.row1,
        randomMove.col1,
        randomMove.row2,
        randomMove.col2
      );

      // Wait between moves for visual effect
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setShowAutoMoveEffect(false);
    setAutoMoveProgress(0);
    autoMoveInProgressRef.current = false;

    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  const executeAutoMove = async (
    row1: number,
    col1: number,
    row2: number,
    col2: number
  ) => {
    const currentBoard = boardStateRef.current;
    if (currentBoard.length === 0) return;

    // Create a copy of the board
    const newBoard = [...currentBoard.map((row) => [...row])];

    // Swap the candies
    const temp = newBoard[row1][col1];
    newBoard[row1][col1] = newBoard[row2][col2];
    newBoard[row2][col2] = temp;

    setBoard(newBoard);

    // Check if the swap created a match (but don't count as user move)
    await new Promise((resolve) => setTimeout(resolve, 300));
    const hasMatches = await checkForMatches(newBoard, false);

    if (!hasMatches) {
      // If no matches were created, swap back
      const revertBoard = [...newBoard.map((row) => [...row])];
      revertBoard[row1][col1] = newBoard[row2][col2];
      revertBoard[row2][col2] = newBoard[row1][col1];
      setBoard(revertBoard);
    } else {
      // Valid move - matches will be handled by checkForMatches
      // Don't call onMoveComplete for auto moves
    }
  };

  // Handle special effects
  useEffect(() => {
    if (
      specialEffect?.type === "colour_bomb" &&
      board.length > 0 &&
      !effectInProgressRef.current
    ) {
      effectInProgressRef.current = true;

      const executeColourBomb = async () => {
        const currentBoard = boardStateRef.current;
        if (currentBoard.length === 0) {
          effectInProgressRef.current = false;
          return;
        }

        setShowColorBombEffect(true);
        playSound("match");

        // Wait for visual effect
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Find the most common color on the board
        const colorCounts: Record<string, number> = {};
        currentBoard.forEach((row) => {
          row.forEach((candy) => {
            if (candy && candy in CANDY_COLORS) {
              colorCounts[candy] = (colorCounts[candy] || 0) + 1;
            }
          });
        });

        // Get the most common color
        const targetColor =
          Object.keys(colorCounts).length > 0
            ? Object.entries(colorCounts).reduce((a, b) =>
                colorCounts[a[0]] > colorCounts[b[0]] ? a : b
              )[0]
            : CANDY_TYPES[0];

        // Find all candies of this color
        const matchedCandies: { row: number; col: number }[] = [];
        currentBoard.forEach((row, rowIndex) => {
          row.forEach((candy, colIndex) => {
            if (candy === targetColor) {
              matchedCandies.push({ row: rowIndex, col: colIndex });
            }
          });
        });

        if (matchedCandies.length > 0) {
          // Show explosion animation for all matched candies
          setAnimations(
            matchedCandies.map((match) => ({
              row: match.row,
              col: match.col,
              type: "explode",
            }))
          );

          // Big score bonus for colour bomb
          const points = matchedCandies.length * 150 + 500; // Bonus points
          onScoreUpdate(points);

          // Wait for animation
          await new Promise((resolve) => setTimeout(resolve, 600));

          // Clear matched candies
          const clearedBoard = [...currentBoard.map((row) => [...row])];
          matchedCandies.forEach((match) => {
            clearedBoard[match.row][match.col] = "";
          });

          setBoard(clearedBoard);
          setAnimations([]);
          setShowColorBombEffect(false);

          // Wait for clearing animation
          await new Promise((resolve) => setTimeout(resolve, 400));

          // Drop candies and check for cascades
          const droppedBoard = await dropCandies(clearedBoard);
          await checkForMatches(droppedBoard, false);
        } else {
          setShowColorBombEffect(false);
        }

        // Notify completion
        effectInProgressRef.current = false;
        if (onSpecialEffectComplete) {
          setTimeout(() => {
            onSpecialEffectComplete();
          }, 2000);
        }
      };

      executeColourBomb();
    } else if (
      specialEffect?.type === "sweet_teeth" &&
      board.length > 0 &&
      !effectInProgressRef.current
    ) {
      effectInProgressRef.current = true;

      const executeSweetTeeth = async () => {
        const currentBoard = boardStateRef.current;
        if (currentBoard.length === 0) {
          effectInProgressRef.current = false;
          return;
        }

        setShowSweetTeethEffect(true);
        playSound("match");

        // Sweet Teeth effect: Gobbles up candies in a sweeping wave pattern
        // Sweep from top to bottom, row by row, creating a wave effect
        const gobbledCandies: { row: number; col: number }[] = [];
        const clearedBoard = [...currentBoard.map((row) => [...row])];

        // Create a wave pattern - sweep row by row from top to bottom
        // Each row is gobbled in segments to create a wave effect
        for (let row = 0; row < BOARD_SIZE; row++) {
          // Process each row in chunks to create a wave effect
          const rowCells: { row: number; col: number }[] = [];

          // Collect all candies in this row
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (
              clearedBoard[row][col] &&
              clearedBoard[row][col] in CANDY_COLORS
            ) {
              rowCells.push({ row, col });
            }
          }

          if (rowCells.length > 0) {
            // Process row in chunks for wave effect
            const chunkSize = 3; // Gobble 3 candies at a time
            for (let i = 0; i < rowCells.length; i += chunkSize) {
              const chunk = rowCells.slice(i, i + chunkSize);

              // Show Sweet Teeth position at the start of the chunk
              if (chunk.length > 0) {
                setSweetTeethPosition(chunk[0]);
              }

              // Animate gobbling for this chunk
              setAnimations(
                chunk.map((cell) => ({
                  row: cell.row,
                  col: cell.col,
                  type: "gobble",
                }))
              );

              // Add to gobbled candies
              gobbledCandies.push(...chunk);

              // Wait for animation
              await new Promise((resolve) => setTimeout(resolve, 120));

              // Clear these candies
              chunk.forEach((cell) => {
                clearedBoard[cell.row][cell.col] = "";
              });

              setBoard([...clearedBoard.map((r) => [...r])]);

              // Small delay between chunks
              await new Promise((resolve) => setTimeout(resolve, 80));
            }
          }

          // Delay between rows for wave effect
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Clear animations
        setAnimations([]);
        setSweetTeethPosition(null);
        setShowSweetTeethEffect(false);

        // Calculate points: base points per candy + bonus
        const points =
          gobbledCandies.length * 20 + (gobbledCandies.length > 20 ? 500 : 200);
        onScoreUpdate(points);

        // Wait for final animation
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Drop candies and check for cascades
        const droppedBoard = await dropCandies(clearedBoard);
        await checkForMatches(droppedBoard, false);

        // Notify completion
        effectInProgressRef.current = false;
        if (onSpecialEffectComplete) {
          setTimeout(() => {
            onSpecialEffectComplete();
          }, 500);
        }
      };

      executeSweetTeeth();
    } else if (
      specialEffect?.type === "lollipop_hammer" &&
      board.length > 0 &&
      !effectInProgressRef.current
    ) {
      // Lollipop Hammer: Interactive mode - player can click to destroy 2 candies
      effectInProgressRef.current = true;
      setShowLollipopHammerEffect(true);
      setHammerDestroysLeft(2);
      setHammerDestroyedCandies([]);
      playSound("select");
      // Don't set effectInProgressRef to false immediately - wait for player interactions
      effectInProgressRef.current = false;
    } else if (
      specialEffect?.type === "free_switch" &&
      board.length > 0 &&
      !effectInProgressRef.current
    ) {
      // Free Switch: Interactive mode - player can swap any 2 candies without using moves
      effectInProgressRef.current = true;
      setShowFreeSwitchEffect(true);
      setFreeSwitchUsed(false);
      playSound("select");
      // Don't set effectInProgressRef to false immediately - wait for player interactions
      effectInProgressRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialEffect]);

  // Handle Lollipop Hammer candy destruction
  const handleHammerDestroy = async (row: number, col: number) => {
    if (
      !showLollipopHammerEffect ||
      hammerDestroysLeft <= 0 ||
      isSwapping ||
      isChecking ||
      effectInProgressRef.current
    ) {
      return;
    }

    const currentBoard = boardStateRef.current;
    if (
      currentBoard.length === 0 ||
      !currentBoard[row] ||
      !currentBoard[row][col] ||
      !(currentBoard[row][col] in CANDY_COLORS)
    ) {
      return;
    }

    // Check if this candy was already destroyed
    if (hammerDestroyedCandies.some((c) => c.row === row && c.col === col)) {
      return;
    }

    effectInProgressRef.current = true;
    playSound("match");

    // Add to destroyed candies list
    const newDestroyed = [...hammerDestroyedCandies, { row, col }];
    setHammerDestroyedCandies(newDestroyed);
    setHammerDestroysLeft(hammerDestroysLeft - 1);

    // Show hammer animation
    setAnimations([
      {
        row,
        col,
        type: "hammer",
      },
    ]);

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Destroy the candy
    const newBoard = [...currentBoard.map((r) => [...r])];
    newBoard[row][col] = "";
    setBoard(newBoard);

    // Award points for destruction
    const points = 150; // Points per destroyed candy
    onScoreUpdate(points);

    // Clear animation
    setAnimations([]);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 200));

    // If we've destroyed 2 candies, complete the effect
    if (newDestroyed.length >= 2) {
      setShowLollipopHammerEffect(false);
      setHammerDestroysLeft(0);

      // Drop candies and check for cascades
      const droppedBoard = await dropCandies(newBoard);
      await checkForMatches(droppedBoard, false);

      // Complete the effect
      effectInProgressRef.current = false;
      if (onSpecialEffectComplete) {
        setTimeout(() => {
          onSpecialEffectComplete();
        }, 500);
      }
    } else {
      // Still have more destructions left
      effectInProgressRef.current = false;
    }
  };

  const initializeBoard = async () => {
    const newBoard: string[][] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      const newRow: string[] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        let candyType;
        do {
          candyType =
            CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
          // Avoid creating matches when generating the board
        } while (
          (col >= 2 &&
            newRow[col - 1] === candyType &&
            newRow[col - 2] === candyType) ||
          (row >= 2 &&
            newBoard[row - 1][col] === candyType &&
            newBoard[row - 2][col] === candyType)
        );
        newRow.push(candyType);
      }
      newBoard.push(newRow);
    }

    setBoard(newBoard);

    // Check for any matches that might have been created during initialization
    setTimeout(async () => {
      await checkForMatches(newBoard, false);
    }, 500);
  };

  // Handle drag start
  const handleDragStart = (row: number, col: number) => {
    // Don't allow dragging when hammer is active
    if (showLollipopHammerEffect && hammerDestroysLeft > 0) {
      return;
    }
    // Free Switch mode: allow dragging but treat it as selection for free swap
    if (showFreeSwitchEffect && !freeSwitchUsed) {
      setDragStart({ row, col });
      setSelectedCandy({ row, col });
      playSound("select");
      return;
    }
    if (isSwapping || isChecking) return;

    setDragStart({ row, col });
    setSelectedCandy({ row, col });
    playSound("select");
  };

  // Handle drag over
  const handleDragOver = (row: number, col: number) => {
    // Don't allow dragging when hammer is active
    if (showLollipopHammerEffect && hammerDestroysLeft > 0) {
      return;
    }
    if (!dragStart || isSwapping || isChecking) return;

    // Free Switch mode: allow dragging to any candy (not just adjacent)
    if (showFreeSwitchEffect && !freeSwitchUsed) {
      setSelectedCandy({ row, col });
      return;
    }

    // Normal mode: Only consider adjacent candies
    const isAdjacent =
      (Math.abs(dragStart.row - row) === 1 && dragStart.col === col) ||
      (Math.abs(dragStart.col - col) === 1 && dragStart.row === row);

    if (isAdjacent) {
      setSelectedCandy({ row, col });
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    // Don't allow dragging when hammer is active
    if (showLollipopHammerEffect && hammerDestroysLeft > 0) {
      setDragStart(null);
      setSelectedCandy(null);
      return;
    }
    if (!dragStart || !selectedCandy || isSwapping || isChecking) {
      setDragStart(null);
      setSelectedCandy(null);
      return;
    }

    // Free Switch mode: allow swapping any two candies
    if (showFreeSwitchEffect && !freeSwitchUsed) {
      if (
        dragStart.row !== selectedCandy.row ||
        dragStart.col !== selectedCandy.col
      ) {
        // Swap the two candies (free switch - no move consumed)
        swapCandies(
          dragStart.row,
          dragStart.col,
          selectedCandy.row,
          selectedCandy.col,
          true
        );
      }
      setDragStart(null);
      setSelectedCandy(null);
      return;
    }

    // Normal mode: If we dragged to a different candy
    if (
      dragStart.row !== selectedCandy.row ||
      dragStart.col !== selectedCandy.col
    ) {
      // Check if the candies are adjacent
      const isAdjacent =
        (Math.abs(dragStart.row - selectedCandy.row) === 1 &&
          dragStart.col === selectedCandy.col) ||
        (Math.abs(dragStart.col - selectedCandy.col) === 1 &&
          dragStart.row === selectedCandy.row);

      if (isAdjacent) {
        swapCandies(
          dragStart.row,
          dragStart.col,
          selectedCandy.row,
          selectedCandy.col,
          false
        );
        playSound("swap");
      }
    }

    setDragStart(null);
    setSelectedCandy(null);
  };

  // Legacy click handler (as fallback)
  const handleCandyClick = (row: number, col: number) => {
    // If Lollipop Hammer is active, handle destruction instead of selection
    if (showLollipopHammerEffect && hammerDestroysLeft > 0) {
      handleHammerDestroy(row, col);
      return;
    }

    if (isSwapping || isChecking) return;

    // For Free Switch, allow selecting any candy
    if (selectedCandy === null) {
      setSelectedCandy({ row, col });
      playSound("select");
    } else {
      // For Free Switch, allow swapping any two candies (not just adjacent)
      const isFreeSwitchActive = showFreeSwitchEffect && !freeSwitchUsed;

      if (isFreeSwitchActive) {
        // Free Switch: Can swap any two candies
        if (selectedCandy.row === row && selectedCandy.col === col) {
          // Clicked the same candy, deselect
          setSelectedCandy(null);
        } else {
          // Swap the two candies (free switch - no move consumed)
          swapCandies(selectedCandy.row, selectedCandy.col, row, col, true);
          setSelectedCandy(null);
        }
      } else {
        // Normal mode: Check if the clicked candy is adjacent to the selected candy
        const isAdjacent =
          (Math.abs(selectedCandy.row - row) === 1 &&
            selectedCandy.col === col) ||
          (Math.abs(selectedCandy.col - col) === 1 &&
            selectedCandy.row === row);

        if (isAdjacent) {
          swapCandies(selectedCandy.row, selectedCandy.col, row, col, false);
          playSound("swap");
        } else {
          setSelectedCandy({ row, col });
          playSound("select");
        }
      }
    }
  };

  const swapCandies = async (
    row1: number,
    col1: number,
    row2: number,
    col2: number,
    isFreeSwitch = false
  ) => {
    setIsSwapping(true);

    // Create a copy of the board
    const newBoard = [...board.map((row) => [...row])];

    // Swap the candies
    const temp = newBoard[row1][col1];
    newBoard[row1][col1] = newBoard[row2][col2];
    newBoard[row2][col2] = temp;

    setBoard(newBoard);
    setSelectedCandy(null);

    // If this is a free switch, mark it as used and complete the effect
    if (isFreeSwitch && showFreeSwitchEffect && !freeSwitchUsed) {
      setFreeSwitchUsed(true);
      setShowFreeSwitchEffect(false);

      // Complete the effect after swap
      setTimeout(() => {
        if (onSpecialEffectComplete) {
          onSpecialEffectComplete();
        }
      }, 100);
    }

    // Check if the swap created a match
    setTimeout(async () => {
      // For free switch, always allow the swap (matched or unmatched)
      // But only check for matches if it's not a free switch or if free switch created matches
      const shouldCheckMatches = !isFreeSwitch || true; // Free switch can create matches too
      const countMove = !isFreeSwitch; // Don't count moves for free switch

      if (shouldCheckMatches) {
        const hasMatches = await checkForMatches(newBoard, countMove);

        if (!hasMatches && !isFreeSwitch) {
          // If no matches were created and it's not a free switch, swap back
          const revertBoard = [...newBoard.map((row) => [...row])];
          revertBoard[row1][col1] = newBoard[row2][col2];
          revertBoard[row2][col2] = newBoard[row1][col1];

          setBoard(revertBoard);
          playSound("invalid");
        } else if (hasMatches && !isFreeSwitch) {
          // Valid move (only count if not free switch)
          onMoveComplete();
        } else if (hasMatches && isFreeSwitch) {
          // Free switch created matches - just play success sound, no move count
          playSound("match");
        } else if (!hasMatches && isFreeSwitch) {
          // Free switch didn't create matches - that's fine, just complete
          playSound("swap");
        }
      }

      setIsSwapping(false);
    }, 300);
  };

  const checkForMatches = async (
    currentBoard: string[][],
    countMove = true
  ) => {
    setIsChecking(true);

    // Check for horizontal matches
    let hasMatches = false;
    const matchedCandies: { row: number; col: number }[] = [];

    // Check horizontal matches
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE - 2; col++) {
        const candy = currentBoard[row][col];
        if (
          candy &&
          candy === currentBoard[row][col + 1] &&
          candy === currentBoard[row][col + 2]
        ) {
          hasMatches = true;

          // Determine the length of the match
          let matchLength = 3;
          while (
            col + matchLength < BOARD_SIZE &&
            currentBoard[row][col + matchLength] === candy
          ) {
            matchLength++;
          }

          // Add all matched candies to the list
          for (let i = 0; i < matchLength; i++) {
            matchedCandies.push({ row, col: col + i });
          }

          // Skip the matched candies
          col += matchLength - 1;
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (let row = 0; row < BOARD_SIZE - 2; row++) {
        const candy = currentBoard[row][col];
        if (
          candy &&
          candy === currentBoard[row + 1][col] &&
          candy === currentBoard[row + 2][col]
        ) {
          hasMatches = true;

          // Determine the length of the match
          let matchLength = 3;
          while (
            row + matchLength < BOARD_SIZE &&
            currentBoard[row + matchLength][col] === candy
          ) {
            matchLength++;
          }

          // Add all matched candies to the list
          for (let i = 0; i < matchLength; i++) {
            matchedCandies.push({ row: row + i, col });
          }

          // Skip the matched candies
          row += matchLength - 1;
        }
      }
    }

    // Remove duplicates from matchedCandies
    const uniqueMatches = matchedCandies.filter(
      (match, index, self) =>
        index ===
        self.findIndex((m) => m.row === match.row && m.col === match.col)
    );

    if (hasMatches) {
      // Add explosion animations
      setAnimations(
        uniqueMatches.map((match) => ({
          row: match.row,
          col: match.col,
          type: "explode",
        }))
      );

      // Play match sound
      playSound("match");

      // Update score
      if (countMove) {
        onScoreUpdate(uniqueMatches.length * 100);
      }

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Clear animations
      setAnimations([]);

      // Remove matched candies
      const newBoard = [...currentBoard.map((row) => [...row])];

      uniqueMatches.forEach((match) => {
        newBoard[match.row][match.col] = "";
      });

      setBoard(newBoard);

      // Wait for clearing animation
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Drop candies to fill empty spaces
      const updatedBoard = await dropCandies(newBoard);

      // Check for new matches
      await checkForMatches(updatedBoard, countMove);
    }

    setIsChecking(false);
    return hasMatches;
  };

  const dropCandies = async (currentBoard: string[][]) => {
    const newBoard = [...currentBoard.map((row) => [...row])];
    let hasDropped = false;

    // Drop existing candies
    for (let col = 0; col < BOARD_SIZE; col++) {
      let emptySpaces = 0;

      for (let row = BOARD_SIZE - 1; row >= 0; row--) {
        if (newBoard[row][col] === "") {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          // Move candy down
          newBoard[row + emptySpaces][col] = newBoard[row][col];
          newBoard[row][col] = "";
          hasDropped = true;
        }
      }

      // Fill top rows with new candies
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (newBoard[row][col] === "") {
          newBoard[row][col] =
            CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
          hasDropped = true;
        }
      }
    }

    if (hasDropped) {
      setBoard(newBoard);
      playSound("drop");

      // Wait for dropping animation
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return newBoard;
  };

  return (
    <div
      ref={boardContainerRef}
      className="grid grid-cols-8 gap-1 aspect-square relative"
      style={{
        backgroundImage:
          "repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.1) 3px, transparent 4px)",
        boxShadow: "inset 0 0 10px rgba(0,0,0,0.5)",
      }}
    >
      {/* Colour Bomb Effect Overlay */}
      {showColorBombEffect && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/40 via-pink-500/40 to-purple-500/40 animate-pulse" />
          <div className="relative z-10 text-center">
            <div className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-2xl animate-bounce">
              <span className="text-yellow-300">COLOUR</span>{" "}
              <span className="text-pink-400">BOMB!</span>
            </div>
            <div className="mt-2 text-2xl text-yellow-200 animate-pulse">
              💥 EXPLOSION! 💥
            </div>
          </div>
        </div>
      )}

      {/* Sweet Teeth Effect Overlay */}
      {showSweetTeethEffect && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 via-red-500/30 to-pink-500/30 animate-pulse" />
          <div className="relative z-10 text-center">
            <div className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-2xl animate-bounce">
              <span className="text-orange-300">SWEET</span>{" "}
              <span className="text-red-400">TEETH!</span>
            </div>
            <div className="mt-2 text-2xl text-orange-200 animate-pulse">
              🦷 GOBBLE GOBBLE! 🦷
            </div>
          </div>
        </div>
      )}

      {/* Sweet Teeth Character Animation */}
      {sweetTeethPosition && (
        <div
          className="absolute z-40 pointer-events-none transition-all duration-150"
          style={{
            left: `${(sweetTeethPosition.col / BOARD_SIZE) * 100}%`,
            top: `${(sweetTeethPosition.row / BOARD_SIZE) * 100}%`,
            width: `${100 / BOARD_SIZE}%`,
            height: `${100 / BOARD_SIZE}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="text-4xl animate-bounce">🦷</div>
            <div className="absolute inset-0 bg-yellow-400/50 rounded-full animate-ping"></div>
          </div>
        </div>
      )}

      {/* Lollipop Hammer Effect Overlay */}
      {showLollipopHammerEffect && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-gradient-to-r from-purple-900/95 to-pink-900/95 border-4 border-yellow-400 rounded-lg px-6 py-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-bounce">🔨</div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-300 font-pixel">
                  LOLLIPOP HAMMER!
                </div>
                <div className="text-sm text-white mt-1">
                  Click {hammerDestroysLeft} candy
                  {hammerDestroysLeft !== 1 ? "ies" : ""} to destroy
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Free Switch Effect Overlay */}
      {showFreeSwitchEffect && !freeSwitchUsed && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-gradient-to-r from-green-900/95 to-emerald-900/95 border-4 border-green-400 rounded-lg px-6 py-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-bounce">🔄</div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-300 font-pixel">
                  FREE SWITCH!
                </div>
                <div className="text-sm text-white mt-1">
                  Swap any 2 candies - No moves used!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Automatic Moves Effect Overlay */}
      {showAutoMoveEffect && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-black/80 border-2 border-blue-400 rounded-lg px-4 py-2 shadow-2xl">
            <div className="text-lg font-bold text-blue-300 font-pixel text-center">
              AUTO MOVE: {autoMoveProgress}
            </div>
          </div>
        </div>
      )}

      {/* Retro scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.8) 50%)",
          backgroundSize: "100% 4px",
        }}
      ></div>

      {board.map((row, rowIndex) =>
        row.map((candy, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`
              relative aspect-square rounded-lg cursor-pointer
              ${
                candy && candy in CANDY_COLORS
                  ? CANDY_COLORS[candy as keyof typeof CANDY_COLORS]
                  : "bg-transparent"
              }
              ${
                selectedCandy?.row === rowIndex &&
                selectedCandy?.col === colIndex
                  ? "ring-4 ring-white ring-opacity-70 animate-pulse"
                  : ""
              }
              ${
                showLollipopHammerEffect &&
                hammerDestroysLeft > 0 &&
                candy &&
                candy in CANDY_COLORS &&
                !hammerDestroyedCandies.some(
                  (c) => c.row === rowIndex && c.col === colIndex
                )
                  ? "ring-4 ring-yellow-400 ring-opacity-90 animate-pulse cursor-crosshair hover:scale-110 hover:ring-yellow-300"
                  : ""
              }
              ${
                showFreeSwitchEffect &&
                !freeSwitchUsed &&
                candy &&
                candy in CANDY_COLORS
                  ? selectedCandy?.row === rowIndex &&
                    selectedCandy?.col === colIndex
                    ? "ring-4 ring-green-400 ring-opacity-100 animate-pulse cursor-pointer"
                    : "ring-2 ring-green-300 ring-opacity-60 hover:ring-green-400 hover:ring-opacity-80 cursor-pointer"
                  : ""
              }
              transition-all duration-200
              ${isSwapping ? "transition-transform duration-300" : ""}
              hover:brightness-110 active:scale-95
            `}
            onClick={() => handleCandyClick(rowIndex, colIndex)}
            onMouseDown={() => handleDragStart(rowIndex, colIndex)}
            onMouseEnter={() => handleDragOver(rowIndex, colIndex)}
            onMouseUp={handleDragEnd}
            onTouchStart={() => handleDragStart(rowIndex, colIndex)}
            onTouchMove={(e) => {
              if (!boardContainerRef.current || !dragStart) return;

              const touch = e.touches[0];
              const boardRect =
                boardContainerRef.current.getBoundingClientRect();
              const cellSize = boardRect.width / BOARD_SIZE;

              const col = Math.floor(
                (touch.clientX - boardRect.left) / cellSize
              );
              const row = Math.floor(
                (touch.clientY - boardRect.top) / cellSize
              );

              if (
                row >= 0 &&
                row < BOARD_SIZE &&
                col >= 0 &&
                col < BOARD_SIZE
              ) {
                handleDragOver(row, col);
              }
            }}
            onTouchEnd={handleDragEnd}
            style={{
              transform: animations.some(
                (anim) => anim.row === rowIndex && anim.col === colIndex
              )
                ? "scale(1.2)"
                : "scale(1)",
            }}
          >
            {/* Candy shape with more retro styling */}
            <div
              className={`
              absolute inset-1 rounded-full 
              ${candy ? `bg-${candy}-400 bg-opacity-70` : ""}
              shadow-inner
              transition-all duration-300
              ${
                animations.some(
                  (anim) => anim.row === rowIndex && anim.col === colIndex
                )
                  ? "scale-0"
                  : "scale-1"
              }
            `}
              style={{
                boxShadow:
                  "inset 0 -4px 4px rgba(0,0,0,0.3), inset 0 4px 4px rgba(255,255,255,0.3)",
              }}
            ></div>

            {/* Pixelated highlight */}
            <div
              className={`
              absolute top-1 left-1 right-1 h-1/3 rounded-t-full
              ${candy ? "bg-white bg-opacity-30" : ""}
            `}
              style={{
                clipPath: "polygon(0% 0%, 100% 0%, 80% 50%, 20% 50%)",
              }}
            ></div>

            {/* Retro pixel border */}
            <div
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                boxShadow:
                  "inset 0 0 0 2px rgba(255,255,255,0.2), inset 0 0 0 4px rgba(0,0,0,0.1)",
                backgroundImage:
                  "radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.2) 100%)",
              }}
            ></div>

            {/* Animation effect - Explode */}
            {animations.some(
              (anim) =>
                anim.row === rowIndex &&
                anim.col === colIndex &&
                anim.type === "explode"
            ) && (
              <>
                <div className="absolute inset-0 bg-white animate-ping rounded-full"></div>
                <div className="absolute inset-[-50%] flex items-center justify-center">
                  <div className="text-yellow-300 text-2xl font-bold animate-bounce">
                    +100
                  </div>
                </div>
                {/* Particle effects */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%)`,
                      animation: `particle-${i} 0.5s forwards`,
                    }}
                  />
                ))}
              </>
            )}
            {/* Animation effect - Gobble (Sweet Teeth) */}
            {animations.some(
              (anim) =>
                anim.row === rowIndex &&
                anim.col === colIndex &&
                anim.type === "gobble"
            ) && (
              <>
                <div className="absolute inset-0 bg-orange-500 animate-pulse rounded-full opacity-80"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-3xl animate-bounce">🦷</div>
                </div>
                <div className="absolute inset-[-30%] flex items-center justify-center pointer-events-none">
                  <div className="text-orange-300 text-xl font-bold animate-bounce">
                    +120
                  </div>
                </div>
                {/* Gobble particle effects */}
                {[...Array(6)].map((_, i) => {
                  const angle = (i * 360) / 6;
                  const distance = 30;
                  return (
                    <div
                      key={i}
                      className="absolute w-3 h-3 bg-orange-400 rounded-full opacity-70 animate-ping"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `translate(-50%, -50%) translate(${
                          Math.cos((angle * Math.PI) / 180) * distance
                        }px, ${
                          Math.sin((angle * Math.PI) / 180) * distance
                        }px)`,
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: "0.4s",
                      }}
                    />
                  );
                })}
              </>
            )}
            {/* Animation effect - Hammer (Lollipop Hammer) */}
            {animations.some(
              (anim) =>
                anim.row === rowIndex &&
                anim.col === colIndex &&
                anim.type === "hammer"
            ) && (
              <>
                <div className="absolute inset-0 bg-purple-600 animate-pulse rounded-full opacity-90"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl animate-bounce">🔨</div>
                </div>
                <div className="absolute inset-[-30%] flex items-center justify-center pointer-events-none">
                  <div className="text-yellow-300 text-xl font-bold animate-bounce">
                    +150
                  </div>
                </div>
                {/* Hammer smash particle effects */}
                {[...Array(8)].map((_, i) => {
                  const angle = (i * 360) / 8;
                  const distance = 40;
                  return (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-80"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `translate(-50%, -50%) translate(${
                          Math.cos((angle * Math.PI) / 180) * distance
                        }px, ${
                          Math.sin((angle * Math.PI) / 180) * distance
                        }px)`,
                        animation: "fadeOut 0.5s forwards",
                        animationDelay: `${i * 0.03}s`,
                      }}
                    />
                  );
                })}
                {/* Crack effect */}
                <div className="absolute inset-0 opacity-60">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 70%)`,
                      clipPath: "polygon(20% 20%, 80% 20%, 60% 80%, 40% 80%)",
                    }}
                  ></div>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
