export default function signalForRequest(signal, timeout, AbortController) {
  if (signal && signal.aborted) {
    return [];
  }

  if (timeout) {
    let controller = new AbortController();
    let tid = setTimeout(() => controller.abort(), timeout * 1000);

    if (signal) {
      let abort = () => {
        controller.abort();
        clearTimeout(tid);
      };
      let teardown = () => signal.removeEventListener('abort', abort);
      signal.addEventListener('abort', abort);

      return [controller.signal, teardown];
    } else {
      return [controller.signal];
    }
  }

  return [];
}
