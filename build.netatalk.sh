#!/bin/sh
# coding: utf-8


NETATALK_URL=http://www003.upp.so-net.ne.jp/hat/files/netatalk-3.1.10-0.1.1.fc26.src.rpm


# reference: http://netatalk.sourceforge.net/wiki/index.php/Netatalk_3.1.10_SRPM_for_Fedora_and_CentOS
# install pre-reqs
CWD=$(pwd)
yum -y install rpm-build gcc make yum-utils >> ${CWD}/build.log

# download src rpm and extract it
pushd ./
cd ~/
curl -o netatalk.rpm $NETATALK_URL
rpm -ivh netatalk.rpm >> ${CWD}/build.log

# go into the specs and build the binary rpm
cd ~/rpmbuild/SPECS/
yum-builddep -y netatalk.spec >> ${CWD}/build.log
rpmbuild -bb netatalk.spec >> ${CWD}/build.log

# upload the binary rpm back to local server
popd
for FN in ~/rpmbuild/RPMS/x86_64/netatalk-[0-9]*
do
cp $FN ./
git add $(basename $FN)
done
git commit
