using ComponentSpace.Saml2;
using ComponentSpace.Saml2.Authentication;
using ComponentSpace.Saml2.Session;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.StaticFiles.Infrastructure;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);


builder.Services.Configure<CookiePolicyOptions>(options =>
{
    // SameSiteMode.None is required to support SAML SSO.
    options.MinimumSameSitePolicy = SameSiteMode.None;
    options.Secure = CookieSecurePolicy.Always;
});

builder.Services.ConfigureApplicationCookie(options =>
{
    // Use a unique identity cookie name rather than sharing the cookie across applications in the domain.
    options.Cookie.Name = "SamlTestApp.Identity";

    // SameSiteMode.None is required to support SAML logout.
    options.Cookie.SameSite = SameSiteMode.None;
});

//builder.Services.Configure<CookieSsoSessionStoreOptions>(options => {
//    options.CookieName = "samltestapp-saml-session";
//    options.CookieOptions.SameSite = ComponentSpace.Saml2.Bindings.CookieOptions.SameSiteMode.None;

//});

// Add SAML SSO services.
builder.Services.AddSaml(builder.Configuration.GetSection("SAML"));


builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = SamlAuthenticationDefaults.AuthenticationScheme;
    options.DefaultSignOutScheme = SamlAuthenticationDefaults.SignOutScheme;



})
.AddCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.Name = "SamlTestApp";
})
.AddSaml(options =>
{
    
    options.PartnerName = (httpContext) => builder.Configuration["PartnerName"];
    options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.SignOutScheme = CookieAuthenticationDefaults.AuthenticationScheme;



    options.LoginCompletionUrl = (httpContext, redirectUri, relayState) =>
    {
        if (!string.IsNullOrEmpty(redirectUri))
        {
            return redirectUri;
        }

        if (!string.IsNullOrEmpty(relayState))
        {
            return relayState;
        }

        return "/Index";
    };

    options.Events = new SamlAuthenticationEvents
    {
        OnResolveUrl = (httpContext, samlEndpointType, url) =>
        {
            Console.WriteLine(httpContext.Request.Query);
            bool v = httpContext == null || httpContext.Request == null || httpContext.Request.BaseUrl() == null;
            //var data = Microsoft.AspNetCore.WebUtilities.QueryHelpers.AddQueryString(url, "display", httpContext?.Request?.BaseUrl() ?? "");
            return Microsoft.AspNetCore.WebUtilities.QueryHelpers.AddQueryString(url, "display", httpContext?.Request?.BaseUrl() ?? "");
        },
    OnInitiateSso = (httpContext, partnerName, relayState, ssoOptions) =>
        {
            ssoOptions = new SsoOptions
            {
                //RequestedUserName = "pushp.abrol@okta.com"
            };
            return (partnerName, relayState, ssoOptions);
        }
    };
});

//builder.Services.AddScoped<ISsoSessionStore, CookieSsoSessionStore>();


// Add services to the container.

builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();

var app = builder.Build();

    
// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
        // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

app.UseCookiePolicy();


app.UseAuthorization();

app.MapDefaultControllerRoute();
app.MapRazorPages();

//app.MapControllerRoute(
//    name: "default",
//    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

public static class HttpRequestExtensions
{
    public static string? BaseUrl(this HttpRequest req)
    {
        if (req == null) return null;
        var uriBuilder = new UriBuilder(req.Scheme, req.Host.Host, req.Host.Port ?? -1);
        if (uriBuilder.Uri.IsDefaultPort)
        {
            uriBuilder.Port = -1;
        }

        return uriBuilder.Uri.AbsoluteUri;
    }
}
