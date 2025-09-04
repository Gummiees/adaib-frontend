import { bootstrapApplication } from "@angular/platform-browser";
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { App } from "./app/app";
import { appConfig } from "./app/app.config";

inject();
injectSpeedInsights();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
