/**
 * models/AuthProviders
 * 
 * Providers table/collection model
 * @description :: Used to return a list of authentication providers
 * @author      :: Matt McCarty
 */
module.exports = (function(configKey) {
    return {
        connection : sails.config.connections.map.AuthProviders,    // Database adapter settings to use
        tableName  : 'wm_auth_providers',                           // Database table/collection
        autoPK     : false,                                         // Manually generate Primary Keys to support DynamoDB

        attributes: {
            id              : { type: 'string',             required: true, primaryKey: true },
            name            : { type: 'alphanumericdashed', required: true  },
            protocol        : { type: 'alphanumeric',       required: true, enum: sails.config[configKey].protocols },
            provider        : { type: 'string',             required: true, enum: sails.config[configKey].providers },
            type            : { type: 'string',             required: true, enum: [ 'none', 'token', 'code'] },
            library         : { type: 'string',             required: false },
            version         : { type: 'string',             required: false },
            description     : { type: 'string',             required: true  },
            url             : { type: 'string',             required: true  },
            urlValidate     : { type: 'string',             required: true  },
            urlCallback     : { type: 'string',             required: true  },
            scope           : { type: 'array',              required: true  },
            fields          : { type: 'array',              required: true  },
            clientID        : { type: 'string',             required: true  },
            clientSecret    : { type: 'string',             required: true  },
            hosts           : { type: 'array',              required: true  },
            strategyPackage : { type: 'string',             required: true  },
            strategyObject  : { type: 'string',             required: true  },

            // Override .toJSON() instance method
            toJSON: function() {
                var obj = this.toObject();
                delete obj.clientSecret;
                delete obj.hosts;
                return obj;
           }
        },

        /**
         * `AuthProviders.beforeValidate()`
         * @description :: Magic function that performs tasks before a record is validated
         * @help        :: http://sailsjs.org/documentation/concepts/models-and-orm/lifecycle-callbacks
         * @author      :: Matt McCarty
         * @param       :: object   req  - Request object; false if session validation is not required
         * @param       :: string   host - Host that contains the list of providers
         * @param       :: callback cb   - Function to call after execution
         * @return      :: callback(err, results)
         */
        beforeValidate: function (values, cb) {
            var serviceName = sails.config[configKey].services.hosts,
                service     = sails.services[serviceName];

            service.validateHosts(values.hosts, function(hosts) {
                values.hosts = hosts;
                cb();
            });
        },
    };
});