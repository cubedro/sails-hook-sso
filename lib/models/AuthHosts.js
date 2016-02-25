/**
 * models/AuthHosts 
 * 
 * Hosts table/collection model
 * @description :: Used to determine if a specific host is whitelisted for the API.
 * @author      :: Matt McCarty
 */
module.exports = (function(configKey) {
    return {
        connection : sails.config.connections.map.AuthHosts,   // Database adapter settings to use
        tableName  : 'wm_auth_hosts',                          // Database table/collection
        autoPK     : false,                                    // Manually generate Primary Keys to support DynamoDB

        attributes: {
            id          : { type: 'string',  required: true, primaryKey: true  },
            hostName    : { type: 'string',  required: true  },
            master      : { type: 'boolean', required: true, defaultsTo: false },
            environment : { type: 'array',   required: true }
        }
    };
});