#/bin/sh

# Copyright (c) 2016 Mountainstorm
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# move/update/replace all the files
shopt -s globstar
for FN in etc/* etc/**/* usr/* usr/**/*; do
    if [ -d "${FN}" ]; then
        # dir, ensure it exists
        if [ ! -d "/${FN}" ] && [ ! -L "/${FN}" ]; then
            mkdir /${FN}
        fi
    else
        # file, if it ends in diff we patch it
        # if the target exists and is a native program
        # we rename the original to .orig
        # then copy the file into
        EXT=$(echo $FN | awk -F . '{if (NF>1) {print $NF}}')
        if [ "$EXT" == "diff" ]; then
            # patch original file
            FILENAME=$(echo $FN | sed 's/.diff$//')
            patch /${FILENAME} < ${FN}
        else
            TYPE=$(file /${FN})
            if [[ "$TYPE" == *"ELF"* ]]; then
                # rename and replace
                mv /${FN} /${FN}.orig
            fi
            # copy this file
            cp ${FN} /${FN}
        fi
    fi
done

# resstart all the services
systemctl enable redirect # can't enable until the files have copied
systemctl daemon-reload

systemctl restart cockpit.socket
systemctl restart smb.service
systemctl restart nmb.service
systemctl restart netatalk
systemctl restart avahi-daemon
systemctl restart yum-cron
systemctl restart redirect
