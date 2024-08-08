using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace WebPage.Pages.Account;

public class AccessDenied : PageModel
{

    [BindProperty(SupportsGet = true)]
    public string ReturnUrl { get; set; }
    private readonly ILogger<AccessDenied> _logger;

    public AccessDenied(ILogger<AccessDenied> logger)
    {
        _logger = logger;
        ReturnUrl = string.Empty;
    }

    public void OnGet()
    {
    }
}
