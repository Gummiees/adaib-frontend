import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Dispatcher } from '@ngrx/signals/events';
import { snackbarEvent } from '@shared/stores/snackbar/snackbar-events';
import { SnackbarStore } from '@shared/stores/snackbar/snackbar-store';
import { SnackbarComponent, SnackbarOptions } from './snackbar.component';

describe('SnackbarComponent', () => {
  let snackbarComponent: SnackbarComponent;
  let fixture: ComponentFixture<SnackbarComponent>;
  let dispatcher: Dispatcher;
  const snackbarSignal = signal<SnackbarOptions | null>(null);

  beforeEach(() => {
    jest.useFakeTimers();

    const snackbarStoreMock = {
      snackbar: snackbarSignal,
    };

    fixture = TestBed.configureTestingModule({
      providers: [
        SnackbarComponent,
        { provide: SnackbarStore, useValue: snackbarStoreMock },
      ],
    }).createComponent(SnackbarComponent);

    dispatcher = TestBed.inject(Dispatcher);
    jest.spyOn(dispatcher, 'dispatch');

    fixture.detectChanges();

    snackbarComponent = fixture.componentInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be created', () => {
    expect(snackbarComponent).toBeTruthy();
  });

  describe('hide', () => {
    it('should dispatch a hide event', () => {
      snackbarComponent.hide();

      expect(dispatcher.dispatch).toHaveBeenCalledWith(snackbarEvent.hide());
    });
  });

  describe('snackbar styles', () => {
    describe('render', () => {
      it('should be rendered', () => {
        snackbarSignal.set({
          message: 'test',
          type: 'success',
          duration: 1,
        });

        fixture.detectChanges();

        const snackbarElement = fixture.debugElement.query(By.css('#snackbar'));
        expect(snackbarElement).toBeTruthy();
      });

      it('should not show the snackbar if there is no snackbar on the store', () => {
        snackbarSignal.set(null);
        fixture.detectChanges();

        const snackbarElement = fixture.debugElement.query(By.css('#snackbar'));
        expect(snackbarElement).toBeNull();
      });
    });

    it('should show the message', () => {
      snackbarSignal.set({
        message: 'test',
        type: 'success',
        duration: 1,
      });

      fixture.detectChanges();

      const snackbarElement = fixture.debugElement.query(By.css('#snackbar'));
      expect(snackbarElement.nativeElement.textContent).toContain('test');
    });

    describe('colors', () => {
      it('should have success style', () => {
        snackbarSignal.set({
          message: 'test',
          type: 'success',
          duration: 1,
        });

        fixture.detectChanges();

        const snackbarElement = fixture.debugElement.query(By.css('#snackbar'));
        expect(
          snackbarElement.nativeElement.classList.contains('bg-green-500/80'),
        ).toBeTruthy();
      });

      it('should have error style', () => {
        snackbarSignal.set({
          message: 'test',
          type: 'error',
          duration: 1,
        });

        fixture.detectChanges();

        const snackbarElement =
          fixture.debugElement.nativeElement.querySelector('#snackbar');
        expect(
          snackbarElement.classList.contains('bg-red-500/80'),
        ).toBeTruthy();
      });

      it('should have warning style', () => {
        snackbarSignal.set({
          message: 'test',
          type: 'warning',
          duration: 1,
        });

        fixture.detectChanges();

        const snackbarElement =
          fixture.debugElement.nativeElement.querySelector('#snackbar');
        expect(snackbarElement.classList.contains('bg-amber-600/80')).toBe(
          true,
        );
      });

      it('should have info style', () => {
        snackbarSignal.set({
          message: 'test',
          type: 'info',
          duration: 1,
        });

        fixture.detectChanges();

        const snackbarElement =
          fixture.debugElement.nativeElement.querySelector('#snackbar');
        expect(
          snackbarElement.classList.contains('bg-blue-500/80'),
        ).toBeTruthy();
      });
    });

    describe('close button', () => {
      it('should show the close button', () => {
        snackbarSignal.set({
          message: 'test',
          type: 'success',
          duration: 1,
        });

        fixture.detectChanges();

        const closeButton =
          fixture.debugElement.nativeElement.querySelector('button');
        expect(closeButton).toBeTruthy();
      });

      it('should dispatch a hide event when the close button is clicked', () => {
        snackbarSignal.set({
          message: 'test',
          type: 'success',
          duration: 1,
        });
        fixture.detectChanges();
        const closeButton =
          fixture.debugElement.nativeElement.querySelector('button');
        closeButton.click();

        fixture.detectChanges();

        expect(dispatcher.dispatch).toHaveBeenCalledWith(snackbarEvent.hide());
      });
    });
  });
});
