var less = require('less'),
    Parser = less.Parser,
    path = require('path'),
    fs = require('fs'),
    util = require('util');

var createLessPreprocessor = function (args, configuration, basePath, logger, helper) {
  var config = configuration || {},
      options = util._extend({compress: false, save: false, paths: Array()}, config.options),
      additionalData = config.additionalData || {},
      translatedPaths = Array(),
      log = logger.create('preprocessor:less');

  var transformPath = args.transformPath || config.transformPath || function (filePath) {
    return filePath.replace(/\.less$/, '.css');
  };

  var rendered = function (done, filePath, error, css) {
    var content;
    if (error !== null && error !== undefined) {
      log.error('Error:%s\n', error);
    } else {
      content = css.toCSS({compress: options.compress})
      if (options.save) {
        var p = path.resolve(filePath.replace(/\/([\.a-zA-Z0-9\-\_]+).css$/, '/'));
        helper.mkdirIfNotExists(p, function () {
          var n = filePath.match(/[a-zA-Z\-\.\_]+.css$/).reverse()[0];
          fs.writeFile(path.join(p, n), content, 'utf-8', function (error) {
            if (error) {
              log.error('Error:%s', error);
            }
            done(content);
          });
        });
      } else {
        done(content);
      }
    }
  };

  return function (content, file, done) {
    file.path = transformPath(file.originalPath);
		
    options.paths.forEach(function(element, index, array) {
      translatedPaths[index] = basePath + '/' + element;
    });

    var parser = new Parser(util._extend({}, options, {
      paths: translatedPaths,
    }));

    try {
      parser.parse(content, rendered.bind(null, done, file.path), additionalData);
    } catch (error) {
      log.error('%s\n  at %s', error.message, file.originalPath);
      return;
    }
  };
};

createLessPreprocessor.$inject = ['args', 'config.lessPreprocessor', 'config.basePath', 'logger', 'helper'];

// PUBLISH DI MODULE
module.exports = {
  'preprocessor:less': ['factory', createLessPreprocessor]
};
