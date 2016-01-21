angular.module('angularStacktrace', []);

angular.module('angularStacktrace').provider('stacktrace', function() {
  this.options = {
    type: 'POST',
    url: null,
    contentType: 'application/json'
  };
  this.setUrl = (function(_this) {
    return function(url) {
      _this.options.url = url;
      return _this;
    };
  })(this);
  this.setType = (function(_this) {
    return function(type) {
      _this.options.type = type;
      return _this;
    };
  })(this);
  this.setUuid = (function(_this) {
    return function(uuid) {
      _this.options.uuid = uuid;
      return _this;
    };
  })(this);
  this.$get = function() {
    return {
      getOption: (function(_this) {
        return function(key) {
          return _this.options[key];
        };
      })(this)
    };
  };
}).factory('traceService', function() {
  return {
    print: printStackTrace
  };
}).factory('errorLogService', ["$injector", "$log", "$window", "stacktrace", "traceService", function($injector, $log, $window, stacktrace, traceService) {
  return function($delegate) {
    return function(exception, cause) {
      var $http, errorMessage, stackTrace, url;
      $log.error.apply($log, arguments);
      try {
        errorMessage = exception.toString();
        stackTrace = traceService.print({
          e: exception
        });
        url = stacktrace.getOption('url');
        if (!url) {
          throw new Error('Cannot send exception report, please set url.');
        }
      } catch (undefined) {}
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
      }).then(function(response) {
        return $log.info(response);
      }, function(error) {
        return $log.error(error);
      });
      return $delegate(exception, cause);
    };
  };
}]).config(["$provide", function($provide) {
  return $provide.decorator('$exceptionHandler', ["$delegate", "errorLogService", function($delegate, errorLogService) {
    return errorLogService($delegate);
  }]);
}]);
