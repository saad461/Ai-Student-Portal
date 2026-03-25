import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const {
      type,
      content,
      lectureTitle,
      language = 'roman-urdu',
      specificInput = ''
    } = await req.json();

    const systemPrompt = `You are an expert software engineering tutor in the Student Training Portal.
    You are helping a student understand a specific part of a lecture.
    ${language === 'roman-urdu' ? 'IMPORTANT: You MUST explain in Roman Urdu (Urdu written using English letters, e.g., "Yeh HTML ka tag hai").' : 'Explain in clear English.'}`;

    let prompt = "";

    if (type === 'paragraph-explain') {
      prompt = `
        Lecture Title: ${lectureTitle}
        Original Paragraph: "${content}"

        Please explain this paragraph clearly and concisely.
        Focus on making it easy to understand for a beginner student.
      `;
    } else if (type === 'summary') {
      prompt = `
        Lecture Title: ${lectureTitle}
        Content: ${content}

        Provide a short, high-level summary of the above content.
        Highlight the most important takeaways.
      `;
    } else if (type === 'key-terms') {
      prompt = `
        Lecture Title: ${lectureTitle}
        Content: ${content}

        Identify and explain the key technical terms used in this content.
        List them as a bulleted list.
      `;
    } else if (type === 'specific') {
      prompt = `
        Lecture Title: ${lectureTitle}
        Context: ${content}
        Student is confused about: "${specificInput}"

        Explain this specific word or line in the context of the lecture.
      `;
    }

    const answer = await generateAIResponse(prompt, systemPrompt);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("AI Explain Error:", error);
    return NextResponse.json({
      answer: "AI is currently busy. Please try again in a moment!"
    }, { status: 500 });
  }
}
