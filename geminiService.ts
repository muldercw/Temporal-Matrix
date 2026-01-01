
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedName, CharacterSpecimen } from "./types";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

/**
 * Generates unique character variants with strict naming and thematic rules.
 */
export const generateMultiplePersonas = async (
  characters: CharacterSpecimen[], 
  usedTerms: string[] = [],
  customAdjective?: string
): Promise<GeneratedName[]> => {
  const ai = getGeminiClient();
  const char = characters[0];
  const targetLetter = char.letter;

  // Logic for the name and theme construction
  const themeInstruction = customAdjective 
    ? `MANDATORY THEME: The user has specified the modifier "${customAdjective}". 
       1. The character's new Title MUST be exactly: "${customAdjective} ${char.name}".
       2. The entire character concept, clothing, and visual description MUST revolve around the word "${customAdjective}".`
    : `RANDOM THEME: Choose a creative adjective that starts with the letter "${targetLetter}". 
       1. The character's new Title MUST follow the format: "[Adjective] ${char.name}".
       2. The [Adjective] MUST start with the letter "${targetLetter}" (e.g., for Derrick, it could be 'Dangerous', 'Daring', 'Dreadful').`;

  const prompt = `You are the Hawkins Lab Neural Matrix. 
  
  TASK: Reconstruct a 'Temporal Variant' for the subject: ${char.name}.
  
  ${themeInstruction}

  STRICT NAMING RULES:
  - Do NOT deviate from the "[Adjective] ${char.name}" format.
  - Exclusions: DO NOT use any of these adjectives: ${usedTerms.join(", ")}.
  
  SCENE REQUIREMENTS:
  Reimagine ${char.name} in a cinematic environment that perfectly embodies the thematic modifier used. 
  If the adjective is "Cyber", the description must be high-tech neon. If "Gothic", it must be dark and Victorian.
  Focus on:
  - Visual attire (clothing, accessories)
  - Atmospheric lighting and environment
  - Facial expression and posture
  The description should be a single, dense, highly descriptive paragraph (max 100 words) suitable for an image generator prompt. Use photorealistic, cinematic language.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            characterName: { type: Type.STRING },
            title: { type: Type.STRING, description: "The full thematic title, e.g. 'Dangerous Derrick'" },
            description: { type: Type.STRING, description: "A detailed visual scene description incorporating the theme." }
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
 * Generates a photorealistic reimagining of a character based on a visual description.
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

  const prompt = `NEURAL RENDER DIRECTIVE: Transform the character ${characterName} into the persona "${personaTitle}".
  
  VISUAL CONCEPT: ${description}.
  
  STRICT TECHNICAL SPECS: 
  - SUBJECT IDENTITY: You MUST preserve the exact facial likeness and identity of the person in the provided image.
  - ENVIRONMENT & ATTIRE: Completely replace the original background and clothing with the details from the VISUAL CONCEPT.
  - ART STYLE: Photorealistic, 8k resolution, cinematic movie still, dramatic lighting, high contrast, shallow depth of field.
  - DO NOT include text, watermarks, or distorted features.
  - Focus on a sharp, clear portrait or medium shot.`;

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
      const outputMime = part.inlineData.mimeType || 'image/png';
      return `data:${outputMime};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Neural rendering failed to output image data.");
};
