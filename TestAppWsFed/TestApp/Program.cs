using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.WsFederation;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.StaticFiles.Infrastructure;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddAuthentication(sharedOptions =>
{
    sharedOptions.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    sharedOptions.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    sharedOptions.DefaultChallengeScheme = WsFederationDefaults.AuthenticationScheme;

})
.AddWsFederation(options =>
{
    var config = builder.Configuration.GetSection(key: "auth0:metadataUrl").Value;

    options.Wtrealm = builder.Configuration.GetSection(key: "auth0:wtrealm").Value;
    options.MetadataAddress = builder.Configuration.GetSection(key: "auth0:metadataUrl").Value;
    options.Events.OnRedirectToIdentityProvider = context =>
    {
        Console.Out.WriteLine(context.ProtocolMessage.IsSignOutMessage);
        if (context.ProtocolMessage.IsSignInMessage)
        {
            //context.ProtocolMessage.SetParameter("whr", builder.Configuration.GetSection(key: "auth0:whr").Value);
            //context.ProtocolMessage.SetParameter("organization", "org_9FCwubSSa0FQiaYS");
            
            Console.Out.WriteLine(context.Request.BaseUrl() + "?" + context.Request.QueryString);
            context.ProtocolMessage.SetParameter("display", context.Request.BaseUrl() + context.Request.Path + context.Request.QueryString);
            //context.ProtocolMessage.SetParameter("resource", context.Request.BaseUrl() + context.Request.Path + context.Request.QueryString);
            Console.Out.WriteLine(context.Properties.Parameters);
        }
        if (context.ProtocolMessage.IsSignOutMessage) {
            context.ProtocolMessage.SetParameter("federated", "true");
            context.ProtocolMessage.SetParameter("wreply", context.Request.BaseUrl() + "Logout/SignedOut");
        }


         return Task.FromResult(0);


    };
     
})
.AddCookie(options =>
{
    options.Cookie.Name = "WSFedAppCookie";
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

});

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

app.UseAuthentication();

app.UseAuthorization();

app.MapDefaultControllerRoute();
app.MapRazorPages();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

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
