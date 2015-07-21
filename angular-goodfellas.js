/**
 * Utility filters, config, services and directives for use in angular 1.2.x
 *
 * @version 1.0.0 - 17/07/2015
 * @company Luxia SAS <http://luxia.fr>
 * @author: Tomasz Gorka <tomasz@gorka.org.pl>
 * @licence MIT License
 */

angular.module('ngGoodfellas', [])

/* FILTERS */

.filter('n', ['$sce', function($sce) {
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}])

.filter('byteFilter', ['$filter', function($filter) {
    return function(intValue) {
        if (intValue >= 1073741824) {
            return $filter('roundFilter')((intValue / 1073741824), 2) + ' Go';
        } else if (intValue >= 1048576) {
            return $filter('roundFilter')((intValue / 1048576), 2) + ' Mo';
        } else if (intValue >= 1024) {
            return $filter('roundFilter')((intValue / 1024), 2) + ' Ko';
        } else if (intValue > 1) {
            return (intValue) + ' Octets';
        } else if (intValue == 1) {
            return '1 Octet';
        } else {
            return '0 Octet';
        }
    };
}])

.filter('percentFilter', ['$filter', function($filter) {
    return function(intValue, baseValue) {
        return $filter('roundFilter')(((intValue * 100) / baseValue), 2) + ' %';
    };
}])

.filter('roundFilter', [function() {
    return function(intValue, decValue) {
        return Math.round(intValue * Math.pow(10, decValue)) /
                Math.pow(10, decValue);
    };
}])

.filter('makeRange', [function() {
    return function(input) {
        var lowBound, highBound, forward;
        switch (input.length) {
            case 1:
                lowBound = 0;
                highBound = parseInt(input[0]) - 1;
                forward = true;
                break;
            case 2:
                lowBound = parseInt(input[0]);
                highBound = parseInt(input[1]);
                forward = true;
                break;
            case 3:
                lowBound = parseInt(input[0]);
                highBound = parseInt(input[1]);
                forward = false;
                break;
            default:
                return input;
        }
        var result = [];
        if (forward) {
            for (var i = lowBound; i <= highBound; i++)
                result.push(i);
        } else {
            for (var i = highBound; i >= lowBound; i--)
                result.push(i);
        }
        return result;
    };
}])

.filter('ensureArraySinceNow', [function() {
    return function(input) {
        var currentYear = (new Date()).getFullYear();
        while (input.length > 0 && parseInt(input[0]) > currentYear) {
            input.shift();
        }

        if (input.length == 0) {
            input.push(currentYear);
        } else if (parseInt(input[0]) < currentYear) {
            input.unshift(currentYear);
        }

        return input;
    };
}])

.filter('fillBetweenFirstLastValues', [function() {
    return function(input) {
        var lowBound, highBound;
        var result = [];
        switch (input.length) {
            case 0:
                break;
            case 1:
                result.push(input[0]);
                break;
            default:
                lowBound = parseInt(input[0]);
                highBound = parseInt(input[input.length - 1]);
                if (lowBound < highBound) {
                    for (var i = lowBound; i <= highBound; i++)
                        result.push(i);
                } else {
                    for (var i = lowBound; i >= highBound; i--)
                        result.push(i);
                }
                break;
        }

        return result;
    };
}])

/* CONFIG */

/* uriType matcher in routes. Usage: url:'/some/prefix/{uri:uriType}' */
.config(['$urlMatcherFactoryProvider', function($urlMatcherFactoryProvider) {
    $urlMatcherFactoryProvider.strictMode(false);
    $urlMatcherFactoryProvider.type('uriType', {
        encode: function(str) {
            return str && str.toString().replace(/ /g, "-");
        },
        decode: function(str) {
            return str && str.toString();
        },
        is: angular.isString,
        pattern: /.+/
    });
}])

/* SERVICES */

.factory('transformRequestDataAsFormPost', [function() {
    return function(data, getHeaders) {
        // If this is not an object, defer to native stringification.
        if (!angular.isObject(data)) {
            return (data == null ) ? "" : data.toString();
        }
        var buffer = [];
        // Serialize each key in the object.
        for (var name in data) {
            if (!data.hasOwnProperty(name)) {
                continue;
            }
            var value = data[name];
            buffer.push(
                    encodeURIComponent(name) +
                    "=" +
                    encodeURIComponent((value == null) ? "" : value)
            );
        }
        // Serialize the buffer and clean it up for transportation.
        return buffer.join("&").replace( /%20/g, "+");
    };
}])

.factory('sizingService', ['$window', '$rootScope', '$timeout',
            function($window, $rootScope, $timeout) {
    // initial update size
    var windowHeight = $window.innerHeight;
    var windowWidth  = $window.innerWidth;
    var headerHeight = $window.document.getElementById(
            'header').offsetHeight;
    var contentHeight = windowHeight - headerHeight;

    // updating function
    var updateSize = function() {
        var fn = function() {
            windowHeight = $window.innerHeight;
            windowWidth  = $window.innerWidth;
            headerHeight = $window.document.getElementById(
                    'header').offsetHeight;
            contentHeight = windowHeight - headerHeight;
        };
        // it's needed for logout event
        if ($rootScope.$$phase) {
            $timeout(fn);
        } else {
            $rootScope.$apply(fn);
        }
    };

    // listen events that can update size
    $window.addEventListener('orientationchange', function() {
        // update size after orientation has changed
        updateSize();
    });

    $window.addEventListener('resize', function() {
        // update size after window size changed
        updateSize();
    });

    $window.addEventListener('load', function() {
        // update size after window size changed
        updateSize();
    });

    // return functions
    return {
        sync: function() {
            updateSize();
        },
        getHeaderHeight: function() {
            return headerHeight;
        },
        getWindowHeight: function() {
            return windowHeight;
        },
        getWindowWidth: function() {
            return windowWidth;
        },
        getContentHeight: function() {
            return contentHeight;
        }
    };
}])

.factory('calendarService', [function() {
    return {
        /**
         * Get week day for for Gregorian calendar.
         * solution from
         * http://en.wikipedia.org/wiki/Determination_of_the_day_of_the_week
         * @param {number} year
         * @param {number} month in range [0, 11]
         * @param {number} day in range [0, MONTH_DAYS_LENGTH-1]
         * @returns {number} in range of [0,6]
         */
        getWeekdayNumber: function(year, month, day) {
            var date = new Date();
            date.setFullYear(year, month, 1);
            var monthFirstWeekday = date.getDay();

            // sunday is last not first day and days is in [0, 6]
            if (monthFirstWeekday == 0) {
                monthFirstWeekday = 6;
            } else {
                monthFirstWeekday--;
            }

            return monthFirstWeekday;
        },
        /**
         * Get day count for each month in the year.
         * @param {number} year needs for calculate leap years
         * @param {number} month in range [1, 12]
         * @returns {number} days count.
         */
        getDayCount: function(year, month) {
            if (month == 2) {
                if (year % 400 == 0) {
                    return 29;
                } else if ((year % 4 == 0) && (year % 100 != 100)) {
                    return 29;
                } else {
                    return 28;
                }
            } else if (month == 4 || month == 6 || month == 9 || month == 11) {
                return 30;
            } else {
                return 31;
            }
        }
    };
}])

.factory('browserHacksService', ['$window', function($window) {
    return {
        localStorage: function() {
            // Safari, in Private Browsing Mode, looks like it supports
            // localStorage but all calls to setItem throw QuotaExceededError.
            // We're going to detect this and just silently drop any calls to
            // setItem to avoid the entire page breaking, without having to
            // do a check at each usage of Storage.
            if (typeof localStorage === 'object') {
                try {
                    $window.sessionStorage.setItem('localStorage', 1);
                    $window.sessionStorage.removeItem('localStorage');
                } catch (e) {
                    Storage.prototype._setItem = Storage.prototype.setItem;
                    Storage.prototype.setItem = function() {};
                    console.log("WARNING: Your web browser does not support " +
                    "storing settings locally. In Safari, the most common " +
                    "cause of this is using \"Private Browsing Mode\". Some " +
                    "settings may not save or some features may not work " +
                    "properly for you.");
                }
            }
        }
    };
}])

/* DIRECTIVES */

/* form */
.directive('isChecked', [function() {
    return {
        restrict: 'A', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        link: function(scope, elem, attrs, ngModel) {
            if(!ngModel) return; // do nothing if no ng-model

            // watch own value and re-validate on change
            scope.$watch(attrs.ngModel, function() {
                validate();
            });

            var validate = function() {
                // value
                var val = ngModel.$viewValue;
                // set validity
                ngModel.$setValidity('isChecked', val);
            };
        }
    };
}])

.directive('crypt', [function() {
    return  {
        restrict: 'A', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        link: function(scope, elem, attrs, ngModel) {
            if(!ngModel) return; // do nothing if no ng-model

            var crypt = function() {
                // Use SHA-2
                ngModel.$setViewValue(CryptoJS.SHA512(elem.val() || ''));
                // Use SHA-3
                //ngModel.$setViewValue(CryptoJS.SHA3(elem.val() || '',
                //        { outputLength: 512 }));
            };

            // view -> model
            scope.$watch(attrs.ngModel, function() {
                if (elem.val() == ngModel.$viewValue) {
                    crypt();
                }
            });

            // model -> view
            ngModel.$render = function() {
                var val = ngModel.$viewValue;
                if (val && val.length > 0) {
                    elem.val('Crypted value');
                } else {
                    elem.val('')
                }
            };

            // load init value from DOM
            //crypt();
        }
    };
}])

.directive('utilitiesSubmitButton', [function() {
    return {
        restrict: 'E',
        require: '^utilitiesForm',
        transclude: true,
        template: '<div class="btn-group btn-group-justified ' +
            'margin-vertical-lg">' +
            '<button type="submit" ' +
            'class="full-width btn btn-link btn-lg text-large" ' +
            'ng-class="summitClass()" role="button" ng-transclude></button>' +
            '</div>'
    };
}])

.directive('utilitiesFieldGroup', ['$compile', '$timeout',
            function($compile, $timeout) {
    return {
        restrict: 'E',
        require: '^utilitiesForm',
        transclude: true,
        scope: {},
        controller: ['$scope', function($scope) {
            // timer for success messageg
            $scope.isSuccessMessagesVisible = false;
            $scope.successMessagesDuration = 500;
            $scope.successMessagesTimer = null;
            $scope.showSuccessMessages = function() {
                if ($scope.successMessagesTimer) {
                    $timeout.cancel($scope.successMessagesTimer);
                }
                $scope.isSuccessMessagesVisible = true;
                $scope.successMessagesTimer = $timeout(function() {
                    $scope.isSuccessMessagesVisible = false;
                }, $scope.successMessagesDuration);
            };

            $scope.getField = function() {
                if ($scope.$parent.formName &&
                        $scope.$parent[$scope.$parent.formName] &&
                        $scope.$parent[$scope.$parent.formName][$scope.fieldName]) {
                    return $scope.$parent[$scope.$parent.formName][$scope.fieldName];
                }
                return null;
            };

            $scope.getGroupClass = function() {
                var field = $scope.getField();
                if (field) {
                    if (!field.$pristine) {
                        if (!field.$valid) {
                            return 'has-error';
                        } else if ($scope.isSuccessMessagesVisible) {
                            return 'has-success';
                        }
                    }
                }
                return '';
            };

            $scope.isShowingInvalid = function() {
                var field = $scope.getField();
                if (field) {
                    return field.$dirty && field.$invalid;
                }
                return false;
            };

            $scope.isShowingValid = function() {
                var field = $scope.getField();
                if (field) {
                    return field.$dirty && field.$valid &&
                            $scope.isSuccessMessagesVisible;
                }
                return false;
            };

            $scope.isShowingError = function(errorName) {
                var field = $scope.getField();
                if (field) {
                    return field.$dirty && field.$error[errorName];
                }
                return false;
            };

            $scope.getServerValidationMessages = function() {
                if ($scope.$parent.serverValidation[$scope.fieldName]) {
                    return $scope.$parent.serverValidation[$scope.fieldName];
                } else {
                    return [];
                }
            }
        }],
        link: function(scope, elem, attrs) {
            var fieldElement = null;
            if (attrs['innerClass']) {
                scope.innerClass = attrs['innerClass'];
            } else {
                scope.innerClass = 'text-left';
            }
            attrs.$observe('innerClass', function(value) {
                if (value) {
                    scope.innerClass = value;
                }
            });

            angular.forEach(elem.children(), function(parent) {
                angular.forEach(angular.element(parent).children(),
                        function(child) {
                            var childElement = angular.element(child);
                            if (childElement.attr('name') != undefined) {
                                if (!childElement.hasClass('form-control')) {
                                    childElement.addClass('form-control');
                                }
                                if(childElement.attr('ng-model') == undefined) {
                                    console.log('WARNING: there is no ' +
                                        'ngModel set in the element');
                                }
                                // add elements for input
                                fieldElement = childElement;
                            } else {
                                // add elements for error messages
                                if (!childElement.hasClass('no-label')) {
                                    childElement.addClass('label');
                                    childElement.addClass('label-danger');
                                    childElement.addClass('margin-right-sl');
                                    childElement.addClass('margin-vertical-sl');
                                    childElement.addClass('inline');
                                    childElement.addClass('full-max-width');
                                }
                                // to be able to call isShowingError
                                $compile(childElement)(scope);
                            }
                        });
            });
            if (fieldElement) {
                scope.fieldName = fieldElement.attr('name');
                scope.fieldElement = fieldElement;
                var ngModel = fieldElement.attr('ng-model');
                // watch own value and re-validate on change
                if (ngModel) {
                    scope.$watch(('$parent.' + ngModel), function() {
                        var field = scope.getField();
                        if (field && field.$dirty) {
                            field.$setValidity('serverValidation', true);
                            if (field.$valid) {
                                scope.showSuccessMessages();
                            }
                        }
                    });
                }

                var serverValidationElement = angular.element(
                    '<span class="label label-danger margin-right-sl ' +
                    'margin-vertical-sl inline full-max-width" ' +
                    'ng-repeat="message in getServerValidationMessages()" ' +
                    'ng-show="isShowingError(\'serverValidation\')" ' +
                    'ng-bind-html="message | n"></span>');
                var successIcon = angular.element('<span class="glyphicon ' +
                    'glyphicon-ok form-control-feedback" ' +
                    'ng-show="isShowingValid()"></span>');
                var dangerIcon = angular.element('<span class="glyphicon ' +
                    'glyphicon-remove form-control-feedback" ' +
                    'ng-show="isShowingInvalid()"></span>');

                fieldElement.after(serverValidationElement);
                fieldElement.after(successIcon);
                fieldElement.after(dangerIcon);

                $compile(serverValidationElement)(scope);
                $compile(successIcon)(scope);
                $compile(dangerIcon)(scope);
            }
        },
        template: '<div class="form-group has-feedback margin-vertical ' +
            '{{innerClass}}" ng-class="getGroupClass()" ng-transclude>' +
            '</div>'
    };
}])

.directive('utilitiesForm', ['$http', 'transformRequestDataAsFormPost',
            function($http, transformRequestDataAsFormPost) {
    return {
        restrict: 'A', // only activate on element attribute
        link: function(scope, elem, attrs) {
            // set name property as a form model
            if (attrs.name) {
                scope.formName = attrs.name;
            } else {
                console.log('WARNING: There is no form[name] specified. ' +
                'Don\'t binding utilities form into fields.');
            }
            if (attrs.action) {
                // bind form submission if action is defined in the form
                elem[0].onsubmit = function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    scope.submitForm(attrs.action);
                };
            } else if (!attrs.ngSubmit) {
                console.log('WARNING: There is no form[ngSubmit] not ' +
                    'form[action] specified. ' +
                    'Don\'t binding utilities form sending.');
            }
            // set method property (default get)
            if (attrs.method) {
                scope.formMethod = attrs.method.toLowerCase();
            } else {
                scope.formMethod = 'get';
                attrs.$set('method', scope.formMethod);
            }
            // set role attribute as a form if not defined
            if (!attrs.role) {
                attrs.$set('role', 'form');
            }
            // set form data encoded if not defined and charset
            if (attrs.enctype) {
                scope.formEnctype = attrs.enctype;
            } else {
                scope.formEnctype =
                        'application/x-www-form-urlencoded;charset=utf-8';
                attrs.$set('enctype', scope.formEnctype);
            }
            // set form accept response type if not defined
            if (attrs.accept) {
                scope.formAccept = attrs.accept;
            } else {
                scope.formAccept = 'application/json';
                attrs.$set('accept', scope.formAccept);
            }
            // set form accept response charset if defined
            if (attrs.acceptCharset) {
                scope.formAcceptCharset = attrs.acceptCharset;
            } else {
                scope.formAcceptCharset = undefined;
            }
        },
        controller: ['$scope', function($scope) {
            $scope.data = {};
            $scope.serverValidation = {};

            $scope.summitClass = function() {
                if ($scope.formName && $scope[$scope.formName]) {
                    if (!$scope[$scope.formName].$dirty ||
                            !$scope[$scope.formName].$valid) {
                        return 'disabled';
                    }
                }
                return '';
            };

            $scope.submitForm = function(url) {
                if ($scope.onSubmitForm && !$scope.onSubmitForm()) {
                    // not submitting if onSubmit form returns false
                    return;
                }

                var request = {
                    method: $scope.formMethod,
                    url   : url,
                    headers: {
                        'Content-Type': $scope.formEnctype,
                        'Accept'      : $scope.formAccept
                    }
                };
                if ($scope.formAcceptCharse) {
                    request.headers['Accept-Charset'] =
                        $scope.formAcceptCharset;
                }
                if ($scope.formMethod == 'get') {
                    request.params = $scope.data;
                } else {
                    request.data = $scope.data;
                }
                if ($scope.formEnctype.indexOf('x-www-form-urlencoded') >= 0) {
                    request.transformRequest = transformRequestDataAsFormPost;
                }
                $http(request).
                        success(function(data, status, headers, config) {
                            // emit information to the controller
                            // that form was send
                            $scope.$emit('formSubmited', data);
                        }).
                        error(function(data, status, headers, config) {
                            if (status == 422) {
                                // invalidate fields
                                $scope.serverValidation = data;
                                if ($scope.formName &&
                                        $scope[$scope.formName]) {
                                    for (var field in data) {
                                        if ($scope[$scope.formName][field]) {
                                            $scope[$scope.formName][field].
                                                $dirty = true;
                                            $scope[$scope.formName][field].
                                                $setValidity(
                                                    'serverValidation', false);
                                        }
                                    }
                                }
                                // emit information to the controller
                                // that form was send invalid
                                $scope.$emit('formSubmitedInvalid', data);
                            }
                        }
                );
            };
            // emit information to the controller that form is ready
            $scope.$emit('formInited', {'data':$scope.data});
        }]
    };
}])

/* grid elements */
.directive('hasGridElements', [function() {
    return {
        restrict: 'A',
        controller: ['$scope', function($scope) {
            $scope.width = 60;
            $scope.updateWidth = function(width) {
                if (width > $scope.width) {
                    if (!$scope.$$phase) {
                        $scope.$apply(function() {
                            $scope.width = width;
                        });
                    } else {
                        $scope.width = width;
                    }
                }
            }
        }]
    };
}])

.directive('gridElement', [function() {
    return {
        restrict: 'A',
        transclude: true,
        require: '^hasGridElements',
        link: function(scope, elem, attrs) {
            var getElementWidth = function() {
                return elem.prop('clientWidth');
            };
            scope.$watch(getElementWidth, function (newValue, oldValue) {
                scope.$parent.updateWidth(newValue);
            }, true);
        },
        template: '<div ng-transclude ' +
            'style="min-width:{{$parent.width}}px;"></div>'
    };
}])

;
