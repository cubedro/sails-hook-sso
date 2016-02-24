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

        // Load models required for SSO
        for (model in models) {
            // Sails stores models it loads with a lower case name
            var modelName = models[model].toLowerCase();

            // Don't use hook model if the project already contains a model
            // with the same name
            if (sails.models[modelName]) {
                continue;
            }

            try {
                var modelFile = __dirname + '/models/' + modelName + '.js';
                // Does the file exist and is it accessible?
                fs.accessSync(modelFile, fs.F_OK);
                // Load the model file if it exists and append it to the sails.models object
                sails.models[modelName] = require(modelFile);
            } catch (e) {
                // File does not exist or is not accessible
                console.log(
                    "Model: " +
                    modelName +
                    " does not exist for sails-hook-sso! The application cannot start."
                );
            }
        }
    };

    loadModels();

   return cb();
});