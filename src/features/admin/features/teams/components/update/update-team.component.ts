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
  selector: 'app-update-team',
  templateUrl: './update-team.component.html',
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
export class UpdateTeamComponent {
  public teamsStore = inject(AdminTeamsStore);
  private teamsService = inject(AdminTeamsService);
  private dispatcher = inject(Dispatcher);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private activatedRoute = inject(ActivatedRoute);

  private team = signal<Team | null>(null);

  private isLoadingResponse = signal(false);
  public form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    shortName: new FormControl(''),
    description: new FormControl(''),
    location: new FormControl(''),
    imageUrl: new FormControl('', [Validators.pattern(imageUrlRegex)]),
    active: new FormControl(false, [Validators.required]),
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

      this.searchTeam();
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
    if (this.form.valid && !this.isLoading() && this.team()) {
      const team = this.formToTeam(this.form);
      await this.handleUpdateTeam(team);
    } else {
      this.form.markAllAsTouched();
    }
  }

  private formToTeam(form: FormGroup): Team {
    const team = this.team();
    if (!team) {
      throw new Error('Team not found');
    }
    return {
      id: team.id,
      name: form.get('name')!.value,
      shortName: form.get('shortName')?.value,
      description: form.get('description')?.value,
      location: form.get('location')?.value,
      imageUrl: form.get('imageUrl')?.value,
      active: form.get('active')?.value || false,
    };
  }

  private async handleUpdateTeam(team: Team): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.teamsService.updateTeam(team));
      this.dispatcher.dispatch(adminTeamsEvent.updateTeam(team));
      this.form.reset();
      this.router.navigate(['/admin/teams']);
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al actualizar el equipo', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }
}
