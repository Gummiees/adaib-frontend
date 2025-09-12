import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TeamImageComponent } from '@shared/components/team-image/team-image.component';
import { Team } from '@shared/models/team';

export type CompactTeamPosition = 'left' | 'right';
export type CompactTeamFontSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-compact-team',
  templateUrl: './compact-team.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule, TeamImageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompactTeamComponent {
  public isWinner = input<boolean>(false);
  public team = input.required<Team>();
  public position = input<CompactTeamPosition>();
  public fontSize = input<CompactTeamFontSize | null>(null);

  public teamClicked = output<Team>();

  public onTeamClicked(): void {
    this.teamClicked.emit(this.team());
  }
}
