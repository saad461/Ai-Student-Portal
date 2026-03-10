import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { messages, currentModule } = await req.json();

    const systemPrompt = `
      You are an expert technical interviewer for a software engineering position.
      The student is currently learning ${currentModule}.
      Conduct a professional, encouraging, but rigorous mock interview.
      Ask one question at a time. Evaluate the student's previous response before asking the next question.
      Keep your responses professional and focused on the technical aspects of ${currentModule}.
    `;

    const chatHistory = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    if (process.env.GROQ_API_KEY) {
       const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
           "Content-Type": "application/json"
         },
         body: JSON.stringify({
           model: "llama-3.3-70b-versatile",
           messages: [
             { role: "system", content: systemPrompt },
             ...chatHistory
           ],
           temperature: 0.7,
           max_tokens: 1024
         })
       });
       const data = await res.json();
       if (data.choices && data.choices[0]) {
         return NextResponse.json({ answer: data.choices[0].message.content });
       }
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        answer: "I'm your AI Interviewer. (Note: API Key is missing, this is a simulated response). Tell me about your experience with " + currentModule
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      ]
    });
    const response = await result.response;
    return NextResponse.json({ answer: response.text() });
  } catch (error) {
    console.error("Interview Prep AI Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
