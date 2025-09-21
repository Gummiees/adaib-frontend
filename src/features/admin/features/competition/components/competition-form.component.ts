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
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { CompetitionsService } from '@features/competitions/services/competitions.service';
import { adminCompetitionsEvent } from '@features/competitions/store/admin-competitions-events';
import { CompetitionsStore } from '@features/competitions/store/competitions-store';
import { Dispatcher } from '@ngrx/signals/events';
import { DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import {
  Competition,
  CompetitionStatus,
  DEFAULT_SPORT_NAME,
} from '@shared/models/competition';
import { imageUrlRegex } from '@shared/utils/utils';
import { firstValueFrom } from 'rxjs';
import { AdminCompetitionService } from '../services/admin-competition.service';

@Component({
  selector: 'app-competition-form',
  templateUrl: './competition-form.component.html',
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
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CompetitionsService, CompetitionsStore, AdminCompetitionService],
})
export class CompetitionFormComponent {
  public competitionsStore = inject(CompetitionsStore);
  private adminCompetitionService = inject(AdminCompetitionService);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  private competition = signal<Competition | null>(null);
  private isLoadingResponse = signal(false);

  // Determine if we're in edit mode based on route params or if we have a competition with an ID
  public isEditMode = computed(() => {
    const competitionId = this.activatedRoute.snapshot.params['id'];
    const hasCompetitionWithId = this.competition()?.id;
    return (
      (competitionId && !isNaN(Number(competitionId))) || !!hasCompetitionWithId
    );
  });

  public form = new FormGroup({
    name: new FormControl<string | null>(null, [Validators.required]),
    description: new FormControl<string | null>(null),
    imageUrl: new FormControl<string | null>(null, [
      Validators.pattern(imageUrlRegex),
    ]),
    active: new FormControl<boolean>(false, [Validators.required]),
    status: new FormControl<CompetitionStatus>('NotStarted', [
      Validators.required,
    ]),
    startDate: new FormControl<Date | null>(null),
    endDate: new FormControl<Date | null>(null),
  });

  public get name(): FormControl {
    return this.form.get('name') as FormControl;
  }

  public get imageUrl(): FormControl {
    return this.form.get('imageUrl') as FormControl;
  }

  public isLoading = computed(
    () => this.competitionsStore.isLoading() || this.isLoadingResponse(),
  );

  public get pageTitle(): string {
    return this.isEditMode() ? 'Editar Competición' : 'Crear Competición';
  }

  public get submitButtonText(): string {
    return this.isEditMode() ? 'Guardar' : 'Crear';
  }

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
      if (this.isEditMode() && !this.competition()) {
        this.searchCompetition();
      }
    });
  }

  private searchCompetition(): void {
    const competitions = this.competitionsStore.competitions();
    const competitionId = this.activatedRoute.snapshot.params['id'];
    if (competitions && competitionId) {
      const parsedId = Number(competitionId);
      if (isNaN(parsedId)) {
        return;
      }

      const competition = competitions.find(
        (competition) => competition.id === parsedId,
      );
      this.competition.set(competition ?? null);
      if (competition) {
        this.form.patchValue({
          name: competition.name,
          description: competition.description,
          imageUrl: competition.imageUrl,
          active: competition.active,
          status: competition.status,
          startDate: competition.startDate,
          endDate: competition.endDate,
        });
      }
    }
  }

  public async onSubmit(): Promise<void> {
    if (this.form.valid && !this.isLoading()) {
      const competition = this.formToCompetition(this.form);
      if (this.isEditMode()) {
        await this.handleUpdateCompetition(competition);
      } else {
        await this.handleAddCompetition(competition);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  public async onDelete(): Promise<void> {
    const competition = this.competition();
    if (!competition) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: 'Eliminar competición',
        text: 'Se eliminarán todas las fases, grupos, jornadas y partidos asociados a esta competición. Recuerda que puedes desactivar la competición en su lugar. Esta acción no se puede deshacer.',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onConfirmDelete(competition.id);
      }
    });
  }

  private formToCompetition(form: FormGroup): Competition {
    return {
      id: this.isEditMode() ? (this.competition()?.id ?? 0) : 0,
      sportName: DEFAULT_SPORT_NAME,
      name: form.get('name')!.value,
      description: this.parseEmptyStringToNull(form.get('description')?.value),
      imageUrl: this.parseEmptyStringToNull(form.get('imageUrl')?.value),
      active: form.get('active')?.value || false,
      status: form.get('status')!.value,
      startDate: form.get('startDate')?.value || null,
      endDate: form.get('endDate')?.value || null,
    };
  }

  private parseEmptyStringToNull(value: string | null): string | null {
    return !!value && value.trim() === '' ? null : value;
  }

  private async handleAddCompetition(competition: Competition): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const competitionId = await firstValueFrom(
        this.adminCompetitionService.addCompetition(competition),
      );
      const newCompetition = { ...competition, id: competitionId };
      this.dispatcher.dispatch(
        adminCompetitionsEvent.addCompetition(newCompetition),
      );
      this.competition.set(newCompetition);
      this.form.markAsPristine();
      this.snackBar.open('Competición añadida correctamente', 'Cerrar', {
        duration: 3000,
      });
      // Update the browser URL without navigation to reflect edit mode
      window.history.replaceState(
        {},
        '',
        `/admin/competicion/${competitionId}`,
      );
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir la competición', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async handleUpdateCompetition(
    competition: Competition,
  ): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(
        this.adminCompetitionService.updateCompetition(competition),
      );
      this.dispatcher.dispatch(
        adminCompetitionsEvent.updateCompetition(competition),
      );
      this.competition.set(competition);
      this.form.markAsPristine();
      this.snackBar.open('Competición actualizada correctamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      this.snackBar.open(
        'Hubo un error al actualizar la competición',
        'Cerrar',
      );
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async onConfirmDelete(competitionId: number): Promise<void> {
    if (!competitionId) {
      return;
    }

    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(
        this.adminCompetitionService.deleteCompetition(competitionId),
      );
      this.dispatcher.dispatch(
        adminCompetitionsEvent.deleteCompetition(competitionId),
      );
      this.router.navigate(['/competiciones']);
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al eliminar la competición', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  public onAddPhase(): void {
    const competitionId = this.competition()?.id;
    if (!competitionId) {
      return;
    }
    this.router.navigate(['/admin/competicion', competitionId, 'fase']);
  }
}
