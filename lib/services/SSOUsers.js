/**
 * services/SSOUsers
 * 
 * @description :: Used for gathering user results or editing user info
 * @author      :: Matt McCarty
 */
module.exports = {

    /**
     * `SSOUsers.getUsers()`
     * @description :: Return a list of all available users for a specific host
     * @author      :: Matt McCarty
     * @param       :: string   host - Host that contains the list of users
     * @param       :: callback cb   - Function to call after execution
     * @return      :: callback(err, found)
     */
     getUsers: function(host, cb) {
        host = host.toLowerCase();

        var modelName = sails.config[configKey].models.users,
            model     = sails.models[modelName];

        return model.find({ hosts: { contains: host } }).exec(function findCB(err, found) {
            found = found || [];

            if (err || found.length <= 0) {
                return cb(err, found);
            }

            return cb(false, found);
        });
     },

    /**
     * `SSOUsers.getUsers()`
     * @description :: Return a list of all available users for a specific host
     * @author      :: Matt McCarty
     * @param       :: string   host - Host to retreive groups for
     * @param       :: callback cb   - Function to call after execution
     * @return      :: callback(err, found)
     */
     getUser: function(host, user, cb) {
        host = host.toLowerCase();
        user = user.toLowerCase();

        var modelName = sails.config[configKey].models.users,
            model     = sails.models[modelName];

        return model.findOne().where({ and: [
            { host      : { contains: host } },
            { loginEmail: user }
        ]}).exec(function findCB(err, found) {
            found = found || [];

            if (err || found.length <= 0) {
                return cb(err, found);
            }

            return cb(false, found);
        });
     },

    /**
     * `SSOUsers.addUser()`
     * @description :: Add a user to the database
     * @author      :: Matt McCarty
     * @param       :: string   data - Data to add to the user record
     * @param       :: callback cb   - Function to call after execution
     * @return      :: callback(err, success)
     */
     addUser: function(data, cb) {
         Object.keys(data).forEach(function(key) {
             if (!data[key] || data[key] === null) {
                 delete data[key];
             }
         });

         data.id     = data.id      || '';
         data.groups = data.groups  || ['guest'];

         var search = {},
             where  = {};

         if (data.username) search.username = data.username;
         if (data.email)    search.email    = data.email;

         if (!search.username && !search.email) {
            return cb("No identifiers for the user have been specified");
         } else if (search.username && search.email) {
            where = { or: [
                { username: search.username },
                { email   : search.email }
            ]};
         }

         var _self    = this,
            modelName = sails.config[configKey].models.users,
            model     = sails.models[modelName];

         model.findOne().where(where).exec(function(err, user) {
             _self.findOrCreate(
                 where,  // Find
                 data    // Create with data object
             ).exec(function createCB(err, user) {
                 if (!err) {
                     sails.log.silly("Added a new user");
                     return cb(false, user);
                 }

                 sails.log.error(err);
                 return cb(err, false);
             });
        });
     },

    /**
     * `SSOUsers.clearCache()`
     * @description :: Clear user from session cache
     * @author      :: Matt McCarty
     * @param       :: object req - Request object
     * @return      :: void
     */
    clearCache: function(req) {
        if (!req || !req.session || !req.session.auth || !req.session.auth.user) {
            return;
        }

        delete req.session.auth.user;
    }
};