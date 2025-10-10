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
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { ActivatedRoute } from '@angular/router';
import { CompetitionService } from '@features/competition/services/competition.service';
import { competitionEvents } from '@features/competition/store/competition-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { Dispatcher } from '@ngrx/signals/events';
import { DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Group } from '@shared/models/group';
import { DetailedMatch, FormApiMatch } from '@shared/models/match';
import { Phase } from '@shared/models/phase';
import { Round } from '@shared/models/round';
import { Team } from '@shared/models/team';
import { firstValueFrom } from 'rxjs';
import { AdminTeamsService } from '../../teams/services/admin-teams.service';
import { adminTeamsEvent } from '../../teams/store/admin-teams-events';
import { AdminTeamsStore } from '../../teams/store/admin-teams-store';
import { AdminMatchService } from '../services/admin-match.service';
import { MatchFormDataService } from '../services/match-form-data.service';
import { MatchFormRouteService } from '../services/match-form-route.service';
import { MatchFormService } from '../services/match-form.service';

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
    MatchFormService,
    MatchFormRouteService,
    MatchFormDataService,
  ],
})
export class MatchFormComponent {
  public competitionStore = inject(CompetitionStore);
  private adminMatchService = inject(AdminMatchService);
  private teamsStore = inject(AdminTeamsStore);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private activatedRoute = inject(ActivatedRoute);

  // Injected services
  private matchFormService = inject(MatchFormService);
  private routeService = inject(MatchFormRouteService);
  private dataService = inject(MatchFormDataService);

  private allTeams = computed<Team[]>(() => {
    return this.teamsStore.teams() ?? [];
  });
  public teams = computed<Team[]>(() => {
    return this.dataService.getFilteredTeams(
      this.allTeams(),
      this.selectedGroup(),
    );
  });
  public selectedTeams = computed<Team[]>(() => {
    return this.dataService.getSelectedTeams(
      this.selectedHomeTeam(),
      this.selectedAwayTeam(),
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
  private selectedRound = signal<Round | null>(null);
  private selectedHomeTeam = signal<Team | null>(null);
  private selectedAwayTeam = signal<Team | null>(null);
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
    this.form = this.matchFormService.createForm();
    this.matchFormService.setupValidators(this.form);

    this.getCompetition();
    this.dispatcher.dispatch(adminTeamsEvent.getTeams());
    this.setupRouteParamSubscription();
    this.setupFormControlEffects();
    this.setupFormPopulation();
    this.setupQueryParameterPreSelection();
  }

  public async onSubmit(): Promise<void> {
    const competitionId = this.competitionStore.competition()?.id;
    const phase = this.selectedPhase();
    const group = this.selectedGroup();
    const round = this.selectedRound();
    if (!competitionId || !phase || !group || !round) {
      return;
    }

    if (!this.matchFormService.isStatusCorrect(this.form)) {
      this.form.get('awayTeam')?.setErrors({ awayTeamRequired: true });
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.valid && !this.isLoading()) {
      const match = this.matchFormService.formToApiMatch(
        this.form,
        this.matchId(),
      );

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
        noShowTeam: this.form.get('noShowTeam')?.value,
        date: match.date ? new Date(match.date) : null,
        homeTeamScore: match.homeTeamScore,
        awayTeamScore: match.awayTeamScore,
        status: match.status,
        round: round,
        phaseName: phase.name,
        groupName: group.name,
      };
      this.match.set(newMatch);
      this.matchId.set(matchId);
      this.refreshCompetition();
      this.form.markAsPristine();
      this.snackBar.open('Partido añadido correctamente', 'Cerrar', {
        duration: 3000,
      });

      // Update the browser URL without navigation to reflect edit mode
      this.routeService.navigateToMatch(
        competitionId,
        matchId,
        phase,
        group,
        round,
      );

      // Manually trigger query parameter processing since we're not doing a real navigation
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
        noShowTeam: this.form.get('noShowTeam')?.value,
        date: match.date ? new Date(match.date) : null,
        homeTeamScore: match.homeTeamScore,
        awayTeamScore: match.awayTeamScore,
        status: match.status,
        round: round,
        phaseName: phase.name,
        groupName: group.name,
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

    const matchData = this.dataService.findMatchInCompetition(
      competition,
      matchId,
      teams,
    );

    if (matchData) {
      this.match.set(matchData.match);
      this.selectedPhase.set(matchData.phase);
      this.selectedGroup.set(matchData.group);
      this.selectedRound.set(matchData.match.round);
      this.selectedHomeTeam.set(matchData.homeTeam);
      this.selectedAwayTeam.set(matchData.awayTeam);

      this.dataService.populateFormFromMatch(this.form, {
        match: matchData.match,
        phaseId: matchData.phase.id,
        groupId: matchData.group.id,
        homeTeamId: matchData.homeTeam?.id ?? null,
        awayTeamId: matchData.awayTeam?.id ?? null,
        noShowTeamId: matchData.noShowTeam?.id ?? null,
      });
    }
  }

  private setupQueryParameterPreSelection(): void {
    // Watch for competition changes and pre-select from query params
    effect(() => {
      const competition = this.competitionStore.competition();
      if (competition && !this.isEditMode()) {
        this.routeService.preSelectFromQueryParams(competition, this.form);
      }
    });
  }

  private navigateToCompetition(): void {
    const competitionId = this.competitionStore.competition()?.id;
    if (competitionId) {
      this.routeService.navigateToCompetition(competitionId);
    }
  }

  private processCurrentQueryParams(): void {
    const competition = this.competitionStore.competition();
    if (competition) {
      this.routeService.processCurrentQueryParams(competition, this.form);
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
    this.dispatcher.dispatch(competitionEvents.getCompetition(parsedId));
  }

  private setupFormControlEffects(): void {
    this.setupPhaseChangeEffect();
    this.setupGroupChangeEffect();
    this.setupRoundChangeEffect();
    this.setupStatusChangeEffect();
    this.setupDateChangeEffect();
    this.setupHomeTeamChangeEffect();
    this.setupAwayTeamChangeEffect();
  }

  private setupHomeTeamChangeEffect(): void {
    this.form
      .get('homeTeamId')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((homeTeamId: number | null) => {
        const homeTeam = this.teams().find((team) => team.id === homeTeamId);
        if (!homeTeam) {
          return;
        }
        this.selectedHomeTeam.set(homeTeam);
        this.updateNoShowTeamInput();
      });
  }

  private setupAwayTeamChangeEffect(): void {
    this.form
      .get('awayTeamId')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((awayTeamId: number | null) => {
        const awayTeam = this.teams().find((team) => team.id === awayTeamId);
        if (!awayTeam) {
          return;
        }
        this.selectedAwayTeam.set(awayTeam);
        this.updateNoShowTeamInput();
      });
  }

  private setupDateChangeEffect(): void {
    this.form
      .get('date')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.matchFormService.updateDateTimeInputs(this.form);
      });
  }

  private setupStatusChangeEffect(): void {
    this.form
      .get('status')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.matchFormService.updateFormControlStates(this.form);
      });
  }

  private setupPhaseChangeEffect(): void {
    this.form
      .get('phaseId')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((phaseId: number | null) => {
        const phase = this.phases().find((phase) => phase.id === phaseId);
        if (!phase) {
          return;
        }
        this.selectedPhase.set(phase);
        this.matchFormService.updatePhaseInputs(this.form, phaseId);
      });
  }

  private setupGroupChangeEffect(): void {
    this.form
      .get('groupId')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((groupId: number | null) => {
        const group = this.groups().find((group) => group.id === groupId);
        if (!group) {
          return;
        }
        this.selectedGroup.set(group);
        this.matchFormService.updateGroupInputs(this.form, groupId);
        this.updateAwayTeamInput();
      });
  }

  private setupRoundChangeEffect(): void {
    this.form
      .get('roundId')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((roundId: number | null) => {
        const round = this.rounds().find((round) => round.id === roundId);
        if (!round) {
          return;
        }
        this.selectedRound.set(round);
      });
  }

  private updateAwayTeamInput(): void {
    this.matchFormService.updateAwayTeamInput(this.form);
  }

  private updateNoShowTeamInput(): void {
    this.matchFormService.updateNoShowTeamInput(this.form);
  }

  public onCreateNew(): void {
    if (!this.form.pristine) {
      this.snackBar.open('Hay cambios sin guardar en el formulario', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const competitionId = this.competitionStore.competition()?.id;
    if (competitionId) {
      const selectedPhaseId = this.form.get('phaseId')?.value as number | null;
      const selectedGroupId = this.form.get('groupId')?.value as number | null;
      const selectedRoundId = this.form.get('roundId')?.value as number | null;

      // Reset component state manually
      this.resetComponentState();

      this.routeService.navigateToCreateMatch(competitionId, {
        selectedPhaseId: selectedPhaseId,
        selectedGroupId: selectedGroupId,
        selectedRoundId: selectedRoundId,
        currentQueryParams: this.activatedRoute.snapshot.queryParams,
      });
    }
  }

  private resetComponentState(): void {
    const currentPhase = this.selectedPhase();
    const currentGroup = this.selectedGroup();
    const currentRound = this.selectedRound();

    // Reset internal state
    this.matchId.set(null);
    this.match.set(null);
    this.selectedPhase.set(null);
    this.selectedGroup.set(null);
    this.selectedRound.set(null);
    this.selectedHomeTeam.set(null);
    this.selectedAwayTeam.set(null);
    this.isMatchNotFound.set(false);

    this.dataService.resetFormState(this.form);

    // Restore selections if they existed
    this.dataService.restoreFormSelections(this.form, {
      phaseId: currentPhase?.id ?? null,
      groupId: currentGroup?.id ?? null,
      roundId: currentRound?.id ?? null,
    });

    // Update signals to match restored selections
    this.selectedPhase.set(currentPhase);
    this.selectedGroup.set(currentGroup);
    this.selectedRound.set(currentRound);
  }

  public onEditPhase(): void {
    const phaseId = this.form.get('phaseId')?.value;
    const competitionId = this.competitionStore.competition()?.id;
    if (phaseId && competitionId) {
      this.routeService.navigateToEditPhase(competitionId, phaseId);
    }
  }

  public onEditGroup(): void {
    const groupId = this.form.get('groupId')?.value;
    const competitionId = this.competitionStore.competition()?.id;
    const phaseId = this.form.get('phaseId')?.value;
    if (groupId && competitionId) {
      this.routeService.navigateToEditGroup(competitionId, groupId, phaseId);
    }
  }

  public onEditRound(): void {
    const roundId = this.form.get('roundId')?.value;
    const competitionId = this.competitionStore.competition()?.id;
    const phaseId = this.form.get('phaseId')?.value;
    if (roundId && competitionId) {
      this.routeService.navigateToEditRound(competitionId, roundId, phaseId);
    }
  }
}
