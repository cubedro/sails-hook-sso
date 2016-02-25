/**
 * services/SSOHosts
 * 
 * Providers table/collection model
 * @description :: Host help functions
 * @author      :: Matt McCarty
 */
module.exports = {

    /**
     * `SSOHosts.validateHosts()`
     * @description :: Compare host names in an array with the available hosts in the DB
     * @author      :: Matt McCarty
     * @param       :: string   hosts - A single host to compare to host entires in the DB
     * @param       :: array    hosts - List of hosts to compare to the host entires in the DB
     * @param       :: callback cb    - A callback to execute once the operation is performed
     * @return      :: callback(string|array)
     */
    validateHosts: function(hosts, cb) {
        if (typeof hosts === 'string') {
            hosts = new Array(hosts);
        }

        var modelName = sails.config[configKey].models.hosts,
            model     = sails.models[modelName];

        model.getHosts(false, function findCB(err, found) {
            if (err || !found) {
                return cb([]);
            }

            var ret = [];
            for(var i = 0; i < found.length; i++) {
                var dbHostName = found[i].hostName.toLowerCase();
                if (hosts.indexOf(dbHostName) >= 0) {
                    ret.push(dbHostName);
                }
            }

            cb(ret);
        });
    }

    /**
     * `SSOHosts.getHosts()`
     * @description :: Return all available hosts in the database
     * @author      :: Matt McCarty
     * @param       :: object   req - Request object; false if session validation is not required
     * @param       :: callback cb  - Function to call after execution
     * @return      :: callback(err, results)
     */
    getHosts: function(req, cb) {
        if (req && req.session && req.session.auth && req.session.auth.hosts) {
            if (req.session.auth.hosts.length > 0) {
                return cb(false, req.session.auth.hosts);
            }
        }

        var modelName = sails.config[configKey].models.hosts,
            model     = sails.models[modelName],
            env       = sails.config.environment;

        return model.find(
            {}
        ).where(
            { environment: { contains: env } }
        ).exec(function findCB(err, found) {
            found = found || [];

            if (err || found.length <= 0) {
                return cb(err, found);
            }

            if (req && req.session) {
                req.session.auth       = req.session.auth || {};
                req.session.auth.hosts = found;
            }

            return cb(false, found);
        });
    },

    /**
     * `SSOHosts.getHost()`
     * @description :: Find a specific host in the database
     * @author      :: Matt McCarty
     * @param       :: object   req  - Request object; false if session validation is not required
     * @param       :: string   host - Host to search for
     * @param       :: callback cb   - Function to call after execution
     * @return      :: callback(err, found)
     */
    getHost: function(req, host, cb) {
        host = host.toLowerCase();

        if (req && req.session && req.session.auth && req.session.auth.hosts) {
            if (req.session.auth.hosts.length > 0) {
               for(var i = 0; i < req.session.auth.hosts.length; i++) {
                    if (req.session.auth.hosts[i].hostName === host) {
                        return cb(false, req.session.auth.hosts);
                    }
                }
            }
        }

        var modelName = sails.config[configKey].models.hosts,
            model     = sails.models[modelName],
            env       = sails.config.environment;

        return model.find(
            { hostName: host }
        ).where(
            { environment: { contains: env } }
        ).exec(function findCB(err, found) {
            found = found || false;

            if (err || !found) {
                return cb(err, found);
            }

            return cb(false, found[0]);
        });
    },

    /**
     * `SSOHosts.addHost()`
     * @description :: Add a host to the database
     * @author      :: Matt McCarty
     * @param       :: string   data - Data to add to the host record
     * @param       :: callback cb   - Function to call after execution
     * @return      :: callback(err, success)
     */
     addHost: function(data, cb) {
        var ObjectID  = require('mongodb').ObjectID,
            objectId  = new ObjectID(),
            _self     = this,
            modelName = sails.config[configKey].models.hosts,
            model     = sails.models[modelName];

        model.findOrCreate(
            { id : objectId.toString(), hostName: data.hostName.toLowerCase() }, // Find
            data                                                                 // Create with data object
        ).exec(function createCB(err, data) {
            if (!err) {
                sails.log.silly("Inserted a new host: " + data.hostName);
                _self.clearCache();
                return cb(false, true);
            } else {
                sails.log.error(err);
                return cb(err, false);
            }
        });
     },

    /**
     * `SSOHosts.saveCache()`
     * @description :: Save all hosts to session cache
     * @author      :: Matt McCarty
     * @param       :: object req - Request object
     * @return      :: void
     */
    saveCache: function(req) {
        if (!req || !req.session) {
            return;
        }

        if (!req.session.auth || !req.session.auth.hosts) {
            var modelName = sails.config[configKey].models.hosts,
                model     = sails.models[modelName];

            model.getHosts(req, function(err, found) {
                // Do nothing. The get method adds everything to session automatically
            });
        }
    },

    /**
     * `SSOHosts.clearCache()`
     * @description :: Clear hosts from session cache
     * @author      :: Matt McCarty
     * @param       :: object req - Request object
     * @return      :: void
     */
    clearCache: function(req) {
        if (!req || !req.session || !req.session.auth || !req.session.auth.hosts) {
            return;
        }

        delete req.session.auth.hosts;
    }
};
