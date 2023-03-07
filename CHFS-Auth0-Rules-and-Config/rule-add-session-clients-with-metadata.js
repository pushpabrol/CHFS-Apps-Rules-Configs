async function rule(user, context, callback) {

      const LOGOUT_APP_CLIENT_ID =  configuration.LOGOUT_APP_CLIENT_ID;

      if (context.clientID === LOGOUT_APP_CLIENT_ID && context.sso.current_clients && context.sso.current_clients.length > 0) {
  
          var clientsData = await global.getClientsData(true);
          var foundAll = true;

          for (const client of context.sso.current_clients)
          {
     
            var match = clientsData.find(item => {
                return item.client_id === client;
            });
            if(typeof match === 'undefined') 
            { 
                foundAll = false;
                 break;
            }
          }
          console.log("Were all clients from SSO session found in the cache? : " + foundAll);

          if(!foundAll) {
            console.log("A client particiapting in the SSO did not have data in the cache, reload cache and move on");
          clientsData = await global.getClientsData(false);
          }

          var clientsMetadata = {};
 						context.sso.current_clients.forEach((client) => {
            var match = clientsData.find(item => {
                return item.client_id === client;
            });
            if (match) {
                console.log(match);

                if(match.client_metadata.logout_url && match.client_metadata.appType )
                {
                let { name, client_metadata: { logout_url, appType } } = match;
                clientsMetadata[client] = { name, logout_url, appType };
                }
                else {

                    let { name } = match;
                    clientsMetadata[client] = { name, logout_url: null, appType : null, setupIncomplete: true };
                }
            }

        });
        if(context.protocol	 === "samlp" || context.protocol === "wsfed") {
          user.current_clients_alt = JSON.stringify(clientsMetadata);
          context.idToken.current_clients_alt = JSON.stringify(clientsMetadata);
        }
        else context.idToken.current_clients_alt = clientsMetadata;
      }
      return callback(null, user, context);
  }
  
  
