
export interface CharacterSpecimen {
  name: string;
  letter: string;
  sourceUrl: string;
  sourceBase64?: string;
  sourceMimeType?: string;
  stagedTitle: string;
  stagedDescription: string;
}

export interface GeneratedName {
  characterName: string;
  title: string;
  description: string;
}
