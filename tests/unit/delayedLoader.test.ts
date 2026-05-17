import { afterEach, describe, expect, it, vi } from "vitest";
import { createDelayedLoader } from "../../src/lib/delayedLoader.svelte";

describe("createDelayedLoader", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps fast operations hidden", () => {
    vi.useFakeTimers();
    const loader = createDelayedLoader({ delay: 1000 });
    const task = loader.start();

    vi.advanceTimersByTime(999);
    loader.stop(task);

    expect(loader.pending).toBe(false);
    expect(loader.visible).toBe(false);
  });

  it("shows operations after the delay", () => {
    vi.useFakeTimers();
    const loader = createDelayedLoader({ delay: 1000 });

    loader.start();
    expect(loader.pending).toBe(true);
    expect(loader.visible).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(loader.pending).toBe(true);
    expect(loader.visible).toBe(true);
  });

  it("does not let old handles clear newer operations", () => {
    vi.useFakeTimers();
    const loader = createDelayedLoader({ delay: 1000 });
    const oldTask = loader.start();
    const newTask = loader.start();

    loader.stop(oldTask);
    vi.advanceTimersByTime(1000);

    expect(loader.pending).toBe(true);
    expect(loader.visible).toBe(true);

    loader.stop(newTask);
    expect(loader.pending).toBe(false);
    expect(loader.visible).toBe(false);
  });

  it("clears timers and state on destroy", () => {
    vi.useFakeTimers();
    const loader = createDelayedLoader({ delay: 1000 });

    loader.start();
    loader.destroy();
    vi.advanceTimersByTime(1000);

    expect(loader.pending).toBe(false);
    expect(loader.visible).toBe(false);
  });
});
