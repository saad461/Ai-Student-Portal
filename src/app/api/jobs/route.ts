import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || 'Junior Frontend Developer';

    const systemPrompt = `
      You are a specialized job search assistant.
      Generate a JSON array of 5 realistic, professional job listings for ${query}.
      Include: id, title, company, location, type (Full-time, Remote, etc.), description, url, required_skills (array), and min_level (1-10).
      Only return the JSON array, no extra text.
    `;

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
             { role: "system", content: "You are a job search API. Return only JSON." },
             { role: "user", content: systemPrompt }
           ],
           temperature: 0.1,
           response_format: { type: "json_object" }
         })
       });
       const data = await res.json();
       let content = data.choices[0].message.content;
       // Sometimes it wraps in a 'jobs' object
       let parsed = JSON.parse(content);
       if (parsed.jobs) parsed = parsed.jobs;
       return NextResponse.json(parsed);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();
    // Clean markdown code blocks if any
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("Jobs API Error:", error);
    // Return mock data if AI fails
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
