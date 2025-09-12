import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { Group } from '@shared/models/group';
import { Team } from '@shared/models/team';
import { ClassificationItemComponent } from '../classification-item/classification-item.component';
import { NotFoundComponent } from '../not-found/not-found.component';

@Component({
  selector: 'app-classification-table-group',
  templateUrl: './classification-table-group.component.html',
  standalone: true,
  imports: [CommonModule, ClassificationItemComponent, NotFoundComponent],
})
export class ClassificationTableGroupComponent {
  public competitionStore = inject(CompetitionStore);

  public group = input.required<Group>();
  public teamClick = output<Team>();

  public onTeamClicked(team: Team): void {
    this.teamClick.emit(team);
  }
}
