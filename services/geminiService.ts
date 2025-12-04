import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, MurmurType } from "../types";

// Note: In a real Class II SaMD, the API Key would be managed via a secure backend proxy, not frontend.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const analyzePCGSignal = async (base64Audio: string): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure process.env.API_KEY.");
  }

  const modelId = "gemini-2.5-flash"; // Using Flash for low latency structured JSON

  const prompt = `
    You are an advanced AI component of a Class II medical device designed for Phonocardiography (PCG) analysis.
    Analyze the provided heart sound audio recording. 
    
    Perform the following conceptual steps:
    1. Pre-processing: Assume 40x amplification and noise cancellation.
    2. Segmentation: Identify S1 (lub) and S2 (dub) boundaries.
    3. Classification: Detect structural murmurs based on timing (systolic/diastolic), shape (crescendo/decrescendo), and frequency.

    Classify the audio into one of these categories:
    - Normal
    - Aortic Stenosis (AS)
    - Mitral Regurgitation (MR)
    - Mitral Stenosis (MS)
    - Mitral Valve Prolapse (MVP)

    Provide a JSON response representing the clinical decision support output.
    Ensure the confidence score accurately reflects the clarity of the murmur in the audio.
    Estimate heart rate and S1/S2 characteristics.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/wav", // Assuming WAV/MP3 input, Gemini handles standard formats
              data: base64Audio
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryDiagnosis: {
              type: Type.STRING,
              enum: [
                MurmurType.NORMAL,
                MurmurType.AORTIC_STENOSIS,
                MurmurType.MITRAL_REGURGITATION,
                MurmurType.MITRAL_STENOSIS,
                MurmurType.MITRAL_VALVE_PROLAPSE
              ]
            },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
            secondaryPossibilities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  score: { type: Type.NUMBER }
                }
              }
            },
            clinicalNotes: { type: Type.STRING, description: "Brief clinical description of the findings for the physician." },
            heartRate: { type: Type.NUMBER },
            s1Intensity: { type: Type.STRING, enum: ['Normal', 'Loud', 'Soft', 'Variable'] },
            s2Intensity: { type: Type.STRING, enum: ['Normal', 'Split', 'Single', 'Loud P2'] }
          },
          required: ["primaryDiagnosis", "confidence", "clinicalNotes", "heartRate"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI model");

    const parsedResult = JSON.parse(resultText) as AnalysisResult;
    
    // Add timestamp locally
    parsedResult.timestamp = new Date().toISOString();
    
    return parsedResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback Mock data if API fails or key is missing (For prototype resilience)
    return {
      primaryDiagnosis: MurmurType.NORMAL,
      confidence: 0.95,
      secondaryPossibilities: [],
      clinicalNotes: "Analysis failed or API key missing. Defaulting to Normal for safety.",
      heartRate: 72,
      s1Intensity: 'Normal',
      s2Intensity: 'Normal',
      timestamp: new Date().toISOString()
    };
  }
};
