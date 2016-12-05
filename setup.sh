#!/bin/sh
# coding: utf-8


BACKUP_PWD=$1


# Install cockpit
echo "Installing Cockpit"
echo "## Installing Cockpit ##########################################################" >> install.log
yum -y install cockpit >> install.log

# move it to port 443
mkdir -p /etc/systemd/system/cockpit.socket.d/
cat > /etc/systemd/system/cockpit.socket.d/listen.conf <<EOF
[Socket]
ListenStream=
ListenStream=443
EOF
semanage port -m -t websm_port_t -p tcp 443

# start cockpit
systemctl daemon-reload
systemctl enable cockpit.socket >> install.log
systemctl start cockpit.socket



# Install SMB
echo "Installing SMB"
echo "## Installing SMB ##############################################################" >> install.log

# reference: http://lintut.com/easy-samba-installation-on-rhel-centos-7/
yum -y install samba samba-client samba-common >> install.log

mkdir -p /etc/samba/
cp smb.conf /etc/samba/smb.conf

# start SMB
systemctl enable smb.service >> install.log
systemctl enable nmb.service >> install.log
systemctl start smb.service
systemctl start nmb.service



# Install netatalk (AFP)
echo "Installing AFP"
echo "## Installing AFP ##############################################################" >> install.log

# reference: http://netatalk.sourceforge.net/wiki/index.php/Netatalk_3.1.10_SRPM_for_Fedora_and_CentOS
yum -y install perl >> install.log
yum -y install netatalk-* >> install.log

mkdir -p /etc/netatalk/
cp afp.conf /etc/netatalk/afp.conf

# start netatalk (AFP)
systemctl enable netatalk >> install.log
systemctl start netatalk



# Install avahi
echo "Installing Avahi"
echo "## Installing Avahi ############################################################" >> install.log

yum -y install avahi >> install.log

cp smb.service /etc/avahi/services/smb.service
cp afpd.service /etc/avahi/services/afpd.service

# start avahi
systemctl enable avahi-daemon.service >> install.log
systemctl start avahi-daemon



# Setup users
echo "Adding Backup User"
echo "## Adding Backup User ##########################################################" >> install.log

# Create backup user
useradd backup
groupadd backup
smbpasswd -a backup -n
# set the password, this will sync the smb password
echo $BACKUP_PWD | passwd backup --stdin
