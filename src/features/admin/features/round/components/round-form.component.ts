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
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CompetitionService } from '@features/competition/services/competition.service';
import { competitionEvents } from '@features/competition/store/competition-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { CompetitionsService } from '@features/competitions/services/competitions.service';
import { CompetitionsStore } from '@features/competitions/store/competitions-store';
import { UserStore } from '@features/user/store/user-store';
import { Dispatcher } from '@ngrx/signals/events';
import { DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Phase } from '@shared/models/phase';
import { Round } from '@shared/models/round';
import { firstValueFrom } from 'rxjs';
import { AdminRoundService } from '../services/admin-round.service';

@Component({
  selector: 'app-round-form',
  templateUrl: './round-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NotFoundComponent,
    FullSpinnerComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CompetitionService,
    CompetitionStore,
    AdminRoundService,
    CompetitionsService,
    CompetitionsStore,
  ],
})
export class RoundFormComponent {
  public competitionStore = inject(CompetitionStore);
  public userStore = inject(UserStore);
  private adminRoundService = inject(AdminRoundService);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public phases = computed<Phase[]>(() => {
    return this.competitionStore.competition()?.phases ?? [];
  });

  private selectedPhase = signal<Phase | null>(null);
  private roundId = signal<number | null>(null);
  private round = signal<Round | null>(null);
  public isEditMode = computed(() => !!this.roundId() || !!this.round()?.id);

  private isLoadingResponse = signal(false);
  private shouldForceFormUpdate = signal(false);

  public form!: FormGroup;

  public isLoading = computed(
    () => this.competitionStore.isLoading() || this.isLoadingResponse(),
  );

  // Computed signal that will automatically populate the form when both competition and roundId are available
  private shouldPopulateForm = computed(() => {
    const competition = this.competitionStore.competition();
    const roundId = this.roundId();
    const shouldForce = this.shouldForceFormUpdate();
    return !!(
      competition &&
      roundId &&
      !this.competitionStore.isLoading() &&
      (!this.round() || shouldForce)
    );
  });

  public shouldShowCreateButton(): boolean {
    return this.form.pristine;
  }

  public isMainButtonDisabled(): boolean {
    return this.form.invalid || this.isLoading() || this.form.pristine;
  }

  constructor() {
    this.form = new FormGroup({
      phase: new FormControl<Phase | null>(null, [Validators.required]),
      name: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(100),
      ]),
    });

    this.getCompetition();
    this.setupRouteParamSubscription();
    this.setupFormPopulation();
    this.setupPhasePreSelection();
  }

  public get name(): FormControl {
    return this.form.get('name') as FormControl;
  }

  public get phase(): FormControl {
    return this.form.get('phase') as FormControl;
  }

  public async onSubmit(): Promise<void> {
    if (this.form.valid && !this.isLoading()) {
      const round = this.formToRound(this.form);
      const phase = this.selectedPhase();
      const competitionId = this.competitionStore.competition()?.id;
      if (!phase || !competitionId) {
        return;
      }

      if (this.isEditMode()) {
        await this.handleUpdateRound(round, phase, competitionId);
      } else {
        await this.handleAddRound(round, phase, competitionId);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  public async onDelete(): Promise<void> {
    const roundId = this.roundId();
    const competitionId = this.competitionStore.competition()?.id;
    const phase = this.selectedPhase();
    if (!roundId || !competitionId || !phase) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: 'Eliminar jornada',
        text: 'Se eliminarán todos los datos asociados a esta jornada. Esta acción no se puede deshacer.',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onConfirmDelete(roundId, competitionId, phase);
      }
    });
  }

  private async onConfirmDelete(
    roundId: number,
    competitionId: number,
    phase: Phase,
  ): Promise<void> {
    if (!roundId) {
      return;
    }

    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(
        this.adminRoundService.deleteRound({
          competitionId: competitionId,
          phaseId: phase.id,
          roundId,
        }),
      );
      this.refreshCompetition();
      this.navigateToCompetition();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al eliminar la jornada', 'Cerrar');
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

  private formToRound(form: FormGroup): Round {
    return {
      id: this.isEditMode() ? this.roundId()! : 0,
      name: form.get('name')?.value ?? '',
    };
  }

  private async handleAddRound(
    round: Round,
    phase: Phase,
    competitionId: number,
  ): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const roundId = await firstValueFrom(
        this.adminRoundService.addRound({
          competitionId: competitionId,
          phaseId: phase.id,
          round,
        }),
      );
      const newRound = { ...round, id: roundId };
      this.round.set(newRound);
      this.roundId.set(roundId);
      this.shouldForceFormUpdate.set(true);
      this.refreshCompetition();
      this.form.markAsPristine();
      this.snackBar.open('Jornada añadida correctamente', 'Cerrar', {
        duration: 3000,
      });
      // Update the browser URL without navigation to reflect edit mode
      if (competitionId) {
        window.history.replaceState(
          {},
          '',
          `/admin/competicion/${competitionId}/jornada/${roundId}?fase=${phase.id}`,
        );
      }
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir la jornada', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async handleUpdateRound(
    round: Round,
    phase: Phase,
    competitionId: number,
  ): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const updatedRound = { ...round, id: this.roundId()! };
      await firstValueFrom(
        this.adminRoundService.updateRound({
          competitionId: competitionId,
          phaseId: phase.id,
          round: updatedRound,
        }),
      );
      this.round.set(updatedRound);
      this.shouldForceFormUpdate.set(true);
      this.refreshCompetition();
      this.form.markAsPristine();
      this.snackBar.open('Jornada actualizada correctamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al actualizar la jornada', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private setupFormPopulation(): void {
    // Watch for changes in the computed signal and populate form when ready
    effect(() => {
      if (this.shouldPopulateForm()) {
        this.populateFormFromRound();
      }
    });
  }

  private setupPhasePreSelection(): void {
    // Watch for competition changes and pre-select phase from query params
    effect(() => {
      const competition = this.competitionStore.competition();
      if (competition && !this.isEditMode()) {
        this.preSelectPhaseFromQueryParams(competition);
      }
    });
  }

  private preSelectPhaseFromQueryParams(competition: {
    phases: Phase[];
  }): void {
    const faseId = this.activatedRoute.snapshot.queryParams['fase'];
    if (faseId) {
      const parsedFaseId = Number(faseId);
      if (!isNaN(parsedFaseId)) {
        const phase = competition.phases.find(
          (p: Phase) => p.id === parsedFaseId,
        );
        if (phase) {
          this.form.patchValue({ phase });
          this.selectedPhase.set(phase);
        } else {
          console.warn(
            'Phase with ID',
            parsedFaseId,
            'not found in competition phases',
          );
        }
      } else {
        console.warn('Invalid fase ID in query params:', faseId);
      }
    }
  }

  private populateFormFromRound(): void {
    const competition = this.competitionStore.competition();
    if (!competition) {
      return;
    }

    const roundId = this.roundId();
    if (!roundId) {
      return;
    }

    let foundRound: Round | null = null;
    let foundPhase: Phase | null = null;

    for (const phase of competition.phases) {
      const round = phase.rounds.find((r: Round) => r.id === roundId);
      if (round) {
        foundRound = round;
        foundPhase = phase;
        break;
      }
    }

    if (foundRound && foundPhase) {
      this.round.set(foundRound);
      this.selectedPhase.set(foundPhase);
      this.form.patchValue({
        phase: foundPhase,
        name: foundRound.name,
      });
      // Reset the force update flag after successful population
      this.shouldForceFormUpdate.set(false);
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

  private setupRouteParamSubscription(): void {
    // Subscribe to route param changes to handle navigation within the same component
    this.activatedRoute.paramMap.subscribe((params) => {
      const roundId = params.get('roundId');
      if (roundId) {
        const parsedRoundId = Number(roundId);
        if (!isNaN(parsedRoundId)) {
          this.roundId.set(parsedRoundId);
          this.shouldForceFormUpdate.set(true);
        }
      } else {
        // No roundId in route, ensure we're in create mode
        this.resetComponentState();
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

    // Reset component state manually
    this.resetComponentState();

    // Navigate to create new round page, preserving query parameters
    const competitionId = this.competitionStore.competition()?.id;
    if (competitionId) {
      const queryParams: Params = {};

      // Preserve phase from current selection or query params
      const currentPhase = this.selectedPhase();
      if (currentPhase) {
        queryParams['fase'] = currentPhase.id.toString();
      } else {
        // Fallback to query params if no phase is selected
        const faseId = this.activatedRoute.snapshot.queryParams['fase'];
        if (faseId) {
          queryParams['fase'] = faseId;
        }
      }

      this.router.navigate(['/admin/competicion', competitionId, 'jornada'], {
        queryParams,
      });
    }
  }

  public onEditPhase(): void {
    const phaseId = this.form.get('phase')?.value?.id;
    if (!phaseId) {
      return;
    }
    this.router.navigate([
      '/admin/competicion',
      this.competitionStore.competition()?.id,
      'fase',
      phaseId,
    ]);
  }

  public onAddGroup(): void {
    const competitionId = this.competitionStore.competition()?.id;
    const phaseId = this.form.get('phase')?.value?.id;
    if (!phaseId || !competitionId) {
      return;
    }
    this.router.navigate(['/admin/competicion', competitionId, 'grupo'], {
      queryParams: { fase: phaseId },
    });
  }

  public onAddMatch(): void {
    const competition = this.competitionStore.competition();
    const roundId = this.roundId();
    if (!roundId || !competition) {
      return;
    }
    const queryParams: Params = { jornada: roundId };
    const phase = this.selectedPhase();
    if (phase) {
      queryParams['fase'] = phase.id.toString();
    }
    this.router.navigate(['/admin/competicion', competition.id, 'partido'], {
      queryParams,
    });
  }

  private resetComponentState(): void {
    // Reset internal state
    this.roundId.set(null);
    this.round.set(null);
    this.selectedPhase.set(null);
    this.shouldForceFormUpdate.set(false);

    // Reset form to pristine state but preserve phase selection
    const currentPhase = this.form.get('phase')?.value;
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();

    // Restore phase selection if it existed
    if (currentPhase) {
      this.form.patchValue({ phase: currentPhase });
      this.selectedPhase.set(currentPhase);
    }
  }
}
