import { setTimeout as delay } from "node:timers/promises";

export class CDP {
  constructor(socket, { base, errors = [], externalRequests = [] }) {
    this.socket = socket; this.next = 0; this.pending = new Map();
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        clearTimeout(pending.timeout); this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
      } else if (message.method === "Runtime.exceptionThrown") {
        errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
      } else if (message.method === "Fetch.requestPaused") {
        const url = message.params.request.url;
        const remote = /^https?:/.test(url) && new URL(url).origin !== base;
        if (remote) externalRequests.push(url);
        void this.call(remote ? "Fetch.failRequest" : "Fetch.continueRequest", {
          requestId: message.params.requestId, ...(remote ? { errorReason: "BlockedByClient" } : {}),
        }, message.sessionId).catch(() => {});
      }
    });
  }
  call(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++this.next;
      const timeout = setTimeout(() => { this.pending.delete(id); reject(new Error(`Browser timeout: ${method}`)); }, 15000);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  async evaluate(session, expression) {
    const result = await this.call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, session);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  }
  async wait(session, expression) {
    const end = Date.now() + 15000;
    while (Date.now() < end) {
      if (await this.evaluate(session, expression)) return;
      await delay(100);
    }
    throw new Error(`UI timeout: ${expression}\n${await this.evaluate(session, "document.body.innerText")}`);
  }
  async click(session, text) {
    const expression = `[...document.querySelectorAll('button')].find(button => !button.disabled && button.textContent.trim() === ${JSON.stringify(text)})`;
    await this.wait(session, `!!(${expression})`);
    await this.evaluate(session, `${expression}.click()`);
  }
  async page(url) {
    const { browserContextId } = await this.call("Target.createBrowserContext");
    const { targetId } = await this.call("Target.createTarget", { url: "about:blank", browserContextId });
    const { sessionId } = await this.call("Target.attachToTarget", { targetId, flatten: true });
    await this.call("Runtime.enable", {}, sessionId);
    await this.call("Page.enable", {}, sessionId);
    await this.call("Fetch.enable", { patterns: [{ urlPattern: "*" }] }, sessionId);
    await this.call("Page.navigate", { url }, sessionId);
    await this.wait(sessionId, "!!document.querySelector('#root')?.children.length");
    return sessionId;
  }
}

