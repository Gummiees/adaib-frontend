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
import { AdminTeamsService } from '../../teams/services/admin-teams.service';
import { AdminTeamsStore } from '../../teams/store/admin-teams-store';
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
  providers: [
    CompetitionService,
    CompetitionStore,
    AdminMatchService,
    AdminTeamsService,
    AdminTeamsStore,
  ],
})
export class MatchFormComponent {
  public competitionStore = inject(CompetitionStore);
  private adminMatchService = inject(AdminMatchService);
  private teamsStore = inject(AdminTeamsStore);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public teams = computed<Team[]>(() => {
    const group = this.selectedGroup();
    return (
      this.teamsStore
        .teams()
        ?.filter((team) => group?.teamIds.includes(team.id)) ?? []
    );
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
  private match = signal<DetailedMatch | null>(null);
  public isEditMode = computed(() => !!this.matchId() || !!this.match()?.id);
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
    return !!(
      competition &&
      matchId &&
      !this.competitionStore.isLoading() &&
      !this.match()
    );
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
      homeTeamScore: new FormControl<number | null>({
        value: null,
        disabled: true,
      }),
      awayTeamScore: new FormControl<number | null>({
        value: null,
        disabled: true,
      }),
      result: new FormControl<MatchResult | null>({
        value: null,
        disabled: true,
      }),
      location: new FormControl<string | null>(null),
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
    const competitionId = this.competitionStore.competition()?.id;
    const phaseId = this.selectedPhase()?.id;
    const groupId = this.selectedGroup()?.id;
    if (!competitionId || !phaseId || !groupId) {
      return;
    }

    if (!this.isStatusCorrect()) {
      this.form.get('awayTeam')?.setErrors({ awayTeamRequired: true });
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.valid && !this.isLoading()) {
      const match = this.formToApiMatch(this.form);
      if (this.isEditMode()) {
        await this.handleUpdateMatch({
          match,
          competitionId,
          phaseId,
          groupId,
        });
      } else {
        await this.handleAddMatch({ match, competitionId, phaseId, groupId });
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  public async onDelete(): Promise<void> {
    const matchId = this.matchId();
    const competitionId = this.competitionStore.competition()?.id;
    const phaseId = this.selectedPhase()?.id;
    const groupId = this.selectedGroup()?.id;
    if (!matchId || !competitionId || !phaseId || !groupId) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: 'Eliminar partido',
        text: 'Se eliminarán todos los datos asociados a este partido. Esta acción no se puede deshacer.',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onConfirmDelete({ matchId, competitionId, phaseId, groupId });
      }
    });
  }

  private async onConfirmDelete({
    matchId,
    competitionId,
    phaseId,
    groupId,
  }: {
    matchId: number;
    competitionId: number;
    phaseId: number;
    groupId: number;
  }): Promise<void> {
    if (!matchId) {
      return;
    }

    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(
        this.adminMatchService.deleteMatch({
          competitionId,
          phaseId,
          groupId,
          matchId,
        }),
      );
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

  private async handleAddMatch({
    match,
    competitionId,
    phaseId,
    groupId,
  }: {
    match: ApiMatch;
    competitionId: number;
    phaseId: number;
    groupId: number;
  }): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const matchId = await firstValueFrom(
        this.adminMatchService.addMatch({
          competitionId,
          phaseId,
          groupId,
          match,
        }),
      );
      const newMatch: DetailedMatch = {
        id: matchId,
        homeTeam: this.form.get('homeTeam')?.value,
        awayTeam: this.form.get('awayTeam')?.value,
        date: match.date ? new Date(match.date) : null,
        homeTeamScore: match.homeTeamScore,
        awayTeamScore: match.awayTeamScore,
        location: match.location,
        result: match.result,
        status: match.status,
        round: this.form.get('round')?.value,
        phaseName: this.selectedPhase()?.name || '',
        groupName: this.selectedGroup()?.name || '',
      };
      this.match.set(newMatch);
      this.matchId.set(matchId);
      this.refreshCompetition();
      this.snackBar.open('Partido añadido correctamente', 'Cerrar', {
        duration: 3000,
      });
      // Update the browser URL without navigation to reflect edit mode
      window.history.replaceState(
        {},
        '',
        `/admin/competicion/${competitionId}/partido/${matchId}`,
      );
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir el partido', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async handleUpdateMatch({
    match,
    competitionId,
    phaseId,
    groupId,
  }: {
    match: ApiMatch;
    competitionId: number;
    phaseId: number;
    groupId: number;
  }): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(
        this.adminMatchService.updateMatch({
          competitionId,
          phaseId,
          groupId,
          match,
        }),
      );
      const updatedMatch: DetailedMatch = {
        id: match.id,
        homeTeam: this.form.get('homeTeam')?.value,
        awayTeam: this.form.get('awayTeam')?.value,
        date: match.date ? new Date(match.date) : null,
        homeTeamScore: match.homeTeamScore,
        awayTeamScore: match.awayTeamScore,
        location: match.location,
        result: match.result,
        status: match.status,
        round: this.form.get('round')?.value,
        phaseName: this.selectedPhase()?.name || '',
        groupName: this.selectedGroup()?.name || '',
      };
      this.match.set(updatedMatch);
      this.refreshCompetition();
      this.snackBar.open('Partido actualizado correctamente', 'Cerrar', {
        duration: 3000,
      });
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
      .subscribe(() => {
        this.updateAwayTeamInput();
        this.updateResultInput();
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
            this.teams().find((t: Team) => t.id === match.awayTeam?.id) ?? null;
          foundHomeTeam =
            this.teams().find((t: Team) => t.id === match.homeTeam.id) ?? null;
          break;
        }
        if (foundMatch) break;
      }
      if (foundMatch) break;
    }

    if (foundMatch && foundPhase && foundGroup) {
      this.match.set(foundMatch);
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

    // If all three parameters are provided, use existing logic
    if (faseId) {
      const phase = this.findAndSelectPhase(competition, faseId);
      if (!phase) {
        return;
      }
      // Pre-select group and round if provided
      this.preSelectGroup(phase, grupoId);
      this.preSelectRound(phase, jornadaId);
      return;
    }

    // If no phase but group and/or round are provided, search for them
    if (grupoId || jornadaId) {
      this.handleMissingPhaseQueryParam(competition, grupoId, jornadaId);
    }
  }

  private handleMissingPhaseQueryParam(
    competition: { phases: Phase[] },
    grupoId: string | undefined,
    jornadaId: string | undefined,
  ): void {
    // Parse IDs if provided
    const parsedGrupoId = grupoId ? Number(grupoId) : null;
    const parsedJornadaId = jornadaId ? Number(jornadaId) : null;

    // Validate parsed IDs
    if (grupoId && (isNaN(parsedGrupoId!) || parsedGrupoId === null)) {
      console.warn('Invalid grupo ID in query params:', grupoId);
      return;
    }
    if (jornadaId && (isNaN(parsedJornadaId!) || parsedJornadaId === null)) {
      console.warn('Invalid jornada ID in query params:', jornadaId);
      return;
    }

    // Case 1: Both group and round are provided - find phase that contains both
    if (parsedGrupoId !== null && parsedJornadaId !== null) {
      const foundPhase = this.findPhaseWithGroupAndRound(
        competition,
        parsedGrupoId,
        parsedJornadaId,
      );
      if (foundPhase) {
        this.selectPhaseGroupAndRound(
          foundPhase.phase,
          foundPhase.group,
          foundPhase.round,
        );
      }
      return;
    }

    // Case 2: Only group is provided - find phase that contains this group
    if (parsedGrupoId !== null) {
      const foundPhase = this.findPhaseWithGroup(competition, parsedGrupoId);
      if (foundPhase) {
        this.selectPhaseAndGroup(foundPhase.phase, foundPhase.group);
      }
      return;
    }

    // Case 3: Only round is provided - find phase that contains this round
    if (parsedJornadaId !== null) {
      const foundPhase = this.findPhaseWithRound(competition, parsedJornadaId);
      if (foundPhase) {
        this.selectPhaseAndRound(foundPhase.phase, foundPhase.round);
      }
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
    this.form
      .get('group')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((group: Group | null) => {
        this.selectedGroup.set(group);
        this.updateAwayTeamInput();

        const homeTeamControl = this.form.get('homeTeam');

        if (!group) {
          homeTeamControl?.disable();
          homeTeamControl?.setValue(null);
        } else {
          homeTeamControl?.enable();
        }
      });
  }

  private updateAwayTeamInput(): void {
    const awayTeamControl = this.form.get('awayTeam');
    const statusControl = this.form.get('status');
    const groupControl = this.form.get('group');
    if (statusControl?.value === 'Rest' || !groupControl?.value) {
      awayTeamControl?.setValue(null);
      awayTeamControl?.disable();
    } else {
      awayTeamControl?.enable();
    }
    awayTeamControl?.updateValueAndValidity();
  }

  private updateResultInput(): void {
    const resultControl = this.form.get('result');
    const homeTeamScoreControl = this.form.get('homeTeamScore');
    const awayTeamScoreControl = this.form.get('awayTeamScore');
    const statusControl = this.form.get('status');

    if (
      statusControl?.value === 'Finished' ||
      statusControl?.value === 'Ongoing'
    ) {
      resultControl?.enable();
      homeTeamScoreControl?.enable();
      awayTeamScoreControl?.enable();
    } else {
      resultControl?.disable();
      homeTeamScoreControl?.disable();
      awayTeamScoreControl?.disable();
      this.form.patchValue({
        result: null,
        homeTeamScore: null,
        awayTeamScore: null,
      });
    }
    resultControl?.updateValueAndValidity();
  }

  // Helper methods for finding phases that contain specific groups and rounds

  private findPhaseWithGroupAndRound(
    competition: { phases: Phase[] },
    groupId: number,
    roundId: number,
  ): { phase: Phase; group: Group; round: Round } | null {
    for (const phase of competition.phases) {
      const group = phase.groups.find((g: Group) => g.id === groupId);
      const round = phase.rounds.find((r: Round) => r.id === roundId);

      if (group && round) {
        return { phase, group, round };
      }
    }
    return null;
  }

  private findPhaseWithGroup(
    competition: { phases: Phase[] },
    groupId: number,
  ): { phase: Phase; group: Group } | null {
    for (const phase of competition.phases) {
      const group = phase.groups.find((g: Group) => g.id === groupId);
      if (group) {
        return { phase, group };
      }
    }
    return null;
  }

  private findPhaseWithRound(
    competition: { phases: Phase[] },
    roundId: number,
  ): { phase: Phase; round: Round } | null {
    for (const phase of competition.phases) {
      const round = phase.rounds.find((r: Round) => r.id === roundId);
      if (round) {
        return { phase, round };
      }
    }
    return null;
  }

  // Helper methods for selecting found phase/group/round combinations

  private selectPhaseGroupAndRound(
    phase: Phase,
    group: Group,
    round: Round,
  ): void {
    this.selectedPhase.set(phase);
    this.selectedGroup.set(group);
    this.form.patchValue({
      phase,
      group,
      round,
    });
  }

  private selectPhaseAndGroup(phase: Phase, group: Group): void {
    this.selectedPhase.set(phase);
    this.selectedGroup.set(group);
    this.form.patchValue({
      phase,
      group,
    });
  }

  private selectPhaseAndRound(phase: Phase, round: Round): void {
    this.selectedPhase.set(phase);
    this.form.patchValue({
      phase,
      round,
    });
  }
}
