import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar-container" [style.width.px]="size" [style.height.px]="size">
      <img
        [src]="src()"
        [alt]="alt()"
        class="avatar-img"
        [style.width.px]="size"
        [style.height.px]="size"
        (error)="onError($event)"
      />
      @if(showStatus) {
        <span
          class="status-badge"
          [class]="'status-' + (status || 'offline').toLowerCase()"
          [style.width.px]="statusSize()"
          [style.height.px]="statusSize()"
        ></span>
      }
    </div>
  `,
  styles: [`
    .avatar-container {
      position: relative;
      display: inline-block;
      flex-shrink: 0;
    }
    .avatar-img {
      border-radius: 50%;
      object-fit: cover;
      display: block;
      border: 2px solid rgba(124, 58, 237, 0.15);
    }
    .status-badge {
      position: absolute;
      bottom: 1px;
      right: 1px;
      border-radius: 50%;
      border: 2px solid white;
    }
    .status-online   { background: #10B981; }
    .status-away     { background: #F59E0B; }
    .status-dnd      { background: #EF4444; }
    .status-offline,
    .status-invisible { background: #9CA3AF; }
  `]
})
export class AvatarComponent {
  @Input() user: User | null = null;
  @Input() name = '';
  @Input() imageUrl = '';
  @Input() size = 40;
  @Input() showStatus = false;
  @Input() status = 'OFFLINE';

  private errored = false;

  src = computed(() => {
    if (!this.errored && this.imageUrl) return this.imageUrl;
    if (!this.errored && this.user?.avatarUrl) return this.user.avatarUrl;
    return this.generatePlaceholder();
  });

  alt = computed(() => {
    if (this.user) return this.user.fullName || this.user.username;
    return this.name || 'Avatar';
  });

  statusSize = computed(() => Math.max(8, Math.floor(this.size * 0.26)));

  onError(e: Event): void {
    this.errored = true;
    const img = e.target as HTMLImageElement;
    img.src = this.generatePlaceholder();
  }

  private generatePlaceholder(): string {
    const displayName = this.user?.fullName || this.user?.username || this.name || '?';
    const initial = displayName.charAt(0).toUpperCase();
    const id = this.user?.id || 0;
    const colors = ['#7C3AED', '#A855F7', '#6D28D9', '#8B5CF6', '#9333EA'];
    const color = colors[id % colors.length];
    const bg = color + '22';
    const fs = Math.max(10, Math.floor(this.size * 0.4));
    const cy = Math.floor(this.size * 0.63);
    const svg = `<svg viewBox="0 0 ${this.size} ${this.size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${this.size/2}" cy="${this.size/2}" r="${this.size/2}" fill="${bg}"/>
      <text x="${this.size/2}" y="${cy}" text-anchor="middle" fill="${color}"
        font-family="system-ui,-apple-system,sans-serif"
        font-size="${fs}" font-weight="700">${initial}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
}
