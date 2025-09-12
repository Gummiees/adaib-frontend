import { CommonModule } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { Classification } from '@shared/models/classification';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Team } from '@shared/models/team';
import { sortClassification } from '@shared/utils/utils';
import { ClassificationTableGroupComponent } from '../classification-table-group/classification-table-group.component';
import { NotFoundComponent } from '../not-found/not-found.component';

@Component({
  selector: 'app-classification-table',
  templateUrl: './classification-table.component.html',
  standalone: true,
  imports: [CommonModule, NotFoundComponent, ClassificationTableGroupComponent],
})
export class ClassificationTableComponent {
  public competitionStore = inject(CompetitionStore);

  public teamClick = output<Team>();

  public allClassifications = computed<
    {
      phase: Phase;
      info: { group: Group; classifications: Classification[] }[];
    }[]
  >(() => {
    const competition = this.competitionStore.filteredCompetition();
    if (!competition) {
      return [];
    }
    return competition.phases.map((phase) => ({
      phase: phase,
      info: phase.groups.map((group) => ({
        group: group,
        classifications: sortClassification(group.classification),
      })),
    }));
  });

  public showPhaseHeader = computed<boolean>(() => {
    return this.competitionStore.phase() === 'all';
  });

  public onTeamClicked(team: Team): void {
    this.teamClick.emit(team);
  }
}
