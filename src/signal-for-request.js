export default function signalForRequest({ signal, timeout }, AbortController) {
  if (signal && signal.aborted) {
    return [signal];
  }

  if (timeout) {
    let controller = new AbortController();
    setTimeout(() => controller.abort(), timeout * 1000);

    if (signal) {
      let abort = () => controller.abort();
      let resolve = response => {
        signal.removeEventListener('abort', abort);
        return response;
      };
      let reject = reason => {
        signal.removeEventListener('abort', abort);
        throw reason;
      };
      signal.addEventListener('abort', abort);

      return [controller.signal, resolve, reject];
    } else {
      return [controller.signal];
    }
  } else if (signal) {
    return [signal];
  }
  return [];
}
