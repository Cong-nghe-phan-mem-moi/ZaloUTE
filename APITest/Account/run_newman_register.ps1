# Run Postman Register collection with Newman (uses npx if newman not installed globally)
$npx = 'npx'
$collection = Join-Path $PSScriptRoot 'ZaloUTE_Register_API.postman_collection.json'
$envFile = Join-Path $PSScriptRoot 'environment.json'

Write-Host "Running Newman against collection: $collection"
& $npx newman run $collection -e $envFile --reporters cli,json --reporter-json-export (Join-Path $PSScriptRoot 'Result.json')
