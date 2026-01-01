
/**
 * Fetches an image from a URL and converts it to a Base64 string and its MIME type.
 */
export const urlToData = async (url: string): Promise<{ base64: string; mimeType: string }> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    
    const base64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip the data:image/xxx;base64, prefix
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return { base64, mimeType };
  } catch (error) {
    console.error(`Failed to ingest asset: ${url}`, error);
    // Fallback to a tiny transparent pixel
    return { 
      base64: "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", 
      mimeType: "image/gif" 
    };
  }
};
