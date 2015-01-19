angular.module("kitware.cmb.core")
.controller('CmbSimulationProgressController', ['$scope', 'kw.Girder', '$state', '$stateParams', '$mdDialog', '$templateCache', '$window', '$http', '$timeout', function ($scope, $girder, $state, $stateParams, $mdDialog, $templateCache, $window, $http, $timeout) {
    var timoutId = 0;

    $scope.outputStats = "";
    $scope.jobId = null;

    function updateOutput() {
       if($scope.jobId) {
            var offset = $scope.outputStats.split('\n').length;

            // Get delta content
            // FIXME path should be given base on the Workflow
            $girder.getJobOutput(jobId, 'output/stat.txt', offset)
                .success(function(deltaContent) {
                    console.log(deltaContent);
                    $scope.outputStats += deltaContent;
                })
                .error(function(err){
                    console.log(err);
                });
        }
    }

    $scope.refresh = function () {
        updateOutput();
    };

    timeoutId = $interval(updateOutput, 30000);

    $scope.$on('$destroy', function() {
        $interval.cancel(timeoutId);
    });

    // Fetch current job id from task
    $girder.getTask($scope.simulation)
        .success(function(task){
            console.log(task);
            // FIXME extract job id
        })
        .error(function(err){
            console.log(err);
        });

    if($girder.getUser() === null) {
        $state.go('login');
    }
}]);
