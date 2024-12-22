import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocationService } from '../services/location.service';
import { WebSocketService } from '../services/websocket.service';
import { Location } from '../models/location.model';
import { SvgIconService } from '../services/svg.icon.service'; 
//import * as L from 'leaflet';

//declare var window: any; 

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  providers: [LocationService, WebSocketService, SvgIconService]
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: any;
  private L: any;
  private markers: any[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private locationService: LocationService,
    private webSocketService: WebSocketService,
    private svgIconService: SvgIconService ,
  ) { }

  ngOnInit() {
    // Charger les locations initiales depuis l'API
    this.locationService.getAllLocations().subscribe({
      next: (locations: Location[]) => {
        this.markers = locations;//this.locationService.mapLocationsToMarkers(locations);
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

        this.initializeMap();
        this.addMarkersToMap();
        this.centerMap();
      }).catch((error) => {
        console.error('Erreur de chargement de Leaflet:', error);
      });
    }
  }

  private initializeMap() {
    const baseMapURl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.map = this.L.map('map');
    this.L.tileLayer(baseMapURl).addTo(this.map);
  }

  private addMarkersToMap() {
    this.markers.forEach(async (location: Location) => {
      const marker = await this.createMarker(location);
      marker.addTo(this.map);
    });
  }

  private async addMarker(location: Location) {
    const marker = await this.createMarker(location);
    marker.addTo(this.map);
    this.markers.push(marker); // Met à jour la liste locale des marqueurss
    this.centerMap();
  }

  private centerMap() {
    if (this.markers.length === 0) return;
    const bounds = this.L.latLngBounds(this.markers.map((location) => this.L.latLng(location.location.y, location.location.x)));
    this.map.fitBounds(bounds);
  }

  private async createMarker(location: Location) {
    const icon = await this.createSvgIcon('directions_bus', 'blue');
    const marker = this.L.marker([location.location.y, location.location.x], { icon: icon});
    return marker;
  }

  private async createSvgIcon(iconText: any, color: any) {
    const svg = await this.svgIconService.generateSvgIcon(iconText, color);

    return this.L.divIcon({
      html: svg,
      className: '', // Pas de classe CSS
      iconSize: [25, 41], // Taille du marqueur
      iconAnchor: [12.5, 41] // Pointe de la goutte en bas
    });
  }
}
