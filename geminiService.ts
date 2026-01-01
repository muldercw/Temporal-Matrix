
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
    model: "gemini-3-flash-preview", // Flash is excellent for instruction following and speed
    contents: `You are the Hawkins Lab Neural Matrix. Generate 1 'Temporal Variant' for these characters: ${characterContext}.
    
    STRICT NAMING CONVENTION:
    1. Title MUST be: [Adjective] [Name].
    2. The [Adjective] MUST start with the character's first letter.
    
    SCENE REQUIREMENTS:
    Provide a rich, cinematic description for each persona. Place them in completely random eras or genres (e.g., 1920s jazz club, futuristic Martian colony, medieval battlefield, modern consumer). Describe their attire and atmosphere in photorealistic detail.`,
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
    return JSON.parse(response.text);
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
  
  // Ensure we only have the raw base64 data
  const cleanBase64 = sourceBase64.includes('base64,') 
    ? sourceBase64.split('base64,')[1] 
    : sourceBase64;

  const prompt = `PHOTOREALISTIC RECONSTRUCTION: Create a new cinematic image of ${characterName} from Stranger Things as "${personaTitle}".
  
  SCENE DESCRIPTION: ${description}.
  
  TECHNICAL DIRECTIVE: 
  - Use the provided reference image ONLY to extract the facial features and identity of the character. 
  - REGENERATE everything else: clothing, background, lighting, and pose must match the SCENE DESCRIPTION perfectly.
  - The final output must be a professional 8k photography still, indistinguishable from reality. 
  - DO NOT just edit the existing photo; generate a WHOLE NEW scene featuring this exact person's face.`;

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
