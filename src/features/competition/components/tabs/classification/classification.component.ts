import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { GroupFilterComponent } from '@features/competition/components/filters/group/group-filter.component';
import { PhaseFilterComponent } from '@features/competition/components/filters/phase/phase-filter.component';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { ClassificationItemComponent } from '@shared/components/classification-item/classification-item.component';
import { Classification } from '@shared/models/classification';
import { Group } from '@shared/models/group';
import { Team } from '@shared/models/team';
import { sortClassification } from '@shared/utils/utils';

@Component({
  selector: 'app-classification',
  templateUrl: './classification.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PhaseFilterComponent,
    GroupFilterComponent,
    ClassificationItemComponent,
  ],
})
export class ClassificationComponent {
  public competitionStore = inject(CompetitionStore);

  private router = inject(Router);

  public allClassifications = computed<
    { group: Group; classifications: Classification[] }[]
  >(() => {
    const competition = this.competitionStore.filteredCompetition();
    if (!competition) {
      return [];
    }
    return competition.phases
      .flatMap((phase) => phase.groups)
      .map((group) => ({
        group: group,
        classifications: sortClassification(group.classification),
      }));
  });

  public onTeamClicked(team: Team): void {
    this.router.navigate(
      ['/competiciones', this.competitionStore.competition()!.id],
      {
        queryParams: { tab: 'equipos', equipo: team.id.toString() },
      },
    );
  }
}
