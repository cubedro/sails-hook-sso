module.exports = {
    sso: {
        __configKey__: {
            name: "sso"
        },
        models: {
            hosts       : "AuthHosts",
            providers   : "AuthProviders",
            users       : "AuthUsers",
            passports   : "AuthPassports",
            groups      : "AuthGroups"
        },
        services: {
            hosts       : "SSOHosts",
            providers   : "SSOProviders",
            users       : "SSOUsers",
            passports   : "SSOPassports",
            groups      : "SSOGroups"
        },
        groups: {
            superuser: { id: 0, displayName: "Super User"    },
            admin    : { id: 1, displayName: "Administrator" },
            guest    : { id: 2, displayName: "Guest"         }
        },
        providers: [
            'google', 'facebook'
        ],
        protocols: [
            'bearer', 'local', 'oauth', 'oauth2', 'openid', 'cas'
        ],
        password: {
            hash: function(passport, cb) {
                if (passport.password && passport.password.length > 0) {
                    var bcrypt = require('bcryptjs');
                    return bcrypt.hash(passport.password, 10, function (err, hash) {
                        passport.password = hash;
                        return cb(err, hash);
                    });
                } else {
                    return cb(null, passport);
                }
            },
            validate: function(password, passport, cb) {
                var bcrypt = require('bcryptjs');
                bcrypt.compare(password, passport.password, function(err, success) {
                    return cb(err, ((success) ? passport : false));
                });
            }
        }
    }
};