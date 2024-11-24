import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocationService } from '../services/location.service';
import { WebSocketService } from '../services/websocket.service';
import { Location } from '../models/location.model';
//import * as L from 'leaflet';

//declare var window: any; 

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  providers: [LocationService, WebSocketService]
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: any;
  private L: any;
  private markers: any[] = [];
  //  { lat: 31.9539, lng: 35.9106 }, // Amman
  //  { lat: 32.5568, lng: 35.8469 }  // Irbid
  // ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private locationService: LocationService,
    private webSocketService: WebSocketService
  ) { }

  ngOnInit() {
    // Charger les locations initiales depuis l'API
    this.locationService.getAllLocations().subscribe({
      next: (locations: Location[]) => {
        this.markers = this.locationService.mapLocationsToMarkers(locations);
        //this.addMarkersToMap(); // Ajoutez les marqueurs initiaux
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des locations:', error);
      }
    });

    // Écouter les nouvelles positions via WebSocket
    this.webSocketService.getNewLocation().subscribe((location: Location | null) => {
      if (location) {
        this.addMarker(location); // Ajoutez le nouveau marqueur à la carte
      }
    });
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      import('leaflet').then((module) => {
        this.L = module.default; // Accès explicite à "default"
        this.L.Icon.Default.imagePath = '/';

        this.initializeMap(this.L);
        this.addMarkersToMap(this.L);
        this.centerMap(this.L);
      }).catch((error) => {
        console.error('Erreur de chargement de Leaflet:', error);
      });
    }
  }

  private initializeMap(L: any) {
    const baseMapURl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.map = L.map('map');
    L.tileLayer(baseMapURl).addTo(this.map);
  }

  private addMarkersToMap(L: any) {
    this.markers.forEach(({ lat, lng }) => {
      const marker = L.marker([lat, lng]);
      marker.addTo(this.map);
    });
  }

  private addMarker(location: Location) {
    //const newMarkers = this.locationService.mapLocationsToMarkers([location]);
    const marker = this.L.marker([location.location.y, location.location.x]); // Ajoutez le marqueur pour la nouvelle position
    marker.addTo(this.map);
    this.markers.push(marker); // Met à jour la liste locale des marqueurss
    this.centerMap(this.L);
  }

  private centerMap(L: any) {
    if (this.markers.length === 0) return;
    //const bounds = L.latLngBounds(this.markers.map((marker: any) => marker.getLatLng()));
    const bounds = L.latLngBounds(this.markers.map(({ lat, lng }) => L.latLng(lat, lng)));
    this.map.fitBounds(bounds);
  }
}
