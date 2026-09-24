import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideStore } from '@ngxs/store';
import { withNgxsLoggerPlugin } from '@ngxs/logger-plugin';
import { MarkersState } from './markers/state/markers.state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideStore(
      [MarkersState],
      withNgxsLoggerPlugin({ collapsed: true, disabled: !isDevMode() }),
    ),
  ],
};
