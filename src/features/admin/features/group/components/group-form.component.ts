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
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminTeamsService } from '@features/admin/features/teams/services/admin-teams.service';
import { AdminTeamsStore } from '@features/admin/features/teams/store/admin-teams-store';
import { CompetitionService } from '@features/competition/services/competition.service';
import { competitionEvents } from '@features/competition/store/competition-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { CompetitionsService } from '@features/competitions/services/competitions.service';
import { CompetitionsStore } from '@features/competitions/store/competitions-store';
import { Dispatcher } from '@ngrx/signals/events';
import { DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { ApiFormGroup, Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Round } from '@shared/models/round';
import { Team } from '@shared/models/team';
import { firstValueFrom } from 'rxjs';
import { AdminGroupService } from '../services/admin-group.service';

@Component({
  selector: 'app-group-form',
  templateUrl: './group-form.component.html',
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
    AdminGroupService,
    CompetitionsService,
    CompetitionsStore,
    AdminTeamsService,
    AdminTeamsStore,
  ],
})
export class GroupFormComponent {
  public competitionStore = inject(CompetitionStore);
  public teamsStore = inject(AdminTeamsStore);
  private adminGroupService = inject(AdminGroupService);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public phases = computed<Phase[]>(() => {
    return this.competitionStore.competition()?.phases ?? [];
  });
  public rounds = computed<Round[]>(() => {
    const phase = this.selectedPhase();
    if (!phase) {
      return [];
    }
    return phase.rounds ?? [];
  });
  public teams = computed<Team[]>(() => {
    return this.teamsStore.teams() ?? [];
  });

  private selectedPhase = signal<Phase | null>(null);
  private groupId = signal<number | null>(null);
  public isEditMode = computed(() => !!this.groupId());

  private isLoadingResponse = signal(false);

  public form!: FormGroup;

  public isLoading = computed(
    () => this.competitionStore.isLoading() || this.isLoadingResponse(),
  );

  // Computed signal that will automatically populate the form when both competition and groupId are available
  private shouldPopulateForm = computed(() => {
    const competition = this.competitionStore.competition();
    const groupId = this.groupId();
    return !!(competition && groupId && !this.competitionStore.isLoading());
  });

  constructor() {
    this.form = new FormGroup({
      phase: new FormControl<Phase | null>(null, [Validators.required]),
      name: new FormControl<string | null>(null, [Validators.required]),
      actualRound: new FormControl<Round | null>(null),
      teamIds: new FormControl<number[]>([]),
    });

    this.getCompetition();
    this.checkForEditMode();
    this.setupFormControlDisabling();
    this.setupFormPopulation();
    this.setupPhasePreSelection();
  }

  public async onSubmit(): Promise<void> {
    if (this.form.valid && !this.isLoading()) {
      const group = this.formToApiGroup(this.form);
      const phase = this.selectedPhase();
      const competitionId = this.competitionStore.competition()?.id;
      if (!phase || !competitionId) {
        return;
      }

      if (this.isEditMode()) {
        await this.handleUpdateGroup(group);
      } else {
        await this.handleAddGroup(group);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  public async onDelete(): Promise<void> {
    const groupId = this.groupId();
    if (!groupId) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: 'grupo',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onConfirmDelete(groupId);
      }
    });
  }

  private refreshCompetition(): void {
    const competitionId = this.competitionStore.competition()?.id;
    if (competitionId) {
      this.dispatcher.dispatch(competitionEvents.getCompetition(competitionId));
    }
  }

  private async onConfirmDelete(groupId: number): Promise<void> {
    if (!groupId) {
      return;
    }

    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.adminGroupService.deleteGroup(groupId));
      this.refreshCompetition();
      this.navigateToCompetition();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al eliminar el grupo', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private formToApiGroup(form: FormGroup): ApiFormGroup {
    return {
      id: this.isEditMode() ? this.groupId()! : 0,
      name: form.get('name')?.value ?? '',
      teamIds: form.get('teamIds')?.value ?? [],
    };
  }

  private async handleAddGroup(group: ApiFormGroup): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.adminGroupService.addGroup(group));
      this.refreshCompetition();
      this.navigateToCompetition();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir el grupo', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async handleUpdateGroup(group: ApiFormGroup): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.adminGroupService.updateGroup(group));
      this.refreshCompetition();
      this.navigateToCompetition();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al actualizar el grupo', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private setupFormControlDisabling(): void {
    this.form.get('actualRound')?.disable();
    this.form
      .get('phase')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((phase: Phase | null) => {
        const actualRoundControl = this.form.get('actualRound');
        this.selectedPhase.set(phase);
        if (phase) {
          actualRoundControl?.enable();
        } else {
          actualRoundControl?.setValue(null);
          actualRoundControl?.disable();
        }
      });
  }

  private checkForEditMode(): void {
    const groupId = this.activatedRoute.snapshot.params['groupId'];
    if (groupId) {
      const parsedGroupId = Number(groupId);
      if (!isNaN(parsedGroupId)) {
        this.groupId.set(parsedGroupId);
      }
    }
  }

  private setupFormPopulation(): void {
    // Watch for changes in the computed signal and populate form when ready
    effect(() => {
      if (this.shouldPopulateForm()) {
        this.populateFormFromGroup();
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

  private populateFormFromGroup(): void {
    const competition = this.competitionStore.competition();
    if (!competition) {
      return;
    }

    const groupId = this.groupId();
    if (!groupId) {
      return;
    }

    let foundGroup: Group | null = null;
    let foundPhase: Phase | null = null;

    for (const phase of competition.phases) {
      const group = phase.groups.find((g: Group) => g.id === groupId);
      if (group) {
        foundGroup = group;
        foundPhase = phase;
        break;
      }
    }

    if (foundGroup && foundPhase) {
      this.selectedPhase.set(foundPhase);
      this.form.patchValue({
        phase: foundPhase,
        name: foundGroup.name,
        actualRound: foundGroup.actualRound,
        teamIds: foundGroup.teams.map((team) => team.id),
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
