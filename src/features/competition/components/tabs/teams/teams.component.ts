import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TeamCardComponent } from '@features/competition/components/tabs/teams/team-card/team-card.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Team } from '@shared/models/team';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NotFoundComponent, TeamCardComponent],
})
export class TeamsComponent {
  public teams = input.required<Team[]>();
}
