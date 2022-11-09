/*
*  Frappe Active Users © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to license.txt
*/


frappe.provide('frappe._active_users');
frappe.provide('frappe.dom');


class ActiveUsers {
    constructor() {
        if (frappe.desk == null) {
            frappe.throw(__('Active Users plugin can not be used outside Desk.'));
            return;
        }
        this.started = true;
        this.is_online = frappe.is_online ? frappe.is_online() : false;
        this.on_online = null;
        this.on_offline = null;
        
        var me = this;
        $(window).on('online', function() {
            me.is_online = true;
            me.on_online && me.on_online.call(me);
            me.on_online = null;
        });
        $(window).on('offline', function() {
            me.is_online = false;
            me.on_offline && me.on_offline.call(me);
            me.on_offline = null;
        });
        
        this.settings = {};
        this.data = [];
        
        this.setup();
    }
    destroy() {
        this.clear_sync();
        if (this.$loading) this.$loading.hide();
        if (this.$reload) this.$reload.off('click').hide();
        if (this.$app) this.$app.remove();
        this.data = this._on_online = this._on_offline = this._syncing = null;
        this.$app = this.$body = this.$loading = this.$footer = this.$reload = null;
    }
    error(msg, args) {
        this.destroy();
        frappe.throw(__(msg, args));
    }
    request(method, callback, type) {
        var me = this;
        return new Promise(function(resolve, reject) {
            let data = {
                method: 'active_users.utils.api.' + method,
                'async': true,
                freeze: false,
                callback: function(res) {
                    if (res && $.isPlainObject(res)) res = res.message || res;
                    if (!$.isPlainObject(res)) {
                        me.error('Active Users plugin received invalid ' + type + '.');
                        reject();
                        return;
                    }
                    if (res.error) {
                        me.error(res.message);
                        reject();
                        return;
                    }
                    let val = callback && callback.call(me, res);
                    resolve(val || res);
                }
            };
            try {
                frappe.call(data);
            } catch(e) {
                (console.error || console.log)('[Active Users]', e);
                this.error('An error has occurred while sending a request.');
                reject();
            }
        });
    }
    setup() {
        if (!this.is_online) {
            this.on_online = this.setup;
            return;
        }
        var me = this;
        this.sync_settings()
        .then(function() {
            if (!me.settings.enabled) return;
            frappe.run_serially([
                function() { me.setup_display(); },
                function() { me.sync_reload(); },
            ]);
        });
    }
    sync_settings() {
        return this.request(
            'get_settings',
            function(res) {
                res.enabled = cint(res.enabled);
                res.refresh_interval = cint(res.refresh_interval) * 60000;
                res.allow_manual_refresh = cint(res.allow_manual_refresh);
                this.settings = res;
            },
            'settings'
        );
    }
    setup_display() {
        let title = __('Active Users');
        this.$app = $(`
            <li class="nav-item dropdown dropdown-notifications dropdown-mobile active-users-navbar-item" title="${title}">
                <a class="nav-link active-users-navbar-icon text-muted"
                    data-toggle="dropdown" aria-haspopup="true" aria-expanded="true" data-persist="true"
                    href="#" onclick="return false;">
                    <span class="fa fa-user fa-lg fa-fw"></span>
                </a>
                <div class="dropdown-menu active-users-list" role="menu">
                    <div class="fluid-container">
        		        <div class="row">
                            <div class="col active-users-list-header">${title}</div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col active-users-list-body">
                            <div class="active-users-list-loading">
                                <div class="active-users-list-loading-box"></div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col active-users-list-footer">
                            <div class="row">
                                <div class="col active-users-footer-text"></div>
                                <div class="col-auto active-users-footer-icon">
                                    <a href="#" class="active-users-footer-reload">
                                        <span class="fa fa-refresh fa-md fa-fw"></span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        `);
        $('header.navbar > .container > .navbar-collapse > ul.navbar-nav').prepend(this.$app.get(0));
        
        this.$body = this.$app.find('.active-users-list-body');
        this.$loading = this.$body.find('.active-users-list-loading').hide();
        this.$footer = this.$app.find('.active-users-footer-text');
        this.$reload = this.$app.find('.active-users-footer-reload');
        
        this.setup_manual_sync();
        
        if (frappe._active_users._ready) return;
        frappe._active_users._ready = true;
        frappe.dom.eval(`
(function(){window.$clamp=function(c,d){function s(a,b){n.getComputedStyle||(n.getComputedStyle=function(a,b){this.el=a;this.getPropertyValue=function(b){var c=/(\-([a-z]){1})/g;"float"==b&&(b="styleFloat");c.test(b)&&(b=b.replace(c,function(a,b,c){return c.toUpperCase()}));return a.currentStyle&&a.currentStyle[b]?a.currentStyle[b]:null};return this});return n.getComputedStyle(a,null).getPropertyValue(b)}function t(a){a=a||c.clientHeight;var b=u(c);return Math.max(Math.floor(a/b),0)}function x(a){return u(c)*
a}function u(a){var b=s(a,"line-height");"normal"==b&&(b=1.2*parseInt(s(a,"font-size")));return parseInt(b)}function l(a){if(a.lastChild.children&&0<a.lastChild.children.length)return l(Array.prototype.slice.call(a.children).pop());if(a.lastChild&&a.lastChild.nodeValue&&""!=a.lastChild.nodeValue&&a.lastChild.nodeValue!=b.truncationChar)return a.lastChild;a.lastChild.parentNode.removeChild(a.lastChild);return l(c)}function p(a,d){if(d){var e=a.nodeValue.replace(b.truncationChar,"");f||(h=0<k.length?
k.shift():"",f=e.split(h));1<f.length?(q=f.pop(),r(a,f.join(h))):f=null;m&&(a.nodeValue=a.nodeValue.replace(b.truncationChar,""),c.innerHTML=a.nodeValue+" "+m.innerHTML+b.truncationChar);if(f){if(c.clientHeight<=d)if(0<=k.length&&""!=h)r(a,f.join(h)+h+q),f=null;else return c.innerHTML}else""==h&&(r(a,""),a=l(c),k=b.splitOnChars.slice(0),h=k[0],q=f=null);if(b.animate)setTimeout(function(){p(a,d)},!0===b.animate?10:b.animate);else return p(a,d)}}function r(a,c){a.nodeValue=c+b.truncationChar}d=d||{};
var n=window,b={clamp:d.clamp||2,useNativeClamp:"undefined"!=typeof d.useNativeClamp?d.useNativeClamp:!0,splitOnChars:d.splitOnChars||[".","-","\u2013","\u2014"," "],animate:d.animate||!1,truncationChar:d.truncationChar||"\u2026",truncationHTML:d.truncationHTML},e=c.style,y=c.innerHTML,z="undefined"!=typeof c.style.webkitLineClamp,g=b.clamp,v=g.indexOf&&(-1<g.indexOf("px")||-1<g.indexOf("em")),m;b.truncationHTML&&(m=document.createElement("span"),m.innerHTML=b.truncationHTML);var k=b.splitOnChars.slice(0),
h=k[0],f,q;"auto"==g?g=t():v&&(g=t(parseInt(g)));var w;z&&b.useNativeClamp?(e.overflow="hidden",e.textOverflow="ellipsis",e.webkitBoxOrient="vertical",e.display="-webkit-box",e.webkitLineClamp=g,v&&(e.height=b.clamp+"px")):(e=x(g),e<=c.clientHeight&&(w=p(l(c),e)));return{original:y,clamped:w}}})();
        `);
    }
    setup_manual_sync() {
        if (!this.settings.allow_manual_refresh) {
            this.$reload.off('click').hide();
            return;
        }
        var me = this;
        this.$reload.on('click', function(e) {
            e.preventDefault();
            if (!me._syncing) me.sync_reload();
        }).show();
    }
    sync_reload() {
        if (!this.is_online) return;
        var me = this;
        this.clear_sync();
        frappe.run_serially([
            function() { me.sync_data(); },
            function() { me.setup_sync(); },
        ]);
    }
    clear_sync() {
        if (this.sync_timer) {
            window.clearInterval(this.sync_timer);
            this.sync_timer = null;
        }
    }
    sync_data() {
        this._syncing = true;
        if (this.data.length) {
            this.$footer.html('');
            this.$body.empty();
        }
        this.$loading.show();
        this.request(
            'get_users',
            function(res) {
                this.data = res.users && Array.isArray(res.users) ? res.users : [];
                this.$loading.hide();
                this.update_list();
                this._syncing = null;
            },
            'users list'
        );
    }
    setup_sync() {
        var me = this;
        this.sync_timer = window.setInterval(function() {
            me.sync_data();
        }, this.settings.refresh_interval);
    }
    update_settings() {
        if (!this.is_online) {
            this.on_online = this.update_settings;
            return;
        }
        var me = this;
        this.sync_settings()
        .then(function() {
            if (!me.settings.enabled) {
                me.destroy();
                return;
            }
            frappe.run_serially([
                function() { me.setup_manual_sync(); },
                function() { me.sync_reload(); },
            ]);
        });
    }
    update_list() {
        var me = this;
        this.data.forEach(function(v) {
            let avatar = frappe.get_avatar(null, v.full_name, v.user_image),
            name = v.full_name,
            item = $(`
                <div class="row active-users-list-item">
                    <div class="col-auto active-users-item-avatar">${avatar}</div>
                    <div class="col active-users-item-name">${name}</div>
                </div>
            `);
            me.$body.append(item.get(0));
            $clamp(item.find('.active-users-item-name').get(0), {clamp: 1});
        });
        this.$footer.html(__('Total') + ': ' + this.data.length);
    }
}

frappe._active_users.init = function() {
    if (frappe._active_users._init) frappe._active_users._init.destory();
    if (frappe.desk == null) return;
    frappe._active_users._init = new ActiveUsers();
};
        
$(document).ready(function() {
    frappe._active_users.init();
});