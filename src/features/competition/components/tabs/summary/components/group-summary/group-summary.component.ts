import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Group } from '@shared/models/group';
import { Team } from '@shared/models/team';
import { GroupClassificationComponent } from '../group-classification/group-classification.component';
import { GroupResultsComponent } from '../group-results/group-results.component';

@Component({
  selector: 'app-group-summary',
  templateUrl: './group-summary.component.html',
  standalone: true,
  imports: [
    CommonModule,
    GroupResultsComponent,
    GroupClassificationComponent,
    NotFoundComponent,
  ],
})
export class GroupSummaryComponent {
  public group = input<Group | null>(null);
  public store = inject(CompetitionStore);

  public moreInfoResultsClick = output<void>();
  public moreInfoClassificationClick = output<void>();
  public teamClick = output<Team>();

  public getGroup(group: Group | 'all'): Group | null {
    if (group === 'all') {
      return null;
    }
    return group;
  }

  public onMoreInfoResultsClicked(): void {
    this.moreInfoResultsClick.emit();
  }

  public onMoreInfoClassificationClicked(): void {
    this.moreInfoClassificationClick.emit();
  }

  public onTeamClicked(team: Team): void {
    this.teamClick.emit(team);
  }

  public hasClassification(group: Group): boolean {
    return group.classification && group.classification.length > 0;
  }

  public hasMatches(group: Group): boolean {
    return group.matches && group.matches.length > 0;
  }
}
