import { ChatTimePipe } from '../src/app/shared/pipes/chat-time.pipe';
import { TimeAgoPipe } from '../src/app/shared/pipes/time-ago.pipe';

// ============================================================
//  ChatTimePipe
// ============================================================
describe('ChatTimePipe', () => {
  let pipe: ChatTimePipe;

  beforeEach(() => (pipe = new ChatTimePipe()));

  it('returns empty string for null', () => expect(pipe.transform(null)).toBe(''));
  it('returns empty string for undefined', () => expect(pipe.transform(undefined)).toBe(''));

  it('formats a Date object as HH:MM', () => {
    const result = pipe.transform(new Date(2024, 0, 15, 14, 30));
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formats an ISO string', () => {
    const result = pipe.transform('2024-01-15T14:30:00');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

});

// ============================================================
//  TimeAgoPipe
// ============================================================
describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;

  beforeEach(() => (pipe = new TimeAgoPipe()));

  it('returns empty for null', () => expect(pipe.transform(null)).toBe(''));
  it('returns empty for undefined', () => expect(pipe.transform(undefined)).toBe(''));

  it('returns "just now" for < 5 seconds ago', () => {
    expect(pipe.transform(new Date(Date.now() - 2000))).toBe('just now');
  });

  it('returns Xs ago for < 60 seconds', () => {
    expect(pipe.transform(new Date(Date.now() - 30000))).toBe('30s ago');
  });

  it('returns Xm ago for < 1 hour', () => {
    expect(pipe.transform(new Date(Date.now() - 5 * 60 * 1000))).toBe('5m ago');
  });

  it('returns Xh ago for < 1 day', () => {
    expect(pipe.transform(new Date(Date.now() - 3 * 3600 * 1000))).toBe('3h ago');
  });

  it('returns "yesterday" for ~1 day ago', () => {
    expect(pipe.transform(new Date(Date.now() - 1 * 86400 * 1000 - 1000))).toBe('yesterday');
  });

  it('returns Xd ago for 2-6 days ago', () => {
    expect(pipe.transform(new Date(Date.now() - 3 * 86400 * 1000))).toBe('3d ago');
  });

  it('returns locale date string for >= 7 days ago', () => {
    const result = pipe.transform(new Date(Date.now() - 10 * 86400 * 1000));
    expect(result).not.toContain('ago');
    expect(result.length).toBeGreaterThan(0);
  });

  it('accepts ISO string input', () => {
    expect(pipe.transform(new Date(Date.now() - 30000).toISOString())).toBe('30s ago');
  });
});
