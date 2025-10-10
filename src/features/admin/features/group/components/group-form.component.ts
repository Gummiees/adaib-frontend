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
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AdminTeamsService } from '@features/admin/features/teams/services/admin-teams.service';
import { AdminTeamsStore } from '@features/admin/features/teams/store/admin-teams-store';
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
import { ApiFormGroup, Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Team } from '@shared/models/team';
import { firstValueFrom } from 'rxjs';
import { adminTeamsEvent } from '../../teams/store/admin-teams-events';
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
    MatTooltipModule,
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
  public userStore = inject(UserStore);
  private adminGroupService = inject(AdminGroupService);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public phases = computed<Phase[]>(() => {
    return this.competitionStore.competition()?.phases ?? [];
  });
  public teams = computed<Team[]>(() => {
    return this.teamsStore.teams()?.filter((team) => team.active) ?? [];
  });

  public selectedPhase = signal<Phase | null>(null);
  private groupId = signal<number | null>(null);
  private group = signal<Group | null>(null);
  public isEditMode = computed(() => !!this.groupId() || !!this.group()?.id);

  private isLoadingResponse = signal(false);
  private shouldForceFormUpdate = signal(false);

  public form!: FormGroup;

  public isLoading = computed(
    () => this.competitionStore.isLoading() || this.isLoadingResponse(),
  );

  // Computed signal that will automatically populate the form when both competition and groupId are available
  private shouldPopulateForm = computed(() => {
    const competition = this.competitionStore.competition();
    const groupId = this.groupId();
    const shouldForce = this.shouldForceFormUpdate();
    return !!(
      competition &&
      groupId &&
      !this.competitionStore.isLoading() &&
      (!this.group() || shouldForce)
    );
  });

  public shouldShowCreateButton(): boolean {
    return this.form.pristine;
  }

  public isMainButtonDisabled(): boolean {
    return this.form.invalid || this.isLoading() || this.form.pristine;
  }

  public get name(): FormControl {
    return this.form.get('name') as FormControl;
  }

  public get phase(): FormControl {
    return this.form.get('phase') as FormControl;
  }

  constructor() {
    this.form = new FormGroup({
      phase: new FormControl<Phase | null>(null, [Validators.required]),
      name: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(100),
      ]),
      teamIds: new FormControl<number[]>([]),
    });

    this.getCompetition();
    this.dispatcher.dispatch(adminTeamsEvent.getTeams());
    this.setupRouteParamSubscription();
    this.setupFormPopulation();
    this.setupPhasePreSelection();
    this.setupPhaseChangeEffects();
  }

  private setupPhaseChangeEffects(): void {
    this.form
      .get('phase')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((phase: Phase | null) => {
        this.selectedPhase.set(phase);
      });
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
        await this.handleUpdateGroup(group, competitionId, phase);
      } else {
        await this.handleAddGroup(group, competitionId, phase);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  public async onDelete(): Promise<void> {
    const groupId = this.groupId();
    const competitionId = this.competitionStore.competition()?.id;
    const phase = this.selectedPhase();
    if (!groupId || !competitionId || !phase) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: 'Eliminar grupo',
        text: 'Se eliminarán todos los partidos asociados a este grupo. Esta acción no se puede deshacer.',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onConfirmDelete({ groupId, competitionId, phase });
      }
    });
  }

  private refreshCompetition(): void {
    const competitionId = this.competitionStore.competition()?.id;
    if (competitionId) {
      this.dispatcher.dispatch(competitionEvents.getCompetition(competitionId));
    }
  }

  private async onConfirmDelete({
    groupId,
    competitionId,
    phase,
  }: {
    groupId: number;
    competitionId: number;
    phase: Phase;
  }): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(
        this.adminGroupService.deleteGroup({
          competitionId: competitionId,
          phaseId: phase.id,
          groupId,
        }),
      );
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

  private async handleAddGroup(
    group: ApiFormGroup,
    competitionId: number,
    phase: Phase,
  ): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const groupId = await firstValueFrom(
        this.adminGroupService.addGroup({
          competitionId: competitionId,
          phaseId: phase.id,
          group,
        }),
      );
      const newGroup: Group = {
        id: groupId,
        name: group.name,
        teamIds: group.teamIds,
        matches: [],
        classification: [],
      };
      this.group.set(newGroup);
      this.groupId.set(groupId);
      this.shouldForceFormUpdate.set(true);
      this.refreshCompetition();
      this.form.markAsPristine();
      this.snackBar.open('Grupo añadido correctamente', 'Cerrar', {
        duration: 3000,
      });
      // Update the browser URL without navigation to reflect edit mode
      window.history.replaceState(
        {},
        '',
        `/admin/competicion/${competitionId}/grupo/${groupId}?fase=${phase.id}`,
      );
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir el grupo', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async handleUpdateGroup(
    group: ApiFormGroup,
    competitionId: number,
    phase: Phase,
  ): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(
        this.adminGroupService.updateGroup({
          competitionId: competitionId,
          phaseId: phase.id,
          group,
        }),
      );
      const updatedGroup: Group = {
        id: group.id,
        name: group.name,
        teamIds: this.group()?.teamIds || [],
        matches: this.group()?.matches || [],
        classification: this.group()?.classification || [],
      };
      this.group.set(updatedGroup);
      this.shouldForceFormUpdate.set(true);
      this.refreshCompetition();
      this.form.markAsPristine();
      this.snackBar.open('Grupo actualizado correctamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al actualizar el grupo', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private setupRouteParamSubscription(): void {
    // Subscribe to route param changes to handle navigation within the same component
    this.activatedRoute.paramMap.subscribe((params) => {
      const groupId = params.get('groupId');
      if (groupId) {
        const parsedGroupId = Number(groupId);
        if (!isNaN(parsedGroupId)) {
          this.groupId.set(parsedGroupId);
        }
      } else {
        // No groupId in route, ensure we're in create mode
        this.resetComponentState();
      }
    });
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
    // Watch for competition changes and pre-select phase from query params in create mode
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
      this.group.set(foundGroup);
      this.selectedPhase.set(foundPhase);
      this.form.patchValue({
        phase: foundPhase,
        name: foundGroup.name,
        teamIds: foundGroup.teamIds,
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
    this.dispatcher.dispatch(competitionEvents.getCompetition(parsedId));
  }

  public onCreateNew(): void {
    if (!this.form.pristine) {
      this.snackBar.open('Hay cambios sin guardar en el formulario', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    // Capture phase information before resetting state
    const competitionId = this.competitionStore.competition()?.id;
    const currentPhase = this.selectedPhase();
    const fallbackFaseId = this.activatedRoute.snapshot.queryParams['fase'];

    // Reset component state manually
    this.resetComponentState();

    // Navigate to create new group page, preserving query parameters
    if (competitionId) {
      const queryParams: Params = {};

      // Preserve phase from current selection or query params
      if (currentPhase) {
        queryParams['fase'] = currentPhase.id.toString();
      } else if (fallbackFaseId) {
        queryParams['fase'] = fallbackFaseId;
      }

      this.router.navigate(['/admin/competicion', competitionId, 'grupo'], {
        queryParams,
      });
    }
  }

  public onAddRound(): void {
    const competitionId = this.competitionStore.competition()?.id;
    const phaseId = this.form.get('phase')?.value?.id;
    if (!phaseId || !competitionId) {
      return;
    }
    this.router.navigate(['/admin/competicion', competitionId, 'jornada'], {
      queryParams: { fase: phaseId },
    });
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

  public onAddMatch(): void {
    const competition = this.competitionStore.competition();
    const groupId = this.groupId();
    if (!groupId || !competition) {
      return;
    }
    const queryParams: Params = { grupo: groupId };
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
    this.groupId.set(null);
    this.group.set(null);
    this.selectedPhase.set(null);
    this.shouldForceFormUpdate.set(false);

    // Reset form to pristine state
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
