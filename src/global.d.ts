// Global TypeScript declarations
interface Window {
  layoutRenderStart?: number;
  initialContentData?: {
    [key: string]: any[];
    photos?: any[];
    albums?: any[];
    snips?: any[];
    playlists?: any[];
  };
}