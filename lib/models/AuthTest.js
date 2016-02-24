/**
 * models/AuthTest
 *
 * @description :: Used to test the loading of models
 * @author      :: Matt McCarty
 */
module.exports = {
    tableName  : 'auth_test',                               // Database table/collection
    autoPK     : false,                                     // Manually generate Primary Keys to support DynamoDB

    attributes: {
        id: { type: 'string', required: true, primaryKey: true  },
    },
};