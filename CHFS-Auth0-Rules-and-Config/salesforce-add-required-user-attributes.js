function SalesForceMappings(user, context, callback) {

    const SALESFORCE_APPS = JSON.parse(configuration.SALESFORCE_APPS);
    if (SALESFORCE_APPS.indexOf(context.clientID) < 0) {
        console.log("SalesForceMappings: " + context.clientID + " is not allowed. Exiting rule - salesforce-add-required-user-attributes");
        return callback(null, user, context);
    }

    if (user.name !== null && user.name.split(' ').length >= 2) {
        user.given_name = user.name.split(' ')[0];
        user.family_name = user.name.split(' ')[1];
    }
    else {
        user.given_name = user.email;
        user.family_name = user.email;
    }
    user.salesforce_profile_id = 'Standard User';
    user.sfUsername = user.email + '.' + context.clientID;

    context.samlConfiguration = context.samlConfiguration || {};
    context.samlConfiguration.mappings = context.samlConfiguration.mappings || {};
    var sfMappings = {
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': 'email',
        'User.FederationIdentifier': 'email',
        'User.Username': 'sfUsername',
        'User.Email': 'email',
        'User.FirstName': 'given_name',
        'User.LastName': 'family_name',
        'User.ProfileId': 'salesforce_profile_id'

    };
    Object.assign(context.samlConfiguration.mappings, sfMappings);

    callback(null, user, context);
}