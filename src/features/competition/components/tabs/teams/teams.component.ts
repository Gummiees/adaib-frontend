import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UserStore } from '@features/user/store/user-store';
import { Dispatcher } from '@ngrx/signals/events';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { TeamCardComponent } from '@shared/components/team-card/team-card.component';
import { Team } from '@shared/models/team';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NotFoundComponent,
    TeamCardComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
})
export class TeamsComponent {
  public userStore = inject(UserStore);
  public dispatcher = inject(Dispatcher);
  private router = inject(Router);
  public teams = input.required<Team[]>();
  public teamSelected = output<number>();

  public activeTeams = computed(() =>
    this.teams().filter((team) => team.active),
  );

  public onTeamClick(teamId: number): void {
    this.teamSelected.emit(teamId);
  }

  public onEditTeamsClick(): void {
    this.router.navigate(['/admin/equipos']);
  }
}
