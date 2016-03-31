{% if cluster.type == 'ec2' -%}
#$ -q all.q@master
{% endif -%}


# Set up cluster-specific variables
PARAVIEW_DIR={{paraviewInstallDir if paraviewInstallDir else "/opt/paraview/install"}}
PV_PYTHON="${PARAVIEW_DIR}/bin/pvpython"
LIB_VERSION_DIR=`ls ${PARAVIEW_DIR}/lib | grep paraview`
APPS_DIR="lib/${LIB_VERSION_DIR}/site-packages/paraview/web"
VISUALIZER="pvw-visualizer.py"
GET_PORT_PYTHON_CMD='import socket; s=socket.socket(); s.bind(("", 0)); print(s.getsockname()[1]); s.close()'
RC_PORT=`python -c "${GET_PORT_PYTHON_CMD}"`
echo ${RC_PORT} > /tmp/{{job._id}}.rc_port

# Need to adjust paths for Mac application install
case $PARAVIEW_DIR in
     *paraview.app) PV_PYTHON="${PARAVIEW_DIR}/Contents/bin/pvpython";;
esac

REVERSE="--reverse-connect-port ${RC_PORT}"

PROXIES="config/defaultProxies.json"
JOB_OUTPUT_DIR="{{ cluster.config.jobOutputDir if cluster.config.jobOutputDir else '$HOME'}}"

# Get the private ip of this host
IPADDRESS=`curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/local-ipv4`

if [ -z "$IPADDRESS" ]; then
IPADDRESS=`hostname`
fi

WEBSOCKET_PORT=`python -c "${GET_PORT_PYTHON_CMD}"`

# Create proxy entry
KEY="{{ sessionKey }}"
BODY='{"host": "'$IPADDRESS'", "port": '${WEBSOCKET_PORT}', "key": "'$KEY'"}'
curl --silent --show-error -o /dev/null -X POST -d "$BODY"  --header "Content-Type: application/json" {{ baseUrl }}/proxy

LD_LIBRARY_PATH=${PARAVIEW_DIR}/lib/${LIB_VERSION_DIR}
export LD_LIBRARY_PATH
DISPLAY=:0
export DISPLAY

# First run pvpython
${PV_PYTHON} ${VISUALIZER} --timeout 3600 --host $IPADDRESS --port ${WEBSOCKET_PORT} --data-dir {{dataDir}} {{ '--load-file %s' % fileName if fileName else '' }}

# Remove proxy entry
curl --silent --show-error -o /dev/null -X DELETE "{{ baseUrl }}/proxy/${KEY}"
