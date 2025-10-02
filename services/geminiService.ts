
import { GoogleGenAI, Modality } from "@google/genai";
import { UserPreferences, AnalysisResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const generateAnalysisPrompt = (preferences: UserPreferences): string => {
    return `
You are an expert home color consultant from Bangladesh. Analyze the provided image of a house (${preferences.imageType}).
User's preferences:
- Desired Style: ${preferences.colorStyle}
- Preferred Paint Type Feel: ${preferences.paintType}

Based on the image and preferences, generate a detailed color palette suggestion in **Bengali**.
Your response must be well-structured and easy to read. Follow this exact format using Markdown:
1. Start with a main title: '🎨 রঙের প্রস্তাবনা (${preferences.colorStyle} Look):'
2. Use headings with emojis for different parts of the house/room (e.g., '🏠 মূল ভবনের রং', '🎨 বর্ডার ও কর্নিশ', '🪟 জানালা ও দরজার ফ্রেম').
3. Use bullet points under each heading to explain the color choice and its effect.
4. Include a summary table section starting with '---', then a title '🖼️ রঙের স্কিম সংক্ষেপে:', and a Markdown table with 'অংশ' and 'রং' columns.
5. End with another '---' separator, a title '✅ আরও কিছু টিপস:', and a bulleted list of additional advice.

Be creative, professional, and provide aesthetically pleasing suggestions that match the user's request. Ensure the output is entirely in Bengali.
`;
};

const generateRecolorPrompt = (analysis: string): string => {
    return `
Based on the following detailed color scheme analysis, please repaint the provided image to reflect these new colors. Apply the colors realistically to the different parts of the building as described.

Color Scheme:
${analysis}
`;
};


export const analyzeAndRecolorImage = async (
  imageFile: File,
  preferences: UserPreferences
): Promise<AnalysisResult> => {
  const imagePart = await fileToGenerativePart(imageFile);

  // Step 1: Get the color analysis
  const analysisPrompt = generateAnalysisPrompt(preferences);
  const analysisModel = 'gemini-2.5-flash';

  const analysisResponse = await ai.models.generateContent({
    model: analysisModel,
    contents: [{ parts: [imagePart, { text: analysisPrompt }] }],
  });
  
  const analysisText = analysisResponse.text;
  if (!analysisText) {
      throw new Error("Failed to generate color analysis.");
  }

  // Step 2: Recolor the image based on the analysis
  const recolorPrompt = generateRecolorPrompt(analysisText);
  const recolorModel = 'gemini-2.5-flash-image-preview';
  
  const recolorResponse = await ai.models.generateContent({
    model: recolorModel,
    contents: {
        parts: [imagePart, { text: recolorPrompt }]
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  // Extract the image from the response
  let newImageBase64: string | null = null;
  for (const part of recolorResponse.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          newImageBase64 = part.inlineData.data;
          break;
      }
  }

  if (!newImageBase64) {
      throw new Error("Failed to generate the recolored image.");
  }
  
  const newImageUrl = `data:${imageFile.type};base64,${newImageBase64}`;

  return {
    analysis: analysisText,
    newImage: newImageUrl,
  };
};
