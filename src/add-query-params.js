import param from 'jquery-param';

export default function addQueryParams(url, queryParams) {
  if (queryParams && Object.keys(queryParams).length) {
    queryParams = param(queryParams);
    let delimiter = url.indexOf('?') > -1 ? '&' : '?';
    return `${url}${delimiter}${queryParams}`;
  }
  return url;
}
