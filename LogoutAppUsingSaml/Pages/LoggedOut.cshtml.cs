using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using static System.Net.WebRequestMethods;

namespace LogoutAppUsingSamlServiceProvider.Pages
{
	public class LoggedOutModel : PageModel
    {
        public IActionResult OnGet(string? returnTo = null, string? fo = null)
        {

            if (!String.IsNullOrEmpty(returnTo)) return Redirect(returnTo);
            return Page();

            //if (fo == null)
            //{
            //    var OktaUrl = "https://pushp.oktapreview.com/login/signout?fromURI=";
            //    if (!String.IsNullOrEmpty(returnTo)) return Redirect(OktaUrl + HttpContext.Request.BaseUrl() + "LoggedOut?fo=" + returnTo);
            //    return Page();

            //}
            //else {

            //    return Redirect(fo);
            //}
        }


        public static string Base64Encode(string plainText)
        {
            var plainTextBytes = System.Text.Encoding.UTF8.GetBytes(plainText);
            return System.Convert.ToBase64String(plainTextBytes);
        }

    }
}
