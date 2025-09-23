import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UserStore } from '@features/user/store/user-store';
import { Team } from '@shared/models/team';

@Component({
  selector: 'app-team-card',
  templateUrl: './team-card.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamCardComponent {
  public userStore = inject(UserStore);
  private router = inject(Router);
  public team = input.required<Team>();
  public teamClick = output<void>();

  public onTeamClick(): void {
    this.teamClick.emit();
  }

  public onArenaClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const arenaUrl = this.team().arenaUrl;
    if (arenaUrl) {
      window.open(arenaUrl, '_blank');
    }
  }

  public onEditTeamClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.router.navigate(['/admin/equipo', this.team().id]);
  }
}
