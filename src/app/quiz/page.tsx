"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Upload, 
  HelpCircle, 
  Check, 
  X, 
  Award, 
  Clock, 
  History, 
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import styles from "@/styles/quiz.module.css";

interface MCQ {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface QuizHistoryItem {
  id: string;
  title: string;
  score: number;
  total: number;
  createdAt: string;
}

interface Deck {
  id: string;
  name: string;
}

type TabType = "QUIZ_GEN" | "FLASH_GEN" | "HISTORY";
type PlayState = "SETUP" | "PLAYING" | "RESULT";

export default function QuizPage() {
  const [activeTab, setActiveTab] = useState<TabType>("QUIZ_GEN");
  const [playState, setPlayState] = useState<PlayState>("SETUP");

  // Input states
  const [notesText, setNotesText] = useState("");
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Flashcards generation specific states
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [newDeckName, setNewDeckName] = useState("");
  const [createMode, setCreateMode] = useState<"existing" | "new">("existing");

  // Quiz Play states
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);

  // History state
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDecks();
    fetchHistory();
  }, []);

  const fetchDecks = async () => {
    try {
      const res = await fetch("/api/decks");
      if (res.ok) {
        const data = await res.json();
        setDecks(data);
        if (data.length > 0) setSelectedDeckId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/quiz/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        alert("Only PDF files are supported.");
        return;
      }
      setPdfFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "") + " Quiz");
      }
    }
  };

  const parsePdfAndGetText = async (): Promise<string> => {
    if (!pdfFile) return "";
    setIsParsingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      const res = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse PDF");
      }

      const data = await res.json();
      
      // Reset file state and clear DOM input value to allow uploading the same file again
      setPdfFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      return data.text;
    } catch (err: any) {
      alert(err.message || "Error parsing PDF");
      // Clear file state and DOM input value on error as well
      setPdfFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return "";
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleGenerateQuiz = async () => {
    let finalNotes = notesText;

    if (pdfFile) {
      const parsedText = await parsePdfAndGetText();
      if (!parsedText) return;
      finalNotes = parsedText;
    }

    if (!finalNotes.trim() || finalNotes.trim().length < 50) {
      alert("Please provide study notes or upload a PDF containing study materials.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setQuestions(data.questions);
      setScore(0);
      setCurrentIdx(0);
      setHasAnswered(false);
      setSelectedOption(null);
      setPlayState("PLAYING");
    } catch (err: any) {
      alert(err.message || "Failed to generate quiz. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    let finalNotes = notesText;

    if (pdfFile) {
      const parsedText = await parsePdfAndGetText();
      if (!parsedText) return;
      finalNotes = parsedText;
    }

    if (!finalNotes.trim() || finalNotes.trim().length < 50) {
      alert("Please provide study notes or upload a PDF containing study materials.");
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        text: finalNotes,
        deckId: createMode === "existing" ? selectedDeckId : null,
        newDeckName: createMode === "new" ? newDeckName : null,
      };

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      alert("Flashcards generated successfully and added to your deck! 🧠");
      setNotesText("");
      setPdfFile(null);
      setNewDeckName("");
      fetchDecks();
    } catch (err: any) {
      alert(err.message || "Failed to generate flashcards.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionClick = (optionIdx: number) => {
    if (hasAnswered) return;
    setSelectedOption(optionIdx);
    setHasAnswered(true);

    const isCorrect = optionIdx === questions[currentIdx].answerIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    setSelectedOption(null);
    setHasAnswered(false);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Quiz finished
      setPlayState("RESULT");
      // Save result to DB
      try {
        await fetch("/api/quiz/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || "AI Study Quiz",
            score,
            total: questions.length,
          }),
        });
        fetchHistory();
        window.dispatchEvent(new Event("refresh-streak"));
      } catch (err) {
        console.error("Failed to save history:", err);
      }
    }
  };

  const resetQuizPlayer = () => {
    setQuestions([]);
    setPlayState("SETUP");
    setTitle("");
    setPdfFile(null);
  };

  return (
    <div className={styles.container}>
      {playState === "SETUP" && (
        <>
          {/* Header */}
          <div className={styles.header}>
            <h1 className="textGradient">AI Quiz & Card Maker</h1>
            <p>Paste notes or upload a PDF. Our AI generates quizzes and flashcards instantly.</p>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === "QUIZ_GEN" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("QUIZ_GEN")}
            >
              Quiz Generator
            </button>
            <button 
              className={`${styles.tab} ${activeTab === "FLASH_GEN" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("FLASH_GEN")}
            >
              Flashcard Maker
            </button>
            <button 
              className={`${styles.tab} ${activeTab === "HISTORY" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("HISTORY")}
            >
              Quiz History
            </button>
          </div>

          {/* Generator Interface */}
          {(activeTab === "QUIZ_GEN" || activeTab === "FLASH_GEN") && (
            <div className={styles.generatorLayout}>
              {/* Creator Card */}
              <GlassCard className={styles.creatorSection} hoverable={false}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={20} style={{ color: "var(--accent-purple)" }} />
                  {activeTab === "QUIZ_GEN" ? "Generate study quiz" : "Generate flashcard deck"}
                </h3>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Paste Study Notes</label>
                  <textarea
                    placeholder="Paste textbook definitions, lecture transcripts, summaries, or general notes here..."
                    className={styles.textArea}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    disabled={!!pdfFile}
                  />
                </div>

                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  — OR UPLOAD PDF —
                </div>

                <div className={styles.formGroup}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    accept=".pdf"
                  />
                  <div 
                    className={`${styles.uploadZone} ${pdfFile ? styles.uploadZoneActive : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={32} style={{ color: pdfFile ? "var(--accent-green)" : "var(--accent-purple)" }} />
                    <span className={styles.uploadTitle}>
                      {pdfFile ? pdfFile.name : "Choose PDF Study Notes"}
                    </span>
                    <span className={styles.uploadSub}>
                      {pdfFile ? "Click to change file" : "Standard text PDF up to 10MB"}
                    </span>
                  </div>
                </div>

                {activeTab === "QUIZ_GEN" ? (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Quiz Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Biology Chapter 4 Review"
                      style={{ background: "rgba(2,2,5,0.4)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "12px", borderRadius: "8px", fontFamily: "inherit", outline: "none" }}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                ) : (
                  /* Deck selection details */
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="deckMode"
                          checked={createMode === "existing"}
                          onChange={() => setCreateMode("existing")}
                        />
                        Add to existing deck
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="deckMode"
                          checked={createMode === "new"}
                          onChange={() => setCreateMode("new")}
                        />
                        Create new deck
                      </label>
                    </div>

                    {createMode === "existing" ? (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Select Deck</label>
                        <select
                          style={{ background: "rgba(2,2,5,0.4)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "12px", borderRadius: "8px", fontFamily: "inherit", outline: "none" }}
                          value={selectedDeckId}
                          onChange={(e) => setSelectedDeckId(e.target.value)}
                        >
                          {decks.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>New Deck Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Photosynthesis Core"
                          style={{ background: "rgba(2,2,5,0.4)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "12px", borderRadius: "8px", fontFamily: "inherit", outline: "none" }}
                          value={newDeckName}
                          onChange={(e) => setNewDeckName(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                <button 
                  className="btn-primary" 
                  style={{ width: "100%", justifyContent: "center", padding: "14px" }}
                  onClick={activeTab === "QUIZ_GEN" ? handleGenerateQuiz : handleGenerateFlashcards}
                  disabled={isParsingPdf || isGenerating}
                >
                  {(isParsingPdf || isGenerating) && <div className={styles.spinner} />}
                  {isParsingPdf ? "Extracting PDF text..." : 
                   isGenerating ? "AI is creating cards/questions..." : 
                   activeTab === "QUIZ_GEN" ? "Generate MCQ Quiz" : "Generate Flashcards"}
                </button>
              </GlassCard>

              {/* Instructions Sidebar */}
              <GlassCard style={{ padding: "24px" }} hoverable={false}>
                <h3 style={{ fontSize: "1.15rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <HelpCircle size={18} style={{ color: "var(--accent-blue)" }} />
                  Instructional Tips
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "18px", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  <li><strong>Format:</strong> You can paste general study summaries, formulas, or raw book passages. PDF files must have readable text.</li>
                  <li><strong>Quiz generation:</strong> Our system builds exactly 10 questions covering major concepts. Once completed, scores are permanently saved.</li>
                  <li><strong>Flashcards:</strong> Cards generated automatically go straight into your flashcard review stack.</li>
                </ul>
              </GlassCard>
            </div>
          )}

          {/* History view tab */}
          {activeTab === "HISTORY" && (
            <div className={styles.historyList}>
              {loadingHistory ? (
                <div className="shimmer" style={{ height: "100px", borderRadius: "12px" }} />
              ) : history.length === 0 ? (
                <GlassCard style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }} hoverable={false}>
                  No quiz history found. Complete a quiz to view statistics.
                </GlassCard>
              ) : (
                history.map((h) => (
                  <GlassCard key={h.id} className={styles.historyItem} hoverable={false}>
                    <div className={styles.historyDetails}>
                      <span className={styles.historyTitle}>{h.title}</span>
                      <span className={styles.historyDate}>
                        Taken on {new Date(h.createdAt).toLocaleDateString()} at {new Date(h.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={styles.historyScore} style={{ 
                      color: h.score >= 8 ? "var(--accent-green)" : 
                             h.score >= 5 ? "var(--accent-yellow)" : "var(--accent-red)"
                    }}>
                      {h.score} / {h.total}
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* 2. PLAYING STATE */}
      {playState === "PLAYING" && questions.length > 0 && (
        <GlassCard className={styles.quizCard} hoverable={false}>
          <div className={styles.quizProgress}>
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span>Current Score: {score}</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>

          <h3 className={styles.questionText}>{questions[currentIdx].question}</h3>

          <div className={styles.optionsList}>
            {questions[currentIdx].options.map((option, idx) => {
              const isCorrect = idx === questions[currentIdx].answerIndex;
              const isSelected = idx === selectedOption;
              
              let optionClass = "";
              if (hasAnswered) {
                if (isCorrect) optionClass = styles.optionCorrect;
                else if (isSelected) optionClass = styles.optionIncorrect;
              }

              return (
                <button
                  key={idx}
                  className={`${styles.optionButton} ${optionClass}`}
                  onClick={() => handleOptionClick(idx)}
                  disabled={hasAnswered}
                >
                  <span>{option}</span>
                  {hasAnswered && isCorrect && <Check size={16} />}
                  {hasAnswered && isSelected && !isCorrect && <X size={16} />}
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <div className={styles.explanationCard}>
              <div className={styles.explanationTitle}>Explanation</div>
              <p>{questions[currentIdx].explanation}</p>
            </div>
          )}

          {hasAnswered && (
            <button 
              className="btn-primary" 
              style={{ alignSelf: "flex-end", marginTop: "12px" }}
              onClick={handleNext}
            >
              {currentIdx + 1 < questions.length ? "Next Question" : "Finish Quiz"}
              <ArrowRight size={16} />
            </button>
          )}
        </GlassCard>
      )}

      {/* 3. RESULT STATE */}
      {playState === "RESULT" && (
        <GlassCard className={`${styles.quizCard} ${styles.scoreCard}`} hoverable={false}>
          <Award size={48} style={{ color: "var(--accent-yellow)" }} />
          <h2 className="textGradient">Quiz Completed!</h2>
          <p style={{ color: "var(--text-secondary)" }}>Excellent effort! You have reviewed this study material.</p>
          
          <div className={styles.scoreCircle}>
            <span className={styles.scoreVal}>{score} / {questions.length}</span>
            <span className={styles.scoreLabel}>Score</span>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button className="btn-secondary" onClick={resetQuizPlayer}>Exit Quiz</button>
            <button 
              className="btn-primary" 
              onClick={() => {
                setScore(0);
                setCurrentIdx(0);
                setHasAnswered(false);
                setSelectedOption(null);
                setPlayState("PLAYING");
              }}
            >
              Retry Quiz
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
