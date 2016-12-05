Nautilus
========

A simple setup script and associated components to convert a minimal Centos 7 install into a fully fledged NAS.


Install
-------

1. Download the Centos minimal ISO
2. Install - make sure you setup your ethernet adapter/IP address
3. yum -y install git
4. git clone https://github.com/mountainstorm/Nautilus.git
5. cd Nautilus
6. sh setup.sh
7. Use cockpit (port 443) to setup the RAID array, partition and mount volumes
8. sh share.sh <backup-pwd>

The current config requires the following volumes mounted:
* /mnt/windows-backup
* /mnt/timemachine
* /mnt/media
