"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Layers,
  BookOpen,
  MessageSquare,
  BarChart2,
  Flame,
  Menu,
  X
} from "lucide-react";
import styles from "../styles/sidebar.module.css";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  // Fetch streak info on load
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const data = await res.json();
          setStreak(data.streak?.currentStreak || 0);
        }
      } catch (err) {
        console.error("Error fetching streak:", err);
      }
    };
    fetchStreak();
    
    // Add event listener to refresh streak when requested
    const handleRefresh = () => fetchStreak();
    window.addEventListener("refresh-streak", handleRefresh);
    return () => window.removeEventListener("refresh-streak", handleRefresh);
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "To-Do List", href: "/tasks", icon: CheckSquare },
    { name: "Pomodoro Timer", href: "/pomodoro", icon: Timer },
    { name: "Flashcards", href: "/flashcards", icon: Layers },
    { name: "AI Quiz Generator", href: "/quiz", icon: BookOpen },
    { name: "AI Study Chat", href: "/chat", icon: MessageSquare },
    { name: "Productivity", href: "/analytics", icon: BarChart2 },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      <button className={styles.mobileMenuToggle} onClick={toggleSidebar}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90, backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={closeSidebar}
        />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>M</div>
          <span className={`${styles.logoText} textGradient`}>MindForge AI</span>
        </div>

        <nav className={styles.navLinks}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={closeSidebar}
              >
                <Icon className={styles.icon} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/analytics" onClick={closeSidebar} className={styles.streakCard}>
            <div className={styles.streakIconContainer}>
              <Flame size={20} fill={streak > 0 ? "var(--accent-yellow)" : "none"} />
            </div>
            <div className={styles.streakInfo}>
              <span className={styles.streakValue}>{streak} Days</span>
              <span className={styles.streakLabel}>Study Streak</span>
            </div>
          </Link>

          <div className={styles.userProfile}>
            <div className={styles.avatar}>S</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Scholar</span>
              <span className={styles.userEmail}>scholar@mindforge.ai</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
