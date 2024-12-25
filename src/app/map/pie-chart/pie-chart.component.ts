import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  standalone: true,
})
export class PieChartComponent implements OnInit, OnChanges {
  @Input() markers: any[] = [];
  private chart: any;

  constructor() { }

  ngOnInit(): void {
    this.createPieChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['markers']) {
      this.updateChartData();
    }
  }

  // Fonction pour générer le graphique en camembert
  private createPieChart() {
    const ctx = document.getElementById('pieChart') as HTMLCanvasElement;
    
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: this.getChartData(),
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw}`
            }
          }
        }
      }
    });
  }

  // Met à jour les données du graphique à partir des markers
  private updateChartData() {
    if (this.chart) {
      this.chart.data = this.getChartData();
      this.chart.update();
    }
  }

  // Fonction pour transformer les données en format adapté à Chart.js
  private getChartData(): ChartData {
    const locationCounts: { [key: string]: number } = {};

    // Compter les occurrences de chaque Location.name
    this.markers.forEach((marker) => {
      const name = marker.name || 'Unknown';  // Gérer les noms non définis
      locationCounts[name] = (locationCounts[name] || 0) + 1;
    });

    // Convertir en tableau de données pour Chart.js
    const labels = Object.keys(locationCounts);
    const data = Object.values(locationCounts);
    
    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: this.getRandomColors(labels.length), // Ajouter des couleurs aléatoires pour chaque section
        }
      ]
    };
  }

  // Générer des couleurs aléatoires pour chaque section
  private getRandomColors(count: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(this.getRandomColor());
    }
    return colors;
  }

  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}
