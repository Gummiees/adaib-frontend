import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Card } from '../card/card';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-card-group',
  templateUrl: './card-group.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, CommonModule],
})
export class CardGroupComponent {
  cards = input.required<Card[]>();
}
