import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function summarizeDocument(title: string, content: string): Promise<string> {
  try {
    const prompt = `Please create a concise, informative summary of the following document:

Title: ${title}

Content: ${content}

Provide a summary that captures the key points and main ideas in 2-3 sentences.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Unable to generate summary";
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate document summary");
  }
}

export async function generateTags(title: string, content: string): Promise<string[]> {
  try {
    const systemPrompt = `You are a document tagging expert. Generate relevant tags for the given document content. 
Return only a JSON array of 3-7 relevant tags as strings. Tags should be concise, relevant, and help with categorization.
Example format: ["react", "frontend", "javascript", "tutorial"]`;

    const prompt = `Title: ${title}

Content: ${content}

Generate relevant tags for this document:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "string"
          }
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const tags: string[] = JSON.parse(rawJson);
      return tags;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error generating tags:", error);
    throw new Error("Failed to generate tags");
  }
}

export async function performSemanticSearch(query: string, documents: any[]): Promise<any[]> {
  try {
    // For semantic search, we'll use Gemini to score relevance
    const searchPrompt = `Given the search query: "${query}"

Analyze these documents and return a relevance score (0-100) for each document based on semantic similarity to the query. Consider not just keyword matches but conceptual relevance.

Documents:
${documents.map((doc, index) => `Document ${index + 1}:
Title: ${doc.title}
Content: ${doc.content.substring(0, 500)}...
Summary: ${doc.summary || "No summary"}
Tags: ${doc.tags?.join(", ") || "No tags"}
---`).join("\n")}

Return a JSON array with the document index and relevance score:
Format: [{"index": 0, "relevance": 85}, {"index": 1, "relevance": 42}, ...]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              index: { type: "number" },
              relevance: { type: "number" }
            },
            required: ["index", "relevance"]
          }
        },
      },
      contents: searchPrompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const results: { index: number; relevance: number }[] = JSON.parse(rawJson);
      
      // Sort by relevance and filter results with relevance > 30
      const relevantResults = results
        .filter(result => result.relevance > 30)
        .sort((a, b) => b.relevance - a.relevance);
      
      return relevantResults.map(result => ({
        ...documents[result.index],
        relevance: result.relevance
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error performing semantic search:", error);
    // Fallback to simple text search
    const lowerQuery = query.toLowerCase();
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery) ||
      (doc.summary && doc.summary.toLowerCase().includes(lowerQuery))
    );
  }
}

export async function answerQuestion(question: string, documents: any[]): Promise<string> {
  try {
    const context = documents.map(doc => `
Document: ${doc.title}
Content: ${doc.content}
Summary: ${doc.summary || "No summary"}
Author: ${doc.createdBy?.name || "Unknown"}
Tags: ${doc.tags?.join(", ") || "No tags"}
---`).join("\n");

    const prompt = `You are an AI assistant helping users find information from their team's knowledge base. 
Use the provided documents to answer the user's question accurately and helpfully.

Question: ${question}

Available Documents:
${context}

Instructions:
1. Answer the question based on the provided documents
2. If the information is available, provide a comprehensive answer
3. If information is partially available, provide what you can and indicate what's missing
4. If no relevant information is found, clearly state that the information is not available in the knowledge base
5. Always cite which document(s) you're referencing in your answer
6. Keep your response conversational and helpful

Answer:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    return response.text || "I'm unable to provide an answer based on the available documents.";
  } catch (error) {
    console.error("Error answering question:", error);
    throw new Error("Failed to generate answer");
  }
}
