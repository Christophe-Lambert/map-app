import { Component, OnInit, AfterViewInit } from '@angular/core';
import { LocationService } from '../services/location.service';
import { WebSocketService } from '../services/websocket.service';
import { Location } from '../models/location.model';
import { SvgIconService } from '../services/svg.icon.service';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import * as d3 from 'd3';
import { MapInteractionService } from '../services/map-interaction.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  providers: [LocationService, WebSocketService, SvgIconService]
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: any;
  private markers: Location[] = [];
  private markerClusterGroup: any;
  private subscription: Subscription | undefined;
  isSpiderEnabled = true; 

  constructor(
    private locationService: LocationService,
    private webSocketService: WebSocketService,
    private svgIconService: SvgIconService,
    private mapInteractionService: MapInteractionService,
  ) { }

  ngOnInit() {
    // Charger les locations initiales depuis l'API
    this.locationService.getAllLocations().subscribe({
      next: (locations: Location[]) => {
        this.markers = locations;
        this.addMarkersToMap();
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des locations:', error);
      }
    });

    // Écouter les nouvelles positions via WebSocket
    this.webSocketService.getNewLocation().subscribe((location: Location | null) => {
      if (location) {
        this.addMarker(location); // Ajouter le nouveau marqueur à la carte
      }
    });

    this.subscription = this.mapInteractionService.flyTo$.subscribe((coords) => {
      this.flyTo(coords.lat, coords.lng);
    });
  }

  async ngAfterViewInit() {
    this.initializeMap();
  }

  flyTo(lat: number, lng: number): void {
    this.map.flyTo([lat, lng], 12);
  }

  ngOnDestroy(): void {
    // Désabonnez-vous pour éviter les fuites de mémoire
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private initializeMap() {
    const baseMapURL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.map = L.map('map', {
      center: [39.8282, -98.5795],
      zoom: 3
    });

    const tiles = L.tileLayer(baseMapURL, {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);

    // Configurer le groupe de clusters avec une fonction `iconCreateFunction`
    this.markerClusterGroup = L.markerClusterGroup({
      spiderfyOnMaxZoom: this.isSpiderEnabled,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const markers = cluster.getAllChildMarkers();
        const typeCounts = this.getClusterTypeCounts(markers);

        // Créez un pie chart pour l'icône
        const pieChartDiv = this.createClusterPieChart(typeCounts);

        // Retournez l'icône
        return L.divIcon({
          html: pieChartDiv.outerHTML,
          className: '',
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        });
      },
    });

    // Ajouter l'événement pour afficher un popup
    this.markerClusterGroup.on('clustermouseover', (event: { layer: any; }) => {
      const cluster = event.layer;
    
      // Récupérer les informations des marqueurs contenus dans le cluster
      const markers = cluster.getAllChildMarkers();
      const typeCounts = this.getClusterTypeCounts(markers);
  
      const clusterPopup = `
      <div>
        <strong>Total:</strong> ${markers.length} items<br>
        ${Object.entries(typeCounts).map(([type, { count, color }]) => `
          <div style="display: flex; align-items: center;">
            <div style="width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 5px;"></div>
            <strong>${type}:</strong> ${count}
          </div>
        `).join('')}
      </div>
    `;
    
      // Créez et ouvrez le popup
      cluster.bindPopup(clusterPopup).openPopup();
    });
    

    // Fermez le popup lorsque la souris quitte le cluster
    this.markerClusterGroup.on('clustermouseout', (event: { layer: any; }) => {
      const cluster = event.layer;

      // Fermez et détachez le popup
      cluster.closePopup();
      cluster.unbindPopup();
    });

    this.map.addLayer(this.markerClusterGroup);
  }

  private getClusterTypeCounts(markers: any[]): { [key: string]: { count: number, color: string } } {
    const counts: { [key: string]: { count: number, color: string } } = {};
  
    markers.forEach((marker: any) => {
      const [name, id, color] = marker.options.title.split('|');
  
      if (!counts[name]) {
        counts[name] = { count: 1, color: color };  // Ajouter le type et la couleur si ce n'est pas encore dans counts
      } else {
        counts[name].count += 1;  // Incrémenter le nombre de marqueurs pour ce type
      }
    });
  
    return counts;
  }

  private createClusterPieChart(markerData: { [key: string]: { count: number, color: string } }): HTMLElement {
    // Créer un élément div pour le graphique
    const div = document.createElement('div');
    div.style.width = '50px';
    div.style.height = '50px';
    div.classList.add('d3-piechart-container');
  
    // Extraire les données sous forme de tableau avec uniquement les "count" pour d3.pie()
    const data = Object.values(markerData).map(item => item.count);  // Nous ne gardons que les valeurs "count"
  
    // Créer une fonction d'arc pour le camembert
    const arc = d3.arc()
      .innerRadius(0)  // Radius interne
      .outerRadius(25);  // Radius externe
  
    // Créer une fonction pie pour générer les arcs à partir des données
    const pie = d3.pie().value((d: any) => d);  // Utiliser la valeur numérique directement
  
    // Créer l'élément SVG
    const svg = d3.select(div)
      .append('svg')
      .attr('width', '50')
      .attr('height', '50')
      .append('g')
      .attr('transform', 'translate(25,25)'); // Centrer le graphique dans le div
  
    // Créer les segments du graphique en camembert
    const arcs = svg.selectAll('path')
      .data(pie(data))  // Applique le pie chart avec les données
      .enter()
      .append('path')
      .attr('d', (d: any) => arc(d))  // Appeler arc(d) pour obtenir le chemin SVG
      .attr('fill', (d: any, i: number) => {
        // Utiliser l'index pour récupérer la couleur correspondante
        return Object.values(markerData)[i].color;
      });
  
    // Ajouter le texte au centre (total)
    const total = data.reduce((sum, value) => sum + value, 0);  // Calculer la somme des valeurs
    svg.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')  // Position verticale pour centrer le texte
      .attr('font-size', '12px')
      .attr('fill', '#000')
      .text(total);  // Afficher la somme totale au centre
  
    return div;
  }
  
  private async addMarker(location: Location) {
    if (!this.map || !this.markerClusterGroup) return; // Assurez-vous que la carte est prête

    const marker = await this.createMarker(location);
    if (!this.markerClusterGroup.hasLayer(marker)) {
      this.markerClusterGroup.addLayer(marker);
      this.markers.push(location); // Ajoutez à la liste seulement après validation
      this.centerMap();
    }
  }

  private async addMarkersToMap() {
    this.markers.forEach(async (location) => {
      const marker = await this.createMarker(location);
      if (marker) {
        //console.log(`Marker créé pour ${location.name}`);
        this.markerClusterGroup.addLayer(marker);
      } else {
        console.warn(`Marker non créé pour ${location.name}`);
      }
    });
    this.markerClusterGroup.refreshClusters();
    this.centerMap();
  }
  
  private centerMap() {
    if (this.markers.length === 0) return;

    const bounds = L.latLngBounds(
      this.markers.map((location) => L.latLng(location.location.y!, location.location.x!))
    );

    this.map.fitBounds(bounds);
  }

  private async createMarker(location: Location) {
    const icon = await this.createSvgIcon(location.icon, location.color);
    const title = `${location.name}|${location.id}|${location.color}`;
    const markerOptions: L.MarkerOptions = { icon: icon, title: title };
    const marker = L.marker([location.location.y!, location.location.x!], markerOptions);
    marker.bindPopup(`<b>${location.name}</b>`); // TODO Exemple de popup
    return marker;
  }

  private async createSvgIcon(iconText: any, color: any) {
    const svg = await this.svgIconService.generateSvgIcon(iconText, color);

    return L.divIcon({
      html: svg,
      className: '',
      iconSize: [25, 41],
      iconAnchor: [12.5, 41],
    });
  }

  toggleSpiderMode() {
    this.isSpiderEnabled = !this.isSpiderEnabled;
  
    if (this.markerClusterGroup) {
      this.markerClusterGroup.options.spiderfyOnMaxZoom = this.isSpiderEnabled;
  
      // Rafraîchir les clusters pour appliquer les nouvelles options
      this.markerClusterGroup.refreshClusters();
  
      // Si le mode spider est activé, forcez l'effet spider sur les clusters visibles
      if (this.isSpiderEnabled) {
        this.forceSpiderfy();
      }
    } else {
      console.error("markerClusterGroup n'est pas initialisé.");
    }
  }  

  private forceSpiderfy() {
    // Parcourir tous les clusters visibles
    this.markerClusterGroup.eachLayer((layer: any) => {
      // Vérifiez si le layer est un cluster valide
      if (layer instanceof L.MarkerCluster && layer.getChildCount && layer.getChildCount() > 1) {
        // Si le cluster a plusieurs enfants, déclencher spiderfy
        layer.spiderfy();
      }
    });
  }
}
