import { Component, signal, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from './services/gemini.service';
import { ChatMessageComponent, MessageReaction } from './components/chat-message.component';

interface Message {
  role: 'user' | 'model';
  text: string;
  reactions: MessageReaction[];
}

interface ChatHistoryItem {
  id: string;
  title: string;
  type?: 'chat' | 'code' | 'travel' | 'food' | 'work';
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

  // Sidebar State
  isSidebarOpen = signal(true); // Default open on desktop
  
  // Mock History Data
  chatHistory = signal<ChatHistoryItem[]>([
    { id: '1', title: 'Plan a trip to Bali', type: 'travel' },
    { id: '2', title: 'React vs Angular 2024', type: 'code' },
    { id: '3', title: 'How to make Nasi Goreng', type: 'food' },
    { id: '4', title: 'Debug Python script', type: 'code' },
    { id: '5', title: 'Email for job application', type: 'work' }
  ]);

  editingChatId = signal<string | null>(null);

  messages = signal<Message[]>([]);
  userInput = signal('');
  isLoading = signal(false);
  isRecording = signal(false);
  
  private recognition: any;

  constructor() {
    this.messages.set([
      { role: 'model', text: "Woi! Welcome di KONGKOW. Gw temen AI lu yang siap nemenin ngobrol. Lagi mikirin apa nih? Cerita sini, santai aja!", reactions: [] }
    ]);
    this.initializeSpeechRecognition();
    
    // Auto-close sidebar on mobile initial load
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.isSidebarOpen.set(false);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
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
      { role: 'model', text: "Woi! Welcome di KONGKOW. Gw temen AI lu yang siap nemenin ngobrol. Lagi mikirin apa nih? Cerita sini, santai aja!", reactions: [] }
    ]);
  }

  startNewChat() {
    this.messages.set([
      { role: 'model', text: "Woi! Welcome di KONGKOW. Gw temen AI lu yang siap nemenin ngobrol. Lagi mikirin apa nih? Cerita sini, santai aja!", reactions: [] }
    ]);
    // On mobile, close sidebar when starting new chat
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.isSidebarOpen.set(false);
    }
  }

  loadHistory(id: string) {
    // Mock loading logic
    console.log('Loading chat', id);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.isSidebarOpen.set(false);
    }
  }

  startRenaming(event: Event, id: string) {
    event.stopPropagation();
    event.preventDefault();
    this.editingChatId.set(id);
  }

  saveRename(id: string, newTitle: string) {
    if (!newTitle.trim()) {
      this.cancelRenaming();
      return;
    }
    
    this.chatHistory.update(history => 
      history.map(item => item.id === id ? { ...item, title: newTitle.trim() } : item)
    );
    this.editingChatId.set(null);
  }

  cancelRenaming() {
    this.editingChatId.set(null);
  }

  handleRenameKeydown(event: KeyboardEvent, id: string, title: string) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveRename(id, title);
    } else if (event.key === 'Escape') {
      this.cancelRenaming();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  handleReaction(index: number, emoji: string) {
    this.messages.update(msgs => {
      const newMsgs = [...msgs];
      const targetMsg = { ...newMsgs[index] };
      const currentReactions = targetMsg.reactions ? [...targetMsg.reactions] : [];
      
      const reactionIndex = currentReactions.findIndex(r => r.emoji === emoji);
      
      if (reactionIndex > -1) {
        // Toggle existing
        const r = { ...currentReactions[reactionIndex] };
        if (r.userReacted) {
          r.count--;
          r.userReacted = false;
        } else {
          r.count++;
          r.userReacted = true;
        }
        
        if (r.count <= 0) {
          currentReactions.splice(reactionIndex, 1);
        } else {
          currentReactions[reactionIndex] = r;
        }
      } else {
        // Add new
        currentReactions.push({ emoji, count: 1, userReacted: true });
      }
      
      targetMsg.reactions = currentReactions;
      newMsgs[index] = targetMsg;
      return newMsgs;
    });
  }

  async sendMessage() {
    const text = this.userInput().trim();
    if (!text || this.isLoading()) return;

    // Add user message
    this.messages.update(msgs => [...msgs, { role: 'user', text, reactions: [] }]);
    this.userInput.set('');
    
    // Set loading state (shows typing indicator)
    this.isLoading.set(true);

    try {
      const stream = await this.geminiService.sendMessageStream(text);
      
      let fullResponse = '';
      let isFirstChunk = true;
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        
        if (isFirstChunk) {
          // On first chunk, hide typing indicator and create the message
          isFirstChunk = false;
          this.isLoading.set(false);
          this.messages.update(msgs => [...msgs, { role: 'model', text: fullResponse, reactions: [] }]);
        } else {
          // Update the existing message, preserving reactions
          this.messages.update(msgs => {
            const newMsgs = [...msgs];
            const lastMsg = newMsgs[newMsgs.length - 1];
            newMsgs[newMsgs.length - 1] = { 
              ...lastMsg, 
              text: fullResponse 
            };
            return newMsgs;
          });
        }
      }
      
    } catch (error) {
      console.error(error);
      this.isLoading.set(false); // Ensure loading is off on error
      this.messages.update(msgs => [...msgs, { role: 'model', text: "Yah elah, koneksinya putus nih. Coba kirim ulang ya?", reactions: [] }]);
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