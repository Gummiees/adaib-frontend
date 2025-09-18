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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { CompetitionService } from '@features/competition/services/competition.service';
import { competitionEvents } from '@features/competition/store/competition-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { CompetitionsService } from '@features/competitions/services/competitions.service';
import { CompetitionsStore } from '@features/competitions/store/competitions-store';
import { Dispatcher } from '@ngrx/signals/events';
import { DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { ApiPhase, Phase } from '@shared/models/phase';
import { firstValueFrom } from 'rxjs';
import { AdminPhaseService } from '../services/admin-phase.service';

@Component({
  selector: 'app-phase-form',
  templateUrl: './phase-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NotFoundComponent,
    FullSpinnerComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CompetitionService,
    CompetitionStore,
    AdminPhaseService,
    CompetitionsService,
    CompetitionsStore,
  ],
})
export class PhaseFormComponent {
  public competitionStore = inject(CompetitionStore);
  private adminPhaseService = inject(AdminPhaseService);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  private phaseId = signal<number | null>(null);
  private phase = signal<Phase | null>(null);
  public isEditMode = computed(() => !!this.phaseId() || !!this.phase()?.id);

  private isLoadingResponse = signal(false);

  public form!: FormGroup;

  public isLoading = computed(
    () => this.competitionStore.isLoading() || this.isLoadingResponse(),
  );

  // Computed signal that will automatically populate the form when both competition and phaseId are available
  private shouldPopulateForm = computed(() => {
    const competition = this.competitionStore.competition();
    const phaseId = this.phaseId();
    return !!(
      competition &&
      phaseId &&
      !this.competitionStore.isLoading() &&
      !this.phase()
    );
  });

  constructor() {
    this.form = new FormGroup({
      name: new FormControl<string | null>(null, [Validators.required]),
    });

    this.getCompetition();
    this.checkForEditMode();
    this.setupFormPopulation();
  }

  public async onSubmit(): Promise<void> {
    if (this.form.valid && !this.isLoading()) {
      const phase = this.formToPhase(this.form);
      const competitionId = this.competitionStore.competition()?.id;
      if (!competitionId) {
        return;
      }
      if (this.isEditMode()) {
        await this.handleUpdatePhase(phase, competitionId);
      } else {
        await this.handleAddPhase(phase, competitionId);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  public async onDelete(): Promise<void> {
    const phaseId = this.phaseId();
    const competitionId = this.competitionStore.competition()?.id;
    if (!phaseId || !competitionId) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: 'Eliminar fase',
        text: 'Se eliminarán todos los grupos, jornadas y partidos asociados a esta fase. Esta acción no se puede deshacer.',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onConfirmDelete(phaseId, competitionId);
      }
    });
  }

  private async onConfirmDelete(
    phaseId: number,
    competitionId: number,
  ): Promise<void> {
    if (!phaseId) {
      return;
    }

    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(
        this.adminPhaseService.deletePhase({
          competitionId: competitionId,
          phaseId,
        }),
      );
      this.refreshCompetition();
      this.navigateToCompetition();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al eliminar la fase', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private refreshCompetition(): void {
    const competitionId = this.competitionStore.competition()?.id;
    if (competitionId) {
      this.dispatcher.dispatch(competitionEvents.getCompetition(competitionId));
    }
  }

  private formToPhase(form: FormGroup): Phase {
    return {
      id: this.isEditMode() ? this.phaseId()! : 0,
      name: form.get('name')?.value ?? '',
      groups: [],
      rounds: [],
    };
  }

  private async handleAddPhase(
    phase: Phase,
    competitionId: number,
  ): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const apiPhase = this.phaseToApiPhase(phase);
      const phaseId = await firstValueFrom(
        this.adminPhaseService.addPhase({
          competitionId: competitionId,
          phase: apiPhase,
        }),
      );
      const newPhase = { ...phase, id: phaseId };
      this.phase.set(newPhase);
      this.phaseId.set(phaseId);
      this.refreshCompetition();
      this.snackBar.open('Fase añadida correctamente', 'Cerrar', {
        duration: 3000,
      });
      window.history.replaceState(
        {},
        '',
        `/admin/competicion/${competitionId}/fase/${phaseId}`,
      );
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir la fase', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async handleUpdatePhase(
    phase: Phase,
    competitionId: number,
  ): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const updatedPhase = { ...phase, id: this.phaseId()! };
      const apiPhase = this.phaseToApiPhase(updatedPhase);
      await firstValueFrom(
        this.adminPhaseService.updatePhase({
          competitionId: competitionId,
          phase: apiPhase,
        }),
      );
      this.phase.set(updatedPhase);
      this.refreshCompetition();
      this.snackBar.open('Fase actualizada correctamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al actualizar la fase', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private phaseToApiPhase(phase: Phase): ApiPhase {
    return {
      id: phase.id,
      name: phase.name,
      groups: [],
      rounds: [],
    };
  }

  private checkForEditMode(): void {
    const phaseId = this.activatedRoute.snapshot.params['phaseId'];
    if (phaseId) {
      const parsedPhaseId = Number(phaseId);
      if (!isNaN(parsedPhaseId)) {
        this.phaseId.set(parsedPhaseId);
      }
    }
  }

  private setupFormPopulation(): void {
    // Watch for changes in the computed signal and populate form when ready
    effect(() => {
      if (this.shouldPopulateForm()) {
        this.populateFormFromPhase();
      }
    });
  }

  private populateFormFromPhase(): void {
    const competition = this.competitionStore.competition();
    if (!competition) {
      return;
    }

    const phaseId = this.phaseId();
    if (!phaseId) {
      return;
    }

    const foundPhase = competition.phases.find((p: Phase) => p.id === phaseId);

    if (foundPhase) {
      this.phase.set(foundPhase);
      this.form.patchValue({
        name: foundPhase.name,
      });
    }
  }

  private navigateToCompetition(): void {
    const competitionId = this.competitionStore.competition()?.id;
    if (competitionId) {
      this.router.navigate(['/competiciones', competitionId]);
    }
  }

  private getCompetition(): void {
    const id = this.activatedRoute.snapshot.params['id'];
    if (!id) {
      return;
    }
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return;
    }
    if (this.competitionStore.competition()?.id === parsedId) {
      return;
    }
    this.dispatcher.dispatch(competitionEvents.getCompetition(parsedId));
  }

  public onAddGroup(): void {
    const phaseId = this.phaseId();
    if (!phaseId) {
      return;
    }
    this.router.navigate(
      ['/admin/competicion', this.competitionStore.competition()?.id, 'grupo'],
      { queryParams: { fase: phaseId } },
    );
  }

  public onAddRound(): void {
    const competition = this.competitionStore.competition();
    const phaseId = this.phaseId();
    if (!phaseId || !competition) {
      return;
    }
    this.router.navigate(['/admin/competicion', competition.id, 'jornada'], {
      queryParams: { fase: phaseId },
    });
  }
}
