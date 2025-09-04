import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PetStore } from '@features/pet/stores/pet-store';
import { App } from './app';

describe('App', () => {
  let app: App;
  let fixture: ComponentFixture<App>;
  const loadingSignal = signal(false);

  const petStoreMock = {
    isLoading: loadingSignal,
  };

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: PetStore, useValue: petStoreMock }],
    }).createComponent(App);

    fixture.detectChanges();

    app = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  describe('isLoading', () => {
    it('should be true if the route is loading', () => {
      loadingSignal.set(true);

      expect(app.petStore.isLoading()).toBeTruthy();
    });

    it('should be false if the route is not loading', () => {
      loadingSignal.set(false);

      expect(app.petStore.isLoading()).toBeFalsy();
    });
  });

  describe('render', () => {
    it('should render the full screen spinner if the route is loading', () => {
      loadingSignal.set(true);

      fixture.detectChanges();

      const fullScreenSpinner =
        fixture.debugElement.nativeElement.querySelector(
          'app-full-screen-spinner',
        );
      expect(fullScreenSpinner).toBeTruthy();
    });

    it('should not render the full screen spinner if the route is not loading', () => {
      loadingSignal.set(false);

      fixture.detectChanges();

      const fullScreenSpinner =
        fixture.debugElement.nativeElement.querySelector(
          'app-full-screen-spinner',
        );
      expect(fullScreenSpinner).toBeNull();
    });
  });
});
