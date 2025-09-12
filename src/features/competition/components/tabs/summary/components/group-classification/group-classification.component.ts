import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { Group } from '@shared/models/group';
import { Team } from '@shared/models/team';

@Component({
  selector: 'app-group-classification',
  templateUrl: './group-classification.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupClassificationComponent {
  public moreInfoClick = output<void>();
  public teamClick = output<Team>();
  public group = input.required<Group>();

  public onTeamClicked(team: Team) {
    this.teamClick.emit(team);
  }

  public onMoreInfoClicked() {
    this.moreInfoClick.emit();
  }
}
