import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'error';

export interface ToastPayload {
  message: string;
  type: ToastType;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSubject = new Subject<ToastPayload>();
  toast$ = this.toastSubject.asObservable();

  show(message: string, type: ToastType = 'success', duration: number = 3500): void {
    this.toastSubject.next({ message, type, duration });
  }

  success(message: string, duration: number = 3500): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration: number = 3500): void {
    this.show(message, 'error', duration);
  }
}
