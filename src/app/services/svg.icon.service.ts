import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SvgIconService {
  private svgCache: string = '';

  constructor(private http: HttpClient) {
    this.loadSvgIcon();
  }

  // Charger une seule fois le fichier SVG
  loadSvgIcon(): void {
    if (this.svgCache) {
      // Si le cache est déjà disponible, on l'utilise
      return;
    }

    this.http.get('/assets/svg/marker-icon.svg', { responseType: 'text' }).subscribe({
      next: (svgContent) => {
        this.svgCache = svgContent;
      },
      error: () => {
        this.svgCache = ''; // En cas d'erreur, on affecte une chaîne vide ou une valeur par défaut
      }
    });
  }

  generateSvgIcon(iconText: string, color: string): string { 
    // Si svgCache est déjà peuplé, on l'utilise immédiatement
    if (this.svgCache) {
      const svg = this.svgCache.replace(/\${color}/g, color).replace(/\${iconText}/g, iconText);
      return svg;
      // Continue avec l'usage du SVG (par exemple, l'appliquer au marqueur)
    } else {
      // Ici, vous pouvez afficher un fallback ou attendre que le SVG soit chargé via un autre mécanisme
      return '';
    }
  }
}
