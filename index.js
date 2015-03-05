var ratchet = require('nurse-ratchet');
var gammabot = require('gammabot');
var async = require('async');
var semver = require('semver');
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var defaults = {
    modulesDir: 'node_modules',
    versionResolver: function (module, conflicts) {
        if (conflicts) {
            conflicts = conflicts.slice(0);
            conflicts.sort(function (a, b) {
                if (semver.lt(a.version, b.version)) {
                    return -1;
                }
                if (semver.gt(a.version, b.version)) {
                    return 1;
                }

                return 0;
            });

            // get the latest version
            return conflicts.pop();
        }

        return module;
    },
    pathResolver: function (appDist, module, options) {
        var resolvedAppDist = path.resolve(appDist);
        var retVal = [];

        if (_.isString(module.lazo)) {
            retVal.push({
                src: path.resolve(path.join(module.path, module.lazo)),
                dest: resolvedAppDist
            });
        } else if (module.lazo.model) {
            retVal.push({
                src: path.resolve(path.join(module.path, getDir(module.lazo.model))),
                dest: path.join(resolvedAppDist, 'models', ratchet.getModuleName(module.name))
            });
        } else if (module.lazo.component) {
            retVal.push({
                src: path.resolve(path.join(module.path, getDir(module.lazo.component))),
                dest: path.join(resolvedAppDist, 'components', ratchet.getModuleName(module.name))
            });
        } else if (module.lazo['html-import']) {
            retVal.push({
                src: path.resolve(path.join(module.path, getDir(module.lazo['html-import']))),
                dest: path.join(resolvedAppDist, options.htmlImportsDest)
            });
        } else {
            ['components', 'models', 'application', 'html-imports'].forEach(function (type) {
                if (module.lazo[type]) {
                    retVal.push({
                        src: path.resolve(path.join(module.path, module.lazo[type])),
                        dest: path.join(resolvedAppDist, getResourceTypeDir(type, options))
                    });
                }
            });
        }

        return retVal;
    },
    htmlImportsDest: path.join('app', 'imports')
};

function getDir(val) {
    return _.isBoolean(val) ? '.' : val;
}

function getResourceTypeDir(type, options) {
    switch (type) {
        case 'components':
        case 'models':
            return type;
        case 'application':
            return 'app';
        case 'html-import':
            return options.htmlImportsDest;
    }
}

module.exports = function (appDist, options, callback) {
    var tasks = [];
    var conflicts = {};
    var copiedModules = {};
    options = _.defaults(options || {}, defaults);
    gammabot(path.resolve(options.modulesDir), options, function (err, list) {
        if (err) {
            return callback(err, null);
        }

        list.modules.forEach(function (module) {
            tasks.push(function (callback) {
                var resolvedModule = options.versionResolver(module, list.conflicts[module.name]);
                var paths = options.pathResolver(appDist, module, options);
                var tasks = [];

                copiedModules[module.name] = module;
                copiedModules[module.name].versions = list.conflicts[module.name] || [resolvedModule];
                paths.forEach(function (p) {
                    tasks.push(function (callback) {
                        if (p.src === p.dest) {
                            return callback(null, true);
                        }

                        fs.copy(p.src, p.dest, { replace: true }, function (err) {
                            if (err) {
                                return callback(err, null);
                            }

                            copiedModules[module.name].paths = copiedModules[module.name].paths || [];
                            copiedModules[module.name].paths.push({
                                src: p.src,
                                dest: p.dest
                            });
                            callback(null, true);
                        });
                    });
                });

                async.series(tasks, function (err, results) {
                    if (err) {
                        return callback(err, null);
                    }

                    callback(null, true);
                });
            });
        });

        async.series(tasks, function (err, results) {
            if (err) {
                return callback(err, null);
            }

            for (var k in copiedModules) {
                delete copiedModules[k].name;
            }
            callback(null, copiedModules);
        });
    });
};