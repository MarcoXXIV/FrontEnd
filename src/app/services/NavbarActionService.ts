import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavbarActionService {
  private resetCronologiaSubject = new Subject<void>();

  resetCronologia$ = this.resetCronologiaSubject.asObservable();

  requestResetCronologia(): void {
    this.resetCronologiaSubject.next();
  }
}
