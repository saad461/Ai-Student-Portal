import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const { question, lectureTitle, lectureContent, history } = await req.json();

    const systemPrompt = "You are an expert software engineering tutor in the Student Training Portal. You are helping a student understand a specific lecture.";
    const prompt = `
      Lecture Title: ${lectureTitle}
      Lecture Content: ${lectureContent}

      Student Question: ${question}

      Conversation History:
      ${(history || []).map((h: { role: string; content: string }) => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.content}`).join('\n')}

      Provide a clear, encouraging, and technically accurate explanation.
      If the question is about code, provide high-quality code snippets using markdown.
      Keep the explanation concise and focused on the student's question within the context of the lecture.
    `;

    const answer = await generateAIResponse(prompt, systemPrompt);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json({
      answer: "AI Assistant is currently facing heavy load. Please try again in a moment!"
    });
  }
}
