function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;

  if (host.startsWith('www.')) {
    var newHost = host.substring(4);
    var newUrl = 'https://' + newHost + request.uri;
    if (request.querystring && Object.keys(request.querystring).length > 0) {
      var qs = Object.keys(request.querystring)
        .map(function(k) {
          var v = request.querystring[k];
          return v.multiValue
            ? v.multiValue.map(function(mv) { return k + '=' + mv.value; }).join('&')
            : k + '=' + v.value;
        })
        .join('&');
      newUrl += '?' + qs;
    }
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: newUrl }
      }
    };
  }

  return request;
}
