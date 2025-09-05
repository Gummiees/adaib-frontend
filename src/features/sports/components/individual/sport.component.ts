import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { Sport } from '../../models/sport';

@Component({
  selector: 'app-sport',
  templateUrl: './sport.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NotFoundComponent],
})
export class SportComponent {
  public sport: Sport | null = inject(ActivatedRoute).snapshot.data['sport'];
}
