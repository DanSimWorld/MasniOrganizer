import { ComponentFixture, TestBed } from '@angular/core/testing';  // Import from the testing module
import { FoodPlannerComponent } from './foodplanner.component';  // Correct case

describe('FoodPlannerComponent', () => {
  let component: FoodPlannerComponent;
  let fixture: ComponentFixture<FoodPlannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodPlannerComponent]  // Correct component name
    })
      .compileComponents();

    fixture = TestBed.createComponent(FoodPlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
