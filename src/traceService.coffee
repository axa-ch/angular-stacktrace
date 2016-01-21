angular.module('angularStacktrace', [])

angular.module('angularStacktrace').provider('stacktrace', ->
  @options = {
    type: 'POST'
    url: null,
    contentType: 'application/json',
  }

  @setUrl = (url) =>
    @options.url = url
    return @

  @setType = (type) =>
    @options.type = type
    return @

  @setUuid = (uuid) =>
    @options.uuid = uuid
    return @

  @$get = ->
    {
      getOption: (key) =>
        @options[key]
    }
  return
)

.factory('traceService', ->
  {
    print: printStackTrace
  }
)
.factory('errorLogService', ($injector, $log, $window, stacktrace, traceService) ->
  ($delegate) ->
    (exception, cause) ->
      $log.error.apply($log, arguments)

      try
        errorMessage = exception.toString()
        stackTrace = traceService.print({e: exception})

        url = stacktrace.getOption('url')
        unless url then throw new Error('Cannot send exception report, please set url.')

      $http = $injector.get('$http');

      $http({
        method: stacktrace.getOption('type'),
        url: stacktrace.getOption('url'),
        data: angular.toJson({
          message: errorMessage,
          stacktrace: stackTrace,
          userAgent: $window.navigator.userAgent,
          url: $window.location.href,
          registrationUuid: stacktrace.getOption('uuid')
        })
      }).then(
        (response) ->
          $log.info response
      ,
        (error) ->
          $log.error error
      )

      $delegate(exception, cause)
).config(($provide) ->
  $provide.decorator('$exceptionHandler', ($delegate, errorLogService) ->
    errorLogService($delegate);
  )
)