import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyFamilyComponent } from './my-family.component';

describe('MyFamilyComponent', () => {
  let component: MyFamilyComponent;
  let fixture: ComponentFixture<MyFamilyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyFamilyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyFamilyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
