import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { LocationService } from '../services/location.service';
import { WebSocketService } from '../services/websocket.service';
import { Location } from '../models/location.model';
import { SvgIconService } from '../services/svg.icon.service';
import * as L from 'leaflet';
import 'leaflet.markercluster'; 

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  providers: [LocationService, WebSocketService, SvgIconService]
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: any;
  private markers: any[] = [];
  private markerClusterGroup: any; 

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
        this.addMarkersToMap();
        this.centerMap();
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
      this.initializeMap();
  }

  private initializeMap() {
    L.Icon.Default.imagePath = '/';
    const baseMapURl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.map = L.map('map', {
      center: [ 39.8282, -98.5795 ],
      zoom: 3
    });

    const tiles = L.tileLayer(baseMapURl, {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
    this.markerClusterGroup = L.markerClusterGroup();
  }

  private addMarkersToMap() {
    this.markers.forEach(async (location: Location) => {
      const marker = await this.createMarker(location);
      this.markerClusterGroup.addLayer(marker);
      this.map.addLayer(this.markerClusterGroup);
    });
  }

  private async addMarker(location: Location) {
    const marker = await this.createMarker(location);
    marker.addTo(this.map);
    this.markerClusterGroup.addLayer(marker); // Ajouter le nouveau marqueur au groupe de clusters
    this.markers.push(marker); // Met à jour la liste locale des marqueurs
    this.centerMap();
  }

  private centerMap() {
    if (this.markers.length === 0) return;
    const bounds = L.latLngBounds(this.markers.map((location) => L.latLng(location.location.y, location.location.x)));
    this.map.fitBounds(bounds);
  }

  private async createMarker(location: Location) {
    const icon = await this.createSvgIcon('directions_bus', 'blue');
    const marker = L.marker([location.location.y!, location.location.x!], { icon: icon});
    return marker;
  }

  private async createSvgIcon(iconText: any, color: any) {
    const svg = await this.svgIconService.generateSvgIcon(iconText, color);

    return L.divIcon({
      html: svg,
      className: '', // Pas de classe CSS
      iconSize: [25, 41], // Taille du marqueur
      iconAnchor: [12.5, 41] // Pointe de la goutte en bas
    });
  }
}
