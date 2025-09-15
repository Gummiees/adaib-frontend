import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { TeamCardComponent } from '@shared/components/team-card/team-card.component';
import { AdminTeamsStore } from '../../store/admin-teams-store';

@Component({
  selector: 'app-admin-teams',
  templateUrl: './admin-teams.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FullSpinnerComponent,
    TeamCardComponent,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTeamsComponent {
  public adminTeamsStore = inject(AdminTeamsStore);
  private router = inject(Router);

  public onTeamClick(teamId: number): void {
    this.router.navigate(['/admin/teams', teamId]);
  }

  public onAddTeamClick(): void {
    this.router.navigate(['/admin/teams/add']);
  }
}
