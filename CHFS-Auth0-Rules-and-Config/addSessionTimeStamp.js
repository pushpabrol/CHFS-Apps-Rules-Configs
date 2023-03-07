function addAuthTimeMappings(user, context, callback) {
  if (!global.processRule(user, context)) {
    console.log("addAuthTimeMappings: exit due to processRule: false");
    return callback(null, user, context);
  }
  user.authTime = new Date(user.auth_time * 1000).toISOString();
  context.samlConfiguration = context.samlConfiguration || {};
  context.samlConfiguration.mappings = context.samlConfiguration.mappings || {};
  context.samlConfiguration.mappings["http://schemas.microsoft.com/ws/2008/06/identity/claims/authenticationinstant1"] = "authTime";
  if (context.idToken) context.idToken.authTime = user.authTime;
  return callback(null, user, context);
}