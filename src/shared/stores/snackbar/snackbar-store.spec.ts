import { TestBed } from '@angular/core/testing';
import { Dispatcher } from '@ngrx/signals/events';
import { snackbarEvent } from './snackbar-events';
import { SnackbarStore } from './snackbar-store';

describe('SnackbarStore', () => {
  let store: InstanceType<typeof SnackbarStore>;
  let dispatcher: Dispatcher;

  beforeEach(() => {
    store = TestBed.inject(SnackbarStore);
    dispatcher = TestBed.inject(Dispatcher);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have snackbar set to null', () => {
      expect(store.snackbar()).toBeNull();
    });
  });

  describe('snackbarEvent', () => {
    describe('show', () => {
      it('should set snackbar to the payload', () => {
        dispatcher.dispatch(
          snackbarEvent.show({
            message: 'test',
            type: 'success',
            duration: 4000,
          }),
        );

        expect(store.snackbar()).toEqual({
          message: 'test',
          type: 'success',
          duration: 4000,
        });
      });
    });

    describe('hide', () => {
      it('should set snackbar to null', () => {
        dispatcher.dispatch(snackbarEvent.hide());

        expect(store.snackbar()).toBeNull();
      });
    });
  });
});
