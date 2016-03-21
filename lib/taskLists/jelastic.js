var jelmiral = require('../jelmiral/index.js');
var fs = require('fs');
var path = require('path');
var util = require('util');
var exec = require('child_process').exec;

var SCRIPT_DIR = path.resolve(__dirname, '../../scripts/jelastic');
var TEMPLATES_DIR = path.resolve(__dirname, '../../templates/jelastic');

exports.setup = function(config) {
  var taskList = jelmiral.taskList('Setup (jelastic)');

  // Installation

  // taskList.execute('Installing', {
  //   command: function () {
  //     console.log('Nothing to install');

  //   }
  // });

  taskList.executeScript('Setting up Environment', {
    script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
    vars: {
      appName: config.appName
    }
  });
  
  taskList.copy('Setting UP package.json', {
    src: path.resolve(TEMPLATES_DIR, 'package.json'),
    dest: '/opt/repo/' + config.appName + '/config/package.json',
    vars: {
      env: config.env || {},
      appName: config.appName
    }
  });

  return taskList;
};

exports.deploy = function(bundlePath, env, deployCheckWaitTime, appName, enableUploadProgressBar) {
  var taskList = jelmiral.taskList("Deploy app '" + appName + "' (jelastic)");

  taskList.copy('Uploading bundle', {
    src: bundlePath,
    dest: '/opt/repo/' + appName + '/tmp/bundle.tar.gz',
    progressBar: enableUploadProgressBar
  });

  taskList.copy('Setting up Environment Variables', {
    src: path.resolve(TEMPLATES_DIR, '.env'),
    dest: '/opt/repo/' + appName + '/config/.env',
    vars: {
      env: env || {},
      appName: appName
    }
  });


  taskList.copy('Setting UP package.json', {
    src: path.resolve(TEMPLATES_DIR, 'package.json'),
    dest: '/opt/repo/' + appName + '/config/package.json',
    vars: {
      env: env || {},
      appName: appName
    }
  });

  taskList.executeScript('Invoking deployment process', {
    script: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
    vars: {
      deployCheckWaitTime: deployCheckWaitTime || 10,
      appName: appName
    }
  });


  return taskList;
};

exports.reconfig = function(env, appName) {
  var taskList = jelmiral.taskList("Updating configurations (jelastic)");

  taskList.copy('Setting up Environment Variables', {
    src: path.resolve(TEMPLATES_DIR, 'env.sh'),
    dest: '/opt/repo/' + appName + '/config/env.sh',
    vars: {
      env: env || {},
      appName: appName
    }
  });

  //restarting
  // taskList.execute('Restarting app', {
  //   command: '(sudo stop ' + appName + ' || :) && (sudo start ' + appName + ')'
  // });

  return taskList;
};

exports.restart = function(appName) {
  var taskList = jelmiral.taskList("Restarting Application (jelastic)");

  //restarting
  taskList.execute('Restarting app', {
    command: '(sudo stop ' + appName + ' || :) && (sudo start ' + appName + ')'
  });

  return taskList;
};

exports.stop = function(appName) {
  var taskList = jelmiral.taskList("Stopping Application (jelastic)");

  //stopping
  taskList.execute('Stopping app', {
    command: '(sudo stop ' + appName + ')'
  });

  return taskList;
};

exports.start = function(appName) {
  var taskList = jelmiral.taskList("Starting Application (jelastic)");

  //starting
  taskList.execute('Starting app', {
    command: '(sudo start ' + appName + ')'
  });

  return taskList;
};

function installStud(taskList) {
  taskList.executeScript('Installing Stud', {
    script: path.resolve(SCRIPT_DIR, 'install-stud.sh')
  });
}

function configureStud(taskList, pemFilePath, port) {
  var backend = {host: '127.0.0.1', port: port};

  taskList.copy('Configuring Stud for Upstart', {
    src: path.resolve(TEMPLATES_DIR, 'stud.init.conf'),
    dest: '/etc/init/stud.conf'
  });

  taskList.copy('Configuring SSL', {
    src: pemFilePath,
    dest: '/opt/stud/ssl.pem'
  });


  taskList.copy('Configuring Stud', {
    src: path.resolve(TEMPLATES_DIR, 'stud.conf'),
    dest: '/opt/stud/stud.conf',
    vars: {
      backend: util.format('[%s]:%d', backend.host, backend.port)
    }
  });

  taskList.execute('Verifying SSL Configurations (ssl.pem)', {
    command: 'stud --test --config=/opt/stud/stud.conf'
  });

  //restart stud
  taskList.execute('Starting Stud', {
    command: '(sudo stop stud || :) && (sudo start stud || :)'
  });
}
