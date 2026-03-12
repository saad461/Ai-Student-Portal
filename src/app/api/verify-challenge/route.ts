import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const { code, title, description, testCases } = await req.json();

    const systemPrompt = "You are an automated code judge. Evaluate the student's solution against the provided challenge description and test cases. Return a JSON object with 'isCorrect' (boolean) and 'feedback' (string).";
    const prompt = `
      Challenge: ${title}
      Description: ${description}
      Test Cases: ${JSON.stringify(testCases)}

      Student's Code:
      \`\`\`javascript
      ${code}
      \`\`\`

      Does this code correctly solve the challenge and pass the logic required?
      Return JSON only.
    `;

    const evaluation = await generateAIResponse(prompt, systemPrompt, 'json');
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Challenge Validation Error:", error);
    return NextResponse.json({ isCorrect: false, feedback: "Unable to evaluate code at this moment." });
  }
}
