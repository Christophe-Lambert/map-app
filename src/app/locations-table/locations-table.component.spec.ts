import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationsTableComponent } from './locations-table.component';

describe('LocationsTableComponent', () => {
  let component: LocationsTableComponent;
  let fixture: ComponentFixture<LocationsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationsTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LocationsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
