
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getLogicSuggestion(prompt: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a Rusted Warfare modding expert. Help write a LogicBoolean expression for a unit. 
      Available prefixes: self, parent, attacking, eventSource, customTarget1, customTarget2.
      Available functions: hp(), energy(), ammo(), isInWater(), isFlying(), tags(), hasResources().
      Prompt: ${prompt}
      Return ONLY the Rusted Warfare code snippet. No explanation.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text?.trim() || "";
  }

  async suggestUnitIdea(theme: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a unique unit concept for the game Rusted Warfare based on the theme: ${theme}. 
      Include name, role, and a brief list of key stats and abilities. 
      Keep it structured.`,
    });

    return response.text || "Failed to generate idea.";
  }
}
