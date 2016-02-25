module.exports = (function(cb) {

    var fs     = require('fs'),   // Node's filesystem functionality
        hook   = this.configKey;  // This hook's config key name (i.e: sails.config.[sso].foo)

    /**
     * @description :: Loop through defaults.models and load any required model
     *                 files that have not been previously loaded by the application.
     *                 Models that have been previously loaded would be in the project's
                       api/models directory.
     * @author      :: Matt McCarty
     * @return      :: void
     */
    function loadModels() {
        var models = sails.config[hook].models;

        for (model in models) {
            var modelName = models[model];

            // Don't use hook model if the project already contains a model
            // with the same name
            if (sails.models[modelName.toLowerCase()]) {
                continue;
            }

            try {
                var modelFile = __dirname + '/models/' + modelName + '.js';
                // Does the file exist and is it accessible?
                fs.accessSync(modelFile, fs.F_OK);
                // Load the model file if it exists and append it to the sails.models object
                sails.models[modelName.toLowerCase()] = require(modelFile)(hook);
            } catch (e) {
                // File does not exist or is not accessible
                console.log(
                    "Model: " +
                    modelName +
                    " does not exist for sails-hook-sso!"
                );
            }
        }

        console.log(sails.models);
    };

    /**
     * @description :: Loop through defaults.services and load any required service
     *                 files that have not been previously loaded by the application.
     *                 Services that have been previously loaded would be in the project's
                       api/services directory.
     * @author      :: Matt McCarty
     * @return      :: void
     */
    function loadServices() {
        var services = sails.config[hook].services;

        for (service in services) {
            // Sails stores models it loads with a lower case name
            var serviceName = services[service];

            // Don't use hook service if the project already contains a service
            // with the same name
            if (sails.services[serviceName.toLowerCase()]) {
                continue;
            }

            try {
                var serviceFile = __dirname + '/services/' + servicesName + '.js';
                // Does the file exist and is it accessible?
                fs.accessSync(serviceFile, fs.F_OK);
                // Load the model file if it exists and append it to the sails.models object
                sails.services[servicesName.toLowerCase()] = require(serviceFile);
            } catch (e) {
                // File does not exist or is not accessible
                console.log(
                    "Service: " +
                    serviceName +
                    " does not exist for sails-hook-sso!"
                );
            }
        }
    };

    loadModels();
    loadServices();

    return cb();
});