using System;

    using ComponentSpace.Saml2;
    using ComponentSpace.Saml2.Metadata.Export;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.AspNetCore.Mvc;
    using System.Security.Claims;
    using System.Text;
    using System.Xml;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace TestApp.Controllers
{
    [Route("[controller]/[action]")]
        public class SamlController : Controller
        {
            private readonly ISamlServiceProvider _samlServiceProvider;
            private readonly IConfiguration _configuration;

            public SamlController(

                ISamlServiceProvider samlServiceProvider,
                IConfiguration configuration)
            {
                _samlServiceProvider = samlServiceProvider;
                _configuration = configuration;
            }


            public async Task<IActionResult> InitiateSingleLogout(string? returnUrl = null)
            {
                // Request logout at the identity provider.
                await _samlServiceProvider.InitiateSloAsync(relayState: returnUrl);

                return new EmptyResult();
            }


            public async Task<IActionResult> SingleLogoutService()
            {
                // Receive the single logout request or response.
                // If a request is received then single logout is being initiated by the identity provider.
                // If a response is received then this is in response to single logout having been initiated by the service provider.
                var sloResult = await _samlServiceProvider.ReceiveSloAsync();

                if (sloResult.IsResponse)
                {
                    // SP-initiated SLO has completed.
                    if (!string.IsNullOrEmpty(sloResult.RelayState))
                    {
                        return LocalRedirect(sloResult.RelayState);
                    }

                    return LocalRedirect("~/");
                }
                else
                {
                // Logout locally.
                await HttpContext.SignOutAsync();
                HttpContext.Session.Clear();
                // Respond to the IdP-initiated SLO request indicating successful logout.
                await _samlServiceProvider.SendSloAsync();
                }

                return new EmptyResult();
            }


        }
    }
