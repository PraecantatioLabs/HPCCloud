import React                   from 'react';
import ButtonBar               from '../../../../../../panels/ButtonBar';
import defaultServerParameters from '../../../../../../panels/run/defaults';
import RunClusterFrom          from '../../../../../../panels/run';
import ClusterPayloads         from '../../../../../../utils/ClusterPayload';

import merge            from 'mout/src/object/merge';
import getNetworkError  from '../../../../../../utils/getNetworkError';

import { connect } from 'react-redux';
import { dispatch } from '../../../../../../redux';
import * as Actions    from '../../../../../../redux/actions/taskflows';
import { patchSimulation } from '../../../../../../redux/actions/projects';
import * as NetActions from '../../../../../../redux/actions/network';

const SimulationStart = React.createClass({

  displayName: 'openfoam/common/steps/Simulation/Start',

  propTypes: {
    location: React.PropTypes.object,
    project: React.PropTypes.object,
    simulation: React.PropTypes.object,
    step: React.PropTypes.string,
    taskFlowName: React.PropTypes.string,
    primaryJob: React.PropTypes.string,
    view: React.PropTypes.string,
    error: React.PropTypes.string,
    clusters: React.PropTypes.object,
    onRun: React.PropTypes.func,
    onError: React.PropTypes.func,
    patchSimulation: React.PropTypes.func,
  },

  getInitialState() {
    return {
      serverType: 'Traditional',
      EC2: defaultServerParameters.EC2,
      Traditional: defaultServerParameters.Traditional,
      OpenStack: defaultServerParameters.OpenStack,
      backend: {},
    };
  },

  dataChange(key, value, which) {
    var profile = this.state[which];
    profile[key] = value;
    this.setState({ [which]: profile });
  },

  runSimulation() {
    var sessionId = btoa(new Float64Array(3).map(Math.random)).substring(0, 96),
      payload = {
        input: {
          folder: {
            id: this.props.simulation.metadata.inputFolder._id,
          },
          shFile: {
            id: this.props.simulation.metadata.inputFolder.files.sh,
          },
        },
        output: {
          folder: {
            id: this.props.simulation.metadata.outputFolder._id,
          },
        },
      };

    if (this.state.serverType === 'Traditional') {
      payload = Object.assign(payload, this.state.Traditional.runtime || {});
      try {
        payload.cluster = ClusterPayloads.tradClusterPayload(this.state.Traditional.profile);
      } catch (error) {
        this.props.onError(error.message);
        return;
      }
    } else if (this.state.serverType === 'EC2') {
      payload = Object.assign(payload, this.state.EC2.runtime || {});
      if (!this.state.EC2.cluster) {
        try {
          payload.cluster = ClusterPayloads.ec2ClusterPayload(
            this.state.EC2.name,
            this.state.EC2.machine,
            this.state.EC2.clusterSize,
            this.state.EC2.profile
          );
        } catch (error) {
          this.props.onError(error.message);
          return;
        }
      } else {
        payload.cluster = { _id: this.state.EC2.cluster };
      }
    } else {
      console.log('unrecognized serverType:', this.state.serverType);
      return;
    }
    this.props.onRun(
      this.props.taskFlowName,
      this.props.primaryJob,
      payload,
      { // simulationStep
        id: this.props.simulation._id,
        name: this.props.simulation.name,
        step: 'Simulation',
        data: {
          view: 'run',
          metadata: {
            sessionId,
          },
        },
      },
      { // new location
        pathname: this.props.location.pathname,
        query: merge(this.props.location.query, {
          view: 'run',
        }),
        state: this.props.location.state,
      });
  },

  formAction(action) {
    this[action]();
  },

  updateServerType(e) {
    this.setState({ serverType: e.target.value });
  },

  clusterFilter(cluster) {
    return 'config' in cluster && 'openfoam' in cluster.config &&
      (cluster.config.openfoam && cluster.config.openfoam.enable);
  },

  render() {
    const actions = [{ name: 'runSimulation', label: 'Run Simulation', icon: '' }];
    const serverProfiles = { EC2: this.state.EC2, Traditional: this.state.Traditional };

    return (
      <div>
          <RunClusterFrom serverType={this.state.serverType} serverTypeChange={this.updateServerType}
            profiles={serverProfiles} dataChange={this.dataChange} clusterFilter={this.clusterFilter}
          />
          <ButtonBar
            visible={this.state[this.state.serverType].profile !== ''}
            onAction={this.formAction}
            actions={actions}
            error={ this.props.error }
          />
      </div>);
  },
});

// Binding --------------------------------------------------------------------
/* eslint-disable arrow-body-style */

export default connect(
  state => {
    return {
      error: getNetworkError(state, ['create_taskflow', 'start_taskflow']),
      clusters: state.preferences.clusters.mapById,
    };
  },
  () => {
    return {
      onRun: (taskflowName, primaryJob, payload, simulationStep, location) =>
        dispatch(Actions.createTaskflow(taskflowName, primaryJob, payload, simulationStep, location)),
      onError: (message) => dispatch(NetActions.errorNetworkCall('create_taskflow', { data: { message } }, 'form')),
      patchSimulation: (newSim) => dispatch(patchSimulation(newSim)),
    };
  }
)(SimulationStart);
