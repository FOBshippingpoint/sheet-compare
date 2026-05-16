export function createDelayedLoader({ delay = 1000 } = {}) {
  return new DelayedLoader(delay);
}

class DelayedLoader {
  pending = $state(false);
  visible = $state(false);
  #delay;
  #timer = 0;
  #token = 0;

  constructor(delay) {
    this.#delay = delay;
  }

  start() {
    const token = ++this.#token;

    if (this.#timer) clearTimeout(this.#timer);

    this.pending = true;
    this.#timer = this.visible ? 0 : setTimeout(() => this.#show(token), this.#delay);

    return token;
  }

  stop(token) {
    if (token !== this.#token) return;

    this.#clear();
  }

  destroy() {
    this.#token++;
    this.#clear();
  }

  #show(token) {
    if (token !== this.#token || !this.pending) return;

    this.visible = true;
    this.#timer = 0;
  }

  #clear() {
    if (this.#timer) clearTimeout(this.#timer);

    this.#timer = 0;
    this.pending = false;
    this.visible = false;
  }
}
