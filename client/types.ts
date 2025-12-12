export enum ComicStyle {
  MANGA = 'Manga',
  AMERICAN_COMIC = 'American Comic',
  NOIR = 'Noir',
  WEBTOON = 'Webtoon',
  PIXEL_ART = 'Pixel Art'
}

export interface BubbleStyle {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  scale: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  tailRotation: number;
}

export interface DialogueLine {
  id: string;
  character: string;
  line: string;
  // Position data for the editor
  x?: number;
  y?: number;
  isPlaced?: boolean;
  // Styling
  style?: BubbleStyle;
}

export interface Scene {
  id: string;
  prompt: string;
  narrator: string;
  dialogue: DialogueLine[];
  imagePrompt?: string; // Optimized prompt for diffusion
  imageUrl?: string; // The generated image URL
}

export interface ComicPage {
  pageNumber: number;
  scenes: Scene[];
}

export interface PanelLayout {
  id: string;
  gridClass: string; // Tailwind grid classes
  slots: number; // Number of image slots
}

export interface EditorPanelState {
  sceneId: string;
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  dialogueBubbles: DialogueLine[];
}

export interface ComicProject {
  title: string;
  description: string;
  style: ComicStyle;
  pageCount: number;
  pages: ComicPage[];
  // Editor state tracking
  editorLayout?: PanelLayout;
  panelsState?: Record<string, EditorPanelState>; // Map sceneId to editor state
}

export interface Settings {
  ollamaEndpoint: string;
  ollamaModel: string;
  openRouterApiKey: string;
  openRouterModel: string;
}