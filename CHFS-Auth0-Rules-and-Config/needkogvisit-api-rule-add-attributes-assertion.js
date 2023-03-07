async function GetUserClaims(user, context, callback) {

    const ALLOWED_CLIENTS = JSON.parse(configuration.ALLOWED_CLIENTS);
    if (ALLOWED_CLIENTS.indexOf(context.clientID) < 0) {
        console.log("GetUserClaims: " + context.clientID + " is not allowed. Exiting rule - needkogvisit-rule-to-add-attributes-from-response");
        return callback(null, user, context);
    }
    //console.log(user);
    global.debugLog(context.clientMetadata);
    var REQUEST_BODY_CHFS_API = {
        "upn": user.CustomUPN,
        "applicationname": context.clientMetadata.applicationName || "CIC_ClientApps",
        "authenticationinstant": user.authTime,
        "oktaauthtype": user.SessionAMR || "mfa"
    };

    if (!global.getAccessTokenForCHFSApi) return callback(null, user, context);

    //Global Function that gets the token to invoke CHFS API from cache or fetches a new token
    const token = await global.getAccessTokenForCHFSApi();

    try {
        var axios = require('axios@0.22.0');

        const json = JSON.stringify(REQUEST_BODY_CHFS_API);
        console.log("GetUserClaims: Request for CHFS API");
        console.log(REQUEST_BODY_CHFS_API);

        const res = await axios.post(configuration.KOG_API_URI, json, {
            headers: {
                'Content-Type': 'application/json',
                "authorization": `Bearer ${token}`,
            }
        });
        //Global function to process the response data from the API call
        const response = global.processKOGAPIResponse(res.data, context.protocol);
        //console.log(response.processedData);
        console.log("GetUserClaims: needkogvisit: " + (response.processedData.needkogvisit || "No"));
        if (typeof response.processedData.needkogvisit !== 'undefined' && context.protocol !== "redirect-callback") {

            var ReturnURL = context.protocol === "wsfed" ? context.request.query.wtrealm : (context.protocol === "samlp" ? context.clientMetadata.needKogVisitReturnUrl : context.request.query.redirect_uri);
            console.log("GetUserClaims: Redirecting to KOG Router Page: ReturnURL= " + ReturnURL);

            context.redirect =
            {
                url: configuration.KOG_ROUTER_PAGE_URL + "?ReturnURL=" + ReturnURL
            };
            return callback(null, user, context);
        }

        console.log("GetUserClaims: After redirect back from KOG Router Page or after fetching and processing KOG API Response");
        context.samlConfiguration = context.samlConfiguration || {};
        context.samlConfiguration.mappings = context.samlConfiguration.mappings || {};
        context.samlConfiguration.mappings = { ...context.samlConfiguration.mappings, ...response.samlMappings };
        context.samlConfiguration.mappings["http://schemas.microsoft.com/ws/2008/06/identity/claims/windowsaccountname"] = "WindowsAccountName";
        context.samlConfiguration.mappings["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] = "uniqueid";
        context.samlConfiguration.mappings["http://schemas.microsoft.com/ws/2008/06/identity/claims/authenticationinstant1"] = "authTime";
        context.samlConfiguration.mapUnknownClaimsAsIs = false;
        context.samlConfiguration.passthroughClaimsWithNoMapping = false;
        context.samlConfiguration.mapIdentities = false;
        context.samlConfiguration.createUpnClaim = false;
        Object.assign(user, response.processedData);
        user.WindowsAccountName = user.WindowsAccountName || `${user.CustomADAbbreviation}\${user.CustomSAMAccountName}`;
        if (context.idToken) {
            context.idToken.WindowsAccountName = user.WindowsAccountName;
            Object.keys(response.processedData).forEach(key => {
                context.idToken[key] = response.processedData[key];
            });
        }
        // Link to allow changing the sub claim for oidc apps
        // On linking get the user id of the local user and set that as the primary id and send to 
        // auth0's continue endpoint, this reloads the user and allows us ot access the transient properties of the user

        var userId = await global.linkUser(user, response.processedData);
        if (userId !== null) {
            console.log("GetUserClaims: User linked, now redirecting. " + auth0.domain);
            context.primaryUser = userId;
            context.redirect = {
                url: "https://" + auth0.domain + "/continue"
            };

        }
        console.log("GetUserClaims: Processing complete, returing from rule!");
        return callback(null, user, context);
    }
    catch (error) {
        console.log(error);
        return callback(new UnauthorizedError(error));

    }
}
