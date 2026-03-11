import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateAIResponse(prompt: string, systemPrompt: string = "You are a professional assistant.", responseFormat: 'text' | 'json' = 'text') {
  const providers = [
    { name: 'groq', key: process.env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
    { name: 'mistral', key: process.env.MISTRAL_API_KEY, url: 'https://api.mistral.ai/v1/chat/completions', model: 'mistral-large-latest' },
    { name: 'openrouter', key: process.env.OPENROUTER_API_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', model: 'google/gemini-2.0-flash-001' },
    { name: 'gemini', key: process.env.GEMINI_API_KEY }
  ];

  for (const provider of providers) {
    if (!provider.key) continue;

    try {
      console.log(`Attempting AI generation with ${provider.name}...`);

      if (provider.name === 'gemini') {
        const genAI = new GoogleGenerativeAI(provider.key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(systemPrompt + "\n\n" + prompt);
        const text = result.response.text();
        return responseFormat === 'json' ? JSON.parse(text.replace(/```json|```/g, '').trim()) : text;
      }

      const res = await fetch(provider.url!, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${provider.key}`,
          "Content-Type": "application/json",
          ...(provider.name === 'openrouter' ? { "HTTP-Referer": "http://localhost:3000", "X-Title": "Student Portal" } : {})
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: responseFormat === 'json' ? 0.1 : 0.7,
          ...(responseFormat === 'json' && provider.name !== 'mistral' ? { response_format: { type: "json_object" } } : {})
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error(`${provider.name} error:`, errorData);
        throw new Error(`${provider.name} failed with status ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices[0].message.content;

      if (responseFormat === 'json') {
        let parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
        // Standardize common AI wrapping
        if (parsed.jobs && Array.isArray(parsed.jobs)) return parsed.jobs;
        if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
        return parsed;
      }

      return content;
    } catch (error) {
      console.error(`Error with ${provider.name}:`, error);
      // Fall through to next provider
    }
  }

  throw new Error("All AI providers failed or were missing API keys.");
}
