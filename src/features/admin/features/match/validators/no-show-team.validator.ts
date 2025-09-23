import { AbstractControl } from '@angular/forms';
import { MatchStatus } from '@shared/models/match';
import { Team } from '@shared/models/team';
export const noShowTeamValidator =
  ({
    status,
    homeTeam,
    awayTeam,
  }: {
    status: MatchStatus;
    homeTeam: Team | null;
    awayTeam: Team | null;
  }) =>
  (control: AbstractControl) => {
    const noShowTeam = control.value as Team | null;
    if (
      status === 'NoShow' &&
      homeTeam &&
      awayTeam &&
      (!noShowTeam ||
        (noShowTeam.id !== homeTeam.id && noShowTeam.id !== awayTeam.id))
    ) {
      return { noShowTeamRequired: true };
    }

    return null;
  };
