import { signalStore, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { SnackbarOptions } from '@shared/components/snackbar/snackbar.component';
import { snackbarEvent } from './snackbar-events';

type SnackbarState = {
  snackbar: SnackbarOptions | null;
};

const initialState: SnackbarState = {
  snackbar: null,
};

export const SnackbarStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withReducer(
    on(snackbarEvent.show, ({ payload: snackbar }) => ({
      snackbar,
    })),
    on(snackbarEvent.hide, () => ({
      snackbar: null,
    })),
  ),
);
