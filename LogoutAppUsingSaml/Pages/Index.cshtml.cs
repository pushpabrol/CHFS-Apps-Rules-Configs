using System.Collections.Generic;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json;

namespace LogoutAppUsingSamlServiceProvider.Pages
{
    [ResponseCache(Location = ResponseCacheLocation.None, Duration = 0, NoStore = true)]
    [Authorize]
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;
        private IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;


        public IndexModel(IConfiguration Configuration, ILogger<IndexModel> logger, IHttpContextAccessor httpContextAccessor)
        {
            _logger = logger;
            _configuration = Configuration;
            _httpContextAccessor = httpContextAccessor;
        }

        public int NoClients { get; private set; }
        public IEnumerable<KeyValuePair<string, ClientInfo>> Clients { get; set; }
        public string? ClientsJson { get; set; }
        public string? ClientId { get; private set; }
        public string? BaseUrl { get; private set; }
        public string? PostLogoutRedirectUrl { get; private set; }
        public string? IssuerDomain { get; private set; }

        public string? returnTo { get; set; }
        //private bool hasWSFedOrSalesforce;
        private string returnToHost = "";

        /**
         * This method is only invoked after logout app authentication with auth0 
         * There is a rule in auth0 that runs only for this client application and adds all 
         * clients participating in the SSO session into a SAML assertion attribute
         * This method then extracts all apps that are using wsfed protocol and are custom apps and salesforce
         * apps and does a custom logout for those apps. This app then also redirects the user after doing custom logout to initiate a SAML SLO 
         * request to auth0...this step then clears out all the SAML sessions and OIDC sessions via back channel logout
         **/
        public IActionResult OnGet()
        {
            var baseUrl = _httpContextAccessor.HttpContext?.Request.BaseUrl();

            returnTo = String.IsNullOrEmpty(HttpContext.Request.Query["returnTo"]) ? "" : HttpContext.Request.Query["returnTo"];
            string? attemptUpstreamLogout = _configuration["Auth0:AttemptUpStreamIdpLogout"] ?? "N";
            if (attemptUpstreamLogout == "Y")
            {
                var fo = HttpContext.Request.Query["fo"];
                if (String.IsNullOrEmpty(fo))
                {
                    var upStreamLogoutUrl = _configuration["Auth0:UpStreamIDPLogoutUrl"];
                    if (!String.IsNullOrEmpty(returnTo)) return Redirect(upStreamLogoutUrl + baseUrl + "?fo=" + returnTo);
                }
                else returnTo = fo;
            }


            if (returnTo != "") returnToHost = new Uri(returnTo).Host;

            /*
             from is only set when the application is salesforce - Salesforce custom url is in the format
             https:\/\/logoutappUrl?returnTo=https://sfsite.com&from=client id of sf app
             We use this to remove the attempt to call back the sf secur/logout.jsp url becasue SF calls the secur/logout.jsp
             first anyways at logout. This means if the request is coming from salesforce the step of calling the logout_url is redundant
            */

            //String? from = String.IsNullOrEmpty(HttpContext.Request.Query["from"]) ? "" : HttpContext.Request.Query["from"];
            ClientId = _configuration["Auth0:ClientId"] as String;
            BaseUrl = baseUrl.EndsWith("/") ? baseUrl : baseUrl + "/";
            PostLogoutRedirectUrl = BaseUrl + "Logout?returnUrl=" + BaseUrl + "LoggedOut&returnTo=" + returnTo;

            IssuerDomain = "https://" + _configuration["Auth0:Domain"];
            //Get claim containing wsfed and salesforce clients for custom logout
            var ssoClients = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.auth0.com/current_clients_alt" || c.Type == "current_clients_alt")?.Value;
            NoClients = 0;
            if (!string.IsNullOrEmpty(ssoClients) && ssoClients.Count() > 0)
            {

                Dictionary<string, ClientInfo>? clientsData = JsonConvert.DeserializeObject<Dictionary<string, ClientInfo>>(ssoClients);
                if (clientsData != null)
                {

                    // Remove the Salesforce instance that initiated this logout request as calling the secur/logout.jsp again is of no use
                    //if(!String.IsNullOrEmpty(from)) clientsData.Remove(from);

                    var sfClientToRemove = clientsData.FirstOrDefault(x => x.Value.appType == "salesforce" && !String.IsNullOrEmpty(x.Value.logoutUrl) && new Uri(x.Value.logoutUrl).Host == returnToHost);
                    if (sfClientToRemove.Key != null) clientsData.Remove(sfClientToRemove.Key);

                    //hasWSFedOrSalesforce = clientsData.Any(x => x.Value.appType == "wsfed" || x.Value.appType == "salesforce" || x.Value.appType == "oidc");
                    //Load clients having client_metadata with appType => wsfed, salesforce, oidc and logout_url
                    Clients = clientsData.Where(x => x.Value.appType == "wsfed" || x.Value.appType == "salesforce" || x.Value.appType == "oidc");
                    NoClients = Clients != null ? Clients.Count() : 0;
                    if (NoClients > 0)
                    {
                        ClientsJson = JsonConvert.SerializeObject(Clients, Formatting.Indented);
                        return Page();
                    }
                    else return Redirect(PostLogoutRedirectUrl);
                }
                else return Redirect(PostLogoutRedirectUrl);

            }
            else return Redirect(PostLogoutRedirectUrl);
        }

        public IActionResult OnGetInitiateSingleSignOn()
        {
            var authenticationProperties = new AuthenticationProperties()
            {
                RedirectUri = "/",
                IsPersistent = true
            };

            return new ChallengeResult(authenticationProperties);
        }
    }

    public class ClientInfo
    {
        public ClientInfo()
        {
            this.id = Guid.NewGuid();
        }
        public Guid id { get; set; }
        [JsonProperty("name")]
        public string? name { get; set; }
        [JsonProperty("logout_url")]
        public string? logoutUrl { get; set; }
        [JsonProperty("appType")]
        public string? appType { get; set; }
    }
}