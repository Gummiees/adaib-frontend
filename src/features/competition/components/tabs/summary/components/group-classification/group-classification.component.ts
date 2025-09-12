import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ClassificationTableGroupComponent } from '@shared/components/classification-table-group/classification-table-group.component';
import { Group } from '@shared/models/group';
import { Team } from '@shared/models/team';

@Component({
  selector: 'app-group-classification',
  templateUrl: './group-classification.component.html',
  standalone: true,
  imports: [CommonModule, ClassificationTableGroupComponent, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupClassificationComponent {
  public moreInfoClick = output<void>();
  public teamClick = output<Team>();
  public group = input.required<Group>();

  public onTeamClicked(team: Team): void {
    this.teamClick.emit(team);
  }

  public onMoreInfoClicked(): void {
    this.moreInfoClick.emit();
  }
}
