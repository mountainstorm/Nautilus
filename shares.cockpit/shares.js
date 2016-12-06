var $ = require("jquery");
var cockpit = require("cockpit");

var Mustache = require("mustache");

cockpit.translate();
var _ = cockpit.gettext;
var C_ = cockpit.gettext;


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

        console.log('entering shares page')

        function parse_shares(content) {
            // e could try to parse and update the smb.conf/afp.conf
            // but that will be a right pain to do - so lets just use
            // a json file
            self.accounts = JSON.parse(content);
            self.update();
        }

        this.handle_shares =  cockpit.file('/etc/shares.cockpit.json');

        this.handle_shares.read()
           .done(parse_shares)
           .fail(log_unexpected_error);

        this.handle_shares.watch(parse_shares);
    },

    leave: function() {
        console.log('leaving shares page')
        if (this.handle_shares) {
            this.handle_shares.close();
            this.handle_shares = null;
        }
    },

    update: function() {
        var list = $("#shares-list");

        list.empty();
        for (var i = 0; i < this.shares.length; i++) {
            var img =
                $('<div/>', { 'class': "cockpit-share-pic pficon pficon-user" });
            var div =
                $('<div/>', { 'class': "cockpit-share" }).append(
                    img,
                    $('<div/>', { 'class': "cockpit-share-name" }).text(this.shares[i]["name"]),
                    $('<div/>', { 'class': "cockpit-share-type" }).text(this.shares[i]["type"]));
            div.on('click', $.proxy(this, "go", this.shares[i]["name"]));
            list.append(div);
        }
    },

    create: function () {
        console.log('create share')
        // PageShareCreate.shares = this.shares;
        // $('#share-create-dialog').modal('show');
    },

    go: function (user) {
        cockpit.location.go([ user ]);
    }
};

function PageAccounts() {
    this._init();
}


function log_unexpected_error(error) {
    console.warn("Unexpected error", error);
}

function init() {
    var overview_page;
    var share_page;

    cockpit.user().done(function (user) {
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

        // share_page = new PageAccount(user);
        // share_page.setup();

        // dialog_setup(new PageAccountsCreate());
        // dialog_setup(new PageAccountConfirmDelete());
        // dialog_setup(new PageAccountSetPassword(user));

        $(cockpit).on("locationchanged", navigate);
        navigate();
    });
}

$(init);
