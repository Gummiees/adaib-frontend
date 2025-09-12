import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { GroupFilterComponent } from '@features/competition/components/filters/group/group-filter.component';
import { PhaseFilterComponent } from '@features/competition/components/filters/phase/phase-filter.component';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { MatchComponent } from '@shared/components/match/match.component';
import { DetailedCompetition } from '@shared/models/competition';
import { Team } from '@shared/models/team';
import { sortMatches } from '@shared/utils/utils';

@Component({
  selector: 'app-classification',
  templateUrl: './classification.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatchComponent, PhaseFilterComponent, GroupFilterComponent],
})
export class ClassificationComponent {
  public competitionStore = inject(CompetitionStore);

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  public queryParams = toSignal<Params>(this.activatedRoute.queryParams, {});

  private filteredCompetition = computed<DetailedCompetition>(() => {
    const competition = this.competitionStore.competition()!;
    const phaseFilter = this.competitionStore.phase();
    const groupFilter = this.competitionStore.group();
    let filteredCompetition = { ...competition };
    if (phaseFilter !== 'all') {
      filteredCompetition = {
        ...filteredCompetition,
        phases: this.competitionStore
          .competition()!
          .phases.filter((phase) => phase.id === phaseFilter.id),
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

    return filteredCompetition;
  });

  public filteredMatches = computed(() => {
    const competition = this.filteredCompetition();
    const allMatches = competition.phases
      .flatMap((phase) => phase.groups)
      .flatMap((group) => group.matches);

    return sortMatches(allMatches);
  });

  public onTeamClicked(team: Team) {
    this.router.navigate(
      ['/competiciones', this.competitionStore.competition()!.id],
      {
        queryParams: { tab: 'equipos', equipo: team.id.toString() },
      },
    );
  }
}
