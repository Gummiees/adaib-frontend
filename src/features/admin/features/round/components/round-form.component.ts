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
  public isEditMode = computed(() => !!this.roundId());

  private isLoadingResponse = signal(false);

  public form!: FormGroup;

  public isLoading = computed(
    () => this.competitionStore.isLoading() || this.isLoadingResponse(),
  );

  // Computed signal that will automatically populate the form when both competition and roundId are available
  private shouldPopulateForm = computed(() => {
    const competition = this.competitionStore.competition();
    const roundId = this.roundId();
    return !!(competition && roundId && !this.competitionStore.isLoading());
  });

  constructor() {
    this.form = new FormGroup({
      phase: new FormControl<Phase | null>(null, [Validators.required]),
      name: new FormControl<string | null>(null, [Validators.required]),
    });

    this.getCompetition();
    this.checkForEditMode();
    this.setupFormPopulation();
    this.setupPhasePreSelection();
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
        await this.handleUpdateRound(round, phase);
      } else {
        await this.handleAddRound(round, phase);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  public async onDelete(): Promise<void> {
    const roundId = this.roundId();
    if (!roundId) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: 'Eliminar ronda',
        text: 'Se eliminarán todos los datos asociados a esta ronda. Esta acción no se puede deshacer.',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onConfirmDelete(roundId);
      }
    });
  }

  private async onConfirmDelete(roundId: number): Promise<void> {
    if (!roundId) {
      return;
    }

    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.adminRoundService.deleteRound(roundId));
      this.refreshCompetition();
      this.navigateToCompetition();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al eliminar la ronda', 'Cerrar');
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

  private async handleAddRound(round: Round, _phase: Phase): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.adminRoundService.addRound(round));
      this.refreshCompetition();
      this.navigateToCompetition();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir la ronda', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async handleUpdateRound(round: Round, _phase: Phase): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.adminRoundService.updateRound(round));
      this.refreshCompetition();
      this.navigateToCompetition();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al actualizar la ronda', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private checkForEditMode(): void {
    const roundId = this.activatedRoute.snapshot.params['roundId'];
    if (roundId) {
      const parsedRoundId = Number(roundId);
      if (!isNaN(parsedRoundId)) {
        this.roundId.set(parsedRoundId);
      }
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
      this.selectedPhase.set(foundPhase);
      this.form.patchValue({
        phase: foundPhase,
        name: foundRound.name,
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
}
