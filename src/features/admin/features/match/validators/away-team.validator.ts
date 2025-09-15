import { AbstractControl } from '@angular/forms';
import { MatchStatus } from '@shared/models/match';

export const awayTeamValidator =
  (status: MatchStatus) => (control: AbstractControl) => {
    const awayTeam = control.value;

    if (status !== 'Rest' && !awayTeam) {
      return { awayTeamRequired: true };
    }

    return null;
  };
