using System.Threading.RateLimiting;
using FluentValidation;
using HusKlar.Api.Middleware;
using HusKlar.Application.Common;
using HusKlar.Infrastructure;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog — never log request bodies (could contain PDF content or tokens)
builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration)
        .WriteTo.Console());

// MediatR + FluentValidation
var applicationAssembly = typeof(ValidationBehavior<,>).Assembly;
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(applicationAssembly);
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
});
builder.Services.AddValidatorsFromAssembly(applicationAssembly);

// Infrastructure services (Claude, PDF, external APIs, codes DB)
builder.Services.AddInfrastructure(builder.Configuration);

// Forwarded-headers — Render sits behind a reverse proxy so RemoteIpAddress would
// otherwise be the proxy IP. Trusting all proxies is acceptable on Render because
// raw TCP is never exposed; revisit if we ever move off the platform.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// CORS — whitelist frontend origin only. Methods/headers deliberately tight.
var frontendOrigin = builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(frontendOrigin)
            .WithMethods("GET", "POST", "OPTIONS")
            .WithHeaders("Content-Type", "X-Access-Code"));
});

// Rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("ReportUpload", limiter =>
    {
        limiter.PermitLimit = 5;
        limiter.Window = TimeSpan.FromMinutes(1);
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Forwarded-headers must run before anything that reads RemoteIpAddress.
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Security headers on all responses.
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});

app.UseSerilogRequestLogging();
app.UseMiddleware<ValidationExceptionMiddleware>();
app.UseCors();
app.UseRateLimiter();
app.MapControllers();

app.Run();
