import { type } from '@ngrx/signals';
import { event } from '@ngrx/signals/events';

export const getCompetitionsEvent = event('getCompetitions', type<void>());
