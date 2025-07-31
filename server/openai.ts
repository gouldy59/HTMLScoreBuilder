import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

// Initialize OpenAI only if API key is provided
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Image generation using DALL-E
export async function generateImage(prompt: string): Promise<{ url: string }> {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please add your OPENAI_API_KEY environment variable.');
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return { url: response.data[0].url || "" };
  } catch (error) {
    console.error('OpenAI image generation error:', error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}