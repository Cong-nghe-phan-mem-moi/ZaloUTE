# Run Postman Forgot Password collection with Newman (uses npx if newman not installed globally)
$npx = 'npx'
$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$collection = Join-Path $scriptRoot 'ZaloUTE_ForgotPassword_API.postman_collection.json'
$envFile = Join-Path $scriptRoot 'environment.json'

Write-Host "Running Newman against collection: $collection"
& $npx newman run $collection -e $envFile --reporters cli,json --reporter-json-export (Join-Path $scriptRoot 'Result.json')
