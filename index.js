#!/usr/bin/env node

var exec = require('simple-subprocess')
  , fs = require('fs')
  , path = require('path')
  , prompt = require('prompt')
  ;

prompt.message = '?';

// TODO make more compositional control flow for chaining interactions together.
// Can probably do a lot of this with futures or something. Finish reading
// http://tech.pro/blog/6742/callback-to-future-functor-applicative-monad


var cloneLocation = path.join(process.env.HOME, 'src/zanata/tmgmt_zanata');

fs.stat(cloneLocation, function (err, stats) {
  if (!err && stats.isDirectory()) {
    console.error('Directory %s exists, clone not possible', cloneLocation);
        askToAddRemotes();
  } else {
    console.log('tmgmt-zanata code not found at %s', cloneLocation)
    ask('Clone code from github?', function (err, result) {
      if (result) {
        var clone = exec('git clone git@github.com:zanata/tmgmt_zanata.git ' + cloneLocation)

        clone.on ('exit', function (code) {
          if (code === 0) {
            console.log('Clone successful.');
            askToAddRemotes();
          } else {
            console.error('looks like the clone did not work =\'(');
          }
        });
      } else {
        askToAddRemotes();
      }
    });
  }
});

function askToAddRemotes () {
  ask('Add drupal.org remotes to the repository?', function (err, result) {
    if (result) {
      var cwd = process.cwd();
      try {
        process.chdir(cloneLocation);
        addRemote('drupal-sandbox', 'davidmason@git.drupal.org:sandbox/davidmason/2279489.git')
          .on('exit', function () {
            addRemote('drupal', 'davidmason@git.drupal.org:project/tmgmt_zanata.git')
              .on('exit', function () {
                console.log('Finished adding remotes.');
              });
          });
      } catch (e) {
        console.error('could not open clone location %s', cloneLocation);
      }
    }
  });
}

// TODO check whether remote exists
//      and whether it already has the given URI
// TODO return a future
function addRemote(name, uri) {
  return exec('git remote add ' + name + ' ' + uri);
}

// TODO return a future
function ask (yesNoQuestion, callback) {
  // TODO make a module for yes/no prompt schema that returns a boolean.
  var schema = {
    properties: {
      question: {
        description: yesNoQuestion,
        required: true,
        pattern: /^([yY]([eE][sS])?|[nN][oO]?)$/,
        message: 'y/N',
        default: 'y',
        before: function (value) { return value.charAt(0).toLowerCase() === 'y' }
      }
    }
  };

  prompt.start();
  prompt.get(schema, callback);
}



// TODO offer to install drupal
// TODO offer to activate all the depended modules
// TODO offer to copy the module code from the github clone
