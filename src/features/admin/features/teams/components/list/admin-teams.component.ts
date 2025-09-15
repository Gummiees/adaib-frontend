import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { TeamCardComponent } from '@shared/components/team-card/team-card.component';
import { AdminTeamsService } from '../../services/admin-teams.service';
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
    NotFoundComponent,
    MatIconModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AdminTeamsStore, AdminTeamsService],
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
