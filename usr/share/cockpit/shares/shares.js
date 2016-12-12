// var $ = require("jquery");
// var cockpit = require("cockpit");

// var Mustache = require("mustache");

cockpit.translate();
var _ = cockpit.gettext;
var C_ = cockpit.gettext;


var CONFIG_FILE = "/etc/shares.cockpit.json";
var CONFG_SMB = "/etc/samba/smb.conf";
var CONFG_AFP = "/etc/netatalk/afp.conf";

var GUEST_USERS = "Guests Users";
var RESTART_TIMEOUT = 1000;


PageShares.prototype = {
    _init: function() {
        this.id = "shares";
    },

    getTitle: function() {
        return C_("page-title", "Shares");
    },

    show: function() {
    },

    setup: function() {
        $('#share-create').on('click', $.proxy (this, "create"));
    },

    enter: function() {
        var self = this;

        function parse_shares(content) {
            // we could try to parse and update the smb.conf/afp.conf
            // but that will be a right pain - so we will use a json file
            self.shares = content;
            if (self.shares) {
                self.update();
            }
        }

        this.handle_shares = cockpit.file(CONFIG_FILE, { syntax: JSON });

        this.handle_shares.read()
           .done(parse_shares)
           .fail(log_unexpected_error);

        this.handle_shares.watch(parse_shares);
    },

    leave: function() {
        if (this.handle_shares) {
            this.handle_shares.close();
            this.handle_shares = null;
        }
    },

    update: function() {
        var list = $("#share-list");

        list.empty();
        for (var i = 0; i < this.shares.length; i++) {
            var img = 
                $('<div/>', { 'class': "cockpit-share-pic pficon pficon-folder-close" });
            if (this.shares[i]["type"] == 'afp') {
                // if its afp give it the timemachine icon
                img = $('<div/>', { 'class': "cockpit-share-pic pficon pficon-history" });
            }
            var div =
                $('<div/>', { 'class': "cockpit-share" }).append(
                    img,
                    $('<div/>', { 'class': "cockpit-share-name" }).text(this.shares[i]["name"]),
                    $('<div/>', { 'class': "cockpit-share-info" }).text(this.shares[i]["path"]));
            div.on('click', $.proxy(this, "go", this.shares[i]["uuid"]));
            list.append(div);
        }
    },

    create: function () {
        var self = this;

        // add a new entry in the file and navigate
        var share_id = this.gen_uuid();
        this.handle_shares.read()
           .done(function(shares) {
                if (!shares) {
                    shares = [];
                }
                shares.push({
                    "uuid": share_id,
                    "name": "",
                    "path": "",
                    "type": "smb",
                    "guest": false, 
                    "accounts": []
                });
                self.handle_shares.replace(shares)
                    .done(function () {
                        cockpit.location.go([ share_id ]);
                    })
                    .fail(log_unexpected_error);
           })
           .fail(log_unexpected_error);
    },

    go: function (share) {
        cockpit.location.go([ share ]);
    },

    gen_uuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
};

function PageShares() {
    this._init();
}


PageShare.prototype = {
    _init: function() {
        this.id = "share";
    },

    getTitle: function() {
        return C_("page-title", "Shares");
    },

    show: function() {
    },

    setup: function() {
        $('#share .breadcrumb a').on("click", function() {
            cockpit.location.go('/');
        });

        $('#share-name').on('change', $.proxy (this, "change_share_name"));
        $('#share-name').on('keydown', $.proxy (this, "share_name_edited"));
        $('#share-path').on('change', $.proxy (this, "change_share_path"));
        $('#share-path').on('keydown', $.proxy (this, "share_path_edited"));
        $('#share-timemachine').on('change', $.proxy (this, "change_share_timemachine"));        
        $('body').on('change', '.share-username', $.proxy (this, "change_share_username"));
        $('#share-delete').on('click', $.proxy (this, "delete_share"));
    },

    enter: function(share_id) {
        var self = this;

        this.share_id = share_id;
        this.update_content = null;
        this.update_timer = null;
        $("#share-name").removeAttr("data-dirty");

        function parse_shares(shares) {
            // we could try to parse and update the smb.conf/afp.conf
            // but that will be a right pain - so we will use a json file
            self.share = null;
            if (shares) {
                for (var i = 0; i < shares.length; i++) {
                    if (shares[i]["uuid"] == self.share_id) {
                        self.share = shares[i];
                        break;
                    }
                }
                self.update();
            }
        }

        this.handle_shares = cockpit.file(CONFIG_FILE, { syntax: JSON });
        this.handle_shares.read()
           .done(parse_shares)
           .fail(log_unexpected_error);
        this.handle_shares.watch(parse_shares);

        this.handle_smb = cockpit.file(CONFG_SMB);
        this.handle_afp = cockpit.file(CONFG_AFP);

        this.handle_passwd = cockpit.file("/etc/passwd");
        this.handle_passwd.watch(function() {
            self.update_users();
        });
    },

    leave: function() {
        if (this.update_timer) {
            window.clearTimeout(this.update_timer);
        }
        if (this.update_content) {
            this.relaunch_config();
        }

        if (this.handle_passwd) {
            this.handle_passwd.close();
            this.handle_passwd = null;
        }        

        if (this.handle_shares) {
            this.handle_shares.close();
            this.handle_shares = null;
        }

        if (this.handle_smb) {
            this.handle_smb.close();
            this.handle_smb = null;
        }

        if (this.handle_afp) {
            this.handle_afp.close();
            this.handle_afp = null;
        }
    },

    config_changed: function(content) {
        var self = this;
        console.log("config_changed");

        // called when the content has changed - restart the times
        if (this.update_timer) {
            window.clearTimeout(this.update_timer);
        }
        this.update_content = content; // save for on exit
        // the x second window is to save redundant restarts and to 
        // attempt to stop an update in the middle of an existing one
        this.update_timer = window.setTimeout(function () {
            // if we havent done another change in x seconds - update setup
            self.relaunch_config();
        }, RESTART_TIMEOUT);
    },

    update: function() {
        if (this.share) {
            var title = this.share["name"];
            $('#share .breadcrumb .active').text(title);
            $("#share-title").text(title);
            $("#share-name").val(title);
            $("#share-path").val(this.share["path"]);
            if (this.share["type"] == "afp") {
                $("#share-timemachine").prop('checked', true);
            } else {
                $("#share-timemachine").prop('checked', false);
            }
            this.update_users();
        }
    },

    update_users: function () {
        var self = this;
        if (this.share) {
            // get list of smb users
            cockpit.spawn(["/bin/pdbedit", "-L"],
                          { "environ": ["LC_ALL=C"] })
               .done(function (data) {
                    var list = $("#share-users");
                    list.empty();
                    self.add_user(list, GUEST_USERS, self.share["guest"]);
                    
                    var smbusers = data.split('\n');
                    for (var i = 0; i < smbusers.length; i++) {
                        if (smbusers[i].length > 0) {
                            var creds = smbusers[i].split(":");
                            var username = creds[0];
                            if (creds[1].length <= 6) {
                                // long ids are deleted users
                                var checked = self.share["accounts"].indexOf(username) != -1;
                                self.add_user(list, username, checked);
                            }
                        }
                    }
               })
               .fail(log_unexpected_error);
        }
    },

    add_user: function(list, title, checked) {
        var name = $("<span/>");
        name.text(title);
        var user = $("<div/>", { "class": "checkbox", "data-container": "body" }).append(
            $("<label/>").append(
                $("<input>", {
                    "type": "checkbox",
                    "class": "share-username",
                    "data-username": title,
                    "checked": checked
                }),
                name
            )
        );
        list.append(user);
    },

    update_value: function(share, name, value, addlist) {
        var retval = false;
        if (addlist === true) {
            // add to list
            var i = share[name].indexOf(value);
            if (i == -1) {
                share[name].push(value);
                retval = true;
            }
        } else if (addlist === false) {
            // rmeove from list
            var j = share[name].indexOf(value);
            if (j != -1) {
                share[name].splice(j, 1);
                retval = true;
            }
        } else {
            // dont do update if the new value is empty as
            // that would be poinless
            if (share[name] != value && value !== "") {
                share[name] = value;
                retval = true;
            }
        }
        return retval;
    },

    update_item: function(name, item, value, addlist) {
        var self = this;

        item.attr("data-dirty", "true");
        this.handle_shares.read()
           .done(function (shares) {
                var changed = false;
                for (var i = 0; i < shares.length; i++) {
                    if (shares[i]["uuid"] == self.share_id) {
                        changed = self.update_value(shares[i], name, value, addlist);
                        break;
                    }
                }
                // update the document
                if (changed) {
                    self.handle_shares.replace(shares)
                        .done(function () {
                            self.config_changed(shares);
                            self.update_value(self.share, name, value, addlist);
                            self.update();
                            item.removeAttr("data-dirty");
                        })
                        .fail(log_unexpected_error);
                }
           })
           .fail(log_unexpected_error);        
    },

    share_name_edited: function() {
        $("#share-name").attr("data-dirty", "true");
    },

    change_share_name: function() {
        var item = $("#share-name");
        this.update_item("name", item, item.val(), null);
    },

    share_path_edited: function() {
        $("#share-path").attr("data-dirty", "true");
    },

    change_share_path: function() {
        var item = $("#share-path");
        this.update_item("path", item, item.val(), null);
    },

    change_share_timemachine: function() {
        var item = $("#share-timemachine");
        var value = 'smb';
        if (item.prop('checked')) {
            value = 'afp';
        }
        this.update_item("type", item, value, null);
    },

    change_share_username: function(ev) {
        var item = $(ev.target);
        if (item.data('username') == 'Guests Users') {
            this.update_item("guest", item, item.prop('checked'), null);
        } else {
            this.update_item("accounts", item, item.data('username'), item.prop('checked'));
        }
    },

    delete_share: function() {
        PageShareConfirmDelete.share_name = this.share["name"];
        PageShareConfirmDelete.share_uuid = this.share["uuid"];
        $('#share-confirm-delete-dialog').modal('show');
    },

    relaunch_config: function() {
        var self = this;
        var shares = this.update_content;
        this.update_content = null;

        var share_script = "";

        var smb_conf = "\
#\n\
# Autogenerated by cockpit/shares\n\
#\n\
\n\
[global]\n\
server string = Samba Server %v\n\
security = user\n\
map to guest = bad user\n\
dns proxy = no\n\
guest account = nobody\n\
load printers = no\n\
printing = bsd\n\
printcap name = /dev/null\n\
\n\
## Share Definitions ##########################################################\n";

        var afp_conf = "\
#\n\
# Autogenerated by cockpit/shares\n\
#\n\
\n\
[Global]\n\
uam list = uams_guest.so, uams_dhx2_passwd.so\n\
\n\
## Share Definitions ##########################################################\n";
        for (var i = 0; i < shares.length; i++) {
            var guest = "no";
            if (shares[i]["guest"]) {
                guest = "yes";
            }
            if (shares[i]["name"].length !== 0 &&
                shares[i]["path"].length !== 0) {
                share_script += "\
chmod 0777 " + shares[i]["path"] + "\n\
chcon -t samba_share_t " + shares[i]["path"] + "\n";
                if (shares[i]["type"] == "smb") {
                    smb_conf += "\n\
[" + shares[i]["name"] + "]\n\
path = " + shares[i]["path"] + "\n\
browsable = yes\n\
writable = yes\n\
guest ok = " + guest + "\n\
read only = no\n\
valid users = " + shares[i]["accounts"].join(" ") + "\n";
                } else {
                    afp_conf += "\n\
[" + shares[i]["name"] + "]\n\
path = " + shares[i]["path"] + "\n\
time machine = yes\n\
guest ok = " + guest + "\n\
valid users = " + shares[i]["accounts"].join(" ") + "\n";
                }
            }
        }
        cockpit.script(share_script);
        this.handle_smb.replace(smb_conf)
            .done(function () {
                console.log("restarting smb");
                cockpit.script("\
/usr/bin/systemctl restart smb.service\n\
/usr/bin/systemctl restart nmb.service\n")
                    .fail(log_unexpected_error);
            })
            .fail(log_unexpected_error);
        this.handle_afp.replace(afp_conf)
            .done(function () {
                console.log("restarting afp");
                cockpit.script("\
/usr/bin/systemctl restart netatalk\n")
                    .fail(log_unexpected_error);
            })
            .fail(log_unexpected_error);
    }
};

function PageShare(user) {
    this._init(user);
}



PageShareConfirmDelete.prototype = {
    _init: function() {
        this.id = "share-confirm-delete-dialog";
    },

    show: function() {
    },

    setup: function() {
        $('#share-confirm-delete-apply').on('click', $.proxy(this, "apply"));
    },

    enter: function() {
        $('#share-confirm-delete-shares').prop('checked', false);
        $('#share-confirm-delete-title').text(cockpit.format(_("Delete $0"), PageShareConfirmDelete.share_name));

        this.handle_shares =  cockpit.file(CONFIG_FILE, { syntax: JSON });        
    },

    leave: function() {
        if (this.handle_shares) {
            this.handle_shares.close();
            this.handle_shares = null;
        }
    },

    apply: function() {
        var self = this;

        this.handle_shares.read()
           .done(function (shares) {
                for (var i = 0; i < shares.length; i++) {
                    if (shares[i]["uuid"] == PageShareConfirmDelete.share_uuid) {
                        shares.splice(i, 1);
                        break;
                    }
                }
                // update the document
                self.handle_shares.replace(shares)
                    .done(function () {
                        $('#share-confirm-delete-dialog').modal('hide');
                       cockpit.location.go("/");
                    })
                    .fail(log_unexpected_error);
           })
           .fail(log_unexpected_error);
    }
};

function PageShareConfirmDelete() {
    this._init();
}



function log_unexpected_error(error) {
    console.warn("Unexpected error", error);
}

/* INITIALIZATION AND NAVIGATION
 *
 * The code above still uses the legacy 'Page' abstraction for both
 * pages and dialogs, and expects page.setup, page.enter, page.show,
 * and page.leave to be called at the right times.
 *
 * We cater to this with a little compatability shim consisting of
 * 'dialog_setup', 'page_show', and 'page_hide'.
 */

function show_error_dialog(title, message) {
    if (message) {
        $("#error-popup-title").text(title);
        $("#error-popup-message").text(message);
    } else {
        $("#error-popup-title").text(_("Error"));
        $("#error-popup-message").text(title);
    }

    $('.modal[role="dialog"]').modal('hide');
    $('#error-popup').modal('show');
}

function show_unexpected_error(error) {
    show_error_dialog(_("Unexpected error"), error.message || error);
}

function dialog_setup(d) {
    d.setup();
    $('#' + d.id).
        on('show.bs.modal', function () { d.enter(); }).
        on('shown.bs.modal', function () { d.show(); }).
        on('hidden.bs.modal', function () { d.leave(); });
}

function page_show(p, arg) {
    if (p._entered_)
        p.leave();
    p.enter(arg);
    p._entered_ = true;
    $('#' + p.id).show();
    p.show();
}

function page_hide(p) {
    $('#' + p.id).hide();
    if (p._entered_) {
        p.leave();
        p._entered_ = false;
    }
}

function init() {
    var overview_page;
    var share_page;

    cockpit.user().done(function (user) {
        function navigate() {
            var path = cockpit.location.path;

            // XXX: only allow navigation if root
            if (path.length === 0) {
                page_hide(share_page);
                page_show(overview_page);
            } else if (path.length === 1) {
                page_hide(overview_page);
                page_show(share_page, path[0]);
            } else { /* redirect */
                console.warn("not a shares location: " + path);
                cockpit.location = '';
            }

            $("body").show();
        }

        cockpit.translate();

        overview_page = new PageShares();
        overview_page.setup();

        share_page = new PageShare();
        share_page.setup();

        dialog_setup(new PageShareConfirmDelete());

        $(cockpit).on("locationchanged", navigate);
        navigate();
    });
}

$(init);
