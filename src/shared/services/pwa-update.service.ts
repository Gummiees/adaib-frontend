import { inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.checkForUpdates();
    }
  }

  private checkForUpdates(): void {
    // Check for updates every 6 hours
    setInterval(
      () => {
        this.swUpdate.checkForUpdate().then(() => {
          console.log('Checked for app updates');
        });
      },
      6 * 60 * 60 * 1000,
    );

    // Handle version updates
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
      )
      .subscribe(() => {
        if (
          confirm('Nueva versión disponible. ¿Desea actualizar la aplicación?')
        ) {
          this.swUpdate.activateUpdate().then(() => {
            document.location.reload();
          });
        }
      });
  }

  public forceUpdate(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.activateUpdate().then(() => {
        document.location.reload();
      });
    }
  }

  public checkForUpdate(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate();
    }
  }
}
