import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '@features/user/store/user-store';
import { Competition } from '@shared/models/competition';
import { CompetitionProgressComponent } from '../competition-progress/competition-progress.component';

@Component({
  selector: 'app-competition-card',
  templateUrl: './competition-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CommonModule,
    CompetitionProgressComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
})
export class CompetitionCardComponent {
  public userStore = inject(UserStore);
  private router = inject(Router);

  competition = input.required<Competition>();

  public onEditCompetitionClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.router.navigate(['/admin/competicion', this.competition().id]);
  }
}
