
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedName, CharacterSpecimen } from "./types";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

/**
 * Generates unique character variants with strict naming rules.
 */
export const generateMultiplePersonas = async (characters: CharacterSpecimen[]): Promise<GeneratedName[]> => {
  const ai = getGeminiClient();
  const characterContext = characters.map(c => `${c.name} (letter ${c.letter})`).join(", ");
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the Hawkins Lab Neural Matrix. Generate 1 'Temporal Variant' for these characters: ${characterContext}.
    
    STRICT NAMING CONVENTION:
    1. Title MUST be: [Adjective] [Name].
    2. The [Adjective] MUST start with the character's first letter.
    3. BE EXTREMELY CREATIVE and use rare or unusual adjectives to ensure every single request results in a unique persona. Use of hyphenated adjectives are encouraged but not required.
    
    SCENE REQUIREMENTS:
    Provide a realistic, rich, cinematic description for each persona. Place them in completely random events, careers, professions, themes, eras, or genres. Describe their attire and atmosphere in photorealistic detail.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            characterName: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["characterName", "title", "description"]
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse personas JSON", e);
    return [];
  }
};

/**
 * Generates a photorealistic reimagining of a character.
 */
export const generatePersonaImage = async (
  characterName: string, 
  personaTitle: string, 
  description: string, 
  sourceBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  const ai = getGeminiClient();
  
  const cleanBase64 = sourceBase64.includes('base64,') 
    ? sourceBase64.split('base64,')[1] 
    : sourceBase64;

  const prompt = `PHOTOREALISTIC RECONSTRUCTION: Create a new cinematic image of ${characterName} from Stranger Things as "${personaTitle}".
  
  SCENE DESCRIPTION: ${description}.
  
  TECHNICAL DIRECTIVE: 
  - Identify the facial features and identity of ${characterName} from the provided image.
  - REGENERATE the entire scene: lighting, clothing, background, and posture must perfectly match the SCENE DESCRIPTION.
  - Output a professional 8k movie still. 
  - Maintain absolute character likeness while changing everything else.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Neural rendering failed to output image data.");
};
