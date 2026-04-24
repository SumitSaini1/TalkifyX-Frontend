import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-container" [class.fade-out]="fadingOut">
      <div class="splash-content">
        <div class="logo-wrapper" [class.visible]="visible">
          <div class="logo-icon">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="32" fill="url(#splashGrad)"/>
              <path d="M14 22c0-3.3 2.7-6 6-6h24c3.3 0 6 2.7 6 6v14c0 3.3-2.7 6-6 6h-8l-8 6v-6h-8c-3.3 0-6-2.7-6-6V22z" fill="white"/>
              <circle cx="24" cy="29" r="2.5" fill="url(#splashGrad)"/>
              <circle cx="32" cy="29" r="2.5" fill="url(#splashGrad)"/>
              <circle cx="40" cy="29" r="2.5" fill="url(#splashGrad)"/>
              <defs>
                <linearGradient id="splashGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#7C3AED"/>
                  <stop offset="1" stop-color="#A855F7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 class="app-name">TalkifyX</h1>
          <p class="tagline">Connect. Chat. Collaborate.</p>
          <div class="dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .splash-container {
      position: fixed; inset: 0;
      background: linear-gradient(135deg, #f8f4ff 0%, #ede8ff 50%, #e4d9ff 100%);
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.7s ease, transform 0.7s ease;
      z-index: 9999;
    }
    .splash-container.fade-out {
      opacity: 0;
      transform: scale(1.05);
    }
    .splash-content {
      display: flex; align-items: center; justify-content: center;
    }
    .logo-wrapper {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      opacity: 0; transform: translateY(30px) scale(0.95);
      transition: opacity 0.7s ease, transform 0.7s ease;
    }
    .logo-wrapper.visible {
      opacity: 1; transform: translateY(0) scale(1);
    }
    .logo-icon {
      width: 100px; height: 100px;
      filter: drop-shadow(0 8px 32px rgba(124,58,237,0.3));
      animation: float 3s ease-in-out infinite;
    }
    .logo-icon svg { width: 100%; height: 100%; }
    .app-name {
      font-size: 3rem; font-weight: 800;
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -1px; margin: 0;
    }
    .tagline {
      color: #9CA3AF; font-size: 1rem; letter-spacing: 2px;
      text-transform: uppercase; margin: 0;
    }
    .dots {
      display: flex; gap: 8px; margin-top: 8px;
    }
    .dots span {
      width: 8px; height: 8px; border-radius: 50%;
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      animation: bounce 1.4s infinite ease-in-out;
    }
    .dots span:nth-child(1) { animation-delay: 0s; }
    .dots span:nth-child(2) { animation-delay: 0.2s; }
    .dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `]
})
export class SplashComponent implements OnInit {
  visible = false;
  fadingOut = false;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    setTimeout(() => this.visible = true, 100);
    setTimeout(() => {
      this.fadingOut = true;
      setTimeout(() => {
        const target = this.auth.isAuthenticated() ? '/chat' : '/auth/login';
        this.router.navigate([target]);
      }, 700);
    }, 2800);
  }
}
