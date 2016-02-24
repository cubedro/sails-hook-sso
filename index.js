module.exports = function(sails) {
    return {
        defaults  : require('./lib/defaults'),
        configure : require('./lib/configure'),
        initialize: require('./lib/initialize'),
        routes    : require('./lib/routes')
    }
};
