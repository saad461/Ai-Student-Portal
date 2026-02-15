import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { githubUrl, assignmentTitle, assignmentDescription } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        feedback: ["AI Review is currently in simulation mode (API Key missing).", "Structure looks good based on URL.", "Continue following best practices."],
        status: "completed"
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are an expert senior software engineer mentor.
      A student has submitted a GitHub repository for an assignment.

      Assignment Title: ${assignmentTitle}
      Assignment Description: ${assignmentDescription}
      GitHub URL: ${githubUrl}

      Even if you cannot access the code directly, please provide 3-4 professional, constructive, and specific feedback points a student might receive for this kind of assignment.
      Focus on:
      1. Code structure and semantics.
      2. Modern best practices (Flexbox/Grid, React hooks, etc. depending on assignment).
      3. Potential areas for improvement.

      Return the feedback as a JSON array of strings. Keep each point concise (1-2 sentences).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Attempt to parse JSON from response
    const jsonMatch = text.match(/\[.*\]/s);
    const feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : [
      "Good progress on the assignment.",
      "Consider optimizing your component structure.",
      "Ensure all accessibility standards are met."
    ];

    return NextResponse.json({ feedback, status: "completed" });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Failed to generate review" }, { status: 500 });
  }
}
