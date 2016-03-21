var Session = require('./session');
var TaskList = require('./taskList');
var TaskListsRunner = require('./taskListsRunner');

var jelmiral = module.exports;
jelmiral.session = Session;
jelmiral.taskList = TaskList;
jelmiral.taskListsRunner = TaskListsRunner;
jelmiral.registerTask = TaskList.registerTask;

//load initial core tasks
require('./coreTasks')(jelmiral);