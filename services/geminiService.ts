
import { GoogleGenAI } from "@google/genai";
import { ACUnit } from "../types";

export const getMaintenanceAdvice = async (unit: ACUnit): Promise<string> => {
  try {
    // Corrected initialization to use API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const historySummary = unit.history.length > 0 
      ? unit.history.map(h => `- ${h.date}: ${h.type} (${h.description})`).join('\n')
      : 'Sem histórico de manutenção recente.';

    const prompt = `
      Atue como um Engenheiro Mecânico sênior especializado em HVAC.
      Analise o seguinte equipamento de Ar-Condicionado e forneça um breve diagnóstico preditivo (insights) e recomendações de manutenção.
      
      EQUIPAMENTO:
      - ID: ${unit.id}
      - Marca/Modelo: ${unit.brand} ${unit.model}
      - Capacidade: ${unit.btu} BTUs
      - Localização: ${unit.location}
      - Data de Instalação: ${unit.installDate}
      - Status Atual: ${unit.status}
      
      HISTÓRICO RECENTE:
      ${historySummary}
      
      REGRAS DE RESPOSTA:
      1. Seja direto e profissional.
      2. Máximo de 150 palavras.
      3. Use bullet points se necessário.
      4. Fale sobre riscos potenciais baseados na idade e histórico.
      5. Sugira a próxima ação crítica.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini API:", error);
    return "Erro ao processar diagnóstico de IA. Verifique sua conexão ou API Key.";
  }
};
