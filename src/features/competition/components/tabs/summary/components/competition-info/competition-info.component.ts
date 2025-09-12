import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';

@Component({
  selector: 'app-competition-info',
  templateUrl: './competition-info.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FullSpinnerComponent,
    NotFoundComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetitionInfoComponent {
  public store = inject(CompetitionStore);
}
