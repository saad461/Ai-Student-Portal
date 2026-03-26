import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const { moduleIndex, moduleName } = await req.json();

    const systemPrompt = `You are an expert software engineering mentor. Your goal is to generate a coding task for a student who is currently studying Module ${moduleIndex}: ${moduleName}.
The task should be practical, simple yet effective for learning, and solvable within a 1-hour focus session using HTML, CSS, and vanilla JavaScript.

You MUST respond in the following JSON format:
{
  "taskTitle": "Short descriptive title",
  "problemStatement": "Clearly explain what the student needs to build.",
  "instructions": ["Step 1...", "Step 2...", "Step 3..."],
  "pseudoCode": "A-Z pseudo-code explaining the logic to improve student's reasoning.",
  "hints": ["Hint 1", "Hint 2"]
}`;

    const prompt = `Generate a coding task for a student in Module ${moduleIndex}: ${moduleName}. Make it engaging and educational. Focus on the core concepts of this module.`;

    const task = await generateAIResponse(prompt, systemPrompt, 'json');
    return NextResponse.json(task);
  } catch (error) {
    console.error("Focus Task Error:", error);
    return NextResponse.json({
      taskTitle: "Quick Coding Challenge",
      problemStatement: "Create a simple interactive element related to your current module.",
      instructions: ["Plan your logic", "Write the HTML structure", "Style with CSS", "Add interactivity with JS"],
      pseudoCode: "1. Define variables\n2. Create event listeners\n3. Update the UI",
      hints: ["Check your console for errors", "Keep it simple and clean"]
    });
  }
}
