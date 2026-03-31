import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function fetchGitHubFiles(githubUrl: string) {
  try {
    const url = new URL(githubUrl);
    if (url.hostname !== 'github.com') return null;

    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const [owner, repo] = parts;
    const branches = ['main', 'master'];
    const filesToTry = ['index.html', 'style.css', 'script.js', 'App.tsx', 'App.jsx', 'README.md'];

    let branch = 'main';
    const contents: Record<string, string> = {};

    // First, try to find the correct branch
    for (const b of branches) {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${b}/README.md`);
      if (res.ok) {
        branch = b;
        break;
      }
    }

    // Fetch files
    for (const file of filesToTry) {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`);
      if (res.ok) {
        contents[file] = await res.text();
      }
    }

    return Object.keys(contents).length > 0 ? contents : null;
  } catch (error) {
    console.error("Error fetching GitHub files:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const {
      githubUrl,
      assignmentTitle,
      assignmentDescription,
      knowledgeChecks, // Array of { question, answer }
      lectureTitle
    } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        feedback: "AI Review is currently in simulation mode (API Key missing).",
        score: 85,
        status: "passed",
        sections: {
          knowledge_check: { score: 90, feedback: "Great understanding of the concepts." },
          assignment: { score: 80, feedback: "Code structure is good, but could be optimized." }
        },
        mistakes: ["Minor syntax inconsistencies", "Lack of comments in complex logic"],
        improvements: ["Use more semantic HTML tags", "Refactor repeated code into functions"]
      });
    }

    const githubContent = githubUrl ? await fetchGitHubFiles(githubUrl) : null;
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are an expert senior software engineer mentor.
      A student has completed a lecture and submitted their work for review.

      Lecture: ${lectureTitle}

      SECTION 1: KNOWLEDGE CHECK
      Questions and Student's Answers:
      ${knowledgeChecks?.map((kc: { question: string; answer: string }, i: number) => `Q${i+1}: ${kc.question}\nA${i+1}: ${kc.answer}`).join('\n\n')}

      SECTION 2: ASSIGNMENT
      Title: ${assignmentTitle}
      Description: ${assignmentDescription}
      GitHub URL: ${githubUrl || 'Not provided'}
      ${githubContent ? `
      Code Samples from Repository:
      ${Object.entries(githubContent).map(([file, content]) => `--- ${file} ---\n${content.substring(0, 2000)}`).join('\n\n')}
      ` : 'No direct code access available.'}

      TASK:
      1. Review the Knowledge Check answers for accuracy and depth.
      2. Review the Assignment (if provided) for code quality, best practices, and requirements fulfillment.
      3. Provide a score out of 100 for each section.
      4. Provide an overall score out of 100.
      5. Highlight specific mistakes and provide actionable improvements.

      REQUIRED JSON RESPONSE FORMAT:
      {
        "score": number (total 0-100),
        "status": "passed" | "failed",
        "feedback": "Overall summary feedback string",
        "sections": {
          "knowledge_check": { "score": number, "feedback": "string" },
          "assignment": { "score": number, "feedback": "string" }
        },
        "mistakes": ["string", "string"],
        "improvements": ["string", "string"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse AI response");

    const evaluation = JSON.parse(jsonMatch[0]);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Failed to generate review" }, { status: 500 });
  }
}
