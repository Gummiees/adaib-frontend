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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Team } from '@shared/models/team';
import { imageUrlRegex, urlRegex } from '@shared/utils/utils';
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
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
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
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  private team = signal<Team | null>(null);
  private isLoadingResponse = signal(false);

  // Determine if we're in edit mode based on route params or if we have a team with an ID
  public isEditMode = computed(() => {
    const teamId = this.activatedRoute.snapshot.params['id'];
    const hasTeamWithId = this.team()?.id;
    return (teamId && !isNaN(Number(teamId))) || !!hasTeamWithId;
  });

  public form = new FormGroup({
    name: new FormControl<string | null>(null, [
      Validators.required,
      Validators.maxLength(100),
    ]),
    shortName: new FormControl<string | null>(null, [
      Validators.maxLength(100),
    ]),
    description: new FormControl<string | null>(null, [
      Validators.maxLength(1000),
    ]),
    location: new FormControl<string | null>(null, [Validators.maxLength(100)]),
    arena: new FormControl<string | null>(null, [Validators.maxLength(100)]),
    arenaUrl: new FormControl<string | null>(null, [
      Validators.pattern(urlRegex),
      Validators.maxLength(255),
    ]),
    imageUrl: new FormControl<string | null>(null, [
      Validators.pattern(imageUrlRegex),
      Validators.maxLength(255),
    ]),
    active: new FormControl<boolean>(false, [Validators.required]),
  });

  public get name(): FormControl {
    return this.form.get('name') as FormControl;
  }

  public get shortName(): FormControl {
    return this.form.get('shortName') as FormControl;
  }

  public get location(): FormControl {
    return this.form.get('location') as FormControl;
  }

  public get arena(): FormControl {
    return this.form.get('arena') as FormControl;
  }

  public get arenaUrl(): FormControl {
    return this.form.get('arenaUrl') as FormControl;
  }

  public get imageUrl(): FormControl {
    return this.form.get('imageUrl') as FormControl;
  }

  public get description(): FormControl {
    return this.form.get('description') as FormControl;
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

  public shouldShowCreateButton(): boolean {
    return this.form.pristine;
  }

  public isMainButtonDisabled(): boolean {
    return this.form.invalid || this.isLoading() || this.form.pristine;
  }

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
      if (this.isEditMode() && !this.team()) {
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
          arena: team.arena,
          arenaUrl: team.arenaUrl,
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

  public async onDelete(): Promise<void> {
    const team = this.team();
    if (!team) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: 'Eliminar equipo',
        text: 'Se eliminarán todos los datos asociados a este equipo. Esta acción no se puede deshacer.',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onConfirmDelete(team.id);
      }
    });
  }

  public onCreateNew(): void {
    if (!this.form.pristine) {
      this.snackBar.open('Hay cambios sin guardar en el formulario', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    // Navigate to create new team page
    this.router.navigate(['/admin/equipo']);
  }

  private formToTeam(form: FormGroup): Team {
    return {
      id: this.isEditMode() ? (this.team()?.id ?? 0) : 0,
      name: form.get('name')!.value,
      shortName: this.parseEmptyStringToNull(form.get('shortName')?.value),
      description: this.parseEmptyStringToNull(form.get('description')?.value),
      location: this.parseEmptyStringToNull(form.get('location')?.value),
      arena: this.parseEmptyStringToNull(form.get('arena')?.value),
      arenaUrl: this.parseEmptyStringToNull(form.get('arenaUrl')?.value),
      imageUrl: this.parseEmptyStringToNull(form.get('imageUrl')?.value),
      active: form.get('active')?.value || false,
    };
  }

  private parseEmptyStringToNull(value: string | null): string | null {
    return !!value && value.trim() === '' ? null : value;
  }

  private async handleAddTeam(team: Team): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const teamId = await firstValueFrom(this.teamsService.addTeam(team));
      const newTeam = { ...team, id: teamId };
      this.dispatcher.dispatch(adminTeamsEvent.addTeam(newTeam));
      this.team.set(newTeam);
      this.form.markAsPristine();
      this.snackBar.open('Equipo añadido correctamente', 'Cerrar', {
        duration: 3000,
      });
      // Update the browser URL without navigation to reflect edit mode
      window.history.replaceState({}, '', `/admin/equipos/${teamId}`);
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
      this.team.set(team);
      this.form.markAsPristine();
      this.snackBar.open('Equipo actualizado correctamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al actualizar el equipo', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async onConfirmDelete(teamId: number): Promise<void> {
    if (!teamId) {
      return;
    }

    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.teamsService.deleteTeam(teamId));
      this.dispatcher.dispatch(adminTeamsEvent.deleteTeam(teamId));
      this.router.navigate(['/admin/equipos']);
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al eliminar el equipo', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }
}
