import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  analyzeReport: async (reportText: string) => {
    // Initializing Gemini client with API key from environment exclusively
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      // Using gemini-3-pro-preview with thinkingConfig for complex medical STEM reasoning
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `You are an expert clinical pathologist assistant. Analyze the following medical lab report data.
        
        TASK:
        1. Identify any values outside standard reference ranges.
        2. Provide a concise summary of abnormalities.
        3. Recommend specific medical specialists for follow-up based on the results.
        4. Provide clinical context for what these abnormalities might suggest (hypotheses only).

        DISCLAIMER: 
        Must start with: "⚠️ AI-ASSISTED PRELIMINARY ANALYSIS: This summary is for informational purposes only and is NOT a substitute for professional medical diagnosis or consultation. Please review these results with a qualified physician."
        
        REPORT DATA:
        ${reportText}`,
        config: {
          thinkingConfig: { thinkingBudget: 4000 } // Setting reasoning budget for complex analysis
        }
      });
      // Extracting generated text using the .text property
      return response.text;
    } catch (error) {
      console.error("AI Analysis failed:", error);
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        return "ERROR: API configuration issue or invalid model name.";
      }
      return "Unable to perform AI analysis at this time. Please check your connection or try again later.";
    }
  }
};