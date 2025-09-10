import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DetailedTeam } from '@shared/models/team';

@Component({
  selector: 'app-team-info',
  templateUrl: './team-info.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamInfoComponent {
  public team = input.required<DetailedTeam>();
}
