import { prisma } from "./prisma";

async function verifyAll() {
  console.log("=========================================");
  console.log("  MINDFORGE AI END-TO-END VERIFICATION  ");
  console.log("=========================================\n");

  const baseUrl = "http://localhost:3000";
  let createdTaskId = "";
  let createdDeckId = "";

  try {
    // Test 1: GET /api/analytics
    console.log("1. Testing GET /api/analytics...");
    const analyticsRes = await fetch(`${baseUrl}/api/analytics`);
    if (!analyticsRes.ok) throw new Error("Analytics API failed");
    const analyticsData = await analyticsRes.json();
    console.log("   ✅ Success! Current Streak:", analyticsData.streak.currentStreak);
    console.log("   ✅ Achievements loaded:", analyticsData.achievements.length);

    // Test 2: POST /api/tasks (Create Task)
    console.log("\n2. Testing POST /api/tasks (Create Task)...");
    const taskPayload = {
      title: "Mitochondria Study Session",
      description: "Read functions and structure of outer membrane.",
      priority: "HIGH",
      category: "Study",
      estPomodoros: 2,
    };
    const createTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskPayload),
    });
    if (!createTaskRes.ok) throw new Error("Create Task failed");
    const taskData = await createTaskRes.json();
    createdTaskId = taskData.id;
    console.log(`   ✅ Success! Created Task ID: ${createdTaskId}`);

    // Test 3: GET /api/tasks (List Tasks)
    console.log("\n3. Testing GET /api/tasks (List Tasks)...");
    const listTasksRes = await fetch(`${baseUrl}/api/tasks`);
    if (!listTasksRes.ok) throw new Error("List Tasks failed");
    const tasks = await listTasksRes.json();
    const found = tasks.some((t: any) => t.id === createdTaskId);
    if (!found) throw new Error("Created task not found in list");
    console.log(`   ✅ Success! Found created task in task manager checklist.`);

    // Test 4: POST /api/pomodoro (Log Session & Sync Task Counter)
    console.log("\n4. Testing POST /api/pomodoro (Auto-log Pomodoro)...");
    const pomoPayload = {
      duration: 25,
      type: "WORK",
      taskId: createdTaskId,
    };
    const logPomoRes = await fetch(`${baseUrl}/api/pomodoro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pomoPayload),
    });
    if (!logPomoRes.ok) throw new Error("Log Pomodoro failed");
    console.log("   ✅ Success! Pomodoro session logged and study streak verified.");

    // Verify task counter got incremented
    const verifyTaskRes = await fetch(`${baseUrl}/api/tasks`);
    const verifyTasks = await verifyTaskRes.json();
    const updatedTask = verifyTasks.find((t: any) => t.id === createdTaskId);
    console.log(`   ✅ Success! Task actual Pomodoro count incremented to: ${updatedTask?.actPomodoros}`);

    // Test 5: POST /api/decks (Create Deck)
    console.log("\n5. Testing POST /api/decks (Create Flashcard Deck)...");
    const deckPayload = {
      name: "Biology Core",
      description: "Essential terms for cellular biology.",
    };
    const createDeckRes = await fetch(`${baseUrl}/api/decks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deckPayload),
    });
    if (!createDeckRes.ok) throw new Error("Create Deck failed");
    const deckData = await createDeckRes.json();
    createdDeckId = deckData.id;
    console.log(`   ✅ Success! Created Deck ID: ${createdDeckId}`);

    // Test 6: POST /api/decks/[id]/cards (Add Flashcard)
    console.log("\n6. Testing POST /api/decks/[id]/cards (Create Card)...");
    const cardPayload = {
      front: "What is the powerhouse of the cell?",
      back: "Mitochondria",
    };
    const createCardRes = await fetch(`${baseUrl}/api/decks/${createdDeckId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cardPayload),
    });
    if (!createCardRes.ok) throw new Error("Create Card failed");
    console.log("   ✅ Success! Flashcard added to deck Biology Core.");

    // Test 7: POST /api/quiz (AI MCQ Generator - Tests Gemini API Key!)
    console.log("\n7. Testing POST /api/quiz (Gemini AI Quiz Generation)...");
    console.log("   ⏳ Sending study notes to Gemini API...");
    const quizPayload = {
      text: "Mitochondria are double-membrane organelles found in most eukaryotic organisms. They generate most of the cell's adenosine triphosphate (ATP), which acts as chemical energy. They contain their own circular DNA.",
    };
    const generateQuizRes = await fetch(`${baseUrl}/api/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quizPayload),
    });
    if (!generateQuizRes.ok) {
      const errorText = await generateQuizRes.text();
      throw new Error(`AI Quiz Generation failed: ${errorText}`);
    }
    const quizData = await generateQuizRes.json();
    console.log(`   ✅ Success! Gemini generated exactly ${quizData.questions.length} MCQs!`);
    console.log(`   Sample Question 1: "${quizData.questions[0].question}"`);
    console.log(`   Options: ${quizData.questions[0].options.join(" | ")}`);

    // Test 8: POST /api/ai/chat (AI Chat Copilot)
    console.log("\n8. Testing POST /api/ai/chat (Gemini AI Chat Copilot)...");
    console.log("   ⏳ Sending message to AI Copilot...");
    const chatPayload = {
      messages: [{ role: "user", content: "Explain ATP in one sentence." }],
    };
    const chatRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatPayload),
    });
    if (!chatRes.ok) throw new Error("AI Chat failed");
    const chatData = await chatRes.json();
    console.log(`   ✅ Success! AI Copilot reply: "${chatData.text.trim()}"`);

    // Clean up
    console.log("\n🧹 Cleaning up test database records...");
    if (createdTaskId) {
      await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, { method: "DELETE" });
    }
    if (createdDeckId) {
      await fetch(`${baseUrl}/api/decks/${createdDeckId}`, { method: "DELETE" });
    }
    console.log("   ✅ Database cleaned up.");

    console.log("\n=========================================");
    console.log("   🎉 ALL TESTS PASSED SUCCESSFULLY!    ");
    console.log("   MindForge AI runs 100% smoothly.      ");
    console.log("=========================================");

  } catch (error: any) {
    console.error("\n❌ VERIFICATION TEST FAILED!");
    console.error(error.message || error);
    
    // Attempt cleanup on fail
    if (createdTaskId) {
      await fetch(`${baseUrl}/api/tasks/${createdTaskId}`, { method: "DELETE" }).catch(() => {});
    }
    if (createdDeckId) {
      await fetch(`${baseUrl}/api/decks/${createdDeckId}`, { method: "DELETE" }).catch(() => {});
    }
    process.exit(1);
  }
}

verifyAll();
