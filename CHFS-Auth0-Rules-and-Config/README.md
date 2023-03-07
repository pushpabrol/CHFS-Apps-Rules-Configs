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




