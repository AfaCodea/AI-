import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex w-full mb-6 animate-fade-in" [class.justify-end]="isUser()" [class.justify-start]="!isUser()">
      
      <!-- Bot Avatar -->
      @if (!isUser()) {
        <div class="flex-shrink-0 mr-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span class="text-xs font-bold text-white">K</span>
          </div>
        </div>
      }

      <div 
        class="max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-md text-sm sm:text-base leading-relaxed break-words"
        [class.bg-purple-600]="isUser()"
        [class.text-white]="isUser()"
        [class.rounded-tr-none]="isUser()"
        [class.bg-gray-800]="!isUser()"
        [class.text-gray-100]="!isUser()"
        [class.rounded-tl-none]="!isUser()"
        [class.border]="!isUser()"
        [class.border-gray-700]="!isUser()"
      >
        <!-- Content -->
        <div class="whitespace-pre-wrap">{{ content() }}</div>
        
        <!-- Time/Status (Simulated for aesthetics) -->
        <div class="mt-1 flex items-center text-[10px] opacity-60" [class.justify-end]="isUser()">
          <span>{{ isUser() ? 'You' : 'Kongkow' }}</span>
        </div>
      </div>

      <!-- User Avatar -->
      @if (isUser()) {
        <div class="flex-shrink-0 ml-3">
          <div class="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ChatMessageComponent {
  content = input.required<string>();
  role = input.required<'user' | 'model'>();
  
  isUser = computed(() => this.role() === 'user');
}