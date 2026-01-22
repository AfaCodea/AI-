import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';

export interface MessageReaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="flex w-full mb-8 animate-fade-in group" 
      [class.flex-row-reverse]="isUser()"
      [class.items-start]="true"
    >
      
      <!-- Avatar -->
      <div class="flex-shrink-0" [class.ml-4]="isUser()" [class.mr-4]="!isUser()">
        @if (!isUser()) {
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mt-1">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
          </div>
        } @else {
          <div class="w-8 h-8 rounded-full bg-[#303132] border border-gray-700 flex items-center justify-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
          </div>
        }
      </div>

      <!-- Message Content Container -->
      <div 
        class="relative max-w-[85%] sm:max-w-[88%] text-[15px] sm:text-[16px] leading-7 group/content"
        [class.bg-[#303132]]="isUser()"
        [class.text-gray-100]="isUser()"
        [class.px-5]="isUser()"
        [class.py-3]="isUser()"
        [class.rounded-[24px]]="isUser()"
        [class.rounded-tr-sm]="isUser()"
        
        [class.w-full]="!isUser()"
        [class.text-gray-200]="!isUser()"
      >
        <!-- Name Label (Optional, good for group contexts or clarity) -->
        @if (!isUser()) {
          <div class="text-xs font-medium text-gray-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            KONGKOW
          </div>
        }

        <!-- Rendered Markdown -->
        <div class="markdown-body" [innerHTML]="renderedContent()"></div>

        <!-- Reactions Area -->
        <div class="mt-2 flex flex-wrap gap-2 items-center min-h-[20px]">
          
          <!-- Existing Reactions -->
          @for (reaction of reactions(); track reaction.emoji) {
            <button 
              (click)="onReactionClick(reaction.emoji)"
              class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-all border select-none"
              [class.bg-indigo-500/20]="reaction.userReacted"
              [class.border-indigo-500/30]="reaction.userReacted"
              [class.text-indigo-300]="reaction.userReacted"
              [class.bg-[#2a2b2d]]="!reaction.userReacted"
              [class.border-gray-700]="!reaction.userReacted"
              [class.text-gray-400]="!reaction.userReacted"
              [class.hover:bg-gray-700]="!reaction.userReacted"
            >
              <span>{{ reaction.emoji }}</span>
              @if(reaction.count > 1) {
                <span>{{ reaction.count }}</span>
              }
            </button>
          }

          <!-- Add Reaction Button -->
          <div class="relative">
             <button 
               (click)="toggleEmojiPicker($event)"
               class="p-1 rounded-full text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors opacity-0 group-hover/content:opacity-100 focus:opacity-100"
               [class.opacity-100]="showEmojiPicker()"
               title="Add reaction"
             >
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </button>

             <!-- Emoji Picker Popup -->
             @if (showEmojiPicker()) {
               <div 
                 class="absolute bottom-full left-0 mb-2 p-1 bg-[#1E1F20] border border-gray-700 rounded-lg shadow-xl flex gap-0.5 z-10 animate-scale-in"
                 (mouseleave)="showEmojiPicker.set(false)"
               >
                 @for (emoji of quickEmojis; track emoji) {
                   <button 
                     (click)="onReactionClick(emoji); showEmojiPicker.set(false)"
                     class="p-1.5 hover:bg-gray-700 rounded transition-colors text-lg leading-none select-none"
                   >
                     {{ emoji }}
                   </button>
                 }
               </div>
             }
          </div>

        </div>
        
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-scale-in {
      animation: scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transform-origin: bottom left;
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }

    /* --- Professional Markdown Styles --- */

    /* Typography */
    :host ::ng-deep .markdown-body {
      font-weight: 300;
      letter-spacing: 0.01em;
    }

    :host ::ng-deep .markdown-body p { 
      margin-bottom: 1rem; 
    }
    :host ::ng-deep .markdown-body p:last-child { 
      margin-bottom: 0; 
    }

    /* Headings */
    :host ::ng-deep .markdown-body h1,
    :host ::ng-deep .markdown-body h2,
    :host ::ng-deep .markdown-body h3,
    :host ::ng-deep .markdown-body h4 {
      color: #F3F4F6;
      font-weight: 500;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      line-height: 1.3;
    }
    :host ::ng-deep .markdown-body h1 { font-size: 1.75em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.3em; }
    :host ::ng-deep .markdown-body h2 { font-size: 1.4em; }
    :host ::ng-deep .markdown-body h3 { font-size: 1.2em; }
    :host ::ng-deep .markdown-body h4 { font-size: 1.1em; font-weight: 600; }

    /* Lists */
    :host ::ng-deep .markdown-body ul { list-style-type: disc; margin-left: 1.2rem; margin-bottom: 1rem; color: #D1D5DB; }
    :host ::ng-deep .markdown-body ol { list-style-type: decimal; margin-left: 1.2rem; margin-bottom: 1rem; color: #D1D5DB; }
    :host ::ng-deep .markdown-body li { margin-bottom: 0.4rem; padding-left: 0.2rem; }
    :host ::ng-deep .markdown-body li::marker { color: #9CA3AF; }

    /* Links */
    :host ::ng-deep .markdown-body a { 
      color: #60A5FA; 
      text-decoration: none; 
      border-bottom: 1px solid transparent;
      transition: border-color 0.2s;
    }
    :host ::ng-deep .markdown-body a:hover { border-bottom-color: #60A5FA; }

    /* Inline Code */
    :host ::ng-deep .markdown-body :not(pre) > code { 
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      background-color: rgba(255, 255, 255, 0.1); 
      color: #E5E7EB;
      padding: 0.2em 0.4em; 
      border-radius: 6px; 
      font-size: 0.85em;
    }

    /* Code Blocks */
    :host ::ng-deep .markdown-body pre {
      background-color: #1E1F20;
      padding: 1rem;
      border-radius: 12px;
      overflow-x: auto;
      margin: 1rem 0;
      border: 1px solid #3c4043;
      position: relative;
    }
    
    :host ::ng-deep .markdown-body pre code {
      background-color: transparent;
      padding: 0;
      color: #E3E3E3;
      font-size: 0.875em;
      line-height: 1.6;
      white-space: pre;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    }

    /* Tables */
    :host ::ng-deep .markdown-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.9em;
    }
    :host ::ng-deep .markdown-body th,
    :host ::ng-deep .markdown-body td {
      border: 1px solid #3c4043;
      padding: 0.75rem;
      text-align: left;
    }
    :host ::ng-deep .markdown-body th {
      background-color: #28292a;
      font-weight: 600;
      color: #F3F4F6;
    }
    :host ::ng-deep .markdown-body tr:nth-child(even) {
      background-color: rgba(255,255,255,0.02);
    }

    /* Blockquotes */
    :host ::ng-deep .markdown-body blockquote {
      border-left: 4px solid #4B5563;
      padding-left: 1rem;
      margin: 1.5rem 0;
      color: #9CA3AF;
      font-style: italic;
    }

    /* Horizontal Rule */
    :host ::ng-deep .markdown-body hr {
      height: 1px;
      background-color: #3c4043;
      border: none;
      margin: 2rem 0;
    }

    /* Strong/Bold */
    :host ::ng-deep .markdown-body strong {
      color: #F9FAFB;
      font-weight: 600;
    }
  `]
})
export class ChatMessageComponent {
  content = input.required<string>();
  role = input.required<'user' | 'model'>();
  reactions = input<MessageReaction[]>([]);
  reactionSelected = output<string>();
  
  isUser = computed(() => this.role() === 'user');
  showEmojiPicker = signal(false);
  quickEmojis = ['👍', '👎', '❤️', '🔥', '😂', '🤔'];
  
  renderedContent = computed(() => {
    try {
      return marked.parse(this.content()) as string;
    } catch (e) {
      console.error('Markdown rendering error', e);
      return this.content();
    }
  });

  toggleEmojiPicker(event: Event) {
    event.stopPropagation();
    this.showEmojiPicker.update(v => !v);
  }

  onReactionClick(emoji: string) {
    this.reactionSelected.emit(emoji);
  }
}