import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { GroupFilterComponent } from '@features/competition/components/filters/group/group-filter.component';
import { PhaseFilterComponent } from '@features/competition/components/filters/phase/phase-filter.component';
import { RoundFilterComponent } from '@features/competition/components/filters/round/round-filter.component';
import { competitionNavEvents } from '@features/competition/store/competition-nav-events';
import { UserStore } from '@features/user/store/user-store';
import { Dispatcher } from '@ngrx/signals/events';
import { MatchComponent } from '@shared/components/match/match.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Round, RoundWithMatches } from '@shared/models/round';
import { Team } from '@shared/models/team';
import { sortMatches } from '@shared/utils/utils';
import { CompetitionStore } from '../../../store/competition-store';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatchComponent,
    NotFoundComponent,
    MatSelectModule,
    MatFormFieldModule,
    PhaseFilterComponent,
    GroupFilterComponent,
    RoundFilterComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
})
export class ResultsComponent {
  public competitionStore = inject(CompetitionStore);
  public userStore = inject(UserStore);
  private router = inject(Router);

  public dispatcher = inject(Dispatcher);

  public groupByRound = signal<boolean>(false);
  public allMatchesSorted = computed(() => {
    const competition = this.competitionStore.filteredCompetition();
    if (!competition) {
      return [];
    }
    const allMatches = competition.phases
      .flatMap((phase) => phase.groups)
      .flatMap((group) => group.matches);

    return sortMatches(allMatches);
  });

  public filteredMatches = computed(() => {
    const competition = this.competitionStore.filteredCompetition();
    if (!competition) {
      return [];
    }
    const allMatches = competition.phases
      .flatMap((phase) => phase.groups)
      .flatMap((group) => group.matches);

    return sortMatches(allMatches);
  });

  public filteredMatchesByRound = computed<RoundWithMatches[]>(() => {
    const competition = this.competitionStore.filteredCompetition();
    if (!competition) {
      return [];
    }
    return competition.phases
      .flatMap<RoundWithMatches[]>((phase) =>
        phase.rounds.map((round) => ({
          ...round,
          matches: sortMatches(
            phase.groups
              .flatMap((group) => group.matches)
              .filter((match) => match.round.id === round.id),
          ),
        })),
      )
      .flat()
      .filter((round) => round.matches.length > 0);
  });

  public availablePhases = computed<Phase[]>(() => {
    return [
      ...new Set(
        this.competitionStore
          .competition()!
          .phases.filter((phase) => phase.groups),
      ),
    ];
  });

  public availableGroups = computed<Group[]>(() => {
    const phaseFilter = this.competitionStore.phase();
    if (phaseFilter === 'all') {
      return [];
    }

    return [...new Set(phaseFilter.groups)];
  });

  public availableRounds = computed<Round[]>(() => {
    const phaseFilter = this.competitionStore.phase();
    if (phaseFilter === 'all') {
      return [];
    }

    return [...new Set(phaseFilter.rounds)];
  });

  public onGroupByRoundChange(groupByRound: boolean): void {
    this.groupByRound.set(groupByRound);
  }

  public onAddMatchClick(): void {
    this.dispatcher.dispatch(competitionNavEvents.toAddMatch());
  }

  public onMatchTeamClicked(team: Team): void {
    this.router.navigate(
      ['/competiciones', this.competitionStore.competition()!.id],
      {
        queryParams: { tab: 'equipos', equipo: team.id.toString() },
      },
    );
  }
}
