/**
 * Created by 423919 on 5/11/2016.
 *
 *
 * MicroService  Service Broker , complying to version 2.4 of the interface specification
 * http://docs.cloudfoundry.org/services/api.html
 *
 */

'use strict';

var config = require('./config/auth_service_broker');
/* following configs are determined by environment variables */
config.credentials = {};
var restify = require('restify');
var async = require('async');
var Handlebars = require('handlebars');
var server = restify.createServer({
    name: 'auth_service_broker'
});
var NodeClient = require("./cf-node-client.js");
var nodeClient = new NodeClient();
server.use(apiVersionChecker({
    'major': 2,
    'minor': 4
}));
server.use(restify.authorizationParser());
server.use(authenticate(config.credentials));
server.use(restify.fullResponse());
server.use(restify.bodyParser());
server.pre(restify.pre.userAgentConnection());
var async = require('async');

// To check the consistency
function checkConsistency() {
    var i, id, p, msg, plans, catalog;

    catalog = config.catalog;
    plans = config.plans;

    for (i = 0; i < catalog.services.length; i += 1) {
        for (p = 0; p < catalog.services[i].plans.length; p += 1) {
            id = catalog.services[i].plans[p].id;
            if (!plans.hasOwnProperty(id)) {
                msg = "ERROR: plan '" + catalog.services[i].plans[p].name + "' of service '" + catalog.services[i].name + "' is missing a specification.";
                throw new Error(msg);
            }
        }
    }
}

// get catalog
server.get('/v2/catalog', function (request, response, next) {

    response.send(config.catalog);
    next();
});

//router for provisioning a service when a cf create-service is called
server.put('/v2/service_instances/:id', function (request, response, next) {
    console.log("Provisioning Request Details:**************************  " + JSON.stringify(request.params));
    if (!request.params.parameters || !request.params.parameters.appname) {
        response.status(400);
        response.end(JSON.stringify({'error': 'Please provide the app name as additional parameter'}));
    } else {

        //callback for async calls
        var finalCallback = function (err, result) {
            if (err) {
                response.status(400);
                response.end(JSON.stringify({'error': err}));

            }
            else {
                console.log("response " + result);
                response.status(200);
                response.end(JSON.stringify({'description': 'created instance of oAuth'}));

            }
        };

        // pushes the app to cloud foundry with the appName given by the client
        var pushApp = function (pushHandler) {

            nodeClient.pushApp({appName: request.params.parameters.appname}, pushHandler);
        };

        // add the sequential task here
        async.waterfall([pushApp], finalCallback);
    }
    next();
});

// router for un provision the service when a cf delete-service is called

server.del('/v2/service_instances/:id', function (req, response, next) {
    console.log("inside delete ************** " + JSON.stringify(req.params));
    response.send(200, {
        'description': 'delete/unprovision done '
    });

    next();
});

// router for binding the service to an app when a cf bind-service is called

server.put('/v2/service_instances/:instance_id/service_bindings/:id', function (req, response, next) {
        if (!req.params.parameters || !req.params.parameters.appname) {
            response.status(400);
            response.end(JSON.stringify({'error': 'Please provide the app name as additional parameter'}));
        }
        else {
            // forming the JSON needed for the VCAP
            var respData = {
                "credentials": {

                    "logouturl": "http://" + req.params.parameters.appname + ".54.208.194.189.xip.io/logout",
                    "auhenticateurl": "http://" + req.params.parameters.appname + ".54.208.194.189.xip.io",
                    "provider_callbackurl": "http://" + req.params.parameters.appname + ".54.208.194.189.xip.io/auth/facebook/callback"

                }
            };
            response.status(201);

            response.end(JSON.stringify(respData));
            next();
        }
    }
);

// router for unbinding the service from an app when a cf unbind-service is called
server.del('/v2/service_instances/:instance_id/service_bindings/:id', function (req, response, next) {
        response.send(200, {
            'description': 'service un bind successfull'
        });
        next();
    }
);


// list services (Not in spec :-)
server.get('/v2/service_instances', function (request, response, next) {

    response.send(501, {
        'description': JSON.stringify(response)
    });
    next();
});

function apiVersionChecker(version) {
    var header = 'x-broker-api-version';
    return function (request, response, next) {
        if (request.headers[header]) {
            var pattern = new RegExp('^' + version.major + '\\.\\d+$');
            if (!request.headers[header].match(pattern)) {
                console.log('Incompatible services API version: ' + request.headers[header]);
                response.status(412);
                next(new restify.PreconditionFailedError('Incompatible services API version'));
            }
        } else {
            console.log(header + ' is missing from the request');
        }
        next();
    };
};

function authenticate(credentials) {
    return function (request, response, next) {
        if (credentials.authUser || credentials.authPassword) {
            if (!(request.authorization && request.authorization.basic && request.authorization.basic.username === credentials.authUser && request.authorization.basic.password === credentials.authPassword)) {
                response.status(401);
                response.setHeader('WWW-Authenticate', 'Basic "realm"="auth-service-broker"');
                next(new restify.InvalidCredentialsError('Invalid username or password'));
            } else {
                // authenticated!
            }
        } else {
            // no authentication required.
            next();
        }
        next();
    };
};

server.get(/\/?.*/, restify.serveStatic({
    directory: './public',
    default: 'index.html'
}));

/** According to the spec, the JSON return message should include a description field. */
server.on('uncaughtException', function (req, res, route, err) {
    console.log(err, err.stack);
    //res.send(500, { 'code' : 500, 'description' : err.message});
});

checkConsistency();

//var port = Number(process.env.VCAP_APP_PORT || 8080);
var port = 3012;
server.listen(port, function () {
    console.log('%s listening at %s', server.name, server.url)
});








