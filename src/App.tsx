import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { RefreshCcw, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = {
  RED: '#FF595E',
  BLUE: '#1982C4',
  GREEN: '#8AC926',
  YELLOW: '#FFCA3A',
};

const TIER_CONFIG = [
  { tier: 1, radius: 20, points: 10, label: 'Small' },
  { tier: 2, radius: 35, points: 50, label: 'Medium' },
  { tier: 3, radius: 50, points: 500, label: 'Large' },
];

const CONNECTION_RADIUS = 150;
const LIMIT_LINE_Y = 120; // 20% from top (80% from bottom of 600px height)
const GAME_OVER_TIME = 5000; // 5 seconds
const BALL_DROP_INTERVAL = 3000; // 3 seconds
const MERGE_COUNTDOWN_DURATION = 1500; // 1.5 seconds

export default function App() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);
  const [gameOverCountdown, setGameOverCountdown] = useState<number | null>(null);
  const [selectedBall, setSelectedBall] = useState<Matter.Body | null>(null);
  const [targetBall, setTargetBall] = useState<Matter.Body | null>(null);
  const [mergeTimer, setMergeTimer] = useState<number | null>(null);
  const selectedBallRef = useRef<Matter.Body | null>(null);
  const targetBallRef = useRef<Matter.Body | null>(null);
  const mergeTimerStartRef = useRef<number | null>(null);
  const gameOverTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    const engine = Matter.Engine.create();
    engineRef.current = engine;
    engine.gravity.y = 1;

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 400,
        height: 600,
        wireframes: false,
        background: '#1a1a1a',
      },
    });
    renderRef.current = render;

    const ground = Matter.Bodies.rectangle(200, 610, 400, 20, { isStatic: true, render: { fillStyle: '#333' } });
    const leftWall = Matter.Bodies.rectangle(-10, 300, 20, 600, { isStatic: true, render: { fillStyle: '#333' } });
    const rightWall = Matter.Bodies.rectangle(410, 300, 20, 600, { isStatic: true, render: { fillStyle: '#333' } });

    Matter.World.add(engine.world, [ground, leftWall, rightWall]);

    // Initial balls
    const initialBalls: Matter.Body[] = [];
    for (let i = 0; i < 25; i++) {
      initialBalls.push(createBall(Math.random() * 360 + 20, Math.random() * 300 + 100, 1));
    }
    Matter.World.add(engine.world, initialBalls);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Dynamic ball drop logic
    const getDropInterval = (currentScore: number) => {
      const baseInterval = 3000;
      const reduction = Math.floor(currentScore / 100) * 100; // 100ms reduction per 100 points
      return Math.max(500, baseInterval - reduction);
    };

    let dropTimeout: number;
    const scheduleNextDrop = () => {
      const interval = getDropInterval(scoreRef.current);
      dropTimeout = window.setTimeout(() => {
        if (!gameOverRef.current) {
          const newBall = createBall(Math.random() * 360 + 20, -20, 1);
          Matter.World.add(engine.world, newBall);
          scheduleNextDrop();
        }
      }, interval);
    };

    scheduleNextDrop();

    // Custom rendering for connection line and overlays
    Matter.Events.on(render, 'afterRender', () => {
      const context = render.context;
      
      // Draw limit line
      context.beginPath();
      context.setLineDash([5, 5]);
      context.moveTo(0, LIMIT_LINE_Y);
      context.lineTo(400, LIMIT_LINE_Y);
      
      // Pulse red if danger
      if (gameOverTimerRef.current) {
        const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5;
        context.strokeStyle = `rgba(255, 0, 0, ${0.3 + pulse * 0.7})`;
        context.lineWidth = 2 + pulse * 2;
      } else {
        context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        context.lineWidth = 1;
      }
      
      context.stroke();
      context.setLineDash([]);

      // Draw connection UI
      const currentSelected = selectedBallRef.current;
      const currentTarget = targetBallRef.current;

      if (currentSelected) {
        // Connection radius
        context.beginPath();
        context.arc(currentSelected.position.x, currentSelected.position.y, CONNECTION_RADIUS, 0, Math.PI * 2);
        context.fillStyle = 'rgba(255, 255, 255, 0.08)';
        context.fill();
        context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        context.lineWidth = 1;
        context.stroke();

        if (currentTarget) {
          // Dashed line
          context.beginPath();
          context.setLineDash([5, 5]);
          context.moveTo(currentSelected.position.x, currentSelected.position.y);
          context.lineTo(currentTarget.position.x, currentTarget.position.y);
          context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          context.lineWidth = 2;
          context.stroke();
          context.setLineDash([]);

          // Target glow/highlight
          context.beginPath();
          const pulse = Math.sin(Date.now() / 150) * 8 + 8;
          context.arc(currentTarget.position.x, currentTarget.position.y, (currentTarget as any).customRadius + pulse, 0, Math.PI * 2);
          context.strokeStyle = (currentTarget as any).customColor;
          context.lineWidth = 4;
          context.stroke();

          // Inner highlight
          context.beginPath();
          context.arc(currentTarget.position.x, currentTarget.position.y, (currentTarget as any).customRadius + 2, 0, Math.PI * 2);
          context.fillStyle = 'rgba(255, 255, 255, 0.2)';
          context.fill();

          // Countdown Timer UI
          if (mergeTimerStartRef.current) {
            const elapsed = Date.now() - mergeTimerStartRef.current;
            const remaining = Math.max(0, MERGE_COUNTDOWN_DURATION - elapsed);
            const progress = elapsed / MERGE_COUNTDOWN_DURATION;

            // Draw progress arc around selected ball
            context.beginPath();
            context.arc(currentSelected.position.x, currentSelected.position.y, (currentSelected as any).customRadius + 10, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * progress));
            context.strokeStyle = (currentSelected as any).customColor;
            context.lineWidth = 4;
            context.stroke();

            // Draw text
            context.font = 'bold 14px Inter';
            context.fillStyle = '#fff';
            context.textAlign = 'center';
            context.fillText(`${(remaining / 1000).toFixed(1)}s`, currentSelected.position.x, currentSelected.position.y - (currentSelected as any).customRadius - 20);
          }
        }
      }
    });

    // Game loop for game over check
    const handleGameOverCheck = () => {
      if (gameOverRef.current) return;
      
      const bodies = Matter.Composite.allBodies(engine.world);
      
      // Check if any ball (including the selected one) is above the limit line
      const isAnyAbove = bodies.some(b => {
        if (!(b as any).customRadius) return false;
        
        // Ignore the ball currently being held by the player
        if (b === selectedBallRef.current) return false;

        if (b.position.y < 0) return false;
        const ballTop = b.position.y - (b as any).customRadius;
        if (ballTop >= LIMIT_LINE_Y) return false;

        // Only trigger if the ball is "resting" or "piled up" (low velocity)
        // This prevents falling balls or explosion-flung balls from triggering the timer
        const velocityMag = Matter.Vector.magnitude(b.velocity);
        return velocityMag < 0.5;
      });

      if (isAnyAbove) {
        if (!gameOverTimerRef.current) {
          const startTime = Date.now();
          gameOverTimerRef.current = window.setTimeout(() => {
            setGameOver(true);
            gameOverRef.current = true;
            setGameOverCountdown(null);
          }, GAME_OVER_TIME);

          const updateCountdown = () => {
            if (gameOverTimerRef.current && !gameOverRef.current) {
              const elapsed = Date.now() - startTime;
              const remaining = Math.max(0, GAME_OVER_TIME - elapsed);
              setGameOverCountdown(remaining);
              requestAnimationFrame(updateCountdown);
            }
          };
          updateCountdown();
        }
      } else {
        if (gameOverTimerRef.current) {
          clearTimeout(gameOverTimerRef.current);
          gameOverTimerRef.current = null;
          setGameOverCountdown(null);
        }
      }
    };

    Matter.Events.on(engine, 'afterUpdate', handleGameOverCheck);

    return () => {
      clearTimeout(dropTimeout);
      Matter.Events.off(engine, 'afterUpdate', handleGameOverCheck);
      Matter.Render.stop(render);
      Matter.Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
      if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
    };
  }, []);

  const createBall = (x: number, y: number, tier: number, color?: string) => {
    const config = TIER_CONFIG[tier - 1];
    const ballColor = color || Object.values(COLORS)[Math.floor(Math.random() * 4)];
    const ball = Matter.Bodies.circle(x, y, config.radius, {
      restitution: 0.4,
      friction: 0.1,
      render: {
        fillStyle: ballColor,
      },
    });
    (ball as any).tier = tier;
    (ball as any).customColor = ballColor;
    (ball as any).customRadius = config.radius;
    return ball;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (gameOver || !engineRef.current) return;
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    const clicked = Matter.Query.point(bodies, { x, y })[0];

    if (clicked && !(clicked as any).isStatic) {
      setSelectedBall(clicked);
      selectedBallRef.current = clicked;
      Matter.Body.setStatic(clicked, true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const currentSelected = selectedBallRef.current;
    if (!currentSelected || !engineRef.current) return;

    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const mousePos = { x: mouseX, y: mouseY };

    // Find all valid targets within radius of the selected ball
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    let bestTarget: Matter.Body | null = null;
    let minMouseDist = Infinity;

    bodies.forEach(body => {
      if (body === currentSelected || (body as any).isStatic) return;
      
      // Check if same color and tier
      if ((body as any).tier === (currentSelected as any).tier && (body as any).customColor === (currentSelected as any).customColor) {
        // Check if within connection radius of the selected ball
        const distToSelected = Matter.Vector.magnitude(Matter.Vector.sub(body.position, currentSelected.position));
        
        if (distToSelected <= CONNECTION_RADIUS) {
          // Among valid targets, pick the one closest to the mouse cursor
          const distToMouse = Matter.Vector.magnitude(Matter.Vector.sub(body.position, mousePos));
          if (distToMouse < minMouseDist) {
            minMouseDist = distToMouse;
            bestTarget = body;
          }
        }
      }
    });

    if (bestTarget !== targetBallRef.current) {
      setTargetBall(bestTarget);
      targetBallRef.current = bestTarget;
      
      if (bestTarget) {
        // Only start the timer if it's not already running
        if (!mergeTimerStartRef.current) {
          mergeTimerStartRef.current = Date.now();
          
          // Start auto-merge check
          const checkAutoMerge = () => {
            // If we still have a target and a selected ball, keep checking
            if (targetBallRef.current && selectedBallRef.current === currentSelected) {
              const elapsed = Date.now() - (mergeTimerStartRef.current || 0);
              if (elapsed >= MERGE_COUNTDOWN_DURATION) {
                handleMouseUp();
              } else {
                requestAnimationFrame(checkAutoMerge);
              }
            }
          };
          requestAnimationFrame(checkAutoMerge);
        }
      } else {
        // Reset timer if no target is found at all
        mergeTimerStartRef.current = null;
      }
    }
  };

  const updateScore = (points: number) => {
    setScore(prev => {
      const newScore = prev + points;
      scoreRef.current = newScore;
      return newScore;
    });
  };

  const handleMouseUp = () => {
    const currentSelected = selectedBallRef.current;
    const currentTarget = targetBallRef.current;

    mergeTimerStartRef.current = null;
    
    if (!currentSelected || !engineRef.current) return;

    if (currentTarget) {
      const tier = (currentSelected as any).tier;
      const color = (currentSelected as any).customColor;
      const targetPos = { x: currentTarget.position.x, y: currentTarget.position.y };
      const startPos = { x: currentSelected.position.x, y: currentSelected.position.y };
      
      // Animation state
      let progress = 0;
      const duration = 10; // frames
      
      const animateMerge = () => {
        if (!engineRef.current) return;
        progress++;
        
        const t = progress / duration;
        const currentX = startPos.x + (targetPos.x - startPos.x) * t;
        const currentY = startPos.y + (targetPos.y - startPos.y) * t;
        
        Matter.Body.setPosition(currentSelected, { x: currentX, y: currentY });
        
        if (progress < duration) {
          requestAnimationFrame(animateMerge);
        } else {
          // Final merge logic
          if (engineRef.current) {
            Matter.World.remove(engineRef.current.world, [currentSelected, currentTarget]);

            if (tier < 3) {
              const nextTierBall = createBall(targetPos.x, targetPos.y, tier + 1, color);
              Matter.World.add(engineRef.current.world, nextTierBall);
              updateScore(TIER_CONFIG[tier - 1].points);
            } else {
              updateScore(500);
              triggerSupernova(targetPos.x, targetPos.y);
            }
          }
        }
      };
      
      requestAnimationFrame(animateMerge);
    } else {
      Matter.Body.setStatic(currentSelected, false);
    }

    setSelectedBall(null);
    setTargetBall(null);
    selectedBallRef.current = null;
    targetBallRef.current = null;
  };

  const triggerSupernova = (x: number, y: number) => {
    if (!engineRef.current) return;
    
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    bodies.forEach(body => {
      if ((body as any).isStatic) return;
      const forceVector = Matter.Vector.sub(body.position, { x, y });
      const distance = Matter.Vector.magnitude(forceVector);
      if (distance < 200) {
        const forceMagnitude = (1 - distance / 200) * 0.15;
        Matter.Body.applyForce(body, body.position, Matter.Vector.mult(Matter.Vector.normalise(forceVector), forceMagnitude));
      }
    });

    // Particle effect would go here, but for simplicity we just use physics
  };

  const restartGame = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-[#0f0f0f] flex flex-col items-center justify-center font-sans text-white overflow-hidden touch-none">
      <div className="relative w-full h-full max-w-[450px] max-h-[800px] flex flex-col items-center justify-center p-2 sm:p-4">
        <div className="relative aspect-[2/3] w-full max-h-full border-4 border-[#333] rounded-2xl overflow-hidden shadow-2xl bg-[#1a1a1a]">
          {/* Game Canvas Container */}
          <div 
            ref={sceneRef} 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as any);
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as any);
            }}
            onTouchEnd={handleMouseUp}
            className="absolute inset-0 cursor-crosshair touch-none"
          >
            {/* The canvas will be injected here and we'll scale it via CSS if needed, 
                but actually Matter.js Render will fill the element if we set it up right.
                For now, we'll keep the 400x600 internal size and use CSS to make it fit. */}
            <style>{`
              canvas {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain;
              }
            `}</style>
          </div>

        {/* HUD */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-xl font-bold tracking-tight">{score}</span>
        </div>

        {/* Game Over Countdown */}
        <AnimatePresence>
          {gameOverCountdown !== null && !gameOver && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-20 bg-red-500 text-white px-8 py-3 rounded-2xl font-black text-3xl shadow-[0_0_30px_rgba(239,68,68,0.5)] border-2 border-white/30"
            >
              {(gameOverCountdown / 1000).toFixed(1)}s
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameOver && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center p-8 text-center"
            >
              <h2 className="text-5xl font-black mb-2 text-red-500 uppercase tracking-tighter">Game Over</h2>
              <p className="text-gray-400 mb-8">You reached the limit!</p>
              
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8 w-full">
                <p className="text-sm uppercase tracking-widest text-gray-500 mb-1">Final Score</p>
                <p className="text-4xl font-bold">{score}</p>
              </div>

              <button 
                onClick={restartGame}
                className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-colors"
              >
                <RefreshCcw className="w-5 h-5" />
                Restart Game
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        {!gameOver && score === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none opacity-50">
            <p className="text-xs uppercase tracking-widest">Drag same-colored balls to merge</p>
          </div>
        )}
        </div>
      </div>

      <div className="mt-4 text-center max-w-md px-4 hidden sm:block">
        <h1 className="text-2xl font-black mb-1 tracking-tighter uppercase">SUPERNOVA MERGE</h1>
        <p className="text-gray-500 text-xs">
          Merge balls of the same color and size. Reach Tier 3 to trigger a Supernova! 
          Don't let the balls stay above the red line.
        </p>
      </div>
    </div>
  );
}
