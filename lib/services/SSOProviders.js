/**
 * services/SSOProviders
 * 
 * Providers table/collection model
 * @description :: Used to return a list of authentication providers
 * @author      :: Matt McCarty
 */
module.exports = {

    /**
     * `SSOProviders.getProviders()`
     * @description :: Return all available auth providers in the database
     * @author      :: Matt McCarty
     * @param       :: object   req  - Request object; false if session validation is not required
     * @param       :: string   host - Host that contains the list of providers
     * @param       :: callback cb   - Function to call after execution
     * @return      :: callback(err, results)
     */
    getProviders: function(req, host, cb) {
        if (req && req.session && req.session.auth && req.session.auth.providers) {
            if (req.session.auth.providers.length > 0) {
                return cb(false, req.session.auth.providers);
            }
        }

        var search    = {},
            modelName = sails.config[configKey].models.providers,
            model     = sails.models[modelName];

        if (typeof host === 'string' && host.length > 0) {
            search = { hosts : { contains: host  } };
        }

        return model.find(search).sort('provider ASC').exec(function findCB(err, found) {
            found = found || [];

            if (err || found.length <= 0) {
                sails.log.error("Could not find providers for host: " + host);
                return cb(err, found);
            }

            if (found && found.clientSecret) {
                delete found.clientSecret;
            }

            if (req && req.session) {
                req.session.auth           = req.session.auth || {};
                req.session.auth.providers = found;
            }

            sails.log.silly("Returned a list of providers for host: " + host);
            return cb(false, found);
        });
    },

    /**
     * `SSOProviders.getProvider()`
     * @description :: Find a specific provider in the database
     * @author      :: Matt McCarty
     * @param       :: object   req      - Request object; false if session validation is not required
     * @param       :: string   host     - Host to search for
     * @param       :: string   provider - Provider to search for
     * @param       :: string   name     - Strategy name
     * @param       :: string   type     - Provider type to search for (none, token, code)
     * @param       :: callback cb       - Function to call after execution
     * @return      :: callback(err, found)
     */
    getProvider: function(req, host, provider, name, type, cb) {
        if (!host)      return cb("Hostname not specified for provider",      []);
        if (!provider)  return cb("Provider not specified",                   []);
        if (!name)      return cb("Strategy name not specified for provider", []);

        host     = host.toLowerCase();
        provider = provider.toLowerCase();
        name     = name.toLowerCase();

        if (req && req.session && req.session.auth && req.session.auth.providers) {
            if (req.session.auth.providers.length > 0) {
               for(var i = 0; i < req.session.auth.providers.length; i++) {
                    if (req.session.auth.providers[i] === provider) {
                        return cb(false, req.session.auth.providers);
                    }
                }
            }
        }

        var search = {
            hosts   : { contains: host },
            provider: provider,
            name    : name
        };

        if (type) search.type = type;

        var modelName = sails.config[configKey].models.providers,
            model     = sails.models[modelName];

        return model.findOne().where(search).exec(function findCB(err, found) {
            if (err || !found) {
                sails.log.error("Invalid provider: " + provider + " for " + host);
                return cb(err, found);
            }

            sails.log.silly("Returned provider details for: " + provider + " in " + host);
            return cb(false, found);
        });
    },

    /**
     * `SSOProviders.addProvider()`
     * @description :: Add a provider to the database
     * @author      :: Matt McCarty
     * @param       :: string   data - Data to add to the provider record
     * @param       :: callback cb   - Function to call after execution
     * @return      :: callback(err, success)
     */
     addProvider: function(data, cb) {
        var ObjectID  = require('mongodb').ObjectID,
            objectId  = new ObjectID(),
            _self     = this,
            modelName = sails.config[configKey].models.providers,
            model     = sails.models[modelName];

        data.id = objectId.toString();

        model.findOrCreate(
            { provider: data.provider, type: data.type }, // Find
            data                                          // Create with data object
        ).exec(function createCB(err, data) {
            if (!err) {
                sails.log.silly("Inserted a new provider");
                _self.clearCache();
                return cb(false, true);
            } else {
                sails.log.error(err);
                return cb(err, false);
            }
        });
     },

    /**
     * `SSOProviders.saveCache()`
     * @description :: Save all providers to session cache
     * @author      :: Matt McCarty
     * @param       :: object req - Request object
     * @return      :: void
     */
    saveCache: function(req) {
        if (!req || !req.session) {
            return;
        }

        if (!req.session.auth || !req.session.auth.providers) {
            var modelName = sails.config[configKey].models.providers,
                model     = sails.models[modelName];

            model.getProviders(req, function(err, found) {
                // Do nothing. The get method adds everything to session automatically
            });
        }
    },

    /**
     * `SSOProviders.clearCache()`
     * @description :: Clear providers from session cache
     * @author      :: Matt McCarty
     * @param       :: object req - Request object
     * @return      :: void
     */
    clearCache: function(req) {
        if (!req || !req.session || !req.session.auth || !req.session.auth.providers) {
            return;
        }

        delete req.session.auth.providers;
    }
};
