#!/bin/sh
# coding: utf-8

BACKUP_PWD=$1

# Setup users
echo "Adding Backup User"
echo "## Adding Backup User ##########################################################" >> install.log

# Create backup user
useradd backup
groupadd backup
smbpasswd -a backup -n
# set the password, this will sync the smb password
echo $BACKUP_PWD | passwd backup --stdin



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
path = /mnt/windows-backup/
valid users = backup cooper
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
chmod -R 0777 /mnt/windows-backup/
chown -R backup:backup /mnt/windows-backup/
chcon -t samba_share_t /mnt/windows-backup/

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
