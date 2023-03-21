# This folder contains rules and scripts to setup the A0 tenant for CHFS
    - This will setup the rules and configure the login page for the logout app 
    - The login page is set different for the logout app so that login never happens for this app only SSO works!

## Config
    - `mv config.json.example config.json`
    - Edit the values for your env

## Run
    - `npm install`
    - `node  setRulesAndConfigEntries.js`
    - `node  setRulesAndConfigEntries.js -h`  to see all the options
```
Usage: setRulesAndConfigEntries [options]

Options:
  -e, --env <type>          env name, tenant name, default is chfs-samples (default: "chfs-samples")
  -a, --all                 run complete setup
  -c, --configUpdate        Update just the rules config
  -r, --rules               update or create rules and set the config
  -l, --upadteLoginPage     update the login page to use the custom login page to bypass auth0
  -rlp, --resetLoginPage    resets the login page to use the NUL
  -usa, --updateSamlAddons  updates the saml addon configs for saml apps
  -h, --help                display help for command
```   



## Update Client Metadata
    - This script is used to update the metadata of the clients
    - The clients are defined in an array within the script - 
    - `node updateClientMetadata.js`
    - `node updateClientMetadata.js -h` to see all the options 
 
 ```
 Usage: updateClientMetadata [options]

Options:
  -e, --env <type>          env, default is  chfs-samples ( this is the name of the auth0 tenant) (default: "chfs-samples")
  -c, --setCommonMetadata   Set Common Metadata
  -s, --setClientsMetadata  Set Metadata
  -h, --help                display help for command
 ```
  




