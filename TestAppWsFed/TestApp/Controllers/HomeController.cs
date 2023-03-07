using System.Diagnostics;
using System.Net.Mail;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestApp.Models;

namespace TestApp.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    [Authorize]
    public IActionResult Index()
    {
        var claims = ((ClaimsIdentity)User.Identity).Claims;

        String[] values = new String[claims.Count()];

        int counter = 0;
        foreach (Claim claim in claims)
        {
            values[counter] = "<span>" + claim.Type + ": </Span><span>" + claim.Value + "</Span><br>";
            counter++;
        }
        return View(values);

    }

    public IActionResult NotLoggedIn()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}

public class UserProfileViewModel
{
    private string emailAddress = "";
    private string name = "";
    private string profileImage = "";

    public string EmailAddress { get => emailAddress; set => emailAddress = value; }

    public string Name { get => name; set => name = value; }

    public string ProfileImage { get => profileImage; set => profileImage = value; }
}