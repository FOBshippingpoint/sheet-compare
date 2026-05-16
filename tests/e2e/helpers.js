import { afterEach } from "vitest";
import { mount, unmount } from "svelte";
import "../../src/app.css";
import App from "../../src/App.svelte";

let app;

export function mountApp() {
  app = mount(App, { target: document.body });
}

export function mountComponent(Component, props = {}) {
  app = mount(Component, { target: document.body, props });
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.replaceChildren();
});
