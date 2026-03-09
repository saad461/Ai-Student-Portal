import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { question, lectureTitle, lectureContent, history } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        answer: "AI Assistant is in simulation mode (API Key missing). Please check back later!"
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are an expert software engineering tutor in the Student Training Portal.
      You are helping a student understand a specific lecture.

      Lecture Title: ${lectureTitle}
      Lecture Content: ${lectureContent}

      Student Question: ${question}

      Conversation History:
      ${(history || []).map((h: any) => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.content}`).join('\n')}

      Provide a clear, encouraging, and technically accurate explanation.
      If the question is about code, provide high-quality code snippets using markdown.
      Keep the explanation concise and focused on the student's question within the context of the lecture.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return NextResponse.json({ answer: response.text() });
  } catch (error) {
    console.error("Gemini Assistant Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
