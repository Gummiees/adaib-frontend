import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Team } from '@shared/models/team';

@Component({
  selector: 'app-team-card',
  templateUrl: './team-card.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamCardComponent {
  public team = input.required<Team>();
  public teamClick = output<void>();

  public onTeamClick(): void {
    this.teamClick.emit();
  }
}
