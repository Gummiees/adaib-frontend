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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CompetitionsService } from '@features/competitions/services/competitions.service';
import { adminCompetitionsEvent } from '@features/competitions/store/admin-competitions-events';
import { CompetitionsStore } from '@features/competitions/store/competitions-store';
import { Dispatcher } from '@ngrx/signals/events';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Competition, CompetitionStatus } from '@shared/models/competition';
import { imageUrlRegex } from '@shared/utils/utils';
import { firstValueFrom } from 'rxjs';
import { AdminCompetitionService } from '../../services/admin-competition.service';

@Component({
  selector: 'app-add-competition',
  templateUrl: './add-competition.component.html',
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CompetitionsService, CompetitionsStore, AdminCompetitionService],
})
export class AddCompetitionComponent {
  public competitionsStore = inject(CompetitionsStore);
  private adminCompetitionService = inject(AdminCompetitionService);
  private dispatcher = inject(Dispatcher);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  private isLoadingResponse = signal(false);
  public form = new FormGroup({
    sportName: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    imageUrl: new FormControl('', [Validators.pattern(imageUrlRegex)]),
    active: new FormControl(true, [Validators.required]),
    status: new FormControl<CompetitionStatus>('NotStarted', [
      Validators.required,
    ]),
    startDate: new FormControl<Date | null>(null),
    endDate: new FormControl<Date | null>(null),
  });

  public get sportName(): FormControl {
    return this.form.get('sportName') as FormControl;
  }

  public get name(): FormControl {
    return this.form.get('name') as FormControl;
  }

  public get imageUrl(): FormControl {
    return this.form.get('imageUrl') as FormControl;
  }

  public isLoading = computed(
    () => this.competitionsStore.isLoading() || this.isLoadingResponse(),
  );

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });
  }

  public async onSubmit(): Promise<void> {
    if (this.form.valid && !this.isLoading()) {
      const competition = this.formToCompetition(this.form);
      await this.handleAddCompetition(competition);
    } else {
      this.form.markAllAsTouched();
    }
  }

  private formToCompetition(form: FormGroup): Competition {
    return {
      id: 0,
      sportName: form.get('sportName')!.value,
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
    return value === '' ? null : value;
  }

  private async handleAddCompetition(competition: Competition): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const competitionId = await firstValueFrom(
        this.adminCompetitionService.addCompetition(competition),
      );
      this.dispatcher.dispatch(
        adminCompetitionsEvent.addCompetition({
          ...competition,
          id: competitionId,
        }),
      );
      this.router.navigate(['/competiciones']);
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al añadir la competición', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }
}
