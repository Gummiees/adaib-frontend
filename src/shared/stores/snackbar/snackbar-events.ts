import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { SnackbarOptions } from '@shared/components/snackbar/snackbar.component';

export const snackbarEvent = eventGroup({
  source: 'Snackbar',
  events: {
    show: type<SnackbarOptions>(),
    hide: type<void>(),
  },
});
