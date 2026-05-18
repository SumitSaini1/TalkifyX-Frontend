import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageBubbleComponent } from '../src/app/features/chat/message-bubble/message-bubble.component';
import { Message } from '../src/app/core/models';

const makeMsg = (overrides: Partial<Message> = {}): Message => ({
  messageId: 'm1',
  roomId: 1,
  senderId: 1,
  content: 'Hello world',
  type: 'TEXT',
  isEdited: false,
  isDeleted: false,
  deliveryStatus: 'SENT',
  sentAt: '2024-01-15T14:30:00Z',
  ...overrides,
});

describe('MessageBubbleComponent', () => {
  let fixture: ComponentFixture<MessageBubbleComponent>;
  let component: MessageBubbleComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MessageBubbleComponent);
    component = fixture.componentInstance;
    component.message = makeMsg();
    component.isOwn = false;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  // ── senderName() ──────────────────────────────────────────
  describe('senderName()', () => {
    it('returns senderName when present', () => {
      component.message = makeMsg({ senderName: 'Alice' });
      expect(component.senderName()).toBe('Alice');
    });

    it('falls back to User {senderId} when no senderName', () => {
      component.message = makeMsg({ senderName: undefined, senderId: 99 });
      expect(component.senderName()).toBe('User 99');
    });
  });

  // ── senderAvatar() ────────────────────────────────────────
  describe('senderAvatar()', () => {
    it('returns senderAvatar URL when present', () => {
      component.message = makeMsg({ senderAvatar: 'https://example.com/avatar.jpg' });
      expect(component.senderAvatar()).toBe('https://example.com/avatar.jpg');
    });

    it('generates SVG data URI when no senderAvatar', () => {
      component.message = makeMsg({ senderAvatar: undefined, senderName: 'Bob' });
      const avatar = component.senderAvatar();
      expect(avatar.startsWith('data:image/svg+xml;base64,')).toBe(true);
    });
  });

  // ── formatTime() ──────────────────────────────────────────
  describe('formatTime()', () => {
    it('returns empty string for empty input', () => {
      expect(component.formatTime('')).toBe('');
    });

    it('returns HH:MM formatted time', () => {
      expect(component.formatTime('2024-01-15T14:30:00Z')).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  // ── formatText() ──────────────────────────────────────────
  describe('formatText()', () => {
    it('escapes HTML special characters', () => {
      expect(component.formatText('<script>')).toContain('&lt;script&gt;');
    });

    it('converts **bold** to <strong>', () => {
      expect(component.formatText('**hello**')).toContain('<strong>hello</strong>');
    });

    it('converts *italic* to <em>', () => {
      expect(component.formatText('*world*')).toContain('<em>world</em>');
    });

    it('converts URLs to anchor tags', () => {
      const result = component.formatText('Visit https://example.com now');
      expect(result).toContain('<a href="https://example.com"');
    });

    it('escapes & to &amp;', () => {
      expect(component.formatText('a & b')).toContain('&amp;');
    });
  });

  // ── menu signals ──────────────────────────────────────────
  describe('signals', () => {
    it('showMenu starts false', () => expect(component.showMenu()).toBe(false));
    it('hovered starts false', () => expect(component.hovered()).toBe(false));
    it('showDeleteModal starts false', () => expect(component.showDeleteModal()).toBe(false));
    it('showReactPicker starts false', () => expect(component.showReactPicker()).toBe(false));
  });

  // ── toggleMenu() ─────────────────────────────────────────
  describe('toggleMenu()', () => {
    it('should toggle showMenu', () => {
      const event = new MouseEvent('click');
      jest.spyOn(event, 'stopPropagation');
      component.toggleMenu(event);
      expect(component.showMenu()).toBe(true);
      component.toggleMenu(event);
      expect(component.showMenu()).toBe(false);
    });
  });

  // ── openDeleteModal() ────────────────────────────────────
  describe('openDeleteModal()', () => {
    it('should close menu and open delete modal', () => {
      component.showMenu.set(true);
      component.openDeleteModal();
      expect(component.showMenu()).toBe(false);
      expect(component.showDeleteModal()).toBe(true);
    });
  });

  // ── onDeleteForMe() ──────────────────────────────────────
  describe('onDeleteForMe()', () => {
    it('should emit deleteForMe and close modal', () => {
      let emitted: any;
      component.deleteForMe.subscribe((m) => (emitted = m));
      component.showDeleteModal.set(true);
      component.onDeleteForMe();
      expect(emitted.messageId).toBe('m1');
      expect(component.showDeleteModal()).toBe(false);
    });
  });

  // ── onDeleteForEveryone() ────────────────────────────────
  describe('onDeleteForEveryone()', () => {
    it('should emit delete and close modal', () => {
      let emitted: any;
      component.delete.subscribe((m) => (emitted = m));
      component.showDeleteModal.set(true);
      component.onDeleteForEveryone();
      expect(emitted.messageId).toBe('m1');
      expect(component.showDeleteModal()).toBe(false);
    });
  });

  // ── onReply() ────────────────────────────────────────────
  describe('onReply()', () => {
    it('should emit replyTo with message and close menu', () => {
      let emitted: any;
      component.replyTo.subscribe((m) => (emitted = m));
      component.showMenu.set(true);
      component.onReply();
      expect(emitted.messageId).toBe('m1');
      expect(component.showMenu()).toBe(false);
    });
  });

  // ── onEdit() ─────────────────────────────────────────────
  describe('onEdit()', () => {
    it('should emit edit with message and close menu', () => {
      let emitted: any;
      component.edit.subscribe((m) => (emitted = m));
      component.showMenu.set(true);
      component.onEdit();
      expect(emitted.messageId).toBe('m1');
      expect(component.showMenu()).toBe(false);
    });
  });

  // ── onReact() ────────────────────────────────────────────
  describe('onReact()', () => {
    it('should emit react with messageId and emoji and close picker', () => {
      let emitted: any;
      component.react.subscribe((r) => (emitted = r));
      component.showReactPicker.set(true);
      component.onReact('👍');
      expect(emitted.emoji).toBe('👍');
      expect(emitted.messageId).toBe('m1');
      expect(component.showReactPicker()).toBe(false);
    });
  });

  // ── onImageClick() ───────────────────────────────────────
  describe('onImageClick()', () => {
    it('should emit imageClick when mediaUrl is present', () => {
      let emitted: string | undefined;
      component.imageClick.subscribe((url) => (emitted = url));
      component.message = makeMsg({ mediaUrl: 'https://example.com/img.jpg' });
      component.onImageClick();
      expect(emitted).toBe('https://example.com/img.jpg');
    });

    it('should not emit imageClick when no mediaUrl', () => {
      let emitted: any = null;
      component.imageClick.subscribe((url) => (emitted = url));
      component.message = makeMsg({ mediaUrl: undefined });
      component.onImageClick();
      expect(emitted).toBeNull();
    });
  });
});
