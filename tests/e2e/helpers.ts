import { afterEach } from "vitest";
import { mount, unmount } from "svelte";
import "../../src/app.css";
import App from "../../src/App.svelte";

type MountFunction = (
  component: unknown,
  options: { target: Element; props?: Record<string, unknown> },
) => unknown;

const mountComponentUntyped = mount as MountFunction;

let app: unknown = null;

export function mountApp() {
  app = mountComponentUntyped(App, { target: document.body });
}

export function mountComponent(Component: unknown, props: Record<string, unknown> = {}) {
  app = mountComponentUntyped(Component, { target: document.body, props });
}

export function requireElement<T extends Element>(element: T | null): T {
  if (!element) throw new Error("Expected element to exist.");
  return element;
}

afterEach(() => {
  if (app) unmount(app as never);
  app = null;
  document.body.replaceChildren();
});
