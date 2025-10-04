import { AbstractControl } from '@angular/forms';
import { MatchStatus } from '@shared/models/match';

export const scoreValidator =
  (status: MatchStatus) => (control: AbstractControl) => {
    const score = control.value;

    if (!score && (status === 'Finished' || status === 'OnGoing')) {
      return { scoreRequired: true };
    }

    return null;
  };
