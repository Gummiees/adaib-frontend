import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormApiMatch, MatchStatus } from '@shared/models/match';
import { setHours, setMinutes } from 'date-fns';
import { awayTeamValidator } from '../validators/away-team.validator';
import { noShowTeamValidator } from '../validators/no-show-team.validator';
import { scoreValidator } from '../validators/score.validator';
import { timeValidator } from '../validators/time.validator';

@Injectable()
export class MatchFormService {
  createForm(): FormGroup {
    const form = new FormGroup({
      phaseId: new FormControl<number | null>(null, [Validators.required]),
      groupId: new FormControl<number | null>({ value: null, disabled: true }, [
        Validators.required,
      ]),
      roundId: new FormControl<number | null>({ value: null, disabled: true }, [
        Validators.required,
      ]),
      homeTeamId: new FormControl<number | null>(
        { value: null, disabled: true },
        [Validators.required],
      ),
      awayTeamId: new FormControl<number | null>({
        value: null,
        disabled: true,
      }),
      noShowTeamId: new FormControl<number | null>({
        value: null,
        disabled: true,
      }),
      date: new FormControl<Date | null>(null),
      time: new FormControl<Date | null>({ value: null, disabled: true }),
      homeTeamScore: new FormControl<number | null>(
        {
          value: null,
          disabled: true,
        },
        [Validators.min(0)],
      ),
      awayTeamScore: new FormControl<number | null>(
        {
          value: null,
          disabled: true,
        },
        [Validators.min(0)],
      ),
      status: new FormControl<MatchStatus>('NotStarted', [Validators.required]),
    });

    return form;
  }

  setupValidators(form: FormGroup): void {
    form.controls['awayTeamId'].addValidators([
      awayTeamValidator(form.get('status')?.value),
    ]);
    form.controls['time'].addValidators([
      timeValidator(form.get('date')?.value),
    ]);
    form.controls['homeTeamScore'].addValidators([
      scoreValidator(form.get('status')?.value),
    ]);
    form.controls['awayTeamScore'].addValidators([
      scoreValidator(form.get('status')?.value),
    ]);
  }

  formToApiMatch(form: FormGroup, matchId: number | null): FormApiMatch {
    const date = form.get('date')?.value as Date | null;
    const time = form.get('time')?.value as Date | null;
    let combinedDate = date;

    if (date && time) {
      combinedDate = this.combineDateAndTime(date, time);
    }

    return {
      id: matchId ?? 0,
      roundId: form.get('roundId')?.value,
      homeTeamId: form.get('homeTeamId')?.value,
      awayTeamId: form.get('awayTeamId')?.value,
      noShowTeamId: this.getNoShowTeamId(form),
      status: form.get('status')?.value ?? 'NotStarted',
      date: combinedDate ? combinedDate.toISOString() : null,
      homeTeamScore: form.get('homeTeamScore')?.value,
      awayTeamScore: form.get('awayTeamScore')?.value,
    };
  }

  updateFormControlStates(form: FormGroup): void {
    this.updateAwayTeamInput(form);
    this.updateScoreInputs(form);
    this.updateNoShowTeamInput(form);
  }

  updateAwayTeamInput(form: FormGroup): void {
    const awayTeamIdControl = form.get('awayTeamId');
    const statusControl = form.get('status');
    const groupIdControl = form.get('groupId');

    if (statusControl?.value === 'Rest' || !groupIdControl?.value) {
      awayTeamIdControl?.setValue(null);
      awayTeamIdControl?.disable();
    } else {
      awayTeamIdControl?.enable();
    }
    awayTeamIdControl?.updateValueAndValidity();
  }

  updateScoreInputs(form: FormGroup): void {
    const homeTeamScoreControl = form.get('homeTeamScore');
    const awayTeamScoreControl = form.get('awayTeamScore');
    const statusControl = form.get('status');

    homeTeamScoreControl?.clearValidators();
    awayTeamScoreControl?.clearValidators();
    if (
      statusControl?.value === 'Finished' ||
      statusControl?.value === 'OnGoing'
    ) {
      homeTeamScoreControl?.enable();
      awayTeamScoreControl?.enable();
      homeTeamScoreControl?.addValidators([
        scoreValidator(statusControl?.value),
        Validators.min(0),
      ]);
      awayTeamScoreControl?.addValidators([
        scoreValidator(statusControl?.value),
        Validators.min(0),
      ]);
    } else {
      homeTeamScoreControl?.disable();
      awayTeamScoreControl?.disable();
      form.patchValue({
        homeTeamScore: null,
        awayTeamScore: null,
      });
    }

    homeTeamScoreControl?.updateValueAndValidity();
    awayTeamScoreControl?.updateValueAndValidity();
  }

  updateNoShowTeamInput(
    form: FormGroup,
    selectedHomeTeamId?: number | null,
    selectedAwayTeamId?: number | null,
  ): void {
    const noShowTeamIdControl = form.get('noShowTeamId');
    const statusControl = form.get('status');

    noShowTeamIdControl?.clearValidators();
    if (statusControl?.value === 'NoShow') {
      noShowTeamIdControl?.enable();
      noShowTeamIdControl?.addValidators([
        noShowTeamValidator({
          status: statusControl?.value,
          homeTeamId: selectedHomeTeamId ?? null,
          awayTeamId: selectedAwayTeamId ?? null,
        }),
      ]);
    } else {
      noShowTeamIdControl?.disable();
      noShowTeamIdControl?.setValue(null);
    }
    noShowTeamIdControl?.updateValueAndValidity();
  }

  updateDateTimeInputs(form: FormGroup): void {
    const timeControl = form.get('time');
    const date = form.get('date')?.value;

    timeControl?.clearValidators();
    if (!date) {
      timeControl?.setValue(null);
      timeControl?.disable();
    } else {
      timeControl?.enable();
      timeControl?.addValidators([timeValidator(date)]);
    }
    timeControl?.updateValueAndValidity();
  }

  updatePhaseInputs(form: FormGroup, phaseId: number | null): void {
    const groupIdControl = form.get('groupId');
    const roundIdControl = form.get('roundId');

    if (phaseId) {
      groupIdControl?.enable();
      roundIdControl?.enable();
    } else {
      groupIdControl?.disable();
      roundIdControl?.disable();
      form.patchValue({
        homeTeamScore: null,
        awayTeamScore: null,
      });
    }
  }

  updateGroupInputs(form: FormGroup, groupId: number | null): void {
    const homeTeamIdControl = form.get('homeTeamId');

    if (!groupId) {
      homeTeamIdControl?.disable();
      homeTeamIdControl?.setValue(null);
    } else {
      homeTeamIdControl?.enable();
    }
  }

  isStatusCorrect(form: FormGroup): boolean {
    const date = form.get('date')?.value;
    const time = form.get('time')?.value;

    if (date && !time) {
      return false;
    }

    const status = form.get('status')?.value;
    const homeTeamScore = form.get('homeTeamScore')?.value;
    const awayTeamScore = form.get('awayTeamScore')?.value;

    if (status === 'Finished' || status === 'OnGoing') {
      return !!homeTeamScore && !!awayTeamScore;
    }

    const noShowTeamId = form.get('noShowTeamId')?.value;
    if (status === 'NoShow') {
      return !!noShowTeamId;
    }

    const awayTeamId = form.get('awayTeamId')?.value;
    return status === 'Rest' || !!awayTeamId;
  }

  private combineDateAndTime(date: Date, time: Date): Date {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    return setMinutes(setHours(date, hours), minutes);
  }

  private getNoShowTeamId(form: FormGroup): number | null {
    const status = form.get('status')?.value;
    if (status === 'NoShow') {
      return form.get('noShowTeamId')?.value;
    }
    return null;
  }
}
