import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Team } from '@shared/models/team';

@Component({
  selector: 'app-team-image',
  templateUrl: './team-image.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamImageComponent {
  public team = input.required<Team>();
}
