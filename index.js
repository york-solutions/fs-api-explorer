var client = new FamilySearch({
      appKey: 'a02j000000KSuIBAA1',
      redirectUri: window.location.href
    }),
    $url = document.getElementById('url'),
    $method = document.getElementById('method'),
    $output = document.getElementById('output'),
    $requestBody = document.getElementById('request-body'),
    $authStatus = document.getElementById('auth-status'),
    $tokenDisplay = document.getElementById('access-token-display'),
    $expectRedirect = document.getElementById('expectRedirect'),
    $followRedirect = document.getElementById('followRedirect');

// Setup event listeners

document.getElementById('load-button').addEventListener('click', makeRequest);

$url.addEventListener('keypress', function(e){
  var key = e.which || e.keyCode;
  if(key === 13){
    makeRequest();
  }
});

$method.addEventListener('change', function(){
  if($method.value === 'POST'){
    $requestBody.style.display = 'block';
  } else {
    $requestBody.style.display = 'none';
  }
});

document.getElementById('login-btn').addEventListener('click', function(){
  client.oauthRedirect();
});

document.getElementById('logout-btn').addEventListener('click', function(){
  client.deleteAccessToken();
  window.location.reload();
});

// Handle an OAuth2 response if we're in that state. Otherwise we initialize the
// app with a request on load.
var oauthResponseState = client.oauthResponse(function(error, response){
  if(response){
    displayResponse(response);
    
    // On success, reload the page to remove the code from the url
    if(response.statusCode === 200){
      window.location = window.location.pathname;
    }
  } else {
    genericError();
  }
});
if(!oauthResponseState){
  makeRequest();
}

/**
 * Send a request to the API and display the response
 */
function makeRequest(){
  output('Sending the request...');
  var options = {
    method: $method.value,
    headers: {
      Accept: document.getElementById('accept').value
    },
    expectRedirect: $expectRedirect.checked,
    followRedirect: $followRedirect.checked
  };
  if(options.method === 'POST'){
    options.body = $requestBody.value;
  }
  client.request($url.value, options, function(error, response){
    if(error){
      genericError();
    } else {
      displayResponse(response);
      
      if(response.statusCode === 401){
        $authStatus.classList.remove('loggedin');
        $tokenDisplay.value = '';
        
      } else {
        $authStatus.classList.add('loggedin');
        $tokenDisplay.value = 'Bearer ' + client.getAccessToken();
      }
    }
  });
}

/**
 * Display a generic error since XHR gives us no details.
 */
function genericError(){
  output('Fatal error. Open the browser\'s developer console for more details.');
}

/**
 * Display an API response
 * 
 * @param {Object} response
 */
function displayResponse(response){
  
  // Gather and display HTTP response data
  var lines = [
    response.statusCode + ' ' + response.statusText,
    headersToString(response.headers)
  ];
  if(response.data){
    lines.push('');
    lines.push(prettyPrint(response.data));
  }
  output(lines.join('\n'));
  
  // Attach listeners to links so that clicking a link will auto-populate
  // the url field
  Array.from($output.querySelectorAll('.link')).forEach(function(link){
    link.addEventListener('click', function(){
      // Remove leading and trailing "
      $url.value = link.innerHTML.slice(1,-1);
      window.scrollTo(0, 0);
    });
  });
}

/**
 * Convert a headers map into a multi-line string
 * 
 * @param {Object} headers
 * @return {String}
 */
function headersToString(headers){
  var lines = [];
  for(var name in headers){
    lines.push(name + ': ' + headers[name]);
  }
  return lines.join('\n');
}

/**
 * Display HTML in the response output container
 * 
 * @param {String} html
 */
function output(html){
  $output.innerHTML = html;
}

/**
 * Pretty print a JSON object
 * 
 * @param {Object} obj
 * @return {String} html string
 */
function prettyPrint(obj){
  return syntaxHighlight(JSON.stringify(obj, null, 4));
}

/**
 * Parse a JSON string and wrap data in spans to enable syntax highlighting.
 * 
 * http://stackoverflow.com/a/7220510
 * 
 * @param {String} JSON string
 * @returns {String}
 */
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    var cls = 'number',
        url = false;
    if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
          if(match.indexOf('"https://') === 0){
            // url = true;
            cls += ' link';
          }
        }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    var html = '<span class="' + cls + '">' + match + '</span>';
    if(url){
      html = '<a href>' + html + '</a>';
    }
    return html;
  });
}