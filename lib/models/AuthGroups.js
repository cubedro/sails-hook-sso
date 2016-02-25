/**
 * models/AuthGroups
 * 
 * Groups table/collection model
 * @description :: Used for gathering user groups results or editing groups
 * @author      :: Matt McCarty
 */
module.exports = (function(configKey) {
    return {
        connection : sails.config.connections.map.AuthGroups,  // Database adapter settings to use
        tableName  : 'wm_auth_groups',                         // Database table/collection
        autoPK     : false,                                    // Manually generate Primary Keys to support DynamoDB

        attributes: {
            id              : { type: 'string',  required      : true, primaryKey: true     },
            guid            : { type: 'integer', autoIncrement : true, defaultsTo: 1000000  },
            groupName       : { type: 'string',  required      : true  },
            groupNameDisplay: { type: 'json',    required      : false },
            hosts           : { type: 'array',   required      : false }
        }
    };
});