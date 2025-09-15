import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { Team } from '@shared/models/team';
import { imageUrlRegex } from '@shared/utils/utils';
import { firstValueFrom } from 'rxjs';
import { TeamsService } from '../../services/teams.service';
import { adminTeamsEvent } from '../../store/admin-teams-events';
import { AdminTeamsStore } from '../../store/admin-teams-store';

@Component({
  selector: 'app-add-team',
  templateUrl: './add-team.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    FullSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTeamComponent {
  public teamsStore = inject(AdminTeamsStore);
  private teamsService = inject(TeamsService);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  private isLoadingResponse = signal(false);
  public form = new FormGroup({
    name: new FormControl(null, [Validators.required]),
    shortName: new FormControl(null),
    description: new FormControl(null),
    location: new FormControl(null),
    imageUrl: new FormControl(null, [Validators.pattern(imageUrlRegex)]),
    active: new FormControl(true, [Validators.required]),
  });

  public get name(): FormControl {
    return this.form.get('name') as FormControl;
  }

  public get imageUrl(): FormControl {
    return this.form.get('imageUrl') as FormControl;
  }

  public isLoading = computed(
    () => this.teamsStore.isLoading() || this.isLoadingResponse(),
  );

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });
  }

  public async onSubmit(): Promise<void> {
    if (this.form.valid && !this.isLoading()) {
      const team = this.formToTeam(this.form);
      await this.handleAddTeam(team);
    } else {
      this.form.markAllAsTouched();
    }
  }

  private formToTeam(form: FormGroup): Team {
    return {
      id: 0,
      name: form.get('name')!.value,
      shortName: form.get('shortName')?.value,
      description: form.get('description')?.value,
      location: form.get('location')?.value,
      imageUrl: form.get('imageUrl')?.value,
      active: form.get('active')?.value || false,
    };
  }

  private async handleAddTeam(team: Team): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const addedTeam = await firstValueFrom(this.teamsService.addTeam(team));
      this.dispatcher.dispatch(adminTeamsEvent.addTeam(addedTeam));
      this.form.reset();
      this.router.navigate(['/admin/teams']);
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir el equipo', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }
}
