$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

$env:SERVER_PORT = "8081"
$env:SPRING_DATASOURCE_URL = "jdbc:h2:file:./data/tender-ai-local;MODE=MySQL;DATABASE_TO_LOWER=TRUE;AUTO_SERVER=TRUE"
$env:SPRING_DATASOURCE_DRIVER = "org.h2.Driver"
$env:SPRING_DATASOURCE_USERNAME = "sa"
$env:SPRING_DATASOURCE_PASSWORD = ""
$env:SPRING_JPA_HIBERNATE_DDL_AUTO = "update"
$env:APP_SEED_DATA = "true"

$googleConfigPath = Join-Path $PSScriptRoot ".env.local"
if (Test-Path -LiteralPath $googleConfigPath) {
    $googleClientSetting = Get-Content -LiteralPath $googleConfigPath |
        Where-Object { $_ -match '^\s*GOOGLE_CLIENT_ID\s*=' } |
        Select-Object -First 1

    if ($googleClientSetting -match '^\s*GOOGLE_CLIENT_ID\s*=\s*(.*?)\s*$') {
        $env:GOOGLE_CLIENT_ID = $matches[1].Trim('"').Trim("'")
    }
}

Write-Output "Starting backend on http://localhost:8081"
Write-Output "Using isolated local database: backend/data/tender-ai-local"
if ($env:GOOGLE_CLIENT_ID) {
    Write-Output "Google OAuth client ID is configured"
}
.\mvnw.cmd spring-boot:run
exit $LASTEXITCODE
