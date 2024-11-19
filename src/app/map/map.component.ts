import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocationService } from '../services/location.service';
import { Location } from '../models/location.model';
import * as L from 'leaflet';

declare var window: any; 

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  providers: [LocationService]
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: any;
  private markers: any[] = [
    { lat: 31.9539, lng: 35.9106 }, // Amman
    { lat: 32.5568, lng: 35.8469 }  // Irbid
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private locationService: LocationService) { }

  ngOnInit() {
    this.locationService.getAllLocations().subscribe({
      next: (locations: Location[]) => {
        this.markers = this.locationService.mapLocationsToMarkers(locations);
      },
      error: (error) => {
        console.error("Erreur lors de la récupération des locations :", error);
      }
    });
   }

  async ngAfterViewInit() {
    // Vérifiez que nous sommes dans un environnement navigateur
    //if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      if (isPlatformBrowser(this.platformId)) {
        import('leaflet').then((module) => {
          const L = module.default; // Accès explicite à "default"
      
          L.Icon.Default.imagePath = '/';
          this.initializeMap(L);
          this.addMarkers(L);
          this.centerMap(L);
        }).catch((error) => {
          console.error('Erreur de chargement de Leaflet:', error);
        });
      //const L = await import('leaflet'); // Import dynamique de leaflet

      // Définissez le chemin des icônes après l'importation
      //L.Icon.Default.imagePath = '/';

      // Retarder l'initialisation de la carte pour s'assurer que la div est rendue
      /*setTimeout(() => {
        this.initializeMap(L);
        this.addMarkers(L);
        this.centerMap(L);
        this.map.invalidateSize();
      }, 0);*/
    }
  }

  private initializeMap(L: any) {
    const baseMapURl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.map = L.map('map');
    L.tileLayer(baseMapURl).addTo(this.map);
  }

  private addMarkers(L: any) {
    // Ajoutez les marqueurs à la carte après l'import de L
    this.markers.forEach(({ lat, lng }) => {
      const marker = L.marker([lat, lng]);
      marker.addTo(this.map);
    });
  }

  private centerMap(L: any) {
    // Créez un objet LatLngBounds pour ajuster la vue de la carte aux marqueurs
    const bounds = L.latLngBounds(this.markers.map(({ lat, lng }) => L.latLng(lat, lng)));
    this.map.fitBounds(bounds);
  }
}
