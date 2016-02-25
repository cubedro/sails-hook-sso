/**
 * models/AuthPassports
 * 
 * @description :: Authentication passport model
 * @author      :: Matt McCarty
 */
module.exports = (function(configKey) {

    var modelName = sails.config[configKey].models.users,
        model     = sails.models[modelName];

    return {
        connection : sails.config.connections.map.AuthPassports,   // Database adapter settings to use
        tableName  : 'wm_auth_passports',                          // Database table/collection
        autoPK     : false,                                        // Manually generate Primary Keys to support DynamoDB

        attributes: {
            id            : { type : 'string',             required: true,  primaryKey: true },
            user          : { model: model,                required: true   },
            password      : { type : 'string',             required: false, minLength: 8 },
            protocol      : { type : 'alphanumeric',       required: true   },
            provider      : { type : 'alphanumericdashed', required: true   },
            identifier    : { type : 'string',             required: false  },
            accessToken   : { type : 'string',             required: false  },
            client_id     : { type : 'string',             required: false  },
            tokenExpiresIn: { type : 'string',             required: false  },
            tokenExpiresAt: { type : 'string',             required: false  },
            nameFirst     : { type : 'string',             required: false  },
            nameLast      : { type : 'string',             required: false  },
            nameDisplay   : { type : 'string',             required: false  },
            username      : { type : 'string',             required: false  },
            email         : { type : 'email',              required: true   },
            image         : { type : 'string',             required: false  },
            gender        : { type : 'string',             required: false , enum      : ['male', 'female'] },
            language      : { type : 'string',             required: false,  defaultsTo: 'en' }
        },

        /**
         * `AuthPassports.beforeCreate()`
         * @description :: Magic function that performs tasks before a record is created
         * @help        :: http://sailsjs.org/documentation/concepts/models-and-orm/lifecycle-callbacks
         * @author      :: Matt McCarty
         * @param       :: object   passport - Model attributes that are being created
         * @param       :: callback cb       - Function to call after execution
         * @return      :: callback(err, results)
         */
        beforeValidate: function(passport, cb) {
            var ObjectID     = require('mongodb').ObjectID,
                hashPassword = sails.config[configKey].password.hash;

            passport.id = new ObjectID().toString();

            if (passport.password) {
                hashPassword(passport, function(err, hash) {
                    if (!err) {
                        passport.password = hash;
                        return cb();
                    }

                    return cb(err);
                });
            } else {
                return cb();
            }
        }
    };
});