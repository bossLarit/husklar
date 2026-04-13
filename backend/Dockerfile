FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY *.sln .
COPY src/HusKlar.Api/HusKlar.Api.csproj src/HusKlar.Api/
COPY src/HusKlar.Application/HusKlar.Application.csproj src/HusKlar.Application/
COPY src/HusKlar.Domain/HusKlar.Domain.csproj src/HusKlar.Domain/
COPY src/HusKlar.Infrastructure/HusKlar.Infrastructure.csproj src/HusKlar.Infrastructure/
RUN dotnet restore

COPY . .
RUN dotnet publish src/HusKlar.Api -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "HusKlar.Api.dll"]
