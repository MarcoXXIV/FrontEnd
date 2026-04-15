import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavbarActionService {
  private resetCronologiaSubject = new Subject<void>();
  resetCronologia$ = this.resetCronologiaSubject.asObservable();

  private resetRecensioniSource = new Subject<void>();
  resetRecensioni$ = this.resetRecensioniSource.asObservable();

  requestResetCronologia(): void {
    this.resetCronologiaSubject.next();
  }

  requestResetRecensioni() {
    this.resetRecensioniSource.next();
  }
}
