import { AbstractControl } from '@angular/forms';

export const timeValidator = (date: Date) => (control: AbstractControl) => {
  if (date && !control.value) {
    return { timeRequired: true };
  }

  return null;
};
