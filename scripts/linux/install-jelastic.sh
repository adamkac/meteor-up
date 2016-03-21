#!/bin/bash

# Remove the lock
set +e
sudo rm /var/lib/dpkg/lock > /dev/null
sudo rm /var/cache/apt/archives/lock > /dev/null  
sudo dpkg --configure -a
set -e

# Install Java
sudo apt-get update
sudo apt-get -y install openjdk-7-jdk > ~/java.log
curl -s ftp://ftp.jelastic.com/pub/cli/jelastic-cli-installer.sh | bash
~/jelastic/users/authentication/signin --login <%= login %> --password <%= password %> --platformUrl <%= platformUrl %>
