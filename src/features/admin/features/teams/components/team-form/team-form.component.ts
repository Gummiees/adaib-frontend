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
import { ActivatedRoute, Router } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Team } from '@shared/models/team';
import { imageUrlRegex } from '@shared/utils/utils';
import { firstValueFrom } from 'rxjs';
import { AdminTeamsService } from '../../services/admin-teams.service';
import { adminTeamsEvent } from '../../store/admin-teams-events';
import { AdminTeamsStore } from '../../store/admin-teams-store';

@Component({
  selector: 'app-team-form',
  templateUrl: './team-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    FullSpinnerComponent,
    NotFoundComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AdminTeamsService, AdminTeamsStore],
})
export class TeamFormComponent {
  public teamsStore = inject(AdminTeamsStore);
  private teamsService = inject(AdminTeamsService);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  private team = signal<Team | null>(null);
  private isLoadingResponse = signal(false);

  // Determine if we're in edit mode based on route params
  public isEditMode = computed(() => {
    const teamId = this.activatedRoute.snapshot.params['id'];
    return teamId && !isNaN(Number(teamId));
  });

  public form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    shortName: new FormControl(''),
    description: new FormControl(''),
    location: new FormControl(''),
    imageUrl: new FormControl('', [Validators.pattern(imageUrlRegex)]),
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

  public get pageTitle(): string {
    return this.isEditMode() ? 'Editar Equipo' : 'Añadir Equipo';
  }

  public get submitButtonText(): string {
    return this.isEditMode() ? 'Actualizar' : 'Añadir';
  }

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
      if (this.isEditMode()) {
        this.searchTeam();
      }
    });
  }

  private searchTeam(): void {
    const teams = this.teamsStore.teams();
    const teamId = this.activatedRoute.snapshot.params['id'];
    if (teams && teamId) {
      const parsedId = Number(teamId);
      if (isNaN(parsedId)) {
        return;
      }

      const team = teams.find((team) => team.id === parsedId);
      this.team.set(team ?? null);
      if (team) {
        this.form.patchValue({
          name: team.name,
          shortName: team.shortName,
          description: team.description,
          location: team.location,
          imageUrl: team.imageUrl,
          active: team.active,
        });
      }
    }
  }

  public async onSubmit(): Promise<void> {
    if (this.form.valid && !this.isLoading()) {
      const team = this.formToTeam(this.form);
      if (this.isEditMode()) {
        await this.handleUpdateTeam(team);
      } else {
        await this.handleAddTeam(team);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  private formToTeam(form: FormGroup): Team {
    return {
      id: this.isEditMode() ? (this.team()?.id ?? 0) : 0,
      name: form.get('name')!.value,
      shortName: this.parseEmptyStringToNull(form.get('shortName')?.value),
      description: this.parseEmptyStringToNull(form.get('description')?.value),
      location: this.parseEmptyStringToNull(form.get('location')?.value),
      imageUrl: this.parseEmptyStringToNull(form.get('imageUrl')?.value),
      active: form.get('active')?.value || false,
    };
  }

  private parseEmptyStringToNull(value: string | null): string | null {
    return value === '' ? null : value;
  }

  private async handleAddTeam(team: Team): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const teamId = await firstValueFrom(this.teamsService.addTeam(team));
      this.dispatcher.dispatch(
        adminTeamsEvent.addTeam({ ...team, id: teamId }),
      );
      this.form.reset();
      this.router.navigate(['/admin/equipos']);
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir el equipo', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async handleUpdateTeam(team: Team): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.teamsService.updateTeam(team));
      this.dispatcher.dispatch(adminTeamsEvent.updateTeam(team));
      this.form.reset();
      this.router.navigate(['/admin/equipos']);
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al actualizar el equipo', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }
}
