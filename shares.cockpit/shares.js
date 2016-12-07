// var $ = require("jquery");
// var cockpit = require("cockpit");

// var Mustache = require("mustache");

cockpit.translate();
var _ = cockpit.gettext;
var C_ = cockpit.gettext;


// XXX: some priv check on the user; disable rename/delete etc


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
            self.shares = JSON.parse(content);
            self.update();
        }

        this.handle_shares =  cockpit.file('/etc/shares.cockpit.json');

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
            var div =
                $('<div/>', { 'class': "cockpit-share" }).append(
                    img,
                    $('<div/>', { 'class': "cockpit-share-name" }).text(this.shares[i]["name"]),
                    $('<div/>', { 'class': "cockpit-share-info" }).text(
                        this.shares[i]["type"] + ": " + this.shares[i]["path"]
                    ));
            div.on('click', $.proxy(this, "go", this.shares[i]["path"]));
            list.append(div);
        }
    },

    create: function () {
        // PageShareCreate.shares = this.shares;
        // $('#share-create-dialog').modal('show');
    },

    go: function (share) {
        cockpit.location.go([ share ]);
    }
};

function PageShares() {
    this._init();
}


PageShare.prototype = {
    _init: function(share) {
        //this.id = "share";
        // this.section_id = "shares";
        // this.roles = [];
        // this.role_template = $("#role-entry-tmpl").html();
        // Mustache.parse(this.role_template);

        // this.keys_template = $("#authorized-keys-tmpl").html();
        // Mustache.parse(this.keys_template);
        // this.authorized_keys = null;

        this.share = share;
    },

    getTitle: function() {
        return C_("page-title", "Shares");
    },

    show: function() {
        // var self = this;
        // $("#account").toggle(!!self.account_id);
        // $("#account-failure").toggle(!self.account_id);
    },

    setup: function() {
        $('#share .breadcrumb a').on("click", function() {
            cockpit.location.go('/');
        });

        $('#share-name').on('change', $.proxy (this, "change_share_name"));
        $('#share-name').on('keydown', $.proxy (this, "share_name_edited"));
        $('#share-delete').on('click', $.proxy (this, "delete_share"));

        // XXX: add change notification for type and users
        // $('#account-locked').on('change', $.proxy (this, "change_locked", true, null));
        // $('#add-authorized-key').on('click', $.proxy (this, "add_key"));
        // $('#add-authorized-key-dialog').on('hidden.bs.modal', function () {
        //     $("#authorized-keys-text").val("");
        // });
    },

    // get_user: function() {
    //    var self = this;
    //    function parse_user(content) {
    //         var accounts = parse_passwd_content(content);

    //         for (var i = 0; i < accounts.length; i++) {
    //            if (accounts[i]["name"] !== self.account_id)
    //               continue;

    //            self.account = accounts[i];
    //            self.setup_keys(self.account.name, self.account.home);
    //            self.update();
    //         }
    //     }

    //     this.handle_passwd = cockpit.file('/etc/passwd');

    //     this.handle_passwd.read()
    //        .done(parse_user)
    //        .fail(log_unexpected_error);

    //     this.handle_passwd.watch(parse_user);
    // },

    enter: function(account_id) {
        //this.account_id = account_id;

        $("#share-name").removeAttr("data-dirty");

        //this.get_user();
    },

    leave: function() {
        if (this.handle_passwd) {
           this.handle_passwd.close();
           this.handle_passwd = null;
        }

        if (this.handle_groups) {
           this.handle_groups.close();
           this.handle_groups = null;
        }

        if (this.authorized_keys) {
           $(this.authorized_keys).off();
           this.authorized_keys.close();
           this.authorized_keys = null;
        }

        $('#account-failure').hide();
    },

    update: function() {

        // if (this.account) {
        //     $('#account').show();
        //     $('#account-failure').hide();
        //     var name = $("#account-real-name");

        //     var title_name = this.account["gecos"];
        //     if (!title_name)
        //         title_name = this.account["name"];

        //     $('#account-logout').attr('disabled', !this.logged);

        //     $("#account-title").text(title_name);
        //     if (!name.attr("data-dirty"))
        //         $('#account-real-name').val(this.account["gecos"]);

        //     $('#account-user-name').text(this.account["name"]);

        //     if (this.logged)
        //         $('#account-last-login').text(_("Logged In"));
        //     else if (! this.lastLogin)
        //         $('#account-last-login').text(_("Never"));
        //     else
        //         $('#account-last-login').text(this.lastLogin.toLocaleString());

        //     if (typeof this.locked != 'undefined' && this.account["uid"] !== 0) {
        //         $('#account-locked').prop('checked', this.locked);
        //         $('#account-locked').parents('tr').show();
        //     } else {
        //         $('#account-locked').parents('tr').hide();
        //     }

        //     if (this.authorized_keys) {
        //         var keys = this.authorized_keys.keys;
        //         var state = this.authorized_keys.state;
        //         var keys_html = Mustache.render(this.keys_template, {
        //             "keys": keys,
        //             "empty": keys.length === 0 && state == "ready",
        //             "denied": state == "access-denied",
        //             "failed": state == "failed",
        //         });
        //         $('#account-authorized-keys-list').html(keys_html);
        //         $(".account-remove-key")
        //             .on("click", $.proxy (this, "remove_key"));
        //         $('#account-authorized-keys').show();
        //     } else {
        //         $('#account-authorized-keys').hide();
        //     }

        //     if (this.account["uid"] !== 0) {
        //         var html = Mustache.render(this.role_template,
        //                                    { "roles": this.roles});
        //         $('#account-change-roles-roles').html(html);
        //         $('#account-roles').parents('tr').show();
        //         $("#account-change-roles-roles :input")
        //             .on("change", $.proxy (this, "change_role"));
        //     } else {
        //         $('#account-roles').parents('tr').hide();
        //     }
        //     $('#account .breadcrumb .active').text(title_name);

        //     // check accounts-self-privileged whether account is the same as currently logged in user
        //     $(".accounts-self-privileged").
        //         toggleClass("accounts-current-account",
        //                     this.user.id == this.account["uid"]);

        // } else {
        //     $('#account').hide();
        //     $('#account-failure').show();
        //     $('#account-real-name').val("");
        //     $('#account-user-name').text("");
        //     $('#account-last-login').text("");
        //     $('#account-locked').prop('checked', false);
        //     $('#account-roles').text("");
        //     $('#account .breadcrumb .active').text("?");
        // }
        // update_accounts_privileged();
    },

    share_name_edited: function() {
        $("#share-name").attr("data-dirty", "true");
    },

    change_share_name: function() {
        var self = this;

        var name = $("#share-name");
        name.attr("data-dirty", "true");

        // TODO: unwanted chars check
        var value = name.val();

        // XXX: update JSON file and restart service
        // cockpit.spawn(["/usr/sbin/usermod", self.account["name"], "--comment", value],
        //               { "superuser": "try", err: "message"})
        //    .done(function(data) {
        //        self.account["gecos"] = value;
        //        self.update();
        //        name.removeAttr("data-dirty");
        //    })
        //    .fail(show_unexpected_error);
    },

    delete_share: function() {
        //PageAccountConfirmDelete.user_name = this.account["name"];
        //$('#account-confirm-delete-dialog').modal('show');
    },    
};

function PageShare(user) {
    this._init(user);
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

    cockpit.share().done(function (share) {
        function navigate() {
            var path = cockpit.location.path;

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

        share_page = new PageShare(share);
        share_page.setup();

        // dialog_setup(new PageAccountsCreate());
        // dialog_setup(new PageAccountConfirmDelete());
        // dialog_setup(new PageAccountSetPassword(user));

        $(cockpit).on("locationchanged", navigate);
        navigate();
    });
}

$(init);
