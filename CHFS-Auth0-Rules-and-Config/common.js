async function chfsCommonFunctions(user, context, callback) {

    global.debugLog = global.debugLog || function(message){
        if(configuration.DEBUG) console.log(message);
    };


    global.getAccessTokenForCHFSApi = global.getAccessTokenForCHFSApi || async function () {

        //console.log(configuration);
        if (configuration.kogClaimsApiAccessToken &&
            configuration.kogClaimsApiAccessTokenRenewAt &&
            configuration.kogClaimsApiAccessTokenRenewAt > Date.now()) {
            global.debugLog("getAccessTokenForCHFSApi: Access token is valid...cache hit!");
            return configuration.kogClaimsApiAccessToken;

        } else {
            global.debugLog("getAccessTokenForCHFSApi: Access token expired or not found...cache miss!, getting new token");

            var a0MgmtToken = await global.A0mgmtApiToken();
            //console.log("######AO MGMT TOKEN#####");
            global.debugLog(a0MgmtToken);

            const ManagementClient = require('auth0@2.17.0').ManagementClient;
            //console.log(auth0LoginBody);
            let management = new ManagementClient({
                token: a0MgmtToken,
                domain: configuration.AUTH0_DOMAIN
            });

            const chfsLoginOpts = {
                url: `https://${configuration.CHFS_AUTH0_DOMAIN}/oauth/token`,
                method: "POST",
                json: true,
                body: {
                    grant_type: "client_credentials",
                    client_id: configuration.CHFS_API_CREDS_CLIENT_ID,
                    client_secret: configuration.CHFS_API_CREDS_CLIENT_SECRET,
                    audience: configuration.CHFS_API_AUDIENCE
                }
            };
            const rp = require("request-promise");
            const chfsLoginBody = await rp(chfsLoginOpts);

            await management.setRulesConfig({
                key: "kogClaimsApiAccessToken"
            }, {
                value: chfsLoginBody.access_token
            });
            await management.setRulesConfig({
                key: "kogClaimsApiAccessTokenRenewAt"
            }, {
                value: (Date.now() + (800 * chfsLoginBody.expires_in)).toString()
            });
            return chfsLoginBody.access_token;
        }

    };

    global.processKOGAPIResponse = global.processKOGAPIResponse || function (data, protocol) {
        var keys = Object.keys(data);
        //set default
        var samlMappings = {
            "http://schemas.chfs.ky.gov/kog/v1/identity/claims/logon": "email"
        };
        keys.forEach(key => {
            var name = key.substring(key.lastIndexOf("/") + 1);
            samlMappings[key] = name;
        });
        var str = JSON.stringify(data).replace(/http:\/\/schemas\.chfs\.ky\.gov\/kog\/v1\/identity\/claims\//g, '').replace(/http:\/\/schemas\.microsoft\.com\/ws\/2008\/06\/identity\/claims\//g, '');
        var Obj = JSON.parse(str);
        if (protocol === "samlp" || protocol === "wsfed" || protocol === "redirect-callback")
            return {
                samlMappings: samlMappings,
                processedData: Obj
            };
        else return {
            samlMappings: null,
            processedData: Obj
        };
    };

    global.getClientsData = global.getClientsData || async function (useCache) {

        const ClientsCacheValidTill = configuration.ClientsCacheValidTill;
        if (ClientsCacheValidTill && ClientsCacheValidTill > Date.now() && configuration.ClientsData && useCache) {
            global.debugLog("getClientsData: Cache hit for clients data");
            return JSON.parse(configuration.ClientsData);
        } else {
            global.debugLog("getClientsData: Use Cache flag, set to: " + useCache);
            global.debugLog("getClientsData: cache miss!");
            global.debugLog("fecth from mgmt api and add to configuration object for 10-15 minutes!");

            const ManagementClient = require('auth0@3.0.1').ManagementClient;

            //console.log(auth0LoginBody);
            var a0MgmtToken = await global.A0mgmtApiToken();
            //console.log("######AO MGMT TOKEN#####");
            global.debugLog(a0MgmtToken);
            let management = new ManagementClient({
                token: a0MgmtToken,
                domain: configuration.AUTH0_DOMAIN,
                retry: {
                    enabled: true
                }
            });

            const clientsDummy = await management.clients.getAll({
                fields: "client_id",
                include_fields: true,
                app_type: "regular_web,spa,salesforce",
                page: 0,
                per_page: 1,
                include_totals: true
            });
            //global.debugLog(clientsDummy);
            var total = clientsDummy.total;
            //global.debugLog(total);
            var pages = Math.ceil(total / 100);
            var clients = [];
            for (let index = 0; index < pages; index++) {
                const fetch = await management.clients.getAll({
                    fields: "client_id,name,client_metadata,app_type,addons",
                    include_fields: true,
                    app_type: "regular_web,spa,salesforce",
                    page: index,
                    per_page: 100,
                    include_totals: false
                });
                //console.log(fetch);
                //console.log(fetch.length);
                clients.push(...fetch);
            }

            //global.debugLog(`Found ${clients.length} apps`);

            //filter only for clients that have client_metadata containing appType = wsfed, oidc and salesforce for now
            // This can be further optimized
            var clientsToStore = clients.filter(client => {
                return client.client_metadata && (client.client_metadata.appType === "wsfed" || client.client_metadata.appType === "salesforce" || client.client_metadata.appType === "oidc");
            });
            
            //global.debugLog(`Found ${clientsToStore.length} wsfed and samlp apps`);

            await management.setRulesConfig({
                key: "ClientsData"
            }, {
                value: JSON.stringify(clientsToStore)
            });
            await management.setRulesConfig({
                key: "ClientsCacheValidTill"
            }, {
                value: (Date.now() + 1000 * 600).toString()
            });
            return clientsToStore;

        }

    };

    global.A0mgmtApiToken = global.A0mgmtApiToken || async function () {

        const mgmtTokenvalidTill = configuration.mgmtTokenvalidTill;
        if (mgmtTokenvalidTill && mgmtTokenvalidTill > Date.now() && configuration.mgmtToken) {
            global.debugLog("A0mgmtApiToken: Cache was hit. Getting data!");
            return configuration.mgmtToken;
        } else {
            global.debugLog("A0mgmtApiToken: cache miss!");
            const rp = require("request-promise");

            const auth0LoginOpts = {
                url: `https://${configuration.AUTH0_DOMAIN}/oauth/token`,
                method: "POST",
                json: true,
                body: {
                    grant_type: "client_credentials",
                    client_id: configuration.MGMT_CLIENT_ID,
                    client_secret: configuration.MGMT_CLIENT_SECRET,
                    audience: `https://${configuration.AUTH0_DOMAIN}/api/v2/`
                }
            };

            const auth0LoginBody = await rp(auth0LoginOpts);
            var token = auth0LoginBody.access_token;
            var expires_in = auth0LoginBody.expires_in;
            const ManagementClient = require('auth0@2.17.0').ManagementClient;
            //console.log(auth0LoginBody);
            let management = new ManagementClient({
                token: token,
                domain: configuration.AUTH0_DOMAIN
            });
            await management.setRulesConfig({ key: "mgmtToken" }, { value: token });
            //set mgmtTokenvalidTill to 90% of the actual expiry time - expires_in*1000*0.90
            await management.setRulesConfig({ key: "mgmtTokenvalidTill" }, { value: (Date.now() + 900 * expires_in).toString() });
            return token;
        }

    };
    /**
     * This function is used to create and link a db account user
     * The db account user's user id is set to the uniqueid returned by the CHFS API call
     * After linking the app_metadata is updated with flag linked: true
     * if this flag is set this function returns null
     */
    global.linkUser = global.linkUser || async function (user, userData) {
        user.app_metadata = user.app_metadata || {};
        if (user.app_metadata.linked === true) return null;
        const ManagementClient = require('auth0@3.0.1').ManagementClient;

        //console.log(auth0LoginBody);
        var a0MgmtToken = await global.A0mgmtApiToken();
        //global.debugLog("linkUser: ######AO MGMT TOKEN#####");
        //global.debugLog(a0MgmtToken);
        let management = new ManagementClient({
            token: a0MgmtToken,
            domain: configuration.AUTH0_DOMAIN,
            retry: {
                enabled: true
            }
        });
        //console.log(user);
        const { v4: uuidv4 } = require('uuid@8.3.1');
        var localUser = await management.createUser({
            "connection": "chfs-users",
            "user_id": userData.uniqueid,
            "email": user.email,
            "password": uuidv4()
        });
        //console.log(localUser);
        var params = {
            "provider": "oauth2",
            "user_id": user.user_id
        };
        const linkedUser = await management.linkUsers(localUser.user_id, params);   
        //console.log(linkedUser);
        await auth0.users.updateAppMetadata(localUser.user_id, { linked : true});
        //console.log(linkedUser);
        return localUser.user_id;

    };
    // this is being done to consolidate data at the top level user object for further processing
    global.consolidateAttributesAtUserLevel = global.consolidateAttributesAtUserLevel || function(user){
    //console.log(user);
    if(user.CustomSAMAccountName ) return user; 
    var oktaIdentity = user.identities.find(identity => identity.profileData && identity.provider === "oauth2");
    //console.log(oktaIdentity);
    if(oktaIdentity && oktaIdentity !== null)
        {
                const { SessionAMR, amr, auth_time, CustomSAMAccountName, groups, CustomADAbbreviation,CustomUPN, WindowsAccountName } = oktaIdentity.profileData;
                return {...user, SessionAMR ,amr, auth_time, CustomSAMAccountName, groups, CustomADAbbreviation, CustomUPN, WindowsAccountName };
        }
        return user;
    };
    /*
    global.consolidateAttributesAtUserLevel = global.consolidateAttributesAtUserLevel || function(user){
    
        if(user.CustomSAMAccountName ) return user; 
        var oktaAttributeSrc = user.identities[1] && user.identities[1].profileData && user.identities[1].profileData.hasOwnProperty("CustomSAMAccountName") ? user.identities[1].profileData : null;
            console.log("oktaAttributeSrc:");
            console.log(oktaAttributeSrc);
            if(oktaAttributeSrc !== null) {
                const { SessionAMR, amr, auth_time, CustomSAMAccountName, groups, CustomADAbbreviation,CustomUPN } = oktaAttributeSrc;
                return {...user, SessionAMR ,amr, auth_time, CustomSAMAccountName, groups, CustomADAbbreviation, CustomUPN };
            } 
            return user;
        };
        */
    

    global.processRule = global.processRule || function(user, context){
        if(user.auth_time) return true;
        return false;
    };
    // this is done to consolidate the transient properties so that when redirect to continue followed by linking happens we are in a good place
    user = global.consolidateAttributesAtUserLevel(user);
    return callback(null, user, context);
}