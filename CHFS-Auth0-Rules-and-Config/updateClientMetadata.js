import { createRequire } from "module";
import * as fs from 'fs/promises';

const require = createRequire(import.meta.url);

import auth0 from 'auth0';

import { Command } from 'commander';
const program = new Command();

program
    .requiredOption('-e, --env <type>', 'Either pse-addons or chfs-samples is required to be passed as the env', 'pse-addons')
    .option('-c, --setCommonMetadata', 'Set Common Metadata')
    .option('-s, --setClientsMetadata', 'Set Metadata')

program.allowUnknownOption(false);
program.parse(process.argv);
program.showHelpAfterError();

const options = program.opts();
console.log(options);
if (Object.keys(options).length === 0) {
    console.log("No option specified!");
    program.help();
}

var config = require(`./config.pse-addons.json`);
try {
    config = require(`./config.${options.env}.json`);
}
catch (e) {
    console.log(e);
    console.log("Error loading the config file");
    process.exit(-1);

}

var mgmtClient = new auth0.ManagementClient({
    domain: config.auth0.domain,
    clientId: config.auth0.mgmtApi.id,
    clientSecret: config.auth0.mgmtApi.secret
});


var clients = [
    {
        "name": "ASPNetWebFormsWSFed",
        "client_id": "HijpkRed9iSs75Htd9L2UnlICTWwQjx4",
        "appType" : "wsfed"
    },
    {
        "name": "ASPNetMVCWSFed",
        "client_id": "d8JapGgFQDhyMBwcEShrOSO5rzcmxYdC",
        "appType" : "wsfed"
    },
    {

        "name": "SAMLRPApp1",
        "client_id": "MYGdwxdeDoBxN6CvgLBqxjauueZYhhAH",
        "appType" : "samlp",
        "client_metadata" : {
            "needKogVisitReturnUrl" : "https://uat.kog.ky.gov/SAMLRPApp1"
        }

    },
    {

        "name": "ASPNetCoreMVCOIDC",
        "client_id": "A02MIupRrme3SEK9wyAgEGgWKmX8BFDj",
        "appType" : "oidc",
        "client_metadata" : {
            "applictionName2" : "asdasdsa"
        }

    },
    {

        "name": "ASPNetMVCOIDC",
        "client_id": "LWpHBBoPO78OwZG3QaTS7DQOaRogLoDV",
        "appType" : "oidc"
    },
    {

        "name": "ASPNetCoreRazorOIDC",
        "client_id": "TujsDDTBTEWKtZZAbj4Igtvmp6n7mqQL",
        "appType" : "oidc"
    },
    {

        "name": "ASPNetWebFormsOIDC",
        "client_id": "2U71BsRzV4tBwLI4DQ3lZCPWYDAWbn6X",
        "appType" : "oidc"
    },
    {

        "name": "SAMLRPApp2",
        "client_id": "nXrRUCOGUvdV9fytJ930ocTK0YovwskD",
        "appType" : "samlp",
        "client_metadata" : {
            "needKogVisitReturnUrl" : "https://uat.kog.ky.gov/SAMLRPApp2"
        }

    },
    {

        "name": "SalesforceTestApp",
        "client_id": "aWl6xv1D3DhtVQ9eG1VbgvZwWbugM3gO",
        "appType" : "salesforce",
        "client_metadata" : {
            "needKogVisitReturnUrl" : "https://commonwealthofkentucky.my.salesforce.com",
            "appType" : "salesforce",
            "logout_url" : "https://commonwealthofkentucky.my.salesforce.com/logout.jsp"

        }

    },
    {
        "name": "Auth0WSFedTestApp",
        "client_id": "pbiQwR6hvazlzffVvzigS5M0a6aLf4Is",
        "appType" : "wsfed",
        "client_metadata" : {
            "appType" : "wsfed",
            "logout_url" : "https://localhost:7004/Logout"
        }
    },
    {
        "name": "SalesforceTestApp2",
        "client_id": "DB2kjVC3dkvUKzWMPNQjZbjXmdk7yR1k",
        "appType" : "salesforce",
        "client_metadata" : {
            "needKogVisitReturnUrl" : "https://mykycompany.my.salesforce.com",
            "appType" : "salesforce",
            "logout_url" : "https://mykycompany.my.salesforce.com/logout.jsp"
        }
    },
    {
        "name": "AspNetCoreMVCAPITestApp",
        "client_id": "ZP5JyQcqGIWFv8qSpls8PbwlnxWRUj0t",
        "appType" : "oidc"
    },
    {
        "name": "Auth0SAMLtestApp",
        "client_id": "Tnu5by0LTu8G8Iodh92kNG0HvY94nbT6",
        "appType" : "samlp",
        "client_metadata" : {
            "needKogVisitReturnUrl" : "https://localhost:44360"
        }
    },
    {
        "name": "Auth0SAMLtestApp2",
        "client_id": "SJmezbaYpbtT8swH2d5aDW8pnXD7hnUz",
        "appType" : "samlp",
        "client_metadata" : {
            "needKogVisitReturnUrl" : "https://localhost:44390"
        }
    },
    {
        "name": "Auth0SPAOIDCSample",
        "client_id": "8KSDcHXRamHzbM8siSxzRLm78DQph7dm",
        "appType" : "oidc"
    },
    {

        "name": "Auth0RegularWebAppOIDCSample",
        "client_id": "CAy9jMQlu1VQekmJDMmg4mlh6s3SwIjT",
        "appType" : "oidc",
        "client_metadata" : {
            "appType" : "oidc",
            "logout_url" : "https://localhost:7005/Account/LocalLogout"
        }

    }
];


var commonClientMetadata = {
    "applicationName": "CIC_ClientApps"
}



if (options.setCommonMetadata) {
    setCommonMetadata(mgmtClient, clients, commonClientMetadata);
}
if(options.setClientsMetadata){
    setClientsMetadata(mgmtClient, clients);
}


async function setCommonMetadata(mgmtClient, clients, commonClientMetadata) {
    for (let index = 0; index < clients.length; index++) {
        const client = clients[index];
        await mgmtClient.updateClient({ client_id: client.client_id }, { client_metadata: commonClientMetadata });

    }
    console.log("Done updating client metadata.");
}


async function setClientsMetadata(mgmtClient, clients) {
    
    var filteredClients = clients.filter(client => typeof client.client_metadata !== 'undefined');
    console.log(filteredClients.length);
    for (let index = 0; index < filteredClients.length; index++) {
        const client = filteredClients[index];
        await mgmtClient.updateClient({ client_id: client.client_id }, { client_metadata: client.client_metadata });

    }
    console.log("Done updating client metadata for SAML and SF Apps.");
}