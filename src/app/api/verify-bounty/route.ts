import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const { code, task } = await req.json();

    const systemPrompt = "You are a code quality auditor. Your job is to verify if a code snippet satisfies a specific task requirement. Return a JSON object with 'isValid' (boolean) and 'feedback' (string).";
    const prompt = `
      Task Requirement: ${task}
      Student's Code:
      \`\`\`
      ${code}
      \`\`\`

      Does this code satisfy the requirement? Be strict but fair.
      Return JSON only.
    `;

    const evaluation = await generateAIResponse(prompt, systemPrompt, 'json');
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Bounty Verification Error:", error);
    return NextResponse.json({ isValid: false, feedback: "Unable to verify code at this moment." });
  }
}
