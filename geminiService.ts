
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedName, CharacterSpecimen } from "./types";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

/**
 * Generates photorealistic personas for characters across different historical and modern eras.
 */
export const generateMultiplePersonas = async (characters: CharacterSpecimen[]): Promise<GeneratedName[]> => {
  const ai = getGeminiClient();
  const characterContext = characters.map(c => `${c.name} (letter ${c.letter})`).join(", ");
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `For each of the following characters, generate 1 hyper-realistic 'Temporal Variant'.
    Characters: ${characterContext}.
    
    RULES:
    1. The title MUST be '[Adjective] [Name]' where the adjective starts with the character's first letter (e.g., 'Dangerous Derrick', 'Exquisite Eleven').
    2. ERA DIVERSITY: Place each character into a specific, identifiable historical or modern period. Examples include the 1920s Jazz Age, 17th Century Dutch Golden Age, 1950s Americana, 1990s London Underground, or contemporary high-society.
    3. PHOTOREALISM: Provide a description focused on authentic detail. Describe textures, period-correct attire, natural lighting conditions (like twilight or overcast morning), and grounded environments.
    4. Focus on absolute realism and human presence.`,
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
 * Fetches an image and converts to base64. 
 */
export const urlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Could not fetch specimen image at ${url}. Falling back to text-only.`, error);
    return null;
  }
};

/**
 * Generates a photorealistic persona image.
 */
export const generatePersonaImage = async (
  characterName: string, 
  personaTitle: string, 
  description: string, 
  originalImageBase64: string | null
): Promise<string> => {
  const ai = getGeminiClient();
  
  const basePrompt = `A high-fidelity, photorealistic cinematic portrait of ${characterName} reimagined as "${personaTitle}". 
  SCENE: ${description}. 
  STYLE: Captured on 35mm film with authentic grain, shallow depth of field, natural skin texture, and period-accurate lighting. 
  The final result should look like an iconic piece of professional photography. 100% human realism.`;

  const prompt = originalImageBase64 
    ? `TEMPORAL RECONSTRUCTION: Extract the facial likeness from the provided image and render it into this new reality: ${basePrompt}`
    : basePrompt;

  const contents: any = {
    parts: []
  };

  if (originalImageBase64) {
    contents.parts.push({
      inlineData: {
        data: originalImageBase64,
        mimeType: 'image/jpeg'
      }
    });
  }
  
  contents.parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: contents,
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

  throw new Error("No image data returned from Gemini");
};
