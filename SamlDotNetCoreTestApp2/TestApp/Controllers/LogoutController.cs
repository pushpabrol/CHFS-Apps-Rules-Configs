using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
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
            return Redirect(_configuration["SAML:customLogoutUrl"] + HttpContext.Request.BaseUrl() + "Logout/SignedOut");
        }

        public IActionResult SamlSlo()
        {
            HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            return RedirectToAction("InitiateSingleLogout", "Saml");
        }

        public IActionResult SignedOut()
        {
            return View();
        }

    }
}

