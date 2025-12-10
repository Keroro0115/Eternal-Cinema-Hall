export type Language = 'zh' | 'en';

export interface LocalizedString {
  zh: string;
  en: string;
}

export interface MovieArt {
  id: number;
  title_zh: string;
  title_en: string;
  year: number;
  director_zh: string;
  director_en: string;
  core_emotion: LocalizedString;
  visual_metaphor: LocalizedString;
  key_element: LocalizedString;
  haiku: LocalizedString;
  color_palette: string[];
  art_note: LocalizedString;
}

export interface MovieDataResponse {
  movies: MovieArt[];
}

export interface AppState {
  currentMovieIndex: number;
  isDetailsOpen: boolean;
  language: Language;
  isLoading: boolean;
  movies: MovieArt[];
}
