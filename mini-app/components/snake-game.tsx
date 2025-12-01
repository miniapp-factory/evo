"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const canvasSize = 400;
const cellSize = 20;
const initialSpeed = 200;
const mutationTypes = ["speed", "shield", "double", "camouflage"] as const;
type Mutation = typeof mutationTypes[number];

interface LeaderboardEntry {
  score: number;
  wallet: string;
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Array<{ x: number; y: number }>>([
    { x: 10, y: 10 },
  ]);
  const [direction, setDirection] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [ball, setBall] = useState<{
    x: number;
    y: number;
    type: Mutation;
  }>({
    x: Math.floor(Math.random() * (canvasSize / cellSize)),
    y: Math.floor(Math.random() * (canvasSize / cellSize)),
    type: "speed",
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const [mutation, setMutation] = useState<Mutation | null>(null);
  const [mutationTimer, setMutationTimer] = useState(0);
  const [evolution, setEvolution] = useState<string>("Tiny");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [milestone, setMilestone] = useState<string | null>(null);

  // Fetch leaderboard (placeholder)
  useEffect(() => {
    // In a real app, fetch from backend or blockchain
    setLeaderboard([
      { score: 50, wallet: "0xABC..." },
      { score: 30, wallet: "0xDEF..." },
      { score: 20, wallet: "0x123..." },
    ]);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          setDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
          setDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
          setDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
          setDirection({ x: 1, y: 0 });
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Handle touch joystick
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) {
        setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
      } else {
        setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
      }
    };
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setSnake((prev) => {
        const newHead = {
          x: prev[0].x + direction.x,
          y: prev[0].y + direction.y,
        };

        // Wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= canvasSize / cellSize ||
          newHead.y < 0 ||
          newHead.y >= canvasSize / cellSize
        ) {
          setGameOver(true);
          return prev;
        }

        // Self collision
        if (prev.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Ball collision
        if (newHead.x === ball.x && newHead.y === ball.y) {
          // Apply mutation effect
          applyMutation(ball.type);
          setScore((s) => s + 1);
          setSpeed((s) => Math.max(50, s - 10));
          spawnBall();
          // Evolution check
          if (score + 1 === 10) setEvolution("Agile");
          if (score + 1 === 20) setEvolution("Armored");
          if (score + 1 === 30) setEvolution("Legendary");
          // Milestone
          if (score + 1 === 15) setMilestone("15 balls collected!");
          return newSnake; // grow
        }

        return newSnake.slice(0, -1); // normal move
      });
    }, speed);
    return () => clearInterval(interval);
  }, [direction, ball, speed, gameOver, score]);

  // Mutation timer
  useEffect(() => {
    if (!mutation) return;
    const timer = setInterval(() => {
      setMutationTimer((t) => t - 1);
    }, 1000);
    if (mutationTimer <= 0) {
      clearInterval(timer);
      setMutation(null);
    }
    return () => clearInterval(timer);
  }, [mutation, mutationTimer]);

  const applyMutation = (type: Mutation) => {
    setMutation(type);
    setMutationTimer(5); // 5 seconds
    if (type === "speed") {
      setSpeed((s) => Math.max(50, s - 30));
    } else if (type === "shield") {
      // shield logic could be added
    } else if (type === "double") {
      setScore((s) => s + 1); // double point
    } else if (type === "camouflage") {
      // camouflage logic could be added
    }
  };

  const spawnBall = () => {
    const newType = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];
    setBall({
      x: Math.floor(Math.random() * (canvasSize / cellSize)),
      y: Math.floor(Math.random() * (canvasSize / cellSize)),
      type: newType,
    });
  };

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw snake with evolution color
    const colors = {
      Tiny: "green",
      Agile: "lime",
      Armored: "blue",
      Legendary: "gold",
    };
    ctx.fillStyle = colors[evolution as keyof typeof colors];
    snake.forEach((segment) => {
      ctx.fillRect(
        segment.x * cellSize,
        segment.y * cellSize,
        cellSize,
        cellSize
      );
    });

    // Draw ball
    ctx.fillStyle = mutation === "camouflage" ? "gray" : "red";
    ctx.fillRect(
      ball.x * cellSize,
      ball.y * cellSize,
      cellSize,
      cellSize
    );
  }, [snake, ball, mutation, evolution]);

  const restart = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: 0 });
    setScore(0);
    setGameOver(false);
    setSpeed(initialSpeed);
    setMutation(null);
    setMutationTimer(0);
    setEvolution("Tiny");
    setMilestone(null);
    spawnBall();
  };

  // Placeholder Web3 interactions
  const awardTokens = (amount: number) => {
    console.log(`Awarded ${amount} tokens to wallet`);
  };
  const mintNFT = (stage: string) => {
    console.log(`Minted ${stage} NFT`);
  };

  // Award tokens on score thresholds
  useEffect(() => {
    if (score === 5) awardTokens(10);
    if (score === 10) awardTokens(20);
    if (score === 20) mintNFT("Armored");
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="border border-gray-300"
      />
      <div className="flex gap-4">
        <span className="text-lg">Score: {score}</span>
        <span className="text-lg">Evolution: {evolution}</span>
        {mutation && (
          <span className="text-lg text-yellow-500">
            Mutation: {mutation} ({mutationTimer}s)
          </span>
        )}
        {milestone && (
          <span className="text-lg text-green-500">{milestone}</span>
        )}
        {gameOver && (
          <span className="text-lg text-red-600">Game Over!</span>
        )}
      </div>
      {gameOver && (
        <div className="flex gap-2">
          <Button onClick={restart}>Restart</Button>
          <Share text={`I scored ${score} in Snake & Ball! ${url}`} />
        </div>
      )}
      <div className="w-full max-w-md mt-4">
        <h2 className="text-xl font-semibold mb-2">Leaderboard</h2>
        <ul className="space-y-1">
          {leaderboard.map((entry, idx) => (
            <li key={idx} className="flex justify-between">
              <span>{entry.wallet}</span>
              <span>{entry.score}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
