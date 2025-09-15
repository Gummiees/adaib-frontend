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
import { AdminTeamsService } from '@features/admin/features/teams/services/admin-teams.service';
import { AdminTeamsStore } from '@features/admin/features/teams/store/admin-teams-store';
import { CompetitionService } from '@features/competition/services/competition.service';
import { adminMatchesEvent } from '@features/competition/store/admin-matches-events';
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
  public teamsStore = inject(AdminTeamsStore);
  private adminMatchService = inject(AdminMatchService);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public teams = computed<Team[]>(() => this.teamsStore.teams() ?? []);
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
    const teams = this.teamsStore.teams();
    return !!(
      competition &&
      matchId &&
      !this.competitionStore.isLoading() &&
      teams
    );
  });

  constructor() {
    this.form = new FormGroup({
      phase: new FormControl<Phase | null>(null, [Validators.required]),
      group: new FormControl<Group | null>(null, [Validators.required]),
      round: new FormControl<Round | null>(null, [Validators.required]),
      homeTeam: new FormControl<Team | null>(null, [Validators.required]),
      awayTeam: new FormControl<Team | null>(null),
      date: new FormControl<Date | null>(null),
      time: new FormControl<string | null>(null),
      homeTeamScore: new FormControl<number | null>(null),
      awayTeamScore: new FormControl<number | null>(null),
      location: new FormControl(''),
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
  }

  public async onSubmit(): Promise<void> {
    if (!this.isStatusCorrect()) {
      this.form.get('awayTeam')?.setErrors({ awayTeamRequired: true });
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.valid && !this.isLoading()) {
      const match = this.formToMatch(this.form);
      const phase = this.selectedPhase();
      const group = this.form.get('group')?.value;
      if (!phase || !group) {
        return;
      }

      if (this.isEditMode()) {
        await this.handleUpdateMatch(match, phase, group);
      } else {
        await this.handleAddMatch(match, phase, group);
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
      this.dispatcher.dispatch(adminMatchesEvent.deleteMatch(matchId));
      this.router.navigate(
        ['/competiciones', this.competitionStore.competition()?.id],
        {
          queryParams: {
            tab: 'resultados',
          },
        },
      );
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

  private formToMatch(form: FormGroup): DetailedMatch {
    const date = form.get('date')?.value;
    const time = form.get('time')?.value;
    let combinedDate = date;

    if (date && time) {
      combinedDate = this.combineDateAndTime(date, time);
    }

    return {
      id: this.isEditMode() ? this.matchId()! : 0,
      round: form.get('round')?.value,
      homeTeam: form.get('homeTeam')?.value,
      awayTeam: form.get('awayTeam')?.value,
      status: form.get('status')?.value ?? 'NotStarted',
      date: combinedDate,
      homeTeamScore: form.get('homeTeamScore')?.value,
      awayTeamScore: form.get('awayTeamScore')?.value,
      location: this.parseEmptyStringToNull(form.get('location')?.value),
      result: form.get('result')?.value,
      phaseName: form.get('phase')?.value?.name ?? '',
      groupName: form.get('group')?.value?.name ?? '',
    };
  }

  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    return setMinutes(setHours(date, hours), minutes);
  }

  private parseEmptyStringToNull(value: string | null): string | null {
    return value === '' ? null : value;
  }

  private async handleAddMatch(
    match: DetailedMatch,
    phase: Phase,
    group: Group,
  ): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const apiMatch = this.matchToApiMatch(match);
      const matchId = await firstValueFrom(
        this.adminMatchService.addMatch(apiMatch),
      );
      this.dispatcher.dispatch(
        adminMatchesEvent.addMatch({
          match: {
            ...match,
            id: matchId,
          },
          phase,
          group,
        }),
      );
      this.router.navigate(
        ['/competiciones', this.competitionStore.competition()?.id],
        {
          queryParams: {
            tab: 'resultados',
          },
        },
      );
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir la competición', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async handleUpdateMatch(
    match: DetailedMatch,
    phase: Phase,
    group: Group,
  ): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const apiMatch = this.matchToApiMatch({
        ...match,
        id: this.matchId()!,
      });
      await firstValueFrom(this.adminMatchService.updateMatch(apiMatch));
      this.dispatcher.dispatch(
        adminMatchesEvent.updateMatch({
          match: {
            ...match,
            id: this.matchId()!,
          },
          phase,
          group,
        }),
      );
      this.router.navigate(
        ['/competiciones', this.competitionStore.competition()?.id],
        {
          queryParams: {
            tab: 'resultados',
          },
        },
      );
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al actualizar el partido', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private matchToApiMatch(match: Match): ApiMatch {
    return {
      id: match.id,
      homeTeamId: match.homeTeam.id,
      awayTeamId: match.awayTeam?.id,
      roundId: match.round.id,
      date: match.date ? new Date(match.date) : null,
      homeTeamScore: match.homeTeamScore,
      awayTeamScore: match.awayTeamScore,
      location: match.location,
      result: match.result,
      status: match.status,
    };
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
    this.form.get('group')?.disable();
    this.form.get('round')?.disable();
    this.form.get('time')?.disable();
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
            this.teamsStore
              .teams()
              ?.find((t: Team) => t.id === match.awayTeam?.id) ?? null;
          foundHomeTeam =
            this.teamsStore
              .teams()
              ?.find((t: Team) => t.id === match.homeTeam.id) ?? null;
          break;
        }
        if (foundMatch) break;
      }
      if (foundMatch) break;
    }

    if (foundMatch && foundPhase && foundGroup) {
      this.selectedPhase.set(foundPhase);
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
