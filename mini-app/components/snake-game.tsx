"use client";

import { useEffect, useRef, useState } from "react";

const canvasSize = 400;
const cellSize = 20;
const initialSpeed = 200;

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Array<{ x: number; y: number }>>([
    { x: 10, y: 10 },
  ]);
  const [direction, setDirection] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [ball, setBall] = useState<{ x: number; y: number }>({
    x: Math.floor(Math.random() * (canvasSize / cellSize)),
    y: Math.floor(Math.random() * (canvasSize / cellSize)),
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);

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

  // Game loop
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setSnake((prev) => {
        const newHead = {
          x: prev[0].x + direction.x,
          y: prev[0].y + direction.y,
        };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= canvasSize / cellSize ||
          newHead.y < 0 ||
          newHead.y >= canvasSize / cellSize
        ) {
          setGameOver(true);
          return prev;
        }

        // Check self collision
        if (prev.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Check ball collision
        if (newHead.x === ball.x && newHead.y === ball.y) {
          setScore((s) => s + 1);
          setSpeed((s) => Math.max(50, s - 10));
          setBall({
            x: Math.floor(Math.random() * (canvasSize / cellSize)),
            y: Math.floor(Math.random() * (canvasSize / cellSize)),
          });
          return newSnake; // grow
        }

        return newSnake.slice(0, -1); // normal move
      });
    }, speed);
    return () => clearInterval(interval);
  }, [direction, ball, speed, gameOver]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw snake
    ctx.fillStyle = "green";
    snake.forEach((segment) => {
      ctx.fillRect(
        segment.x * cellSize,
        segment.y * cellSize,
        cellSize,
        cellSize
      );
    });

    // Draw ball
    ctx.fillStyle = "red";
    ctx.fillRect(
      ball.x * cellSize,
      ball.y * cellSize,
      cellSize,
      cellSize
    );
  }, [snake, ball]);

  const restart = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: 0 });
    setScore(0);
    setGameOver(false);
    setSpeed(initialSpeed);
    setBall({
      x: Math.floor(Math.random() * (canvasSize / cellSize)),
      y: Math.floor(Math.random() * (canvasSize / cellSize)),
    });
  };

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
        {gameOver && (
          <span className="text-lg text-red-600">Game Over!</span>
        )}
      </div>
      {gameOver && (
        <button
          onClick={restart}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Restart
        </button>
      )}
    </div>
  );
}
