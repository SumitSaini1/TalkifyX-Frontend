import { Component, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RoomService } from '../../../core/services/room.service';
import { User, Room, RoomRequest } from '../../../core/models';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-new-chat-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal glass" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-header">
          <h2>New Conversation</h2>
          <button class="close-btn" (click)="close.emit()">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab" [class.active]="tab() === 'dm'" (click)="tab.set('dm')">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 17a6.974 6.974 0 01-4.696-1.81z"/></svg>
            Direct Message
          </button>
          <button class="tab" [class.active]="tab() === 'group'" (click)="tab.set('group')">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
            Group Chat
          </button>
        </div>

        <!-- DM Tab -->
        @if(tab() === 'dm') {
          <div class="tab-content">
            <div class="search-field">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
              <input [(ngModel)]="dmSearch" (input)="searchUsers()" placeholder="Search users by username..."/>
            </div>

            @if(searching()) {
              <div class="search-hint"><span class="mini-spinner"></span> Searching...</div>
            }

            @if(searchResults().length > 0) {
              <div class="user-list">
                @for(user of searchResults(); track user.id) {
                  <div class="user-item" (click)="selectDmUser(user)" [class.selected]="selectedDmUser()?.id === user.id">
                    <img [src]="avatarOf(user)" class="user-avatar" [alt]="user.fullName"/>
                    <div class="user-details">
                      <span class="user-fullname">{{ user.fullName }}</span>
                      <span class="user-uname">&#64;{{ user.username }}</span>
                    </div>
                    @if(selectedDmUser()?.id === user.id) {
                      <svg viewBox="0 0 20 20" fill="currentColor" class="check-icon"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                    }
                  </div>
                }
              </div>
            } @else if(dmSearch && !searching()) {
              <div class="empty-search">No users found for "{{ dmSearch }}"</div>
            }

            @if(error()) {
              <div class="alert-error">{{ error() }}</div>
            }

            <button class="create-btn" [disabled]="!selectedDmUser() || creating()" (click)="createDM()">
              @if(creating()) { <span class="mini-spinner white"></span> } Starting conversation...
            </button>
          </div>
        }

        <!-- Group Tab -->
        @if(tab() === 'group') {
          <div class="tab-content">
            <div class="field">
              <label>Group Name *</label>
              <input class="text-input" [(ngModel)]="groupName" placeholder="e.g. Project Team"/>
            </div>
            <div class="field">
              <label>Description</label>
              <input class="text-input" [(ngModel)]="groupDesc" placeholder="What's this group about?"/>
            </div>

            <!-- Add members -->
            <div class="field">
              <label>Add Members</label>
              <div class="search-field">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
                <input [(ngModel)]="memberSearch" (input)="searchUsers()" placeholder="Search users..."/>
              </div>
              @if(searchResults().length > 0) {
                <div class="user-list small">
                  @for(user of searchResults(); track user.id) {
                    <div class="user-item" (click)="toggleGroupMember(user)">
                      <img [src]="avatarOf(user)" class="user-avatar sm" [alt]="user.fullName"/>
                      <div class="user-details">
                        <span class="user-fullname sm">{{ user.fullName }}</span>
                        <span class="user-uname">&#64;{{ user.username }}</span>
                      </div>
                      <div class="checkbox" [class.checked]="isGroupMember(user.id)">
                        @if(isGroupMember(user.id)) {
                          <svg viewBox="0 0 12 12" fill="currentColor"><path d="M10 3L5 8.5 2 5.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Selected members chips -->
            @if(selectedGroupMembers().length > 0) {
              <div class="selected-chips">
                @for(user of selectedGroupMembers(); track user.id) {
                  <div class="chip">
                    <img [src]="avatarOf(user)" class="chip-avatar"/>
                    {{ user.username }}
                    <button (click)="removeGroupMember(user.id)">×</button>
                  </div>
                }
              </div>
            }

            @if(error()) {
              <div class="alert-error">{{ error() }}</div>
            }

            <button class="create-btn" [disabled]="!groupName.trim() || creating()" (click)="createGroup()">
              @if(creating()) { <span class="mini-spinner white"></span> } Create Group
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 500; padding: 20px;
    }
    .glass {
      background: rgba(255,255,255,0.92); backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.9);
      box-shadow: 0 20px 60px rgba(124,58,237,0.18);
    }
    .modal { width: 100%; max-width: 460px; border-radius: 24px; overflow: hidden; }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 24px 16px;
    }
    h2 { font-size: 1.3rem; font-weight: 700; color: #1F2937; margin: 0; }
    .close-btn {
      width: 34px; height: 34px; border-radius: 9px; border: none;
      background: rgba(124,58,237,0.08); color: #7C3AED; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .close-btn svg { width: 16px; height: 16px; }
    .tabs { display: flex; gap: 4px; padding: 0 24px 16px; }
    .tab {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px; border-radius: 12px; border: 1.5px solid #E5E7EB;
      background: transparent; color: #6B7280; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .tab svg { width: 16px; height: 16px; }
    .tab.active {
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      border-color: transparent; color: white;
    }
    .tab-content { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 14px; }
    .search-field {
      display: flex; align-items: center; gap: 8px;
      border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 0 12px;
      background: rgba(255,255,255,0.8); transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-field:focus-within { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
    .search-field svg { width: 16px; height: 16px; color: #9CA3AF; flex-shrink: 0; }
    .search-field input { flex: 1; border: none; background: transparent; padding: 11px 0; font-size: 0.9rem; outline: none; color: #374151; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 0.82rem; font-weight: 600; color: #374151; }
    .text-input {
      border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 11px 14px;
      font-size: 0.9rem; color: #1F2937; background: rgba(255,255,255,0.8); outline: none;
      transition: border-color 0.2s;
    }
    .text-input:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
    .search-hint { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #9CA3AF; }
    .user-list { border: 1px solid rgba(124,58,237,0.1); border-radius: 14px; overflow: hidden; max-height: 220px; overflow-y: auto; }
    .user-list.small { max-height: 160px; }
    .user-list::-webkit-scrollbar { width: 4px; }
    .user-list::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.2); border-radius: 2px; }
    .user-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      cursor: pointer; transition: background 0.15s;
    }
    .user-item:hover { background: rgba(124,58,237,0.05); }
    .user-item.selected { background: rgba(124,58,237,0.08); }
    .user-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1.5px solid rgba(124,58,237,0.15); flex-shrink: 0; }
    .user-avatar.sm { width: 32px; height: 32px; }
    .user-details { flex: 1; min-width: 0; }
    .user-fullname { display: block; font-weight: 600; font-size: 0.88rem; color: #1F2937; }
    .user-fullname.sm { font-size: 0.82rem; }
    .user-uname { font-size: 0.75rem; color: #9CA3AF; }
    .check-icon { width: 20px; height: 20px; color: #7C3AED; flex-shrink: 0; }
    .checkbox {
      width: 20px; height: 20px; border-radius: 6px; border: 2px solid #E5E7EB;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      transition: all 0.15s;
    }
    .checkbox.checked { background: linear-gradient(135deg, #7C3AED, #A855F7); border-color: transparent; }
    .checkbox svg { width: 12px; height: 12px; }
    .selected-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      display: flex; align-items: center; gap: 6px; padding: 4px 10px 4px 4px;
      background: rgba(124,58,237,0.1); border-radius: 20px; font-size: 0.8rem;
      font-weight: 600; color: #7C3AED;
    }
    .chip-avatar { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; }
    .chip button { border: none; background: none; cursor: pointer; color: #7C3AED; font-size: 1rem; line-height: 1; padding: 0; }
    .empty-search { text-align: center; color: #9CA3AF; font-size: 0.85rem; padding: 12px; }
    .alert-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 10px; padding: 10px 14px; font-size: 0.85rem; }
    .create-btn {
      width: 100%; padding: 13px;
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      color: white; border: none; border-radius: 12px; font-size: 0.95rem;
      font-weight: 600; cursor: pointer; display: flex; align-items: center;
      justify-content: center; gap: 8px; transition: opacity 0.2s;
    }
    .create-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .mini-spinner {
      width: 16px; height: 16px; border: 2px solid rgba(124,58,237,0.3);
      border-top-color: #7C3AED; border-radius: 50%;
      animation: spin 0.7s linear infinite; display: inline-block;
    }
    .mini-spinner.white { border-color: rgba(255,255,255,0.3); border-top-color: white; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class NewChatModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() roomCreated = new EventEmitter<Room>();

  tab = signal<'dm' | 'group'>('dm');
  searching = signal(false);
  creating = signal(false);
  error = signal('');

  dmSearch = '';
  memberSearch = '';
  searchResults = signal<User[]>([]);
  selectedDmUser = signal<User | null>(null);
  selectedGroupMembers = signal<User[]>([]);
  groupName = '';
  groupDesc = '';

  private searchSubject = new Subject<string>();

  constructor(private auth: AuthService, private roomService: RoomService) {}

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300)).subscribe(q => {
      if (!q.trim()) { this.searchResults.set([]); this.searching.set(false); return; }
      this.auth.searchUsers(q).subscribe({
        next: users => { this.searchResults.set(users.filter(u => u.id !== this.auth.getUserId())); this.searching.set(false); },
        error: () => this.searching.set(false)
      });
    });
  }

  searchUsers(): void {
    const q = this.tab() === 'dm' ? this.dmSearch : this.memberSearch;
    this.searching.set(true);
    this.searchSubject.next(q);
  }

  selectDmUser(user: User): void { this.selectedDmUser.set(user); }

  toggleGroupMember(user: User): void {
    const members = this.selectedGroupMembers();
    const idx = members.findIndex(m => m.id === user.id);
    if (idx >= 0) { this.selectedGroupMembers.set(members.filter(m => m.id !== user.id)); }
    else { this.selectedGroupMembers.set([...members, user]); }
  }

  removeGroupMember(userId: number): void {
    this.selectedGroupMembers.update(arr => arr.filter(u => u.id !== userId));
  }

  isGroupMember(userId: number): boolean {
    return this.selectedGroupMembers().some(u => u.id === userId);
  }

  createDM(): void {
    const other = this.selectedDmUser();
    const myId = this.auth.getUserId();
    if (!other || !myId) return;
    this.creating.set(true); this.error.set('');
    const req: RoomRequest = { name: `dm_${myId}_${other.id}`, type: 'DM', isPrivate: true };
    this.roomService.createRoom(req).subscribe({
      next: room => {
        this.roomService.addMember(room.roomId, other.id).subscribe({
          next: () => { this.creating.set(false); this.roomCreated.emit({ ...room, otherUser: other }); },
          error: err => { this.creating.set(false); this.error.set(err.error?.message || 'Failed to add member.'); }
        });
      },
      error: err => { this.creating.set(false); this.error.set(err.error?.message || 'Failed to create conversation.'); }
    });
  }

  createGroup(): void {
    if (!this.groupName.trim()) return;
    this.creating.set(true); this.error.set('');
    const req: RoomRequest = { name: this.groupName.trim(), description: this.groupDesc.trim(), type: 'GROUP', isPrivate: false };
    this.roomService.createRoom(req).subscribe({
      next: room => {
        const memberIds = this.selectedGroupMembers().map(u => u.id);
        let pending = memberIds.length;
        if (pending === 0) { this.creating.set(false); this.roomCreated.emit(room); return; }
        memberIds.forEach(uid => {
          this.roomService.addMember(room.roomId, uid).subscribe({
            next: () => { if (--pending === 0) { this.creating.set(false); this.roomCreated.emit(room); } },
            error: () => { if (--pending === 0) { this.creating.set(false); this.roomCreated.emit(room); } }
          });
        });
      },
      error: err => { this.creating.set(false); this.error.set(err.error?.message || 'Failed to create group.'); }
    });
  }

  avatarOf(user: User): string {
    if (user.avatarUrl) return user.avatarUrl;
    const initial = (user.fullName || user.username || '?').charAt(0).toUpperCase();
    const svg = `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#EDE8FF"/><text x="18" y="23" text-anchor="middle" fill="#7C3AED" font-family="system-ui" font-size="13" font-weight="700">${initial}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close.emit();
  }
}
