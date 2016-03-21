#!/bin/bash

# utilities
gyp_rebuild_inside_node_modules () {
  for npmModule in ./*; do
    cd $npmModule

    isBinaryModule="no"
    # recursively rebuild npm modules inside node_modules
    check_for_binary_modules () {
      if [ -f binding.gyp ]; then
        isBinaryModule="yes"
      fi

      if [ $isBinaryModule != "yes" ]; then
        if [ -d ./node_modules ]; then
          cd ./node_modules
          for module in ./*; do
            cd $module
            check_for_binary_modules
            cd ..
          done
          cd ../
        fi
      fi
    }

    check_for_binary_modules

    if [ $isBinaryModule = "yes" ]; then
      echo " > $npmModule: npm install due to binary npm modules"
      rm -rf node_modules
      if [ -f binding.gyp ]; then
        npm install
        node-gyp rebuild || :
      else
        npm install
      fi
    fi

    cd ..
  done
}

rebuild_binary_npm_modules () {
  for package in ./*; do
    if [ -d $package/node_modules ]; then
      cd $package/node_modules
        gyp_rebuild_inside_node_modules
      cd ../../
    elif [ -d $package/main/node_module ]; then
      cd $package/node_modules
        gyp_rebuild_inside_node_modules
      cd ../../../
    fi
  done
}

revert_app (){
  if [[ -d old_app ]]; then
    rm -rf app
    mv old_app app
    stop <%= appName %> || :
    start <%= appName %> || :

    echo "Latest deployment failed! Reverted back to the previous version." 1>&2
    exit 1
  else
    echo "App did not pick up! Please check app logs." 1>&2
    exit 1
  fi
}


# logic
set -e

TMP_DIR=/opt/repo/<%= appName %>/tmp
BUNDLE_DIR=${TMP_DIR}/bundle

cd ${TMP_DIR}
rm -rf bundle
tar xvzf bundle.tar.gz > /dev/null

# rebuilding fibers
cd ${BUNDLE_DIR}/programs/server

if [ -d ./npm ]; then
  cd npm
  rebuild_binary_npm_modules
  cd ../
fi

if [ -d ./node_modules ]; then
  cd ./node_modules
  gyp_rebuild_inside_node_modules
  cd ../
fi

if [ -f package.json ]; then
  # support for 0.9
  npm install
else
  # support for older versions
  npm install fibers
  npm install bcrypt
fi

cd /opt/repo/<%= appName %>/

# remove old app, if it exists
if [ -d old_app ]; then
  rm -rf old_app
fi

## backup current version
if [[ -d app ]]; then
  mv app old_app
fi

cp /opt/repo/<%= appName %>/config/package.json /opt/repo/<%= appName %>/tmp/bundle/package.json
mv tmp/bundle app


cp /opt/repo/<%= appName %>/config/.env ~/.bashrc
source ~/.bashrc

echo "Killing app..."
/opt/repo/npm/node_modules/pm2/bin/pm2 stop all

echo "Starting app..."
/opt/repo/npm/node_modules/pm2/bin/pm2 start /opt/repo/ROOT/main.js --name "webapp"


#wait and check
# echo "Waiting for MongoDB to initialize. (5 minutes)"
# wait-for-mongo ${MONGO_URL} 300000

# restart app
# stop <%= appName %> || :
# start <%= appName %> || :

# echo "Waiting for <%= deployCheckWaitTime %> seconds while app is booting up"
# sleep <%= deployCheckWaitTime %>

# echo "Checking is app booted or not?"
# curl localhost:${PORT} || revert_app

# chown to support dumping heapdump and etc
# chown -R meteoruser app
