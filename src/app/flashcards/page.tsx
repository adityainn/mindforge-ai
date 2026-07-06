"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  BookOpen, 
  Award, 
  Check, 
  HelpCircle,
  AlertCircle,
  Edit2
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import styles from "@/styles/flashcards.module.css";

interface Deck {
  id: string;
  name: string;
  description: string | null;
  cardCount: number;
  dueCount: number;
}

interface Card {
  id: string;
  front: string;
  back: string;
  nextReview: string;
}

type ViewState = "LIST" | "DECK_DETAILS" | "STUDY";

export default function FlashcardsPage() {
  const [view, setView] = useState<ViewState>("LIST");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  
  // Deck Form states
  const [deckName, setDeckName] = useState("");
  const [deckDesc, setDeckDesc] = useState("");
  const [showDeckForm, setShowDeckForm] = useState(false);

  // Card list and editor states
  const [cards, setCards] = useState<Card[]>([]);
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);

  // Study states
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCompleted, setStudyCompleted] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/decks");
      if (res.ok) {
        const data = await res.json();
        setDecks(data);
      }
    } catch (err) {
      console.error("Error fetching decks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCards = async (deckId: string) => {
    try {
      const res = await fetch(`/api/decks/${deckId}/cards`);
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch (err) {
      console.error("Error fetching cards:", err);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName.trim()) return;

    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deckName, description: deckDesc }),
      });
      if (res.ok) {
        setDeckName("");
        setDeckDesc("");
        setShowDeckForm(false);
        fetchDecks();
      }
    } catch (err) {
      console.error("Error creating deck:", err);
    }
  };

  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this deck and all its flashcards?")) return;
    try {
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDecks();
        if (selectedDeck?.id === deckId) setView("LIST");
      }
    } catch (err) {
      console.error("Error deleting deck:", err);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeck || !cardFront.trim() || !cardBack.trim()) return;

    const payload = { front: cardFront, back: cardBack };

    try {
      let res;
      if (editingCardId) {
        res = await fetch(`/api/decks/${selectedDeck.id}/cards/${editingCardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/decks/${selectedDeck.id}/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setCardFront("");
        setCardBack("");
        setEditingCardId(null);
        setShowCardForm(false);
        fetchCards(selectedDeck.id);
        fetchDecks(); // refresh count
      }
    } catch (err) {
      console.error("Error saving card:", err);
    }
  };

  const handleEditCard = (card: Card) => {
    setEditingCardId(card.id);
    setCardFront(card.front);
    setCardBack(card.back);
    setShowCardForm(true);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!selectedDeck || !confirm("Are you sure you want to delete this card?")) return;
    try {
      const res = await fetch(`/api/decks/${selectedDeck.id}/cards/${cardId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCards(selectedDeck.id);
        fetchDecks();
      }
    } catch (err) {
      console.error("Error deleting card:", err);
    }
  };

  const startStudy = async (deck: Deck) => {
    setSelectedDeck(deck);
    try {
      // Fetch only cards that are due for review (nextReview <= now)
      const res = await fetch(`/api/decks/${deck.id}/cards?due=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          alert("All caught up! No cards due for review in this deck today. 🎉");
          return;
        }
        setStudyCards(data);
        setStudyIndex(0);
        setIsFlipped(false);
        setStudyCompleted(false);
        setReviewsCount(0);
        setView("STUDY");
      }
    } catch (err) {
      console.error("Error fetching study cards:", err);
    }
  };

  const handleGrade = async (grade: number) => {
    if (!selectedDeck || studyCards.length === 0) return;
    const currentCard = studyCards[studyIndex];

    try {
      const res = await fetch(`/api/decks/${selectedDeck.id}/cards/${currentCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade }),
      });

      if (res.ok) {
        setReviewsCount((prev) => prev + 1);
        setIsFlipped(false);

        // Move to next card
        setTimeout(() => {
          if (studyIndex + 1 < studyCards.length) {
            setStudyIndex((prev) => prev + 1);
          } else {
            setStudyCompleted(true);
            fetchDecks(); // refresh due counts
            window.dispatchEvent(new Event("refresh-streak"));
          }
        }, 150);
      }
    } catch (err) {
      console.error("Error grading review:", err);
    }
  };

  const navigateToDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    fetchCards(deck.id);
    setView("DECK_DETAILS");
  };

  const handleCardFormCancel = () => {
    setEditingCardId(null);
    setCardFront("");
    setCardBack("");
    setShowCardForm(false);
  };

  return (
    <div className={styles.container}>
      {/* 1. LIST VIEW */}
      {view === "LIST" && (
        <>
          <div className={styles.header}>
            <div>
              <h1 className="textGradient">Flashcard Decks</h1>
              <p>Reinforce your memory using smart spaced repetition scheduling.</p>
            </div>
            <button 
              className="btn-primary"
              onClick={() => setShowDeckForm(!showDeckForm)}
            >
              <Plus size={18} />
              New Deck
            </button>
          </div>

          {showDeckForm && (
            <GlassCard style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }} hoverable={false}>
              <h3>Create New Deck</h3>
              <form onSubmit={handleCreateDeck} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Deck Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Organic Chemistry, Midterm History"
                    style={{ background: "rgba(2,2,5,0.4)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px", borderRadius: "8px", fontFamily: "inherit", outline: "none" }}
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Description</label>
                  <input
                    type="text"
                    placeholder="Brief description of deck topics..."
                    style={{ background: "rgba(2,2,5,0.4)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px", borderRadius: "8px", fontFamily: "inherit", outline: "none" }}
                    value={deckDesc}
                    onChange={(e) => setDeckDesc(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowDeckForm(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Create Deck</button>
                </div>
              </form>
            </GlassCard>
          )}

          {loading ? (
            <div className="shimmer" style={{ height: "180px", borderRadius: "16px" }} />
          ) : decks.length === 0 ? (
            <GlassCard style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }} hoverable={false}>
              No flashcard decks yet. Create one or generate cards using AI notes! 🧠
            </GlassCard>
          ) : (
            <div className={styles.decksGrid}>
              {decks.map((deck) => (
                <GlassCard 
                  key={deck.id} 
                  className={styles.deckCard}
                  onClick={() => navigateToDeck(deck)}
                >
                  <div>
                    <h3 className={styles.deckTitle}>{deck.name}</h3>
                    <p className={styles.deckDesc}>{deck.description || "No description provided."}</p>
                  </div>
                  
                  <div className={styles.deckFooter}>
                    <div className={styles.cardCounts}>
                      <span>
                        <span className={styles.countLabel}>Cards: </span>
                        <span className={styles.countVal}>{deck.cardCount}</span>
                      </span>
                      {deck.dueCount > 0 && (
                        <span className={`${styles.dueBadge} ${styles.dueBadgeAlert}`}>
                          {deck.dueCount} Due
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {deck.dueCount > 0 && (
                        <button 
                          className="btn-primary" 
                          style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "8px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            startStudy(deck);
                          }}
                        >
                          Review
                        </button>
                      )}
                      <button 
                        className="btn-secondary" 
                        style={{ padding: "6px", borderRadius: "8px" }}
                        onClick={(e) => handleDeleteDeck(deck.id, e)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* 2. DECK DETAILS & CARD EDITOR */}
      {view === "DECK_DETAILS" && selectedDeck && (
        <>
          <div className={styles.header}>
            <button className="btn-secondary" onClick={() => setView("LIST")}>
              <ChevronLeft size={16} /> Decks
            </button>
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn-primary" onClick={() => startStudy(selectedDeck)}>
                <BookOpen size={16} /> Study Due Cards ({selectedDeck.dueCount})
              </button>
              <button className="btn-secondary" onClick={() => setShowCardForm(true)}>
                <Plus size={16} /> Add Card
              </button>
            </div>
          </div>

          <GlassCard style={{ padding: "24px" }} hoverable={false}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{selectedDeck.name}</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>{selectedDeck.description}</p>

            {/* Add/Edit Card Inline Form */}
            {showCardForm && (
              <GlassCard style={{ padding: "20px", marginBottom: "24px", border: "1px solid var(--border-purple)" }} hoverable={false}>
                <h4>{editingCardId ? "Edit Flashcard" : "Add Flashcard"}</h4>
                <form onSubmit={handleCreateCard} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Front Face (Question/Term) *</label>
                    <textarea
                      placeholder="Enter front card text..."
                      style={{ background: "rgba(2,2,5,0.4)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px", borderRadius: "8px", fontFamily: "inherit", outline: "none" }}
                      rows={2}
                      value={cardFront}
                      onChange={(e) => setCardFront(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Back Face (Answer/Definition) *</label>
                    <textarea
                      placeholder="Enter back card text..."
                      style={{ background: "rgba(2,2,5,0.4)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px", borderRadius: "8px", fontFamily: "inherit", outline: "none" }}
                      rows={2}
                      value={cardBack}
                      onChange={(e) => setCardBack(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <button type="button" className="btn-secondary" onClick={handleCardFormCancel}>Cancel</button>
                    <button type="submit" className="btn-primary">{editingCardId ? "Save" : "Add Card"}</button>
                  </div>
                </form>
              </GlassCard>
            )}

            {/* Cards List Table */}
            <h3 style={{ fontSize: "1.2rem", marginTop: "24px" }}>Cards in Deck</h3>
            {cards.length === 0 ? (
              <p style={{ color: "var(--text-muted)", margin: "20px 0", textAlign: "center" }}>
                This deck is empty. Click "Add Card" to add flashcards manually.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className={styles.cardListTable}>
                  <thead>
                    <tr>
                      <th>Front</th>
                      <th>Back</th>
                      <th>Next Review</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((card) => (
                      <tr key={card.id}>
                        <td style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.front}</td>
                        <td style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.back}</td>
                        <td>{new Date(card.nextReview).toLocaleDateString()}</td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: "6px", borderRadius: "6px", marginRight: "8px" }}
                            onClick={() => handleEditCard(card)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: "6px", borderRadius: "6px", color: "var(--accent-red)" }}
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </>
      )}

      {/* 3. STUDY VIEW */}
      {view === "STUDY" && selectedDeck && (
        <div className={styles.studyPanel}>
          <div className={styles.studyHeader}>
            <button className="btn-secondary" onClick={() => setView("DECK_DETAILS")}>
              <ChevronLeft size={16} /> Exit Study
            </button>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              {studyCompleted ? "Completed" : `Card ${studyIndex + 1} of ${studyCards.length}`}
            </span>
          </div>

          {!studyCompleted ? (
            <>
              {/* Interactive 3D Card Flipping */}
              <div className={styles.flipCard} onClick={() => setIsFlipped(!isFlipped)}>
                <div className={`${styles.flipCardInner} ${isFlipped ? styles.flipped : ""}`}>
                  {/* Front Face */}
                  <div className={styles.flipCardFront}>
                    <span className={styles.cardSideLabel}>Front (Question)</span>
                    <div className={styles.cardText}>{studyCards[studyIndex]?.front}</div>
                    <span className={styles.flipHint}>Click card to flip and reveal answer</span>
                  </div>

                  {/* Back Face */}
                  <div className={styles.flipCardBack}>
                    <span className={styles.cardSideLabel}>Back (Answer)</span>
                    <div className={styles.cardText}>{studyCards[studyIndex]?.back}</div>
                    <span className={styles.flipHint}>Rate how well you recalled this</span>
                  </div>
                </div>
              </div>

              {/* SM-2 Recall Grade Buttons */}
              {isFlipped && (
                <GlassCard className={styles.gradingContainer} hoverable={false}>
                  <p className={styles.gradingLabel}>How well did you recall this answer?</p>
                  <div className={styles.gradeButtonsGrid}>
                    {[
                      { num: 0, label: "Forgot", desc: "Complete blackout" },
                      { num: 1, label: "Wrong", desc: "Familiar after seeing" },
                      { num: 2, label: "Almost", desc: "Recalled with hint" },
                      { num: 3, label: "Hard", desc: "Recalled with struggle" },
                      { num: 4, label: "Good", desc: "Correct with hesitation" },
                      { num: 5, label: "Easy", desc: "Perfect recall" }
                    ].map((g) => (
                      <button
                        key={g.num}
                        className={`${styles.gradeBtn} ${styles["gradeBtn" + g.num]}`}
                        onClick={() => handleGrade(g.num)}
                      >
                        <span className={styles.gradeNum}>{g.num}</span>
                        <span className={styles.gradeLabel}>{g.label}</span>
                      </button>
                    ))}
                  </div>
                </GlassCard>
              )}
            </>
          ) : (
            // Study Session completed screen
            <GlassCard style={{ padding: "40px", textAlign: "center", width: "100%" }} hoverable={false}>
              <Award size={48} style={{ color: "var(--accent-yellow)", marginBottom: "16px" }} />
              <h2 className="textGradient" style={{ marginBottom: "12px" }}>Review Session Complete!</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                You have successfully reviewed {reviewsCount} flashcards in this deck. Your memory is strengthened!
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                <button className="btn-secondary" onClick={() => setView("LIST")}>
                  Decks List
                </button>
                <button className="btn-primary" onClick={() => navigateToDeck(selectedDeck)}>
                  Manage Deck
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
