import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { LocationService } from '../services/location.service';
import { Location } from '../models/location.model';
import { MapInteractionService } from '../services/map-interaction.service';

@Component({
  selector: 'app-locations-table',
  standalone: true,
  imports: [MatTableModule,
    MatPaginatorModule,
    MatSortModule,    
    MatIconModule,
    CommonModule,
  ],
  providers: [LocationService],
  templateUrl: './locations-table.component.html',
  styleUrl: './locations-table.component.css'
})
export class LocationsTableComponent implements OnInit {
  displayedColumns: string[] = ['icon', 'id', 'name', 'latitude', 'longitude'];
  dataSource = new MatTableDataSource<Location>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private locationService: LocationService, private mapInteractionService: MapInteractionService) { }

  ngOnInit(): void {
    this.locationService.getAllLocations().subscribe({
      next: (locations: Location[]) => {
        this.dataSource.data = locations;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des locations:', error);
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onRowClick(row: any): void {
    const lat = row.location.y;
    const lng = row.location.x;

    this.mapInteractionService.flyTo(lat, lng);
  }
}