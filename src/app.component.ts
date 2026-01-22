import { Component, signal, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from './services/gemini.service';
import { ChatMessageComponent } from './components/chat-message.component';

interface Message {
  role: 'user' | 'model';
  text: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatMessageComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements AfterViewChecked {
  private geminiService = inject(GeminiService);
  
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('inputField') private inputField!: ElementRef;

  messages = signal<Message[]>([]);
  userInput = signal('');
  isLoading = signal(false);
  isRecording = signal(false);
  
  private recognition: any;

  // Initial welcome message
  constructor() {
    this.messages.set([
      { role: 'model', text: "Yo! Welcome to KONGKOW. I'm your AI buddy. What's on your mind? Let's chat!" }
    ]);
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'id-ID'; // Optimize for Indonesian/Mixed context
        
        this.recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          this.userInput.update(current => {
            const spacer = current && !current.endsWith(' ') ? ' ' : '';
            return current + spacer + transcript;
          });
          this.isRecording.set(false);
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          this.isRecording.set(false);
        };

        this.recognition.onend = () => {
          this.isRecording.set(false);
        };
      }
    }
  }

  toggleVoiceInput() {
    if (!this.recognition) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (this.isRecording()) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
        this.isRecording.set(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
        this.isRecording.set(false);
      }
    }
  }

  clearChat() {
    this.messages.set([
      { role: 'model', text: "Yo! Welcome to KONGKOW. I'm your AI buddy. What's on your mind? Let's chat!" }
    ]);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  async sendMessage() {
    const text = this.userInput().trim();
    if (!text || this.isLoading()) return;

    // Add user message
    this.messages.update(msgs => [...msgs, { role: 'user', text }]);
    this.userInput.set('');
    this.isLoading.set(true);

    try {
      // Create placeholder for bot response
      this.messages.update(msgs => [...msgs, { role: 'model', text: '' }]);
      
      const stream = await this.geminiService.sendMessageStream(text);
      
      let fullResponse = '';
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        // Update the last message (the bot placeholder)
        this.messages.update(msgs => {
          const newMsgs = [...msgs];
          newMsgs[newMsgs.length - 1] = { role: 'model', text: fullResponse };
          return newMsgs;
        });
      }
      
    } catch (error) {
      console.error(error);
      this.messages.update(msgs => [...msgs, { role: 'model', text: "My bad, something went wrong with the connection. Let's try that again?" }]);
    } finally {
      this.isLoading.set(false);
      setTimeout(() => this.inputField.nativeElement.focus(), 100);
    }
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}