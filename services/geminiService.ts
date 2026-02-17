import { GoogleGenAI, Chat } from "@google/genai";
import { GeoLocation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a generic itinerary from a raw prompt (Used by Agency Dashboard).
 */
export const generateItinerary = async (
  prompt: string,
  location?: GeoLocation
): Promise<{ text: string; mapsSources: any[] }> => {
  try {
    const retrievalConfig = location
      ? {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          },
        }
      : {};

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an expert travel planner named TravelGuideAI. 
        Create detailed, day-by-day itineraries. 
        You MUST use Google Maps grounding to provide real, clickable locations for hotels, restaurants, and attractions.
        Format your response in clean Markdown. Use bolding for times and key locations.
        Do not output JSON. Output a readable guide.`,
        tools: [{ googleMaps: {} }],
        toolConfig: retrievalConfig,
      },
    });

    // Extract Google Maps grounding chunks
    const mapsSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.maps)
      .filter((item: any) => item) || [];

    return {
      text: response.text || "No itinerary generated. Please try again.",
      mapsSources
    };
  } catch (error) {
    console.error("Error generating itinerary:", error);
    throw new Error("Failed to generate itinerary. Please check your API key and try again.");
  }
};

/**
 * Generates a specific travel guide based on destination, days, and nights.
 * Matches the requested function signature structure.
 */
export const generateTravelGuide = async (
  destination: string,
  days: number,
  nights: number,
  preferences: {
    budget?: string;
    interests?: string[];
    travelers?: string;
  } = {},
  location?: GeoLocation
): Promise<{ text: string; mapsSources: any[] }> => {
  try {
    const retrievalConfig = location
      ? {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          },
        }
      : {};

    let prompt = `Create a detailed travel itinerary for ${days} days and ${nights} nights in ${destination}.`;
    
    // Append preferences to refine the result
    if (preferences.budget) prompt += ` Budget: ${preferences.budget}.`;
    if (preferences.travelers) prompt += ` Travelers: ${preferences.travelers}.`;
    if (preferences.interests && preferences.interests.length > 0) {
      prompt += ` Interests: ${preferences.interests.join(', ')}.`;
    }
    
    prompt += ` Include breakfast, lunch, and dinner recommendations, and specific timings for activities.
    Ensure all places mentioned are real and linkable via Google Maps.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an expert travel planner. Create detailed, day-by-day itineraries with Google Maps links. Format in Markdown.`,
        tools: [{ googleMaps: {} }],
        toolConfig: retrievalConfig,
      },
    });

    const mapsSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.maps)
      .filter((item: any) => item) || [];

    return {
      text: response.text || "No itinerary generated.",
      mapsSources
    };
  } catch (error) {
    console.error("Error generating travel guide:", error);
    throw new Error("Failed to generate travel guide.");
  }
};

/**
 * Generates blog content using Google Search Grounding for up-to-date info.
 * Uses gemini-3-flash-preview.
 */
export const generateTravelArticle = async (
  topic: string
): Promise<{ text: string; sources: any[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write an engaging, SEO-friendly travel blog post about: ${topic}. 
      Include a catchy title at the top. Use Markdown for formatting.
      Focus on current trends, hidden gems, and practical advice.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(
        (chunk: any) => chunk.web
    ).filter((item: any) => item) || [];

    return {
      text: response.text || "No content generated.",
      sources: sources,
    };
  } catch (error) {
    console.error("Error generating article:", error);
    throw new Error("Failed to generate article.");
  }
};

/**
 * Creates a new chat session for the travel assistant.
 * Uses gemini-3-flash-preview for conversational capabilities.
 */
export const createTravelChat = (): Chat => {
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are a friendly, concise, and helpful travel assistant for TravelGuideAI. You help users with quick questions about destinations, packing tips, visa requirements, and local customs. You can also analyze images of landmarks, menus, or locations uploaded by the user to provide details about them. Keep your answers brief and practical.",
    },
  });
};