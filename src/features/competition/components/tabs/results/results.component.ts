import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatchComponent } from '@shared/components/match/match.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { DetailedCompetition } from '@shared/models/competition';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Round, RoundWithMatches } from '@shared/models/round';
import { Team } from '@shared/models/team';
import { sortMatches } from '@shared/utils/utils';

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
  ],
})
export class ResultsComponent implements AfterViewInit {
  public competition = input.required<DetailedCompetition>();
  public phaseFilter = signal<Phase | 'all'>('all');
  public groupFilter = signal<Group | 'all'>('all');
  public roundFilter = signal<Round | 'all'>('all');
  public groupByRound = signal<boolean>(false);

  @ViewChildren(MatchComponent) matchComponents!: QueryList<MatchComponent>;
  public hasVisibleMatches = signal<boolean>(false);

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
    const competition = this.competition();
    let filteredCompetition = { ...competition };
    const phaseFilter = this.phaseFilter();
    const groupFilter = this.groupFilter();
    const roundFilter = this.roundFilter();
    if (phaseFilter !== 'all') {
      filteredCompetition = {
        ...filteredCompetition,
        phases: competition.phases.filter(
          (phase) => phase.id === phaseFilter.id,
        ),
      };
    }
    if (groupFilter !== 'all') {
      filteredCompetition = {
        ...filteredCompetition,
        phases: filteredCompetition.phases.map((phase) => ({
          ...phase,
          groups: phase.groups.filter((group) => group.id === groupFilter.id),
        })),
      };
    }
    if (roundFilter !== 'all') {
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
      ...new Set(this.competition().phases.filter((phase) => phase.groups)),
    ];
  });

  public availableGroups = computed<Group[]>(() => {
    const phaseFilter = this.phaseFilter();
    if (phaseFilter === 'all') {
      return [];
    }

    return [...new Set(phaseFilter.groups)];
  });

  public availableRounds = computed<Round[]>(() => {
    const phaseFilter = this.phaseFilter();
    if (phaseFilter === 'all') {
      return [];
    }

    return [...new Set(phaseFilter.rounds)];
  });

  constructor() {
    effect(() => {
      this.updateVisibleMatches();
      this.recalculatePhaseFilter();
      this.recalculateGroupFilter();
    });
  }

  private recalculatePhaseFilter() {
    const queryParams = this.queryParams();
    const faseId: string | undefined = queryParams?.['fase'];

    if (faseId) {
      const competition = this.competition();
      const phase = competition.phases.find((p) => p.id.toString() === faseId);
      if (phase) {
        this.phaseFilter.set(phase);
      }
    } else {
      this.phaseFilter.set('all');
    }
  }

  private recalculateGroupFilter() {
    const queryParams = this.queryParams();
    const grupoId: string | undefined = queryParams?.['grupo'];
    if (grupoId) {
      const competition = this.competition();
      const group = competition.phases
        .flatMap((phase) => phase.groups)
        .find((g) => g.id.toString() === grupoId);
      if (group) {
        this.groupFilter.set(group);
      }
    } else {
      this.groupFilter.set('all');
    }
  }

  ngAfterViewInit() {
    this.updateVisibleMatches();
  }

  private updateVisibleMatches() {
    setTimeout(() => {
      const hasMatches =
        this.matchComponents && this.matchComponents.length > 0;
      this.hasVisibleMatches.set(hasMatches);
    });
  }

  public onPhaseFilterChange(phase: Phase | 'all') {
    if (phase === 'all') {
      this.phaseFilter.set('all');
    } else {
      this.phaseFilter.set(phase);
    }
    this.groupFilter.set('all');
    this.roundFilter.set('all');
    this.updateVisibleMatches();
  }

  public onGroupFilterChange(group: Group | 'all') {
    if (group === 'all') {
      this.groupFilter.set('all');
      this.roundFilter.set('all');
    } else {
      this.groupFilter.set(group);
      const phase = this.phaseFilter();
      if (phase !== 'all') {
        const round = phase?.rounds.find(
          (round) => round.id === group.actualRoundId,
        );
        if (round) {
          this.roundFilter.set(round);
        } else {
          this.roundFilter.set('all');
        }
      } else {
        this.roundFilter.set('all');
      }
    }

    this.updateVisibleMatches();
  }

  public onRoundFilterChange(round: Round | 'all') {
    if (round === 'all') {
      this.roundFilter.set('all');
    } else {
      this.roundFilter.set(round);
    }
    this.updateVisibleMatches();
  }

  public onGroupByRoundChange(groupByRound: boolean) {
    this.groupByRound.set(groupByRound);
  }

  public onMatchTeamClicked(team: Team) {
    this.router.navigate(['/competiciones', this.competition().id], {
      queryParams: { tab: 'equipos', equipo: team.id.toString() },
    });
  }
}
