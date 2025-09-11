import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
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
    this.updateVisibleMatches();
  }

  public onGroupFilterChange(group: Group | 'all') {
    if (group === 'all') {
      this.groupFilter.set('all');
    } else {
      this.groupFilter.set(group);
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
