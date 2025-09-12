import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CompactTeamComponent } from '@shared/components/compacted-team/compact-team.component';
import { Classification } from '@shared/models/classification';
import { Team } from '@shared/models/team';

@Component({
  selector: 'app-classification-item',
  templateUrl: './classification-item.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CompactTeamComponent],
})
export class ClassificationItemComponent {
  public classification = input<Classification | null>(null);
  public isHeader = input<boolean>(false);
  public teamClick = output<Team>();

  public getPointsText(): string {
    return this.isHeader()
      ? 'Puntos'
      : this.classification()!.points.toString();
  }

  public onTeamClicked(team: Team): void {
    this.teamClick.emit(team);
  }
}
