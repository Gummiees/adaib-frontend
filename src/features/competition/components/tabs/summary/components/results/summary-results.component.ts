import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatchComponent } from '@shared/components/match/match.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { RoundButtonComponent } from '@shared/components/round-button/round-button.component';
import { DetailedCompetition } from '@shared/models/competition';
import { Group } from '@shared/models/group';
import { Match } from '@shared/models/match';
import { Round, RoundWithMatches } from '@shared/models/round';
import { Team } from '@shared/models/team';
import { sortMatches } from '@shared/utils/utils';
import { SummaryStore } from '../../store/summary-store';

@Component({
  selector: 'app-summary-results',
  templateUrl: './summary-results.component.html',
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
export class SummaryResultsComponent {
  public store = inject(SummaryStore);

  public moreInfoClick = output<void>();
  public matchTeamClicked = output<Team>();
  public competition = input.required<DetailedCompetition>();
  public group = input.required<Group>();
  public roundsWithMatches = computed<RoundWithMatches[]>(() => {
    const phase = this.store.phase();
    const group = this.group();
    return (
      phase?.rounds.map((round) => ({
        ...round,
        matches: sortMatches(
          group.matches.filter((match) => match.round.id === round.id),
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
  public currentRound = signal<Round | null>(null);

  constructor() {
    effect(() => {
      const group = this.group();
      const phase = this.store.phase();
      if (phase) {
        const firstRound = this.firstRound();
        const round = phase.rounds.find(
          (round) => round.id === group.actualRoundId,
        );
        this.currentRound.set(round ?? firstRound);
      } else {
        this.currentRound.set(null);
      }
    });
  }

  public filteredMatches = computed<Match[]>(() => {
    const currentRound = this.currentRound();
    if (currentRound) {
      return this.roundsWithMatches()
        .filter((roundWithMatches) => roundWithMatches.id === currentRound.id)
        .flatMap((roundWithMatches) => roundWithMatches.matches);
    }

    return sortMatches(this.group().matches);
  });

  public onMatchTeamClicked(team: Team) {
    this.matchTeamClicked.emit(team);
  }

  public onMoreInfoClicked() {
    this.moreInfoClick.emit();
  }

  public onRoundClick(round: Round) {
    this.currentRound.set(round);
  }

  public getRoundNumber(index: number): string {
    return (index + 1).toString();
  }
}
