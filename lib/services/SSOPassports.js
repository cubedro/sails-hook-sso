/**
 * services/SSOPassports
 * 
 * Passport table/collection model
 * @description :: Host help functions
 * @author      :: Matt McCarty
 */

var PassportSSO         = require('passport-sso'),
    hostsModelName      = sails.config[configKey].models.hosts,
    providersModelName  = sails.config[configKey].models.providers,
    passportsModelName  = sails.config[configKey].models.passports,
    usersModelName      = sails.config[configKey].models.users,
    usersServiceName    = sails.config[configKey].services.users,
    modelHosts          = sails.models[hostsModelName],
    modelProviders      = sails.models[providersModelName],
    modelPassports      = sails.models[passportsModelName],
    modelUsers          = sails.models[usersModelName],
    serviceUsers        = sails.services[usersServiceName];

module.exports = {

    loadStrategies: function() {
        modelHosts.getHosts(null, function(err, hosts) {
            if (err || hosts.length <= 0) {
                return false;
            }

            modelProviders.getProviders(false, false, function(err, providers) {
                if (err || providers.length <= 0) {
                    return false;
                }

                PassportSSO.init(hosts, providers, {
                    authorize: AuthPassportService.bearer,
                    login    : AuthPassportService.login
                });
            });
        });
    },

    /**
     * `SSOPassports.getPassport()`
     * @description :: Get passport for a given provider and user identifier
     * @author      :: Matt McCarty
     * @param       :: object   search - Search Criteria
     * @param       :: callback cb     - Function to call after execution
     * @return      :: callback(err, found)
     */
    getPassport: function(search, cb) {
        var _self     = this,
            _pwd      = false;

        if (search.password) {
            _pwd = search.password;
            delete search.password;
        }

        modelPassports.findOne().where(search).exec(function createCB(err, passport) {
            if (!err && passport) {
                sails.log.silly("Found passport for " + passport.provider);
                if (!_pwd) {
                    return cb(false, passport);
                }

                return _self.validatePassword(_pwd, passport, cb);
            } else {
                if (!passport) {
                    err = true;
                }
                sails.log.error(err);
                return cb(err, false);
            }
        });
    },

    /**
     * `SSOPassports.addPassport()`
     * @description :: Create a new authentication passport
     * @author      :: Matt McCarty
     * @param       :: object   data - Passport model data
     * @param       :: callback cb   - Function to call after execution
     * @return      :: callback(err, found)
     */
     addPassport: function(data, cb) {
        Object.keys(data).forEach(function(key) {
            if (!data[key] || data[key] === null) {
                delete data[key];
            }
        });

        var _self               = this,
            _validatePassword   = sails.config[configKey].password.validate;

        serviceUsers.addUser(data.user, function(err, user) {
            if (err) {
                return cb(err, false);
            }

            var search = {};
            if (data.provider)    search.provider   = data.provider;
            if (data.identifier)  search.identifier = data.identifier;

            if (data.provider === 'local') {
                if (search.identifier) delete search.identifier;
                search.email = data.email;
            }

            data.id    = data.id || '';
            data.user  = user;

            modelPassports.findOrCreate(
                search, // Find
                data    // Create with data object
            ).exec(function createCB(err, passport) {
                if (!err) {
                    if (passport.provider === 'local') {
                        return _validatePassword(data.password, passport, cb);
                    }

                    sails.log.silly("Added or updated a passport for: " + data.provider);
                    if (data.accessToken === passport.accessToken) {
                        return cb(false, passport);
                    }

                    return modelPassports.update({ id: passport.id }, { accessToken: data.accessToken }).exec(cb);
                }
                
                sails.log.error(err);
                return cb(err, false);
            });
        });
     },

    bearer: function(token, done) {
        modelPassports.findOne({ accessToken: token }, function(err, passport) {
            if (err)       { return done(err); }
            if (!passport) { return done(null, false); }
            modelUsers.findOneById(passport.user, function(err, user) {
                if (err)   { return done(err); }
                if (!user) { return done(null, false); }
                return done(null, user, { scope: 'all' });
            });
        });
    },

    /**
     * `SSOPassports.redirect()`
     * @description :: Redirect the user to the provider's login page
     * @author      :: Matt McCarty
     * @param       :: object   req - Request object from controller
     * @param       :: object   res - Response object from controller
     * @return      :: void
     */
    redirect: function(req, res) {
        var hostName = req.hostName          || '',
            provider = req.param('provider') || false,
            strategy = req.param('strategy') || false,
            redirect = req.param('redirect') || false;

        if (!provider || !strategy) {
            return res.badRequest("Provider or strategy is invalid");
        }

        modelProviders.getProvider(
            req, hostName, provider, strategy, false,
        function(err, provider) {
            if (err || !provider) {
                return res.serverError(err);
            }

            if (req.session && redirect) {
                req.session.lastUri = redirect;
            }

            if (provider.provider === 'local') {
                var root = (sails.config.environment !== 'development') ? '' : '/test';
                return res.redirect(root + '/user/login');
            }

            PassportSSO.authenticate(strategy, req, res, req.next);
        });
    },

    /**
     * `SSOPassports.register()`
     * @description :: Create (register) a new user using the local strategy
     * @author      :: Matt McCarty
     * @param       :: object   req - Request object from controller
     * @param       :: object   res - Response object from controller
     * @return      :: callback(err, passport)
     */
    register: function (req, res, cb) {
        var email    = req.param('email'),
            username = req.param('username'),
            password = req.param('password'),
            lang     = req.param('language', 'en'),
            crypto   = require('crypto');

        if (!email)    return cb(new Error('Error.Passport.Email.Missing'));
        if (!username) return cb(new Error('Error.Passport.Username.Missing'));
        if (!password) return cb(new Error('Error.Passport.Password.Missing'));

        AuthPassports.addPassport({
          provider    : 'local',
          protocol    : 'local',
          identifier  : username,
          email       : email,
          password    : password,
          language    : lang,
          user        : { username: username, email: email },
          accessToken : crypto.randomBytes(48).toString('base64')
        }, function (err, passport) {
            if ((err && err.code === 'E_VALIDATION') || passport === false) {
                return cb('Error.Passport.Password.Invalid');
            }

            return cb(null, passport);
        });

    },

    /**
     * `SSOPassports.login()`
     * @description :: Authenticate an existing user using the local strategy
     * @author      :: Matt McCarty
     * @param       :: object req        - Request object from controller
     * @param       :: string identifier - User ID (username)
     * @param       :: string password   - User's login password 
     * @param       :: object res        - Response object from controller
     * @return      :: callback(err, passport)
     */
    login: function (req, identifier, password, cb) {
        var validator   = require('validator'),
            isEmail     = validator.isEmail(identifier),
            searchField = (isEmail) ? 'email' : 'identifier',
            _self       = this;

        if (!identifier)  return cb(new Error('Error.Passport.Identifier.Missing'));
        if (!password)    return cb(new Error('Error.Passport.Password.Missing'));

        var search          = { provider: 'local', protocol: 'local', password: password };
        search[searchField] = identifier;

        modelPassports.getPassport(search, function(err, passport) {
            if (err) {
                return cb(err, false);
            }

            var redirect = false;
            if (req.session) {
                redirect = req.session.lastUri;
                _self.session(req, {
                    user: {
                        email    : passport.email,
                        username : passport.identifier,
                        hosts    : new Array(req.hostName)
                    },
                    passport: passport
                });
            }

            cb(false, passport, redirect);
        });
    },

    /**
     * `SSOPassports.connect()`
     * @description :: Connect a user to a new or existing authentication passport
     * @author      :: Matt McCarty
     * @param       :: object   req     - Request object from controller
     * @param       :: object   profile - Profile data from auth provider
     * @param       :: callback cb      - Callback to execute after results are returned
     * @return      :: callback(err, user)
     */
    connect: function(req, profile, cb) {
        var _self   = this,
            session = req.session,
            user    = {
                email   : profile.email,
                username: profile.username,
                hosts   : new Array(req.hostName)
            };

        if (session && session.auth && session.auth.user) {
            if (session.auth.user.email)    user.email    = session.auth.user.email;
            if (session.auth.user.username) user.username = session.auth.user.username;
        }

        profile.user = user;
        modelPassports.addPassport(profile, function(err, dbPassport) {
            if (err) {
                if (session && session.lastUri) {
                    delete session.lastUri
                }
                sails.log.error(err);
                return cb(err, false);
            }

            var redirect = false;
            if (session) {
                redirect = session.lastUri;
                _self.session(req, { user: user, passport: dbPassport });
            }

            cb(false, dbPassport, redirect);
        });
    },

    /**
     * `SSOPassports.verify()`
     * @description :: Verify that the accessToken sent by the user is authentic
     * @author      :: Matt McCarty
     * @param       :: object   req - Request object from controller
     * @param       :: object   res - Response object from controller
     * @param       :: callback cb  - Callback to execute after results are returned
     * @return      :: callback(err, user)
     */
    verify: function(req, res, cb) {
        var passport = require('passport'),
            hostName = req.hostName          || '',
            provider = req.param('provider') || '',
            strategy = req.param('strategy') || '',
            profile  = req.param('profile', {
                provider : provider,
                strategy : strategy,
                code     : req.param('code', '')
            });

        if (profile.code.length > 0) req.query.code = profile.code;

        modelProviders.getProvider(
            req, hostName, provider, strategy, false,
        function(err, provider) {
            if (err || !provider) {
                return cb(err);
            }

            if (req.wantsJSON && profile.code.length > 0) {

                var options = {
                    callbackURL         : 'postmessage',
                    autoResolveCallback : false
                };

                PassportSSO.callback(strategy, options, req, res, function(err, user) {
                  console.log(err);
                  console.log(user);
               });
                /*strategy = passport._strategy(strategy);

                if (!strategy) {
                    return res.badRequest('The strategy that was supplied is invalid');
                }

                strategy.userProfile(profile.accessToken, function(err, providerProfile) {
                    if (err || !providerProfile) {
                        return cb(err);
                    }

                    strategy._verify(req, profile.accessToken, false, providerProfile, cb);
                });*/
            } else {
                passport.authenticate(strategy, cb)(req, res, req.next);
            }

        });
    },

    session: function(req, data) {
        var session = req.session;
        if (session) {
            if (typeof data === 'object') {
                session.auth            = session.auth || {};
                session.auth.user       = data.user;
                session.auth.passports  = session.auth.passports || [];

                session.auth.passports.push(data.passport);

                if (session.lastUri) {
                    delete session.lastUri
                }
            }

            if (session.auth) {
                return session.auth;
            }
        }

        return false;
    },

    disconnect: function (req, res, next) {
        var session = req.session;
        if (session && session.auth && session.auth.user) {
            delete req.session.auth;
            if (req.session.lastUri) {
                delete req.session.lastUri;
            }
        }

        return true;
    }
};