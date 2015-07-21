# angular-goodfellas

Utility filters, config, services and directives for use in angular 1.2.x

## Install

Copy angular-goodfellas.min.js into your static js file directory.
Load the script in your html head part.

Add 'ngGoodfellas' into your angular module dependencies ex.

angular.module('yourApp', ['ngGoodfellas'])

## List of filters

+ n - filter like in mako templates
+ byteFilter
+ percentFilter
+ roundFilter
+ makeRange
+ ensureArraySinceNow
+ fillBetweenFirstLastValues

## List of configs

+ uriType - uriType matcher in routes. Usage: url:'/some/prefix/{uri:uriType}'

## List of services

+ transformRequestDataAsFormPost - for request transforming post type data as a form type.
+ sizingService
  + sync
  + getHeaderHeight
  + getWindowHeight
  + getWindowWidth
  + getContentHeight
+ calendarService
  + getWeekdayNumber
  + getDayCount
+ browserHacksService - for browser hacks
  + localStorage - hack form safari private localstorage

## List of directives

+ Work with forms and form fields
  + isChecked
  + crypt
  + utilitiesSubmitButton
  + utilitiesFieldGroup
  + utilitiesForm
+ Order elements into the grid
  + hasGridElements
  + gridElement

## Release History
+ 1.0.0 - initial revision.

## Author
Tomasz Górka <tomasz@gorka.org.pl>

## License
&copy; 2015 Luxia SAS <http://luxia.fr>

MIT licensed.
