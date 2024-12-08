import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { Location } from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client!: Client;
  private locationSubject = new BehaviorSubject<Location | null>(null);
  //private wsUrl = 'http://138.2.172.84:8443/ws';
  private wsUrl = 'https://localhost:8443/ws';

  constructor() {
    this.connect();
  }

  private connect() {
    const socket = new SockJS(this.wsUrl); // Remplacez par l'URL de votre endpoint WebSocket
    this.client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str), // Pour déboguer
      reconnectDelay: 5000, // Reconnexion automatique
    });

    this.client.onConnect = () => {
      console.log('WebSocket connecté');
      this.client.subscribe('/topic/locations', (message: Message) => {
        const location: Location = JSON.parse(message.body);
        this.locationSubject.next(location); // Diffuse la nouvelle position
      });
    };

    this.client.onStompError = (error) => {
      console.error('Erreur STOMP', error);
    };

    this.client.activate();
  }

  getNewLocation(): Observable<Location | null> {
    return this.locationSubject.asObservable();
  }
}
