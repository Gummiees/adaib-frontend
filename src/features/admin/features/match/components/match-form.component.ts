import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { CompetitionService } from '@features/competition/services/competition.service';
import { competitionEvents } from '@features/competition/store/competition-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { Dispatcher } from '@ngrx/signals/events';
import { DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Group } from '@shared/models/group';
import {
  ApiMatch,
  DetailedMatch,
  Match,
  MatchResult,
  MatchStatus,
} from '@shared/models/match';
import { Phase } from '@shared/models/phase';
import { Round } from '@shared/models/round';
import { Team } from '@shared/models/team';
import { setHours, setMinutes } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { AdminMatchService } from '../services/admin-match.service';
import { awayTeamValidator } from '../validators/away-team.validator';
import { timeValidator } from '../validators/time.validator';

@Component({
  selector: 'app-match-form',
  templateUrl: './match-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NotFoundComponent,
    FullSpinnerComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatOptionModule,
    MatSlideToggleModule,
    MatTimepickerModule,
    MatTooltipModule,
    MatIconModule,
    MatDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CompetitionService, CompetitionStore, AdminMatchService],
})
export class MatchFormComponent {
  public competitionStore = inject(CompetitionStore);
  private adminMatchService = inject(AdminMatchService);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public teams = computed<Team[]>(() => {
    const group = this.selectedGroup();
    return group?.teams ?? [];
  });
  public phases = computed<Phase[]>(() => {
    return this.competitionStore.competition()?.phases ?? [];
  });
  public groups = computed<Group[]>(() => {
    const phase = this.selectedPhase();
    if (!phase) {
      return [];
    }
    return phase.groups ?? [];
  });
  public rounds = computed<Round[]>(() => {
    const phase = this.selectedPhase();
    if (!phase) {
      return [];
    }
    return phase.rounds ?? [];
  });

  private selectedPhase = signal<Phase | null>(null);
  private selectedGroup = signal<Group | null>(null);
  private matchId = signal<number | null>(null);
  public isEditMode = computed(() => !!this.matchId());
  public isMatchNotFound = signal(false);

  private isLoadingResponse = signal(false);

  public form!: FormGroup;

  public isLoading = computed(
    () => this.competitionStore.isLoading() || this.isLoadingResponse(),
  );

  // Computed signal that will automatically populate the form when both competition and matchId are available
  private shouldPopulateForm = computed(() => {
    const competition = this.competitionStore.competition();
    const matchId = this.matchId();
    return !!(competition && matchId && !this.competitionStore.isLoading());
  });

  constructor() {
    this.form = new FormGroup({
      phase: new FormControl<Phase | null>(null, [Validators.required]),
      group: new FormControl<Group | null>({ value: null, disabled: true }, [
        Validators.required,
      ]),
      round: new FormControl<Round | null>({ value: null, disabled: true }, [
        Validators.required,
      ]),
      homeTeam: new FormControl<Team | null>({ value: null, disabled: true }, [
        Validators.required,
      ]),
      awayTeam: new FormControl<Team | null>({ value: null, disabled: true }),
      date: new FormControl<Date | null>(null),
      time: new FormControl<string | null>(null),
      homeTeamScore: new FormControl<number | null>(null),
      awayTeamScore: new FormControl<number | null>(null),
      location: new FormControl<string | null>(null),
      result: new FormControl<MatchResult | null>(null),
      status: new FormControl<MatchStatus>('NotStarted', [Validators.required]),
    });
    this.form.controls['awayTeam'].addValidators([
      awayTeamValidator(this.form.get('status')?.value),
    ]);
    this.form.controls['time'].addValidators([
      timeValidator(this.form.get('date')?.value),
    ]);

    this.getCompetition();
    this.checkForEditMode();
    this.setupFormControlDisabling();
    this.setupFormPopulation();
    this.setupAwayTeamValidator();
    this.setupTimeValidator();
    this.setupQueryParameterPreSelection();
    this.setupGroupChangeEffect();
  }

  public async onSubmit(): Promise<void> {
    if (!this.isStatusCorrect()) {
      this.form.get('awayTeam')?.setErrors({ awayTeamRequired: true });
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.valid && !this.isLoading()) {
      const match = this.formToApiMatch(this.form);
      if (this.isEditMode()) {
        await this.handleUpdateMatch(match);
      } else {
        await this.handleAddMatch(match);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  public async onDelete(): Promise<void> {
    const matchId = this.matchId();
    if (!matchId) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: 'partido',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onConfirmDelete(matchId);
      }
    });
  }

  private async onConfirmDelete(matchId: number): Promise<void> {
    if (!matchId) {
      return;
    }

    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.adminMatchService.deleteMatch(matchId));
      this.refreshCompetition();
      this.navigateToCompetition();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al eliminar el partido', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  public isStatusCorrect(): boolean {
    const status = this.form.get('status')?.value;
    const awayTeam = this.form.get('awayTeam')?.value;
    return status === 'Rest' || !!awayTeam;
  }

  private refreshCompetition(): void {
    const competitionId = this.competitionStore.competition()?.id;
    if (competitionId) {
      this.dispatcher.dispatch(competitionEvents.getCompetition(competitionId));
    }
  }

  private formToApiMatch(form: FormGroup): ApiMatch {
    const date = form.get('date')?.value as Date | null;
    const time = form.get('time')?.value as string | null;
    let combinedDate = date;

    if (date && time) {
      combinedDate = this.combineDateAndTime(date, time);
    }

    return {
      id: this.isEditMode() ? this.matchId()! : 0,
      roundId: form.get('round')?.value?.id,
      homeTeamId: form.get('homeTeam')?.value?.id,
      awayTeamId: form.get('awayTeam')?.value?.id,
      status: form.get('status')?.value ?? 'NotStarted',
      date: combinedDate ? combinedDate.toISOString() : null,
      homeTeamScore: form.get('homeTeamScore')?.value,
      awayTeamScore: form.get('awayTeamScore')?.value,
      location: this.parseEmptyStringToNull(form.get('location')?.value),
      result: form.get('result')?.value,
    };
  }

  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    return setMinutes(setHours(date, hours), minutes);
  }

  private parseEmptyStringToNull(value: string | null): string | null {
    return !!value && value.trim() === '' ? null : value;
  }

  private async handleAddMatch(match: ApiMatch): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.adminMatchService.addMatch(match));
      this.refreshCompetition();
      this.navigateToCompetition();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir la competición', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async handleUpdateMatch(match: ApiMatch): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.adminMatchService.updateMatch(match));
      this.refreshCompetition();
      this.navigateToCompetition();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al actualizar el partido', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private setupAwayTeamValidator(): void {
    this.form
      .get('status')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.form.get('awayTeam')?.updateValueAndValidity();
      });
  }

  private setupTimeValidator(): void {
    this.form
      .get('date')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.form.get('time')?.updateValueAndValidity();
      });
  }

  private setupFormControlDisabling(): void {
    this.form
      .get('phase')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((phase: Phase | null) => {
        const groupControl = this.form.get('group');
        const roundControl = this.form.get('round');
        this.selectedPhase.set(phase);
        if (phase) {
          groupControl?.enable();
          roundControl?.enable();
        } else {
          groupControl?.setValue(null);
          groupControl?.disable();
          roundControl?.setValue(null);
          roundControl?.disable();
        }
      });
    this.form
      .get('status')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((status: MatchStatus | null) => {
        const awayTeamControl = this.form.get('awayTeam');
        if (status === 'Rest') {
          awayTeamControl?.setValue(null);
          awayTeamControl?.disable();
        } else {
          awayTeamControl?.enable();
        }
        awayTeamControl?.updateValueAndValidity();
      });

    this.form
      .get('date')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((date: Date | null) => {
        const timeControl = this.form.get('time');
        if (!date) {
          timeControl?.setValue(null);
          timeControl?.disable();
        } else {
          timeControl?.enable();
        }
        timeControl?.updateValueAndValidity();
      });
  }

  private checkForEditMode(): void {
    const matchId = this.activatedRoute.snapshot.params['matchId'];
    if (matchId) {
      const parsedMatchId = Number(matchId);
      if (!isNaN(parsedMatchId)) {
        this.matchId.set(parsedMatchId);
      } else {
        this.isMatchNotFound.set(true);
      }
    }
  }

  private setupFormPopulation(): void {
    // Watch for changes in the computed signal and populate form when ready
    effect(() => {
      if (this.shouldPopulateForm()) {
        this.populateFormFromMatch();
      }
    });
  }

  private populateFormFromMatch(): void {
    const competition = this.competitionStore.competition();
    if (!competition) {
      return;
    }

    const matchId = this.matchId();
    if (!matchId) {
      return;
    }

    let foundMatch: DetailedMatch | null = null;
    let foundPhase: Phase | null = null;
    let foundGroup: Group | null = null;
    let foundAwayTeam: Team | null = null;
    let foundHomeTeam: Team | null = null;

    for (const phase of competition.phases) {
      for (const group of phase.groups) {
        const match = group.matches.find((m: Match) => m.id === matchId);
        if (match) {
          foundMatch = {
            ...match,
            round: match.round,
            phaseName: phase.name,
            groupName: group.name,
          };
          foundPhase = phase;
          foundGroup = group;
          foundAwayTeam =
            group.teams?.find((t: Team) => t.id === match.awayTeam?.id) ?? null;
          foundHomeTeam =
            group.teams?.find((t: Team) => t.id === match.homeTeam.id) ?? null;
          break;
        }
        if (foundMatch) break;
      }
      if (foundMatch) break;
    }

    if (foundMatch && foundPhase && foundGroup) {
      this.selectedPhase.set(foundPhase);
      this.selectedGroup.set(foundGroup);
      this.form.patchValue({
        phase: foundPhase,
        group: foundGroup,
        round: foundMatch.round,
        homeTeam: foundHomeTeam,
        awayTeam: foundAwayTeam,
        date: foundMatch.date,
        time: foundMatch.date,
        homeTeamScore: foundMatch.homeTeamScore,
        awayTeamScore: foundMatch.awayTeamScore,
        location: foundMatch.location,
        result: foundMatch.result,
        status: foundMatch.status,
      });
    }
  }

  private setupQueryParameterPreSelection(): void {
    // Watch for competition changes and pre-select from query params
    effect(() => {
      const competition = this.competitionStore.competition();
      if (competition && !this.isEditMode()) {
        this.preSelectFromQueryParams(competition);
      }
    });
  }

  private navigateToCompetition(): void {
    const competitionId = this.competitionStore.competition()?.id;
    if (competitionId) {
      this.router.navigate(['/competiciones', competitionId], {
        queryParams: { tab: 'resultados' },
      });
    }
  }

  private preSelectFromQueryParams(competition: { phases: Phase[] }): void {
    const queryParams = this.activatedRoute.snapshot.queryParams;
    const faseId = queryParams['fase'];
    const grupoId = queryParams['grupo'];
    const jornadaId = queryParams['jornada'];

    // Phase is required to populate groups and rounds
    if (!faseId) {
      this.handleMissingPhaseQueryParam(grupoId, jornadaId);
      return;
    }

    const phase = this.findAndSelectPhase(competition, faseId);
    if (!phase) {
      return;
    }

    // Pre-select group and round if provided
    this.preSelectGroup(phase, grupoId);
    this.preSelectRound(phase, jornadaId);
  }

  private handleMissingPhaseQueryParam(
    grupoId: string,
    jornadaId: string,
  ): void {
    if (grupoId || jornadaId) {
      console.warn(
        'Ignoring grupo/jornada query params because fase is required but not provided',
      );
    }
  }

  private findAndSelectPhase(
    competition: { phases: Phase[] },
    faseId: string,
  ): Phase | null {
    const parsedFaseId = Number(faseId);
    if (isNaN(parsedFaseId)) {
      console.warn('Invalid fase ID in query params:', faseId);
      return null;
    }

    const phase = competition.phases.find((p: Phase) => p.id === parsedFaseId);
    if (!phase) {
      console.warn(
        'Phase with ID',
        parsedFaseId,
        'not found in competition phases',
      );
      return null;
    }

    // Pre-select phase
    this.form.patchValue({ phase });
    this.selectedPhase.set(phase);
    return phase;
  }

  private preSelectGroup(phase: Phase, grupoId: string | undefined): void {
    if (!grupoId) {
      return;
    }

    const parsedGrupoId = Number(grupoId);
    if (isNaN(parsedGrupoId)) {
      console.warn('Invalid grupo ID in query params:', grupoId);
      return;
    }

    const group = phase.groups.find((g: Group) => g.id === parsedGrupoId);
    if (group) {
      this.form.patchValue({ group });
      this.selectedGroup.set(group);
    } else {
      console.warn('Group with ID', parsedGrupoId, 'not found in phase groups');
    }
  }

  private preSelectRound(phase: Phase, jornadaId: string | undefined): void {
    if (!jornadaId) {
      return;
    }

    const parsedJornadaId = Number(jornadaId);
    if (isNaN(parsedJornadaId)) {
      console.warn('Invalid jornada ID in query params:', jornadaId);
      return;
    }

    const round = phase.rounds.find((r: Round) => r.id === parsedJornadaId);
    if (round) {
      this.form.patchValue({ round });
    } else {
      console.warn(
        'Round with ID',
        parsedJornadaId,
        'not found in phase rounds',
      );
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

  private setupGroupChangeEffect(): void {
    // Subscribe to group form control changes
    this.form
      .get('group')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((group: Group | null) => {
        // Update the selectedGroup signal
        this.selectedGroup.set(group);

        const homeTeamControl = this.form.get('homeTeam');
        const awayTeamControl = this.form.get('awayTeam');

        if (!group) {
          // Disable team selects and clear selections when no group is selected
          homeTeamControl?.disable();
          awayTeamControl?.disable();
          this.form.patchValue({
            homeTeam: null,
            awayTeam: null,
          });
        } else {
          // Enable team selects when a group is selected
          homeTeamControl?.enable();
          awayTeamControl?.enable();
        }
      });
  }
}
