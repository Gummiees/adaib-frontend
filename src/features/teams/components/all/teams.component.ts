import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { Team } from '@features/teams/models/team';
import { Card } from '@shared/components/card/card';
import { CardComponent } from '@shared/components/card/card.component';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, CommonModule, NotFoundComponent],
})
export class TeamsComponent {
  public teams = input.required<Team[]>();

  public teamCards = computed<Card[]>(() =>
    this.teams().map<Card>((team: Team) => ({
      id: team.id,
      title: team.name,
      subtitle: team.description,
      link: 'equipos',
      imageUrl: team.imageUrl,
    })),
  );
}
