import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const { messages, currentModule, isFinal } = await req.json();

    const systemPrompt = isFinal
      ? `You are a technical interview evaluator. Based on the conversation history, provide a detailed score (0-100) and constructive feedback on the student's performance regarding ${currentModule}.`
      : `
      You are an expert technical interviewer for a software engineering position.
      The student is currently learning ${currentModule}.
      Conduct a professional, encouraging, but rigorous mock interview.
      Ask one question at a time. Evaluate the student's previous response before asking the next question.
      Keep your responses professional and focused on the technical aspects of ${currentModule}.
    `;

    const prompt = isFinal
      ? `Evaluate the following interview session for ${currentModule}:\n\n${(messages || []).map((m: any) => `${m.role === 'assistant' ? 'Interviewer' : 'Student'}: ${m.content}`).join('\n')}`
      : `
      Current Module: ${currentModule}

      Conversation History:
      ${(messages || []).map((m: any) => `${m.role === 'assistant' ? 'Interviewer' : 'Student'}: ${m.content}`).join('\n')}

      Provide the next question or response as the Interviewer.
    `;

    const answer = await generateAIResponse(prompt, systemPrompt);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Interview Prep AI Error:", error);
    return NextResponse.json({
      answer: "I'm having a bit of trouble connecting to the interview server. Let's try that again."
    });
  }
}
