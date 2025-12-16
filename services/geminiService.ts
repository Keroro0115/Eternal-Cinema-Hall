
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MovieDataResponse, MovieArt } from "../types";

// Define the schema for structured output
const movieSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    movies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          title_zh: { type: Type.STRING },
          title_en: { type: Type.STRING },
          year: { type: Type.INTEGER },
          director_zh: { type: Type.STRING },
          director_en: { type: Type.STRING },
          core_emotion: {
            type: Type.OBJECT,
            properties: {
              zh: { type: Type.STRING },
              en: { type: Type.STRING },
            },
            required: ["zh", "en"],
          },
          visual_metaphor: {
            type: Type.OBJECT,
            properties: {
              zh: { type: Type.STRING },
              en: { type: Type.STRING },
            },
            required: ["zh", "en"],
          },
          key_element: {
            type: Type.OBJECT,
            properties: {
              zh: { type: Type.STRING },
              en: { type: Type.STRING },
            },
            required: ["zh", "en"],
          },
          haiku: {
            type: Type.OBJECT,
            properties: {
              zh: { type: Type.STRING },
              en: { type: Type.STRING },
            },
            required: ["zh", "en"],
          },
          color_palette: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          art_note: {
            type: Type.OBJECT,
            properties: {
              zh: { type: Type.STRING },
              en: { type: Type.STRING },
            },
            required: ["zh", "en"],
          },
        },
        required: ["id", "title_zh", "title_en", "year", "director_zh", "core_emotion", "visual_metaphor", "color_palette", "key_element"],
      },
    },
  },
  required: ["movies"],
};

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("No API Key found for Gemini.");
      return null;
    }
    return new GoogleGenAI({ apiKey });
}

export const fetchMovieData = async (): Promise<MovieDataResponse | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const prompt = `
      You are the curator of the "Eternal Cinema Hall", an infinite art gallery.
      Generate a list of 16 highly acclaimed movies.
      
      Requirements:
      - Select a diverse mix of classics, modern masterpieces, animation, and international cinema.
      - Ensure they are visually distinct and thematically deep.
      - Do NOT repeat common blockbusters unless they have high artistic merit.
      
      For each movie, provide:
      1. Core emotion (dual language)
      2. A visual metaphor (poetic description)
      3. A key element (prop/symbol) - Must be short (e.g. "Rose", "Sword")
      4. A Haiku (3 lines, Chinese and English translation)
      5. Color palette (3 hex codes)
      6. Art note explaining the metaphor (dual language).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: movieSchema,
        temperature: 1.1, // High creativity
      },
    });

    const text = response.text;
    if (!text) return null;

    let data: MovieDataResponse;
    try {
        data = JSON.parse(text) as MovieDataResponse;
    } catch (e) {
        // Fallback cleanup if the model wraps in markdown
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        data = JSON.parse(cleanedText) as MovieDataResponse;
    }

    // Assign incremental IDs to ensure order in 3D space
    if (data.movies) {
      // We initially give them 1-16, but the App will re-index them to append to the list
      data.movies = data.movies.slice(0, 16).map((m, index) => ({ ...m, id: index + 1 }));
    }
    
    return data;

  } catch (error) {
    console.error("Failed to fetch from Gemini:", error);
    return null;
  }
};

export const generatePosterImage = async (movie: MovieArt): Promise<string | null> => {
    const ai = getClient();
    if (!ai) return null;
  
    try {
      // Prompt optimized for Gemini Image Generation
      const prompt = `Movie poster for "${movie.title_en}". Visual style: ${movie.visual_metaphor.en}. Minimalist, high quality, 8k, cinematic lighting, artistic composition, textless.`;
      
      // Use the proper model for image generation
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
              aspectRatio: '3:4' // Vertical poster ratio
          }
        }
      });
  
      // Iterate to find the image part in the response
      for (const candidate of response.candidates || []) {
          for (const part of candidate.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
      }
      return null;
    } catch (e) {
      console.error("Image Gen Error", e);
      return null;
    }
}
