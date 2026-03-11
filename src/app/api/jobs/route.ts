import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || 'Junior Frontend Developer';

    const systemPrompt = "You are a specialized job search assistant. Return only a JSON array.";
    const prompt = `
      Generate a JSON array of 5 realistic, professional job listings for ${query}.
      Include: id, title, company, location, type (Full-time, Remote, etc.), description, url, required_skills (array), and min_level (1-10).
      Only return the JSON array, no extra text.
    `;

    const jobs = await generateAIResponse(prompt, systemPrompt, 'json');
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Jobs API Error:", error);
    // Return mock data if all AI fails
    return NextResponse.json([
      {
        id: 'mock-1',
        title: 'Junior Frontend Developer',
        company: 'Vercel Inc.',
        location: 'Remote',
        type: 'Full-time',
        description: 'Building the future of web development with Next.js and React.',
        url: '#',
        required_skills: ['React', 'Next.js', 'Tailwind', 'TypeScript'],
        min_level: 5
      }
    ]);
  }
}
