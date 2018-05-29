export default function headersToObject(headers) {
  return Array.from(headers).reduce((headers, [key, value]) => {
    headers[key] = value;
    return headers;
  }, Object.create(null));
}
