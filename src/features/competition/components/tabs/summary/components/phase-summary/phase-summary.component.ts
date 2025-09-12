import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Team } from '@shared/models/team';
import { GroupSummaryComponent } from '../group-summary/group-summary.component';

@Component({
  selector: 'app-phase-summary',
  templateUrl: './phase-summary.component.html',
  standalone: true,
  imports: [CommonModule, NotFoundComponent, GroupSummaryComponent],
})
export class PhaseSummaryComponent {
  public store = inject(CompetitionStore);
  public phase = input<Phase | null>(null);

  public moreInfoClick = output<void>();
  public teamClick = output<Team>();

  public getPhase(phase: Phase | 'all'): Phase | null {
    if (phase === 'all') {
      return null;
    }
    return phase;
  }

  public getGroup(group: Group | 'all'): Group | null {
    if (group === 'all') {
      return null;
    }
    return group;
  }

  public onMoreInfoClicked(): void {
    this.moreInfoClick.emit();
  }

  public onTeamClicked(team: Team): void {
    this.teamClick.emit(team);
  }
}
