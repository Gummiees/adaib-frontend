import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { competitionEvents } from '@features/competition/store/competition-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { Dispatcher } from '@ngrx/signals/events';
import { MatchComponent } from '@shared/components/match/match.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { RoundButtonComponent } from '@shared/components/round-button/round-button.component';
import { Match } from '@shared/models/match';
import { Phase } from '@shared/models/phase';
import { Round, RoundWithMatches } from '@shared/models/round';
import { Team } from '@shared/models/team';
import { sortMatches } from '@shared/utils/utils';

@Component({
  selector: 'app-phase-results',
  templateUrl: './phase-results.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatchComponent,
    NotFoundComponent,
    MatButtonModule,
    RoundButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseResultsComponent {
  public store = inject(CompetitionStore);
  private dispatcher = inject(Dispatcher);

  public moreInfoClick = output<void>();
  public teamClick = output<Team>();
  public phase = input.required<Phase>();
  public roundsWithMatches = computed<RoundWithMatches[]>(() => {
    const competition = this.store.competition();
    if (!competition) {
      return [];
    }
    const phase = this.phase();
    return (
      phase.rounds.map((round) => ({
        ...round,
        matches: sortMatches(
          phase.groups
            .flatMap((group) => group.matches)
            .filter((match) => match.round.id === round.id),
        ),
      })) ?? []
    );
  });
  public firstRound = computed<RoundWithMatches | null>(() => {
    const roundsWithMatches = this.roundsWithMatches();
    if (roundsWithMatches.length === 0) {
      return null;
    }

    return (
      roundsWithMatches.findLast(
        (roundWithMatches) => roundWithMatches.matches.length > 0,
      ) ?? null
    );
  });

  public filteredMatches = computed<Match[]>(() => {
    const currentRound = this.store.roundByPhaseId()[this.phase().id];
    if (currentRound && currentRound !== 'all') {
      return this.roundsWithMatches()
        .filter((roundWithMatches) => roundWithMatches.id === currentRound.id)
        .flatMap((roundWithMatches) => roundWithMatches.matches);
    }

    return sortMatches(this.phase().groups.flatMap((group) => group.matches));
  });

  public onTeamClicked(team: Team): void {
    this.teamClick.emit(team);
  }

  public onMoreInfoClicked(): void {
    this.moreInfoClick.emit();
  }

  public onRoundClick(round: Round): void {
    this.dispatcher.dispatch(
      competitionEvents.roundByPhaseChange({
        phase: this.phase(),
        round: round,
      }),
    );
  }

  public getRoundNumber(index: number): string {
    return (index + 1).toString();
  }

  public isRoundSelected(round: Round): boolean {
    const currentRound = this.store.roundByPhaseId()[this.phase().id];
    if (!currentRound || currentRound === 'all') {
      return false;
    }
    return round.id === currentRound.id;
  }
}
