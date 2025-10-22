import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { sponsors } from '@features/footer/sponsors';
import { Sponsor } from '@shared/models/sponsor';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  public sponsors: Sponsor[] = sponsors;

  public trackById = (_: number, item: Sponsor): string => item.id;
}
