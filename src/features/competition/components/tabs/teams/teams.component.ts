import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { TeamCardComponent } from '@shared/components/team-card/team-card.component';
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
  public teamSelected = output<number>();

  public activeTeams = computed(() =>
    this.teams().filter((team) => team.active),
  );

  public onTeamClick(teamId: number): void {
    this.teamSelected.emit(teamId);
  }
}
