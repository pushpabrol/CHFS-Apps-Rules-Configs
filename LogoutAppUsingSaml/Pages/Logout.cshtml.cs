using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace CookieServiceProvider.Pages
{
    public class LogoutModel : PageModel
    {
        public async Task OnGetAsync(string? returnUrl = null, string? returnTo = null)
        {
            var authenticationProperties = new AuthenticationProperties()
            {
                RedirectUri = returnUrl + "?returnTo=" + returnTo,
                IsPersistent = true
                
            };

            // Logout the user locally.
            await HttpContext.SignOutAsync(authenticationProperties);
        }
    }
}
