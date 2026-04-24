import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'chatTime', standalone: true })
export class ChatTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
