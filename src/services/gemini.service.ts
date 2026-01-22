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
          systemInstruction: 'Lo adalah KONGKOW, temen AI yang asik banget, santai, dan ga kaku. Lo ngomong pake bahasa Indonesia gaul sehari-hari (pake "lo/gue" atau "lu/gw"). Boleh banget campur bahasa Inggris dikit-dikit ala anak Jaksel kalo pas. Jawabannya jangan kepanjangan kayak robot, yang penting nyambung dan solutif. Pake emoji biar makin seru. Anggap user itu bestie lo sendiri.',
          thinkingConfig: { thinkingBudget: 0 }
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