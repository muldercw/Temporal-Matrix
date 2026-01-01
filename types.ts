
export interface CharacterSpecimen {
  name: string;
  letter: string;
  imageUrl: string;
  stagedTitle: string;
  stagedDescription: string;
}

export interface Persona {
  id: string;
  characterName: string;
  personaTitle: string;
  imageUrl: string;
  description: string;
  timestamp: number;
}

export interface GeneratedName {
  characterName: string;
  title: string;
  description: string;
}
