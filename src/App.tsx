import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { RefreshCcw, Trophy, Users, ChevronLeft, Send } from 'lucide-react';
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
const MERGE_COUNTDOWN_DURATION = 1500; // 1.5 seconds

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (showLeaderboard) {
    return <Leaderboard onBack={() => setShowLeaderboard(false)} />;
  }

  if (!gameStarted) {
    return (
      <div className="fixed inset-0 bg-[#0f0f0f] flex flex-col items-center justify-center font-sans text-white overflow-hidden touch-none p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-12">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block mb-4"
            >
              <div className="w-24 h-24 rounded-3xl bg-[#1a1a1a] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative border border-white/10">
                {/* Custom Icon matching the user image */}
                <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-[#FF595E]" />
                <div className="absolute top-2 -right-6 w-20 h-20 rounded-full bg-[#8AC926]" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[#1982C4]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/4 w-12 h-12 rounded-full bg-[#FFCA3A]" />
                <div className="absolute -bottom-4 right-2 w-10 h-10 rounded-full bg-[#FF595E]" />
              </div>
            </motion.div>
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
              SUPERNOVA
            </h1>
            <p className="text-gray-400 tracking-widest uppercase text-xs font-bold">Merge & Survive</p>
          </div>

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGameStarted(true)}
              className="w-full p-6 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between group transition-all hover:border-white/20"
            >
              <div className="text-left">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Start Game</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Level up to increase your multiplier
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </motion.button>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
            >
              <Users className="w-4 h-4" />
              Leaderboard
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <Game onBack={() => setGameStarted(false)} />;
}

function Leaderboard({ onBack }: { onBack: () => void }) {
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setScores(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0f0f0f] flex flex-col items-center justify-center font-sans text-white overflow-hidden p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Leaderboard</h2>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCcw className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-12 text-gray-500 uppercase text-xs tracking-widest">
              No scores yet. Be the first!
            </div>
          ) : (
            scores.map((s, i) => (
              <div 
                key={i}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-6 text-sm font-black ${i < 3 ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold tracking-tight">{s.name}</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                      Level {s.level || 1}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-black tabular-nums">{s.score}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Game({ onBack }: { onBack: () => void }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  const [levelProgress, setLevelProgress] = useState(0);
  const [levelLimit, setLevelLimit] = useState(100);
  const [multiplier, setMultiplier] = useState(1);
  const multiplierRef = useRef(1);
  const multiplierTimeoutRef = useRef<number | null>(null);
  const [multiplierTimeLeft, setMultiplierTimeLeft] = useState(0);

  // Keep refs in sync with state for Matter.js and timeouts
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    multiplierRef.current = multiplier;
  }, [multiplier]);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);
  const [gameOverCountdown, setGameOverCountdown] = useState<number | null>(null);
  const [selectedBall, setSelectedBall] = useState<Matter.Body | null>(null);
  const [targetBall, setTargetBall] = useState<Matter.Body | null>(null);
  const selectedBallRef = useRef<Matter.Body | null>(null);
  const targetBallRef = useRef<Matter.Body | null>(null);
  const mergeTimerStartRef = useRef<number | null>(null);
  const gameOverTimerRef = useRef<number | null>(null);
  const particlesRef = useRef<any[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playMergeSound = (tier: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const freq = 200 + tier * 100;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  const triggerHaptic = (tier: number) => {
    if ('vibrate' in navigator) {
      const duration = 15 + tier * 20;
      navigator.vibrate(duration);
    }
  };

  const createParticles = (x: number, y: number, color: string, count = 15, speedMult = 1, toScore = false) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 4 + 2) * speedMult;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: toScore ? 0.005 : (0.02 + Math.random() * 0.02),
        color,
        size: Math.random() * 5 + 2,
        toScore,
        delay: toScore ? Math.random() * 20 : 0,
        targetX: 350, // Approximate score position
        targetY: 30
      });
    }
  };

  // Leaderboard submission state
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitScore = async () => {
    if (!playerName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName.trim(),
          score: scoreRef.current,
          level: levelRef.current
        })
      });
      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    for (let i = 0; i < 20; i++) {
      initialBalls.push(createBall(Math.random() * 360 + 20, Math.random() * 300 + 100, 1));
    }
    Matter.World.add(engine.world, initialBalls);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Dynamic ball drop logic
    const getSpawnConfig = (lvl: number) => {
      const rawInterval = 2500 - (lvl - 1) * 200;
      const interval = Math.max(400, rawInterval);
      let count = 1;
      if (rawInterval < 400) {
        const overflow = 400 - rawInterval;
        count = 1 + Math.floor(overflow / 200);
      }
      return { interval, count };
    };

    let dropTimeout: number;
    const scheduleNextDrop = () => {
      const { interval, count } = getSpawnConfig(levelRef.current);
      dropTimeout = window.setTimeout(() => {
        if (!gameOverRef.current) {
          for (let i = 0; i < count; i++) {
            const newBall = createBall(Math.random() * 360 + 20, -20 - (i * 40), 1);
            Matter.World.add(engine.world, newBall);
          }
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

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        if (p.delay > 0) {
          p.delay--;
          return;
        }

        if (p.toScore && p.life < 0.9) {
          // Move towards score after initial burst
          const dx = (p.targetX + (Math.random() * 20 - 10)) - p.x;
          const dy = (p.targetY + (Math.random() * 20 - 10)) - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 15) {
            p.life = 0;
          } else {
            const flySpeed = 15;
            p.vx = (dx / dist) * flySpeed;
            p.vy = (dy / dist) * flySpeed;
          }
        } else {
          p.vy += 0.1; // gravity for burst phase
        }

        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        
        context.globalAlpha = p.life;
        context.beginPath();
        context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        context.fillStyle = p.color;
        context.fill();
      });
      context.globalAlpha = 1.0;

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
      
      const isAnyAbove = bodies.some(b => {
        if (!(b as any).customRadius) return false;
        if (b === selectedBallRef.current) return false;
        if (b.position.y < 0) return false;
        const ballTop = b.position.y - (b as any).customRadius;
        if (ballTop >= LIMIT_LINE_Y) return false;
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
      if (multiplierTimeoutRef.current) clearTimeout(multiplierTimeoutRef.current);
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

  const getScaledCoordinates = (clientX: number, clientY: number) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    // Calculate position relative to the element
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Scale to Matter.js internal coordinates (400x600)
    const scaleX = 400 / rect.width;
    const scaleY = 600 / rect.height;
    
    return {
      x: x * scaleX,
      y: y * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent | { clientX: number, clientY: number }) => {
    if (gameOver || !engineRef.current) return;
    
    const { x, y } = getScaledCoordinates(e.clientX, e.clientY);

    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    const clicked = Matter.Query.point(bodies, { x, y })[0];

    if (clicked && !(clicked as any).isStatic) {
      setSelectedBall(clicked);
      selectedBallRef.current = clicked;
      Matter.Body.setStatic(clicked, true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | { clientX: number, clientY: number }) => {
    const currentSelected = selectedBallRef.current;
    if (!currentSelected || !engineRef.current) return;

    const { x, y } = getScaledCoordinates(e.clientX, e.clientY);
    const mousePos = { x, y };

    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    let bestTarget: Matter.Body | null = null;
    let minMouseDist = Infinity;

    bodies.forEach(body => {
      if (body === currentSelected || (body as any).isStatic) return;
      if ((body as any).tier === (currentSelected as any).tier && (body as any).customColor === (currentSelected as any).customColor) {
        const distToSelected = Matter.Vector.magnitude(Matter.Vector.sub(body.position, currentSelected.position));
        if (distToSelected <= CONNECTION_RADIUS) {
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
        if (!mergeTimerStartRef.current) {
          mergeTimerStartRef.current = Date.now();
          const checkAutoMerge = () => {
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
        mergeTimerStartRef.current = null;
      }
    }
  };

  const addLevelProgress = (amount: number) => {
    setLevelProgress(prev => prev + amount);
  };

  useEffect(() => {
    if (levelProgress >= levelLimit) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setLevelProgress(prev => prev - levelLimit);
      setLevelLimit(prev => prev + 50);
    }
  }, [levelProgress, levelLimit, level]);

  const updateScore = (points: number) => {
    const multipliedPoints = Math.round(points * level * multiplier);
    setScore(prev => {
      const newScore = prev + multipliedPoints;
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
      let progress = 0;
      const duration = 10;
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
          if (engineRef.current) {
            Matter.World.remove(engineRef.current.world, [currentSelected, currentTarget]);
            playMergeSound(tier);
            triggerHaptic(tier);
            
            // Quantity scales with tier
            const particleCount = 5 + tier * 10;
            createParticles(targetPos.x, targetPos.y, color, particleCount, 1, true);

            if (tier < 3) {
              const nextTierBall = createBall(targetPos.x, targetPos.y, tier + 1, color);
              Matter.World.add(engineRef.current.world, nextTierBall);
              updateScore(TIER_CONFIG[tier - 1].points);
              addLevelProgress(tier === 1 ? 2 : 5);
            } else {
              updateScore(500);
              triggerSupernova(targetPos.x, targetPos.y);
              addLevelProgress(10);
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
    
    // Multiplier logic: increase and reset 5s timer
    if (multiplierTimeoutRef.current) {
      clearTimeout(multiplierTimeoutRef.current);
    }
    
    const nextMult = multiplierRef.current + 1;
    setMultiplier(nextMult);
    setMultiplierTimeLeft(5000);

    const startTime = Date.now();
    const updateTimer = () => {
      if (multiplierRef.current > 1) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 5000 - elapsed);
        setMultiplierTimeLeft(remaining);
        if (remaining > 0 && multiplierTimeoutRef.current) {
          requestAnimationFrame(updateTimer);
        }
      }
    };
    requestAnimationFrame(updateTimer);

    multiplierTimeoutRef.current = window.setTimeout(() => {
      setMultiplier(1);
      setMultiplierTimeLeft(0);
      multiplierTimeoutRef.current = null;
    }, 5000);

    // Big explosion effect
    createParticles(x, y, '#fff', 40, 2);
    createParticles(x, y, '#FFD700', 30, 1.5);
    triggerHaptic(5); // Stronger haptic for supernova

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
  };

  return (
    <div className="fixed inset-0 bg-[#0f0f0f] flex flex-col items-center justify-center font-sans text-white overflow-hidden touch-none">
      <div className="relative w-full h-full max-w-[450px] max-h-[800px] flex flex-col items-center justify-center p-2 sm:p-4">
        <div className="relative aspect-[2/3] w-full max-h-full border-4 border-[#333] rounded-2xl overflow-hidden shadow-2xl bg-[#1a1a1a]">
          {/* Level Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-white/5 z-20">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${(levelProgress / levelLimit) * 100}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>

          <div 
            ref={sceneRef} 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              if (e.cancelable) e.preventDefault();
              const touch = e.touches[0];
              handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
            }}
            onTouchMove={(e) => {
              if (e.cancelable) e.preventDefault();
              const touch = e.touches[0];
              handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
            }}
            onTouchEnd={(e) => {
              if (e.cancelable) e.preventDefault();
              handleMouseUp();
            }}
            className="absolute inset-0 cursor-crosshair touch-none"
          >
            <style>{`
              canvas {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain;
              }
            `}</style>
          </div>

        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <button 
            onClick={onBack}
            className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-colors"
          >
            <RefreshCcw className="w-4 h-4 rotate-180" />
          </button>
          <div className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
            LVL {level}
          </div>
        </div>

        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1">
          <AnimatePresence mode="wait">
            {multiplier > 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  scale: Math.min(1.5, 1 + (multiplier * 0.05)), 
                  y: 0,
                  rotate: [0, -Math.min(5, multiplier), Math.min(5, multiplier), -Math.min(5, multiplier), 0]
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: 0.2 },
                  scale: { type: "spring", stiffness: 300 }
                }}
                className="bg-red-500 text-white px-3 py-1 rounded-lg font-black italic shadow-lg flex flex-col items-center relative overflow-hidden"
              >
                <div className="text-xs uppercase tracking-tighter leading-none relative z-10">Supernova</div>
                <div className="text-2xl leading-none relative z-10">x{multiplier}</div>
                {/* Timer bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-white/40 z-10" style={{ width: `${(multiplierTimeLeft / 5000) * 100}%` }} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div 
            key={score}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-xl font-bold tracking-tight tabular-nums">{score}</span>
          </motion.div>
        </div>

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

              {!isSubmitted ? (
                <div className="w-full mb-8 space-y-3">
                  <p className="text-xs uppercase tracking-widest text-gray-400">Save to Leaderboard</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter Name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value.slice(0, 15))}
                      className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <button 
                      onClick={submitScore}
                      disabled={!playerName.trim() || isSubmitting}
                      className="bg-white text-black px-4 py-3 rounded-xl disabled:opacity-50 hover:bg-gray-200 transition-colors"
                    >
                      {isSubmitting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full mb-8 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-bold uppercase tracking-widest">
                  Score Submitted!
                </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-colors"
                >
                  <RefreshCcw className="w-5 h-5" />
                  Try Again
                </button>
                <button 
                  onClick={onBack}
                  className="flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-colors"
                >
                  Main Menu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!gameOver && score === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none opacity-50">
            <p className="text-xs uppercase tracking-widest">Drag same-colored balls to merge</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
