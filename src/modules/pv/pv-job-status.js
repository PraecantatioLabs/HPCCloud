angular.module('pv.web')
    .directive('pvJobStatus', ['$rootScope', '$templateCache', 'kw.Girder',
        function($rootScope, $templateCache, $girder) {
        return {
            restrict: 'AE',
            template: $templateCache.get('pv/tpls/pv-job-status.html'),
            scope: {
                status: '@',
            },
            link: function(scope, element, attrs) {
                var parentTask = null;
                scope.statuses = {}; // formatted {[_id]: 'status', ...}
                scope.jobs = [];
                scope.done = false;

                //pass an object and a regex, get an array of keys which match the regex
                function pick(obj, regexp) {
                    return Object.keys(obj).filter(function(el) {
                        return regexp.test(el);
                    });
                }

                function indexWithJobId(id) {
                    for (var i=0; i < scope.jobs.length; i++) {
                        if (scope.jobs[i]._id === id) {
                            return i;
                        }
                    }
                    return -1;
                }

                function updateJobsList(taskId, callback) {
                    console.log('task :: ', taskId);
                    $girder.getTaskWithId(taskId)
                        .then(function(res) {
                            scope.jobs = [];
                            pick(res.data.output, /_job$/)
                                .forEach(function(el) {
                                    console.log('_job', el, res.data.output[el]);
                                    scope.jobs.push(res.data.output[el]);
                                    if (!scope.statuses.hasOwnProperty(res.data.output[el]._id)){
                                        scope.statuses[res.data.output[el]._id] = 'created';
                                    }
                                });
                            if (callback) {
                                callback();
                            }
                        }, function(err) {
                            console.log('error getting task id', err.data.message);
                        });
                }

                //fetch the task incase there are any new jobs, update jobs scope.statuses
                $rootScope.$on('job.status', function(event, data) {
                    function cb() {
                        scope.statuses[data._id] = data.status;
                        //if all the jobs are running, we're done here.
                        if (Object.keys(scope.statuses).every(function(el) {
                            return scope.statuses[el] === 'running';
                        })) {
                            scope.done = true;
                            $rootScope.$broadcast('job-status-done');
                        }
                    }
                    updateJobsList(parentTask, cb);
                });

                //set the parentTaskId, update the jobs list
                $rootScope.$on('task.status', function(event, data) {
                    if (!parentTask) {
                        //only set this once, there could be multiple ones flying around
                        parentTask = data._id;
                        updateJobsList(parentTask);
                    } else if (data._id === parentTask && data._status === 'error') {
                        $window.alert('parent task has errored');
                    }
                });


            }
         };
    }]);