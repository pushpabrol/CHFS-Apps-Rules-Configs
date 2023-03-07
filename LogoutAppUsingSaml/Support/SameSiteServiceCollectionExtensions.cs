using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
namespace CookieServiceProvider.Support
{
    public static class SameSiteServiceCollectionExtensions
    {
        public static IServiceCollection ConfigureSameSiteNoneCookies(this IServiceCollection services)
        {
            services.Configure<CookiePolicyOptions>(options =>
            {
                options.MinimumSameSitePolicy = SameSiteMode.None;
                options.Secure = CookieSecurePolicy.Always;

                options.OnAppendCookie = cookieContext =>
                {
                    //CheckSameSite(cookieContext.CookieOptions);
                    //cookieContext.CookieName = "LogoutAppCookie";
                    //cookieContext.CookieOptions.Expires = System.DateTimeOffset.Now.AddSeconds(40);
                    //cookieContext.CookieOptions.Secure = true;
                    //cookieContext.CookieOptions.MaxAge = System.TimeSpan.FromSeconds(40);

                };
                //options.OnDeleteCookie = cookieContext => CheckSameSite(cookieContext.CookieOptions);

            });

            return services;
        }

    }
}

