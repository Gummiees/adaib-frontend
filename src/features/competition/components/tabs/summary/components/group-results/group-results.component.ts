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
import { Phase } from '@shared/models/phase';
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
  public teamClick = output<Team>();
  public group = input<Group | null>(null);
  public phase = input<Phase | null>(null);
  public roundsWithMatches = computed<RoundWithMatches[]>(() => {
    const competition = this.store.competition();
    const group = this.group();
    const phase = this.phase();
    if (!competition || (!group && !phase)) {
      return [];
    }

    if (phase) {
      return phase.rounds.map((round) => ({
        ...round,
        matches: sortMatches(
          phase.groups
            .flatMap((group) => group.matches)
            .filter((match) => match.round.id === round.id),
        ),
      }));
    }

    const groupPhase = competition.phases.find((phase) =>
      phase.groups.includes(group!),
    );
    if (!groupPhase) {
      return [];
    }

    return (
      groupPhase.rounds.map((round) => ({
        ...round,
        matches: sortMatches(
          group!.matches.filter((match) => match.round.id === round.id),
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
    const phase = this.phase();
    const group = this.group();
    if (phase) {
      return this.filterMatchesByPhase(phase);
    }
    if (group) {
      return this.filterMatchesByGroup(group);
    }
    return [];
  });

  private filterMatchesByPhase(phase: Phase): Match[] {
    const currentRound = this.store.roundByPhaseId()[phase.id];
    if (currentRound && currentRound !== 'all') {
      return this.roundsWithMatches()
        .filter((roundWithMatches) => roundWithMatches.id === currentRound.id)
        .flatMap((roundWithMatches) => roundWithMatches.matches);
    }
    return sortMatches(phase.groups.flatMap((group) => group.matches));
  }

  private filterMatchesByGroup(group: Group): Match[] {
    const currentRound = this.store.roundByGroupId()[group.id];
    if (currentRound && currentRound !== 'all') {
      return this.roundsWithMatches()
        .filter((roundWithMatches) => roundWithMatches.id === currentRound.id)
        .flatMap((roundWithMatches) => roundWithMatches.matches);
    }
    return sortMatches(group.matches);
  }

  public onTeamClicked(team: Team): void {
    this.teamClick.emit(team);
  }

  public onMoreInfoClicked(): void {
    this.moreInfoClick.emit();
  }

  public onRoundClick(round: Round): void {
    const group = this.group();
    const phase = this.phase();
    if (phase) {
      this.dispatcher.dispatch(
        competitionEvents.roundByPhaseChange({
          phase: phase,
          round: round,
        }),
      );
    }
    if (group) {
      this.dispatcher.dispatch(
        competitionEvents.roundByGroupChange({
          group: group,
          round: round,
        }),
      );
    }
  }

  public getRoundNumber(index: number): string {
    return (index + 1).toString();
  }

  public isRoundSelected(round: Round): boolean {
    const group = this.group();
    const phase = this.phase();
    let currentRound = null;
    if (phase) {
      currentRound = this.store.roundByPhaseId()[phase.id];
    }
    if (group) {
      currentRound = this.store.roundByGroupId()[group.id];
    }
    if (!currentRound || currentRound === 'all') {
      return false;
    }
    return round.id === currentRound.id;
  }
}
