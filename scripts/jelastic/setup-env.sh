#!/bin/bash
mkdir -p /opt/repo/<%= appName %>/
mkdir -p /opt/repo/<%= appName %>/config
mkdir -p /opt/repo/<%= appName %>/tmp
mkdir -p /opt/repo/<%= appName %>/app
unlink  /opt/repo/ROOT
ln -s /opt/repo/<%= appName %>/app /opt/repo/ROOT 

if [ ! -d "/opt/repo/jelastic-nodejs0.10.42"]; then
  git clone https://github.com/adamkac/jelastic-node0.10.42.git /opt/repo/jelastic-nodejs0.10.42
fi
if [ ! -d "/opt/repo/npm/node_modules/pm2"]; then
  mkdir /opt/repo/npm
  mkdir /opt/repo/npm/node_modules/
  git clone https://github.com/adamkac/jelastic-pm2.git /opt/repo/npm/node_modules/pm2
fi
