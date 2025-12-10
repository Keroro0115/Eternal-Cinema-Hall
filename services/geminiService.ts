
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MovieDataResponse } from "../types";

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

export const fetchMovieData = async (): Promise<MovieDataResponse | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("No API Key found for Gemini.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Create an artistic concept for an exhibition called "Eternal Cinema Hall".
      Generate a list of 16 movies. 
      
      CRITICAL REQUIREMENT: "Deadpool & Wolverine" (Deadpool 3) MUST be the LAST movie (No. 16) in the list.
      
      For the other 15, select randomly from:
      - Classic (pre-1990)
      - Modern (1990-2020)
      - Asian Cinema (e.g., Wong Kar-wai, Kurosawa, Bong Joon-ho)
      - Sci-Fi/Fantasy
      - Animation/Romance

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
      data.movies = data.movies.slice(0, 16).map((m, index) => ({ ...m, id: index + 1 }));
    }
    
    return data;

  } catch (error) {
    console.error("Failed to fetch from Gemini:", error);
    return null;
  }
};
