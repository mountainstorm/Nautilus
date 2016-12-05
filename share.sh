#!/bin/sh
# coding: utf-8

#
# The plan is to make this a cockpit plugin with config from that
# You'd only be able to share dirs under /mnt/
#
# The thing I can't figure out is how to do the user account stuff
#
# My thinking is to change /sbin/useradd to a script which calls
# the native version, then calls 'smbpasswd -a <user> -n'
# 
# You need some nasty UI to add users to shares though
#


# Setup SMB
echo "Configuring SMB"
echo "## Configuring SMB #############################################################" >> install.log

cp smb.conf /etc/samba/smb.conf
cat >> /etc/samba/smb.conf <<EOF
## Share Definitions ##########################################################
[Media]
path = /mnt/media/
browsable = yes
writable = yes
guest ok = yes
read only = no

[Windows Backup]
path = /mnt/winbackup/
valid users = backup
browsable = yes
writable = yes
guest ok = no
read only = no
EOF

# anyone can rw
chmod -R 0777 /mnt/media/
chown -R nobody:nobody /mnt/media/
chcon -t samba_share_t /mnt/media/

# anyone can rw; use smb to restrict access
chmod -R 0777 /mnt/winbackup/
chown -R backup:backup /mnt/winbackup/
chcon -t samba_share_t /mnt/winbackup/

# restart services
systemctl restart smb.service
systemctl restart nmb.service



# Setup AFP
echo "Configuring AFP"
echo "## Configuring AFP #############################################################" >> install.log

cp afp.conf /etc/netatalk/afp.conf
cat >> /etc/netatalk/afp.conf <<EOF
## Share Definitions ##########################################################
[Time Machine]
path = /mnt/timemachine/
time machine = yes
valid users = backup
EOF

chmod -R 0777 /mnt/timemachine/
chown -R backup:backup /mnt/timemachine/
chcon -t samba_share_t /mnt/timemachine/

systemctl restart netatalk
