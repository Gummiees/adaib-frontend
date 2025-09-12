import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { GroupFilterComponent } from '@features/competition/components/filters/group/group-filter.component';
import { PhaseFilterComponent } from '@features/competition/components/filters/phase/phase-filter.component';
import { RoundFilterComponent } from '@features/competition/components/filters/round/round-filter.component';
import { MatchComponent } from '@shared/components/match/match.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { DetailedCompetition } from '@shared/models/competition';
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
  ],
})
export class ResultsComponent {
  public competitionStore = inject(CompetitionStore);
  public groupByRound = signal<boolean>(false);

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public queryParams = toSignal<Params>(this.activatedRoute.queryParams, {});

  public allMatchesSorted = computed(() => {
    const competition = this.filteredCompetition();
    const allMatches = competition.phases
      .flatMap((phase) => phase.groups)
      .flatMap((group) => group.matches);

    return sortMatches(allMatches);
  });

  public filteredCompetition = computed<DetailedCompetition>(() => {
    const competition = this.competitionStore.competition()!;
    let filteredCompetition = { ...competition };
    const phaseFilter = this.competitionStore.phase();
    const groupFilter = this.competitionStore.group();
    let roundFilter = null;

    if (phaseFilter !== 'all') {
      filteredCompetition = {
        ...filteredCompetition,
        phases: competition.phases.filter(
          (phase) => phase.id === phaseFilter.id,
        ),
      };

      if (groupFilter !== 'all') {
        filteredCompetition = {
          ...filteredCompetition,
          phases: filteredCompetition.phases.map((phase) => ({
            ...phase,
            groups: phase.groups.filter((group) => group.id === groupFilter.id),
          })),
        };

        roundFilter = this.competitionStore.roundByGroupId()[groupFilter.id];
      } else {
        roundFilter = this.competitionStore.roundByPhaseId()[phaseFilter.id];
      }
    }

    if (roundFilter && roundFilter !== 'all') {
      filteredCompetition = {
        ...filteredCompetition,
        phases: filteredCompetition.phases.map((phase) => ({
          ...phase,
          groups: phase.groups.map((group) => ({
            ...group,
            matches: group.matches.filter(
              (match) => match.round.id === roundFilter.id,
            ),
          })),
        })),
      };
    }

    return filteredCompetition;
  });

  public filteredMatches = computed(() => {
    const competition = this.filteredCompetition();
    const allMatches = competition.phases
      .flatMap((phase) => phase.groups)
      .flatMap((group) => group.matches);

    return sortMatches(allMatches);
  });

  public filteredMatchesByRound = computed<RoundWithMatches[]>(() => {
    return this.filteredCompetition()
      .phases.flatMap<RoundWithMatches[]>((phase) =>
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

  public onGroupByRoundChange(groupByRound: boolean) {
    this.groupByRound.set(groupByRound);
  }

  public onMatchTeamClicked(team: Team) {
    this.router.navigate(
      ['/competiciones', this.competitionStore.competition()!.id],
      {
        queryParams: { tab: 'equipos', equipo: team.id.toString() },
      },
    );
  }
}
