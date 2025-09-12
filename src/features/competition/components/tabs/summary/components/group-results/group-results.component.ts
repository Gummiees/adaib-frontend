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
import { Group } from '@shared/models/group';
import { Match } from '@shared/models/match';
import { Round, RoundWithMatches } from '@shared/models/round';
import { Team } from '@shared/models/team';
import { sortMatches } from '@shared/utils/utils';

@Component({
  selector: 'app-group-results',
  templateUrl: './group-results.component.html',
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
export class GroupResultsComponent {
  public store = inject(CompetitionStore);
  private dispatcher = inject(Dispatcher);

  public moreInfoClick = output<void>();
  public matchTeamClick = output<Team>();
  public group = input.required<Group>();
  public roundsWithMatches = computed<RoundWithMatches[]>(() => {
    const competition = this.store.competition();
    if (!competition) {
      return [];
    }
    const phase = competition.phases.find((phase) =>
      phase.groups.includes(this.group()),
    );
    if (!phase) {
      return [];
    }

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

  public filteredMatches = computed<Match[]>(() => {
    const currentRound = this.store.roundByGroupId()[this.group().id];
    if (currentRound && currentRound !== 'all') {
      return this.roundsWithMatches()
        .filter((roundWithMatches) => roundWithMatches.id === currentRound.id)
        .flatMap((roundWithMatches) => roundWithMatches.matches);
    }

    return sortMatches(this.group().matches);
  });

  public onMatchTeamClicked(team: Team) {
    this.matchTeamClick.emit(team);
  }

  public onMoreInfoClicked() {
    this.moreInfoClick.emit();
  }

  public onRoundClick(round: Round) {
    this.dispatcher.dispatch(
      competitionEvents.roundByGroupChange({
        group: this.group(),
        round: round,
      }),
    );
  }

  public getRoundNumber(index: number): string {
    return (index + 1).toString();
  }

  public isRoundSelected(round: Round): boolean {
    const currentRound = this.store.roundByGroupId()[this.group().id];
    if (!currentRound || currentRound === 'all') {
      return false;
    }
    return round.id === currentRound.id;
  }
}
