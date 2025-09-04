import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let app: App;
  let fixture: ComponentFixture<App>;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      imports: [App],
    }).createComponent(App);

    fixture.detectChanges();

    app = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });
});
