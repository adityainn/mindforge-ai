"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  CheckCircle,
  HelpCircle,
  Volume2
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import styles from "@/styles/pomodoro.module.css";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

type Mode = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export default function PomodoroPage() {
  const [mode, setMode] = useState<Mode>("WORK");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [pomoCountToday, setPomoCountToday] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const modeDurations: Record<Mode, number> = {
    WORK: 25 * 60,
    SHORT_BREAK: 5 * 60,
    LONG_BREAK: 15 * 60
  };

  useEffect(() => {
    // Fetch pending tasks
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const data = await res.json();
          setTasks(data.filter((t: Task) => !t.completed));
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    const fetchPomoStats = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const data = await res.json();
          setPomoCountToday(data.today.pomodorosCompleted || 0);
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
      }
    };

    fetchTasks();
    fetchPomoStats();
  }, []);

  // Update timer duration on mode change
  useEffect(() => {
    setTimeLeft(modeDurations[mode]);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [mode]);

  // Main countdown timer interval loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, selectedTaskId]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    playCompletionSound();
    
    // Log Pomodoro to SQLite Database
    try {
      const res = await fetch("/api/pomodoro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: modeDurations[mode] / 60,
          type: mode,
          taskId: mode === "WORK" && selectedTaskId ? selectedTaskId : null
        })
      });

      if (res.ok) {
        // Refresh sidebar streak & local counter
        window.dispatchEvent(new Event("refresh-streak"));
        if (mode === "WORK") {
          setPomoCountToday((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error("Failed to log Pomodoro session:", err);
    }

    // Auto-advance mode or show alert
    alert(`${mode === "WORK" ? "Work session completed! Time for a break." : "Break completed! Time to get back to work."}`);
  };

  const playCompletionSound = () => {
    if (typeof window === "undefined") return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Play a nice double chime
      const playChime = (delay: number, pitch: number) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(pitch, audioContext.currentTime + delay);
        
        gain.gain.setValueAtTime(0, audioContext.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.6);

        osc.start(audioContext.currentTime + delay);
        osc.stop(audioContext.currentTime + delay + 0.6);
      };

      playChime(0, 523.25); // C5
      playChime(0.2, 659.25); // E5
    } catch (err) {
      console.error("Web Audio API chime failed:", err);
    }
  };

  const toggleStart = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(modeDurations[mode]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // SVG calculations for visual circular ring
  const radius = 130;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const totalDuration = modeDurations[mode];
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={styles.pomodoroContainer}>
      {/* Timer Display Card */}
      <GlassCard className={styles.timerCard} hoverable={false}>
        {/* Mode Buttons */}
        <div className={styles.modeSelector}>
          {(["WORK", "SHORT_BREAK", "LONG_BREAK"] as Mode[]).map((m) => (
            <button
              key={m}
              className={`${styles.modeButton} ${mode === m ? styles.modeButtonActive : ""}`}
              onClick={() => setMode(m)}
            >
              {m === "WORK" ? "Focus" : m === "SHORT_BREAK" ? "Short Break" : "Long Break"}
            </button>
          ))}
        </div>

        {/* Circular Countdown Progress */}
        <div className={styles.timerDisplay}>
          <svg height={radius * 2} width={radius * 2} className={styles.circleSvg}>
            <circle
              stroke="rgba(255, 255, 255, 0.03)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={
                mode === "WORK" ? "var(--accent-purple)" : 
                mode === "SHORT_BREAK" ? "var(--accent-green)" : "var(--accent-blue)"
              }
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <span className={styles.timeText}>{formatTime(timeLeft)}</span>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button className={`${styles.controlBtn} ${styles.btnPause}`} onClick={resetTimer}>
            <RotateCcw size={20} />
          </button>
          <button className={`${styles.controlBtn} ${styles.btnPlay}`} onClick={toggleStart}>
            {isRunning ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" style={{ marginLeft: "4px" }} />}
          </button>
          <button 
            className={`${styles.controlBtn} ${styles.btnPause}`} 
            onClick={playCompletionSound}
            title="Test Chime Sound"
          >
            <Volume2 size={20} />
          </button>
        </div>

        {/* Associated Task */}
        {mode === "WORK" && (
          <div className={styles.taskAssociation}>
            <label className={styles.taskLabel}>Link to Study Task</label>
            <select
              className={styles.taskSelect}
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            >
              <option value="">None (General Study)</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </GlassCard>

      {/* Instructions / Dashboard Log card */}
      <GlassCard className={styles.infoCard} hoverable={false}>
        <h3 className={styles.infoTitle}>
          <Clock size={20} style={{ color: "var(--accent-blue)" }} />
          Session Statistics
        </h3>

        <div className={styles.infoStats}>
          <div className={styles.infoStatItem}>
            <span className={styles.infoStatLabel}>Pomo Sessions Today</span>
            <span className={styles.infoStatVal}>{pomoCountToday}</span>
          </div>
          <div className={styles.infoStatItem}>
            <span className={styles.infoStatLabel}>Focus Goal</span>
            <span className={styles.infoStatVal}>4 Sessions (100m)</span>
          </div>
        </div>

        <h3 className={styles.infoTitle} style={{ marginTop: "12px" }}>
          <HelpCircle size={20} style={{ color: "var(--accent-purple)" }} />
          How to Pomodoro?
        </h3>

        <ol className={styles.instructionsList}>
          <li>Select a study task to focus on.</li>
          <li>Set the timer to 25 minutes of high-intensity focus.</li>
          <li>Work with zero distractions until the alarm rings.</li>
          <li>Take a short 5-minute break to rest your mind.</li>
          <li>Every 4 focus cycles, take a longer 15-minute break.</li>
        </ol>
      </GlassCard>
    </div>
  );
}
