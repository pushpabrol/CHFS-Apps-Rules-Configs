using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.WsFederation;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace TestApp.Controllers
{
    public class LogoutController : Controller
    {
        private IConfiguration _configuration;


        public LogoutController(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        // GET: /<controller>/
        public IActionResult Index()
        {
            HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return View("SignedOut");
        }

        public IActionResult Custom()
        {
            HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Redirect(_configuration["auth0:customLogoutUrl"] + HttpContext.Request.BaseUrl() + "Logout/SignedOut");
        }


        public async Task<IActionResult> WSFedLogoutAsync()
        {
            // Redirects
            _ = HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            await HttpContext.SignOutAsync(WsFederationDefaults.AuthenticationScheme);
            return View("SignedOut");
            
        }

        public IActionResult SignedOut()
        {
            return View();
        }

    }
}

