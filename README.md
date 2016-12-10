Nautilus
========

A simple setup script and associated components to convert a minimal Centos 7 install into a fully fledged Nautilus NAS.

Install
-------

1. Download the Centos minimal ISO
2. Install - make sure you setup your ethernet adapter/IP address
3. ./install <nautilus ip>

Setup
-----

1. Log into Cockpit
2. Setup IP address/DNS name
3. Create RAID attay in storage plugin
4. Create partitions and format them
5. Mount them under /mnt/
6. Create shares and share the mount points

TODO
----

* brand Cockpit /etc/os-release (bad way)
* Move Accounts to menu (from tools)
* Move Containers
* Move Services
* Move Logs
* cron diff post update


Dev Instructions
----------------

### Setup pasword-less ssh ###

1. ssh_keygen (accept all the defaults)
2. cat ~/.ssh/id_rsa.pub | ssh root@192.168.0.101 'mkdir ~/.ssh; cat >> ~/.ssh/authorized_keys'

### rsync local file to server ###

1. Install 'rsync-ssh' plugin
2. open the Nautilus sublime-project


### Creating/Applying diffs ###

1. diff -u <original file location> <new file> > <diff>
2. patch <original file location> < <diff>
