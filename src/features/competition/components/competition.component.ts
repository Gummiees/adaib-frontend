import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamComponent } from '@features/competition/components/tabs/teams/team/team.component';
import { TeamsComponent } from '@features/competition/components/tabs/teams/teams.component';
import { Dispatcher } from '@ngrx/signals/events';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { map } from 'rxjs';
import {
  competitionEvents,
  RoundWithGroup,
  RoundWithPhase,
} from '../store/competition-events';
import { CompetitionStore } from '../store/competition-store';
import { ClassificationComponent } from './tabs/classification/classification.component';
import { ResultsComponent } from './tabs/results/results.component';
import { SummaryComponent } from './tabs/summary/summary.component';

@Component({
  selector: 'app-competition',
  templateUrl: './competition.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CompetitionStore],
  imports: [
    CommonModule,
    NotFoundComponent,
    FullSpinnerComponent,
    TeamsComponent,
    TeamComponent,
    MatTabsModule,
    ResultsComponent,
    MatButtonModule,
    SummaryComponent,
    ClassificationComponent,
  ],
})
export class CompetitionComponent {
  public competitionStore = inject(CompetitionStore);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private dispatcher = inject(Dispatcher);

  constructor() {
    this.getCompetition();
    effect(() => {
      const initialPhase = this.initialPhase();
      const initialGroup = this.initialGroup();
      if (initialPhase) {
        this.dispatcher.dispatch(competitionEvents.phaseChange(initialPhase));
      }
      if (initialGroup) {
        this.dispatcher.dispatch(competitionEvents.groupChange(initialGroup));
      }

      this.dispatchRoundChange();
    });
  }

  private dispatchRoundChange(): void {
    const competition = this.competitionStore.competition();
    const initialPhase = this.initialPhase();
    const initialGroup = this.initialGroup();
    if (initialGroup) {
      this.dispatchRoundChangeByGroup(initialGroup);
    } else if (initialPhase) {
      this.dispatchRoundChangeByPhase(initialPhase);
    } else if (competition) {
      for (const phase of competition.phases) {
        this.dispatchRoundChangeByPhase(phase);
      }
    }
  }

  private dispatchRoundChangeByPhase(phase: Phase): void {
    const roundRecord: RoundWithPhase = {
      phase: phase,
      round: 'all',
    };
    this.dispatcher.dispatch(competitionEvents.roundByPhaseChange(roundRecord));

    for (const group of phase.groups) {
      this.dispatchRoundChangeByGroup(group);
    }
  }

  private dispatchRoundChangeByGroup(group: Group): void {
    const roundRecord: RoundWithGroup = {
      group: group,
      round: group.actualRound ?? 'all',
    };
    this.dispatcher.dispatch(competitionEvents.roundByGroupChange(roundRecord));
  }

  // Get the current tab from query parameters
  public currentTab = toSignal(
    this.activatedRoute.queryParams.pipe(
      takeUntilDestroyed(),
      map((params) => {
        const tab = params['tab'];
        switch (tab) {
          case 'clasificacion':
            return 1;
          case 'resultados':
            return 2;
          case 'equipos':
            return 3;
          default:
            return 0; // Default to Resumen tab
        }
      }),
    ),
    { initialValue: 0 },
  );

  // Get the selected team ID from query parameters
  public selectedTeamId = toSignal(
    this.activatedRoute.queryParams.pipe(
      takeUntilDestroyed(),
      map((params) => {
        const equipo = params['equipo'];
        return equipo ? Number(equipo) : null;
      }),
    ),
    { initialValue: null },
  );

  // Check if we should show the team component
  public showTeamComponent = computed(() => {
    const tab = this.currentTab();
    const teamId = this.selectedTeamId();
    return tab === 3 && teamId !== null && !isNaN(teamId);
  });

  private initialPhase = computed<Phase | null>(() => {
    const competition = this.competitionStore.competition();
    if (!competition) {
      return null;
    }
    return (
      competition.phases.find(
        (phase) => phase.groups.flatMap((group) => group.matches).length > 0,
      ) ?? null
    );
  });

  private initialGroup = computed<Group | null>(() => {
    const phase = this.initialPhase();
    return phase?.groups.find((group) => group.matches.length > 0) ?? null;
  });

  public onNotFoundButtonClick = (): void => {
    this.router.navigate(['/competiciones']);
  };

  public reloadCompetition(): void {
    this.getCompetition();
  }

  public onTabChange(index: number): void {
    if (index === this.currentTab()) {
      return;
    }

    const competitionId = this.activatedRoute.snapshot.params['id'];
    const baseUrl = `/competiciones/${competitionId}`;

    let queryParams: {
      tab?: string;
      equipo?: string;
      fase?: string;
      grupo?: string;
    } = {};

    switch (index) {
      case 0:
        break;
      case 1:
        queryParams = { tab: 'clasificacion' };
        break;
      case 2:
        queryParams = { tab: 'resultados' };
        break;
      case 3: {
        queryParams = { tab: 'equipos' };
        const currentQueryParams = this.activatedRoute.snapshot.queryParams;
        if (currentQueryParams['equipo']) {
          queryParams.equipo = currentQueryParams['equipo'];
        }
        break;
      }
    }

    this.router.navigate([baseUrl], { queryParams });
  }

  public onTeamSelect(teamId: number): void {
    const competitionId = this.activatedRoute.snapshot.params['id'];
    const baseUrl = `/competiciones/${competitionId}`;
    const queryParams = { tab: 'equipos', equipo: teamId.toString() };

    this.router.navigate([baseUrl], { queryParams });
  }

  public onBackToTeams(): void {
    const competitionId = this.activatedRoute.snapshot.params['id'];
    const baseUrl = `/competiciones/${competitionId}`;
    const queryParams = { tab: 'equipos' };

    this.router.navigate([baseUrl], { queryParams: queryParams });
  }

  private getCompetition(): void {
    const id = this.activatedRoute.snapshot.params['id'];

    if (!id) {
      return;
    }

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return;
    }

    if (this.competitionStore.competition()?.id === parsedId) {
      return;
    }

    this.dispatcher.dispatch(competitionEvents.getCompetition(parsedId));
  }
}
