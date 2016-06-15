/**
 * Created by 423919 on 5/6/2016.
 */

'use strict';

var sys = require('sys')
var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');
var CfNodeClient = function () {
};

// this api will clone the code from git and pushes it to cloud foundry
CfNodeClient.prototype.pushApp = function (options, callback) {
    //const endpoint = "https://api.54.208.194.189.xip.io";
    var endpoint = options.endpoint;
    var Apps = new (require("cf-nodejs-client")).Apps(endpoint);
    var Routes = new (require("cf-nodejs-client")).Routes(endpoint);
    var ServiceInstances = new (require("cf-nodejs-client")).ServiceInstances(endpoint);
    var ServiceBindings = new (require("cf-nodejs-client")).ServiceBindings(endpoint);
    var simpleGit = require('simple-git')(process.cwd());
    var fs = require('fs');
    var url ="https://github.com/SrividyaUppugandla/GITCloneTest.git";

    var clone = function(callback){
        fs.mkdir('git',function(err) {
            if (err) {
                console.log('mkdir error: ' + err);
                return callback(err);
                }
            else{

                process.chdir(process.cwd() + '/git');
                console.log(' process.cwd() '+ process.cwd());

                simpleGit.clone("https://github.com/santhoshreddyt/OAuthApp.git", process.cwd(),function(err,result){
                    if(err){
                    console.log("errrr "+err);
                        return callback(err);
                    }
                    else{
                        return callback(null,result);
                    }
                });

            }

        });
    }

    var zip = function(app,callback){

        var zipFolder = require('zip-folder');
        zipFolder(process.cwd()+'/git', process.cwd()+'/git/'+'application.zip', function(err,result) {
            if(err) {
                return callback(err);
            } else {
                return callback(null,result);
            }
        });

    }

    var push = function(app,callback){

        console.log(" in create");
        //res.write(" in create");
        var appGuid;
        var appOptions = {
            "name": options.appname,
           // "space_guid": "b169a527-a10a-4a84-a45a-2909fee6b1d9"
            "space_guid": options.space_guid,
            "environment_json":options.environment_json
            };

      /*
      var token = {
            "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiIzOTI4ZmMxNTVlMDY0N2RmYjgyYjdhN2EwMjAyNDFhZiIsInN1YiI6ImM3NDQ4ZGZmLWRmZjktNGJmZC05MjYxLTdiMmI2YjE2OGVlMyIsInNjb3BlIjpbIm9wZW5pZCIsInNjaW0ucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIuYWRtaW4iLCJ1YWEudXNlciIsInJvdXRpbmcucm91dGVyX2dyb3Vwcy5yZWFkIiwiY2xvdWRfY29udHJvbGxlci5yZWFkIiwicGFzc3dvcmQud3JpdGUiLCJjbG91ZF9jb250cm9sbGVyLndyaXRlIiwiZG9wcGxlci5maXJlaG9zZSIsInNjaW0ud3JpdGUiXSwiY2xpZW50X2lkIjoiY2YiLCJjaWQiOiJjZiIsImF6cCI6ImNmIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9pZCI6ImM3NDQ4ZGZmLWRmZjktNGJmZC05MjYxLTdiMmI2YjE2OGVlMyIsIm9yaWdpbiI6InVhYSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbiIsImF1dGhfdGltZSI6MTQ2NTg5OTYxMywicmV2X3NpZyI6ImVlZjAzNDhjIiwiaWF0IjoxNDY1ODk5NjEzLCJleHAiOjE0NjU5MDAyMTMsImlzcyI6Imh0dHBzOi8vdWFhLjU0LjIwOC4xOTQuMTg5LnhpcC5pby9vYXV0aC90b2tlbiIsInppZCI6InVhYSIsImF1ZCI6WyJjZiIsIm9wZW5pZCIsInNjaW0iLCJjbG91ZF9jb250cm9sbGVyIiwidWFhIiwicm91dGluZy5yb3V0ZXJfZ3JvdXBzIiwicGFzc3dvcmQiLCJkb3BwbGVyIl19.MYeXMUTGIROcAX1_4bXaYNtmFBTPQBVPhbuM0jFMxguarRKR_HvFxS0vKZARSykY2nS-IS5vXQrQNZnTo4bDyk-aemRLa6G6sDnwwEzm9GzfOGxtdM409VFquwqg8falxf_8mrux1Wy_oSnL-h9uJa5O3kFvSc4anJ2rrqnLXCo",
            "token_type": "bearer",
            "refresh_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiIzOTI4ZmMxNTVlMDY0N2RmYjgyYjdhN2EwMjAyNDFhZi1yIiwic3ViIjoiYzc0NDhkZmYtZGZmOS00YmZkLTkyNjEtN2IyYjZiMTY4ZWUzIiwic2NvcGUiOlsib3BlbmlkIiwic2NpbS5yZWFkIiwiY2xvdWRfY29udHJvbGxlci5hZG1pbiIsInVhYS51c2VyIiwicm91dGluZy5yb3V0ZXJfZ3JvdXBzLnJlYWQiLCJjbG91ZF9jb250cm9sbGVyLnJlYWQiLCJwYXNzd29yZC53cml0ZSIsImNsb3VkX2NvbnRyb2xsZXIud3JpdGUiLCJkb3BwbGVyLmZpcmVob3NlIiwic2NpbS53cml0ZSJdLCJpYXQiOjE0NjU4OTk2MTMsImV4cCI6MTQ2ODQ5MTYxMywiY2lkIjoiY2YiLCJjbGllbnRfaWQiOiJjZiIsImlzcyI6Imh0dHBzOi8vdWFhLjU0LjIwOC4xOTQuMTg5LnhpcC5pby9vYXV0aC90b2tlbiIsInppZCI6InVhYSIsImdyYW50X3R5cGUiOiJwYXNzd29yZCIsInVzZXJfbmFtZSI6ImFkbWluIiwib3JpZ2luIjoidWFhIiwidXNlcl9pZCI6ImM3NDQ4ZGZmLWRmZjktNGJmZC05MjYxLTdiMmI2YjE2OGVlMyIsInJldl9zaWciOiJlZWYwMzQ4YyIsImF1ZCI6WyJjZiIsIm9wZW5pZCIsInNjaW0iLCJjbG91ZF9jb250cm9sbGVyIiwidWFhIiwicm91dGluZy5yb3V0ZXJfZ3JvdXBzIiwicGFzc3dvcmQiLCJkb3BwbGVyIl19.REY3jurjHXqpz22r-HExXHfWW4fmOFHjnAHnzbA9SSTVOkE6GFaYgJyEcqim4E8h6V7QiY-015jjamFcWTys-eEODjXzVlkYATsV_8CCRErafl3mZnUULm_0c9y-1Oi3SljQ8sCbfHieOgiLOecF1ObwEfm_XLNP2N9atHO0_j8",
            "expires_in": 599,
            "scope": "openid scim.read cloud_controller.admin uaa.user routing.router_groups.read cloud_controller.read password.write cloud_controller.write doppler.firehose scim.write",
            "jti": "3928fc155e0647dfb82b7a7a020241af"
        };
        */
        var token = options.token;
        Apps.setToken(token);

        Apps.add(appOptions).then(function (result) {
            appGuid = result.metadata.guid;
            /*
            var routeOptions = {
                "domain_guid" : "56f6da1f-eed3-42fb-a629-b28101069137",
                "space_guid" : "b169a527-a10a-4a84-a45a-2909fee6b1d9",
                "host" : "sri"
            };
            */
            var routeOptions = {
                "domain_guid" : options.domain_guid,
                "space_guid" : options.space_guid,
                "host" :options.host
            };
            Routes.setToken(token);
            return Routes.add(routeOptions);
        }).then(function (result) {
            //console.log(result);

            console.info("appguid  "+appGuid+"  routeguid  "+result.metadata.guid);
            Apps.setToken(token);
            return Apps.associateRoute(appGuid,result.metadata.guid);
        }).then(function (result) {
            console.log('IN Zipping');
            Apps.setToken(token);
            return Apps.upload(appGuid,process.cwd()+'/git/'+'application.zip',false);
        }).then(function (result) {
            console.log('In start');
            Apps.setToken(token);
            return Apps.start(appGuid);
        }).then(function (result) {
            console.log('In final result');
            return callback(null,result);
            //res.send(result);
        }).catch( function(reason) {
            console.error("Error:************** " + reason);
            return callback(reason);
            //res.send(reason);
        });
    };


    var async = require('async');
    async.waterfall([clone,zip,push],function(err,result){
        if(err){
            console.log("err ************* "+err);
            return callback(err);
        }
        else{
            return callback(null,result);
        }

    });
};


// This api is used to create a service in CF
CfNodeClient.prototype.createService = function (options, callback) {
    var child = exec("cf login --skip-ssl-validation -a https://api.54.208.194.189.xip.io -u admin -p admin -o Trumobi -s Trumobi-Paas", function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
            return callback(error);
        }
        else {
            console.log(stdout);
            var createCmd = "cf create-service '" + options.serviceName + "' " + options.plan + ' ' + options.instanceName;
            console.log("createCmd cmd *************** " + createCmd);
            var createSvc = exec(createCmd, function (err, result) {
                if (error !== null) {
                    console.log('exec error create-service : ' + error);
                    return callback(error);
                }
                else {
                    console.log("Create service successfully******************* !!!");
                    return callback(null, result);
                }
            });

        }
    });
};

// This api is used to bind a service to an app and call a restage
CfNodeClient.prototype.bindService = function (options, callback) {
    var child = exec("cf login --skip-ssl-validation -a https://api.54.208.194.189.xip.io -u admin -p admin -o Trumobi -s Trumobi-Paas", function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
            return callback(error);
        }
        else {
            console.log(stdout);
            var bindSvc = "cf bind-service " + options.appName + ' ' + options.instanceName;
            var bindExec = exec(bindSvc, function (err, result) {
                console.log("bind Service cmd *************** " + bindSvc);
                if (err !== null) {
                    console.log('exec error bind-service : ' + err);
                    return callback(err);
                }
                else {

                    console.log("Binding service successfully !!!");
                    return callback(null, stdout);

                    var restageCmd = "cf restage " + options.appName;
                    var restageExec = exec(restageCmd, function (err, result) {
                        console.log(" cmd *************** " + restageCmd);
                        if (err !== null) {
                            console.log('exec error app restage : ' + err);
                            return callback(err);
                        }
                        else {

                            console.log("restage successfully !!!");

                            return callback(null, stdout);
                        }
                    });


                }
            });
        }


    });
};

// This api is used to get the Vcap Services of an app

CfNodeClient.prototype.getVCAPService = function (appName, callback) {
    var child = exec("cf login --skip-ssl-validation -a https://api.54.208.194.189.xip.io -u admin -p admin -o Trumobi -s Trumobi-Paas", function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
            return callback(error);
        }
        else {
            console.log(stdout);
            var envCmd = "cf env " + appName;
//            var envCmd = "cf env testApp";
            var envSvc = exec(envCmd, function (err, result) {
                if (error !== null) {
                    console.log('exec error env : ' + error);
                    return callback(error);
                }
                else {
                    console.log("getting vcap service successfully");
                    console.log("result ****************** " + result);
                    console.log("stdout****************** " + stdout);
                    return callback(null, result);
                }
            });

        }
    });
};
module.exports = CfNodeClient;









