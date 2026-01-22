import { Injectable } from '@angular/core';
import { GoogleGenAI, Chat } from '@google/genai';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat;
  private isInitialized = false;

  constructor() {
    // Initialize with API Key from environment
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
    this.initializeChat();
  }

  private initializeChat() {
    try {
      this.chat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are KONGKOW, a super chill, friendly, and witty AI companion. Your name comes from the Indonesian slang for "hanging out". You speak in a casual, conversational tone. You are helpful but not robotic. You can use emojis. If the user speaks Indonesian, reply in a mix of Indonesian slang and English (Jaksel style) if it fits the vibe. Keep responses concise unless asked for details.',
        },
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  }

  async *sendMessageStream(message: string) {
    if (!this.isInitialized) {
      this.initializeChat();
    }

    try {
      const resultStream = await this.chat.sendMessageStream({ message });
      
      for await (const chunk of resultStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}