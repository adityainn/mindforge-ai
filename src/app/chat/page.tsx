"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Calendar, 
  BookOpen, 
  User, 
  Cpu,
  RefreshCw
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import styles from "@/styles/chat.module.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Planner states
  const [studyPlan, setStudyPlan] = useState("");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load plan and messages from LocalStorage if they exist
  useEffect(() => {
    const savedPlan = localStorage.getItem("mindforge_study_plan");
    if (savedPlan) setStudyPlan(savedPlan);

    const savedMessages = localStorage.getItem("mindforge_chat_messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! I am MindForge Copilot. I'm connected to your study planner and can help explain topics, generate study schedules, or brainstorm ideas. What are we studying today?"
        }
      ]);
    }
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessages = (updatedMessages: ChatMessage[]) => {
    localStorage.setItem("mindforge_chat_messages", JSON.stringify(updatedMessages));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveMessages(newMessages);
    setInputText("");
    setIsSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.text,
        };
        const updated = [...newMessages, assistantMessage];
        setMessages(updated);
        saveMessages(updated);
      } else {
        throw new Error("Chat failed");
      }
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error communicating with the AI. Please verify your internet connection or API Key.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatePlan: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setStudyPlan(data.text);
        localStorage.setItem("mindforge_study_plan", data.text);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleClearChat = () => {
    if (!confirm("Are you sure you want to clear your chat history?")) return;
    const welcome: ChatMessage[] = [
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I am MindForge Copilot. I'm connected to your study planner and can help explain topics, generate study schedules, or brainstorm ideas. What are we studying today?"
      }
    ];
    setMessages(welcome);
    localStorage.removeItem("mindforge_chat_messages");
  };

  // Convert simple markdown inside plan response to paragraphs
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      let trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return <h3 key={idx}>{trimmed.replace("###", "")}</h3>;
      }
      if (trimmed.startsWith("##")) {
        return <h2 key={idx}>{trimmed.replace("##", "")}</h2>;
      }
      if (trimmed.startsWith("#")) {
        return <h1 key={idx}>{trimmed.replace("#", "")}</h1>;
      }
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        // Parse bold inside list item
        return (
          <li key={idx}>
            {line.replace(/^[-\*\s]+/, "").split("**").map((chunk, cIdx) => 
              cIdx % 2 === 1 ? <strong key={cIdx}>{chunk}</strong> : chunk
            )}
          </li>
        );
      }
      // Bold text lines
      if (line.includes("**")) {
        return (
          <p key={idx}>
            {line.split("**").map((chunk, cIdx) => 
              cIdx % 2 === 1 ? <strong key={cIdx}>{chunk}</strong> : chunk
            )}
          </p>
        );
      }
      return line ? <p key={idx}>{line}</p> : <div key={idx} style={{ height: "8px" }} />;
    });
  };

  return (
    <div className={styles.chatLayout}>
      {/* 1. Chat Assistant Window */}
      <GlassCard className={styles.chatWindow} hoverable={false}>
        <div className={styles.chatHeader}>
          <div className={styles.chatTitle}>
            <Cpu size={20} style={{ color: "var(--accent-purple)" }} />
            <span>AI Study Copilot</span>
          </div>
          <button 
            className="btn-secondary" 
            style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "8px" }}
            onClick={handleClearChat}
          >
            Clear History
          </button>
        </div>

        {/* Scrollable messages area */}
        <div className={styles.messagesContainer}>
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`${styles.messageBubble} ${
                msg.role === "user" ? styles.messageUser : styles.messageAssistant
              }`}
            >
              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px", fontSize: "0.75rem", opacity: 0.7 }}>
                {msg.role === "user" ? <User size={12} /> : <Cpu size={12} />}
                <span>{msg.role === "user" ? "You" : "MindForge AI"}</span>
              </div>
              <div style={{ whiteSpace: "pre-line" }}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <form onSubmit={handleSendMessage} className={styles.inputBar}>
          <input
            type="text"
            placeholder="Ask a question or explain a concept..."
            className={styles.chatInput}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
          />
          <button type="submit" className="btn-primary" disabled={isSending}>
            {isSending ? <div className={styles.spinner} /> : <Send size={18} />}
          </button>
        </form>
      </GlassCard>

      {/* 2. AI Study Planner Panel */}
      <GlassCard className={styles.plannerPanel} hoverable={false}>
        <div className={styles.plannerHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={20} style={{ color: "var(--accent-blue)" }} />
            <h3 style={{ fontSize: "1.15rem" }}>AI Study Planner</h3>
          </div>
          <button 
            className="btn-primary" 
            style={{ padding: "8px 14px", fontSize: "0.85rem", borderRadius: "8px" }}
            onClick={handleGenerateStudyPlan}
            disabled={isGeneratingPlan}
          >
            {isGeneratingPlan ? <div className={styles.spinner} /> : <RefreshCw size={14} />}
            {isGeneratingPlan ? "Planning..." : "Plan Day"}
          </button>
        </div>

        <div className={styles.planContent}>
          {studyPlan ? (
            renderMarkdown(studyPlan)
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "48px 0" }}>
              <Calendar size={32} style={{ color: "var(--text-muted)", marginBottom: "12px", opacity: 0.5 }} />
              <p>No study plan generated yet.</p>
              <p style={{ fontSize: "0.8rem", marginTop: "4px" }}>Click "Plan Day" to build an AI-guided hourly schedule based on your checklist!</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
