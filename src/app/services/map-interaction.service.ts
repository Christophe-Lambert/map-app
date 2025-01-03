import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapInteractionService {
  private flyToSubject = new Subject<{ lat: number; lng: number }>();

  flyTo$ = this.flyToSubject.asObservable();

  // Méthode pour émettre les coordonnées
  flyTo(lat: number, lng: number): void {
    this.flyToSubject.next({ lat, lng });
  }
}
