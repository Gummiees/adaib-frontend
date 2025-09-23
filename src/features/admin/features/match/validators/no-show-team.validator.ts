import { AbstractControl } from '@angular/forms';
import { MatchStatus } from '@shared/models/match';
export const noShowTeamValidator =
  ({
    status,
    homeTeamId,
    awayTeamId,
  }: {
    status: MatchStatus;
    homeTeamId: number | null;
    awayTeamId: number | null;
  }) =>
  (control: AbstractControl) => {
    const noShowTeamId = control.value as number | null;
    if (
      status === 'NoShow' &&
      homeTeamId &&
      awayTeamId &&
      (!noShowTeamId ||
        (noShowTeamId !== homeTeamId && noShowTeamId !== awayTeamId))
    ) {
      return { noShowTeamRequired: true };
    }

    return null;
  };
