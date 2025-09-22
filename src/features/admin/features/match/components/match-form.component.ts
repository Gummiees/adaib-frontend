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
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CompetitionService } from '@features/competition/services/competition.service';
import { competitionEvents } from '@features/competition/store/competition-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { Dispatcher } from '@ngrx/signals/events';
import { DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Group } from '@shared/models/group';
import {
  DetailedMatch,
  FormApiMatch,
  Match,
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

  private allTeams = computed<Team[]>(() => {
    return this.teamsStore.teams() ?? [];
  });
  public teams = computed<Team[]>(() => {
    const group = this.selectedGroup();
    return (
      this.allTeams()?.filter((team) => group?.teamIds.includes(team.id)) ?? []
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

  public shouldShowCreateButton(): boolean {
    return this.form.pristine;
  }

  public isMainButtonDisabled(): boolean {
    return this.form.invalid || this.isLoading() || this.form.pristine;
  }

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
      status: new FormControl<MatchStatus>('NotStarted', [Validators.required]),
    });
    this.form.controls['awayTeam'].addValidators([
      awayTeamValidator(this.form.get('status')?.value),
    ]);
    this.form.controls['time'].addValidators([
      timeValidator(this.form.get('date')?.value),
    ]);

    this.getCompetition();
    this.setupRouteParamSubscription();
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
      const phase = this.selectedPhase();
      const group = this.selectedGroup();
      const round = this.form.get('round')?.value;
      if (!phase || !group || !round) {
        return;
      }

      if (this.isEditMode()) {
        await this.handleUpdateMatch({
          match,
          competitionId,
          phase,
          group,
          round,
        });
      } else {
        await this.handleAddMatch({
          match,
          competitionId,
          phase,
          group,
          round,
        });
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

  private formToApiMatch(form: FormGroup): FormApiMatch {
    const date = form.get('date')?.value as Date | null;
    const time = form.get('time')?.value as Date | null;
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
    };
  }

  private combineDateAndTime(date: Date, time: Date): Date {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    return setMinutes(setHours(date, hours), minutes);
  }

  private async handleAddMatch({
    match,
    competitionId,
    phase,
    group,
    round,
  }: {
    match: FormApiMatch;
    competitionId: number;
    phase: Phase;
    group: Group;
    round: Round;
  }): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const matchId = await firstValueFrom(
        this.adminMatchService.addMatch({
          competitionId,
          phaseId: phase.id,
          groupId: group.id,
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
        status: match.status,
        round: round,
        phaseName: this.selectedPhase()?.name || '',
        groupName: this.selectedGroup()?.name || '',
      };
      this.match.set(newMatch);
      this.matchId.set(matchId);
      this.refreshCompetition();
      this.form.markAsPristine();
      this.snackBar.open('Partido añadido correctamente', 'Cerrar', {
        duration: 3000,
      });

      // Update the browser URL without navigation to reflect edit mode
      window.history.replaceState(
        {},
        '',
        `/admin/competicion/${competitionId}/partido/${matchId}?fase=${phase.id}&grupo=${group.id}&jornada=${round.id}`,
      );

      // Manually trigger query parameter processing since we're not doing a real navigation
      // The form should maintain its current state as it already has the correct values
      // But we need to ensure the URL query params are processed for any future operations
      this.processCurrentQueryParams();
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
    phase,
    group,
    round,
  }: {
    match: FormApiMatch;
    competitionId: number;
    phase: Phase;
    group: Group;
    round: Round;
  }): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(
        this.adminMatchService.updateMatch({
          competitionId,
          phaseId: phase.id,
          groupId: group.id,
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
        status: match.status,
        round: round,
        phaseName: this.selectedPhase()?.name || '',
        groupName: this.selectedGroup()?.name || '',
      };
      this.match.set(updatedMatch);
      this.refreshCompetition();
      this.form.markAsPristine();
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
        this.updateScoreInputs();
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

  private setupRouteParamSubscription(): void {
    // Subscribe to route param changes to handle navigation within the same component
    this.activatedRoute.paramMap.subscribe((params) => {
      const matchId = params.get('matchId');
      if (matchId) {
        const parsedMatchId = Number(matchId);
        if (!isNaN(parsedMatchId)) {
          this.matchId.set(parsedMatchId);
        } else {
          this.isMatchNotFound.set(true);
        }
      } else {
        // No matchId in route, ensure we're in create mode
        this.resetComponentState();
      }
    });
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
    const teams = this.allTeams();
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
            teams.find((t: Team) => t.id === match.awayTeam?.id) ?? null;
          foundHomeTeam =
            teams.find((t: Team) => t.id === match.homeTeam.id) ?? null;
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

  private processCurrentQueryParams(): void {
    const competition = this.competitionStore.competition();
    if (competition) {
      this.preSelectFromQueryParams(competition);
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

  private updateScoreInputs(): void {
    const homeTeamScoreControl = this.form.get('homeTeamScore');
    const awayTeamScoreControl = this.form.get('awayTeamScore');
    const statusControl = this.form.get('status');

    if (
      statusControl?.value === 'Finished' ||
      statusControl?.value === 'OnGoing'
    ) {
      homeTeamScoreControl?.enable();
      awayTeamScoreControl?.enable();
    } else {
      homeTeamScoreControl?.disable();
      awayTeamScoreControl?.disable();
      this.form.patchValue({
        homeTeamScore: null,
        awayTeamScore: null,
      });
    }
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

  public onCreateNew(): void {
    if (!this.form.pristine) {
      this.snackBar.open('Hay cambios sin guardar en el formulario', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    // Navigate to create new match page, preserving query parameters
    const competitionId = this.competitionStore.competition()?.id;
    if (competitionId) {
      const queryParams: Params = {};

      // Preserve current selections or fallback to query params
      const currentPhase = this.selectedPhase();
      const currentGroup = this.selectedGroup();
      const currentRound = this.form.get('round')?.value;
      const currentQueryParams = this.activatedRoute.snapshot.queryParams;

      // Preserve phase
      if (currentPhase) {
        queryParams['fase'] = currentPhase.id.toString();
      } else if (currentQueryParams['fase']) {
        queryParams['fase'] = currentQueryParams['fase'];
      }

      // Preserve group
      if (currentGroup) {
        queryParams['grupo'] = currentGroup.id.toString();
      } else if (currentQueryParams['grupo']) {
        queryParams['grupo'] = currentQueryParams['grupo'];
      }

      // Preserve round
      if (currentRound) {
        queryParams['jornada'] = currentRound.id.toString();
      } else if (currentQueryParams['jornada']) {
        queryParams['jornada'] = currentQueryParams['jornada'];
      }

      // Reset component state manually
      this.resetComponentState();

      this.router.navigate(['/admin/competicion', competitionId, 'partido'], {
        queryParams,
      });
    }
  }

  private resetComponentState(): void {
    const currentPhase = this.selectedPhase();
    const currentGroup = this.selectedGroup();
    const currentRound = this.form.get('round')?.value;

    // Reset internal state
    this.matchId.set(null);
    this.match.set(null);
    this.selectedPhase.set(null);
    this.selectedGroup.set(null);
    this.isMatchNotFound.set(false);

    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();

    // Restore selections if they existed
    if (currentPhase) {
      this.form.patchValue({ phase: currentPhase });
      this.selectedPhase.set(currentPhase);
    }
    if (currentGroup) {
      this.form.patchValue({ group: currentGroup });
      this.selectedGroup.set(currentGroup);
    }
    if (currentRound) {
      this.form.patchValue({ round: currentRound });
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

  public onEditGroup(): void {
    const groupId = this.form.get('group')?.value?.id;
    if (!groupId) {
      return;
    }
    const phaseId = this.form.get('phase')?.value?.id;
    const queryParams: Params = {};
    if (phaseId) {
      queryParams['fase'] = phaseId;
    }
    this.router.navigate(
      [
        '/admin/competicion',
        this.competitionStore.competition()?.id,
        'grupo',
        groupId,
      ],
      { queryParams },
    );
  }

  public onEditRound(): void {
    const roundId = this.form.get('round')?.value?.id;
    if (!roundId) {
      return;
    }
    const phaseId = this.form.get('phase')?.value?.id;
    const queryParams: Params = {};
    if (phaseId) {
      queryParams['fase'] = phaseId;
    }
    this.router.navigate(
      [
        '/admin/competicion',
        this.competitionStore.competition()?.id,
        'jornada',
        roundId,
      ],
      { queryParams },
    );
  }

  private selectPhaseAndRound(phase: Phase, round: Round): void {
    this.selectedPhase.set(phase);
    this.form.patchValue({
      phase,
      round,
    });
  }
}
