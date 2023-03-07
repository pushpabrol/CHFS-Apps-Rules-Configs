import { createRequire } from "module";
import * as fs from 'fs/promises';

const require = createRequire(import.meta.url);

import auth0 from 'auth0';

import { Command } from 'commander';
const program = new Command();

program
  .requiredOption('-e, --env <type>', 'Either pse-addons or chfs-samples is required to be passed as the env', 'pse-addons')
  .option('-a, --all', 'run complete setup')
  .option('-c, --configUpdate', 'Update just the rules config')
  .option('-r, --rules', 'update or create rules and set the config')
  .option('-l, --upadteLoginPage', 'update the login page to use the custom login page to bypass auth0')
  .option('-rlp, --resetLoginPage', 'resets the login page to use the NUL')
  .option('-usa, --updateSamlAddons', 'updates the saml addon configs for saml apps')

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


if (options.all) {
  setRuleConfigs(config, mgmtClient);
  updateCreateRules(config, mgmtClient);
  updateLoginPage(config, mgmtClient, './AUTH0_Login_Page_CHFS/loginPage.html');
}

if (options.configUpdate) setRuleConfigs(config, mgmtClient);

if(options.updateSamlAddons) updateSamlAddonConfig(config, mgmtClient);

if (options.rules) {
  setRuleConfigs(config, mgmtClient);
  updateCreateRules(config, mgmtClient);

}
if (options.upadteLoginPage) updateLoginPage(config, mgmtClient);
if (options.resetLoginPage) resetLoginPage(config, mgmtClient);

async function processPlaceHolders(config) {
  console.log("here");
  var replacements = config.loginPage.replacements;
  var contents = await fs.readFile(config.loginPage.filePath, "utf8");
  if (replacements !== null && replacements.length > 0) {
    for (let index = 0; index < replacements.length; index++) {
      const placeHolder = replacements[index];
      for (var prop in placeHolder) {
        console.log(prop);
        if (placeHolder.hasOwnProperty(prop)) contents = await replacePlaceHolder(contents, prop, placeHolder[prop]);
      }
    }
  }
  return contents;
}


// // Set rule config settings using the config.json
async function setRuleConfigs(config, mgmtClient) {
  var keys = Object.keys(config.ruleConfigs);

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    await mgmtClient.setRulesConfig({ key: key }, { value: config.ruleConfigs[key] });

  }
  console.log("done setting config");
}

async function updateCreateRules(config, mgmtClient) {
  // Set rules based on config.json
  var rules = await mgmtClient.getRules({ page: 0, per_page: 1, include_totals: true, fields: "id,name", include_fields: true });
  var totalRules = rules.total;

  var pages = Math.ceil(totalRules / 100);

  var rules = [];
  for (let index = 0; index < pages; index++) {
    const page = pages[index];
    var fetch = await mgmtClient.getRules({ page: page, per_page: 100, include_totals: false, fields: "id,name,order,enabled,stage", include_fields: true });
    console.log(fetch);
    rules.push(...fetch);
  }

  var startAtOrder = Math.max(...rules.map(o => o.order)) + 1;

  console.log(startAtOrder);

  console.log("Total rules: " + rules.length);

  for (let index = 0; index < config.rules.length; index++) {
    const ruleItem = config.rules[index];
    var data = await fs.readFile(ruleItem.filePath, 'utf8');
    var foundInstalledRule = rules.find(rule => rule.name === ruleItem.name);
    if (foundInstalledRule) {

      try {
        console.log("Will update rule with ID: " + foundInstalledRule.id)
        await mgmtClient.updateRule({ id: foundInstalledRule.id }, { script: data, name: ruleItem.name, enabled: foundInstalledRule.enabled });
        console.log("updated rule with ID: " + foundInstalledRule.id)
      } catch (error) {
        console.log(error);
      }

    }
    else {
      console.log("Will create rule with name: " + ruleItem.name);
      try {
        await mgmtClient.createRule({ script: data, name: ruleItem.name, order: (startAtOrder + index), "enabled": true, "stage": "login_success" });
        console.log("Done, creating rule:  " + ruleItem.name);
      } catch (error) {
        console.log(error);
      }

    }

    console.log("Done, updating or creating rule:  " + ruleItem.name);


  }
}

async function updateLoginPage(config, mgmtClient, filePath = './AUTH0_Login_Page_CHFS/loginPageTemplate.html') {
  // // Set custom login page for the logout app so that a user can not specifically login using that
  var loginPageForApp = await processPlaceHolders(config, filePath);
  console.log(loginPageForApp);
  var client_data = {};
  client_data.custom_login_page = loginPageForApp;
  client_data.custom_login_page_preview = loginPageForApp;

  if (typeof config.loginPage.clientIds !== 'undefined' && config.loginPage.clientIds !== null && config.loginPage.clientIds.length > 0) {
    for (let index = 0; index < config.loginPage.clientIds.length; index++) {
      const clientId = config.loginPage.clientIds[index];
      await mgmtClient.updateClient({ client_id: clientId }, client_data);

    }

  }

}


async function resetLoginPage(config, mgmtClient) {
  // // Set custom login page for the logout app so that a user can not specifically login using that
  var client_data = {};
  client_data.custom_login_page = "";
  client_data.custom_login_page_preview = "";

  if (typeof config.loginPage.reset !== 'undefined' && config.loginPage.reset !== null && config.loginPage.reset.length > 0) {
    for (let index = 0; index < config.loginPage.reset.length; index++) {
      const clientId = config.loginPage.reset[index];
      await mgmtClient.updateClient({ client_id: clientId }, client_data);

    }

  }

}


async function updateSamlAddonConfig(config, mgmtClient) {

  for (let index = 0; index < config.samlAddons.length; index++) {
    const entry = config.samlAddons[index];
    var client_data = {
      "addons": {
        "samlp" : entry.samlp
      }
  };
    await mgmtClient.updateClient({ client_id: entry.client_id }, client_data)
    
  }
  console.log("Done updating the saml addons!");

}

async function replacePlaceHolder(contents, tag, value) {
  try {
    if (contents) {
      const replacementString = new RegExp(tag, "g");;
      const replaced = contents.replace(replacementString, value);
      return replaced;
    }
  } catch (error) {
    console.log(error);
  }


}



