import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Location } from '../models/location.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(this.apiUrl);
  }

  // Fonction de mappage des Location vers des marqueurs Leaflet
  mapLocationsToMarkers(locations: Location[]): { lat: number; lng: number; name: string }[] {
    return locations.map(location => ({
      lat: location.location.coordinates[1], // latitude
      lng: location.location.coordinates[0], // longitude
      name: location.name
    }));
  }  
}
