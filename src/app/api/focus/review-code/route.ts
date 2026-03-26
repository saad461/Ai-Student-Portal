import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const { html, css, js, taskTitle, problemStatement } = await req.json();

    const systemPrompt = `You are an expert code reviewer. You are reviewing a student's attempt at the task: ${taskTitle}.
The student is trying to solve: ${problemStatement}.

Review their code for correctness, efficiency, and adherence to best practices. Be encouraging but firm on logic.

You MUST respond in the following JSON format:
{
  "feedback": "Overall summary of their work",
  "lineByLine": [
    { "file": "HTML/CSS/JS", "line": 1, "issue": "Description of the issue or improvement", "suggestion": "Corrected code" }
  ],
  "score": 0-100,
  "isComplete": true/false
}`;

    const prompt = `Review this student's code:
HTML:
${html}

CSS:
${css}

JS:
${js}

Task: ${taskTitle}
Problem: ${problemStatement}`;

    const review = await generateAIResponse(prompt, systemPrompt, 'json');
    return NextResponse.json(review);
  } catch (error) {
    console.error("AI Review Error:", error);
    return NextResponse.json({
      feedback: "The AI reviewer is currently busy. Keep up the good work and try again shortly!",
      lineByLine: [],
      score: 0,
      isComplete: false
    });
  }
}
