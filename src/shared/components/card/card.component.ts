import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from './card';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CommonModule],
})
export class CardComponent {
  card = input.required<Card>();
}
