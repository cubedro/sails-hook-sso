/**
 * models/AuthUsers
 * 
 * @description :: Used for searching, adding, editing, deleteting users
 * @author      :: Matt McCarty
 */
module.exports = (function(configKey) {

    var modelName = sails.config[configKey].models.passports,
        model     = sails.models[modelName];

    return {
      connection : sails.config.connections.map.AuthUsers,   // Database adapter settings to use
      tableName  : 'wm_auth_users',                          // Database table/collection
      autoPK     : false,                                    // Manually generate Primary Keys to support DynamoDB

      attributes: {
          id          : { type      : 'string',        required: true,  primaryKey: true  },
          username    : { type      : 'string',        required: false, unique    : true, minLength : 3, maxLength: 25 },
          email       : { type      : 'email',         required: true,  unique    : true  },
          passports   : { collection: model,           via     : 'user' },
          groups      : { type      : 'array',         required: false  },
          hosts       : { type      : 'array',         required: false  }
      },

       /**
        * `AuthUsers.beforeValidate()`
        * @description :: Magic function that performs tasks before a record is validated
        * @help        :: http://sailsjs.org/documentation/concepts/models-and-orm/lifecycle-callbacks
        * @author      :: Matt McCarty
        * @param       :: object   values - Model data that is being validated
        * @param       :: callback cb     - Function to call after execution
        * @return      :: callback(err, results)
        */
        beforeValidate: function (values, cb) {
            // Set primary key
            if (!values.id || values.id.length <= 0) {
                var ObjectID = require('mongodb').ObjectID;
                values.id    = new ObjectID().toString();
                return cb();
            } else {
                return cb();
            }
        }
    };
});