import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButtonModule, RouterModule],
})
export class NotFoundComponent {
  public title = input<string>('Página no encontrada');
  public subtitle = input<string>(
    'Lo sentimos, no encontramos la página que estás buscando.',
  );
  public buttonText = input<string>('Ir a la página de inicio');
  public hideButton = input<boolean>(false);
  public buttonClicked = output<void>();
}
