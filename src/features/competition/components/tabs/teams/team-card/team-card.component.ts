import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Team } from '@shared/models/team';

@Component({
  selector: 'app-team-card',
  templateUrl: './team-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CommonModule, MatIconModule],
})
export class TeamCardComponent {
  team = input.required<Team>();
}
