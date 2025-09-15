import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class DeviceStorageService {
  getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = uuidv4();
      this.setDeviceId(deviceId);
    }
    return deviceId;
  }

  setDeviceId(deviceId: string): void {
    localStorage.setItem('device_id', deviceId);
  }
}
