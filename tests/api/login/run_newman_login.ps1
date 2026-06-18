# ZaloUTE Login API Test Script
# Run Login tests using Newman

# Bypass execution policy for this session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Define paths (using absolute paths)
$collectionPath = Join-Path $scriptDir "ZaloUTE_Login_API.postman_collection.json"
$environmentPath = Join-Path $scriptDir "environment.json"
$resultPath = Join-Path $scriptDir "Result.json"

# Check if Newman is installed
$newmanExists = $null -ne (Get-Command newman -ErrorAction SilentlyContinue)
if (-not $newmanExists) {
    Write-Host "Newman not found. Installing Newman..." -ForegroundColor Yellow
    npm install -g newman
}

# Check if collection file exists
if (-not (Test-Path $collectionPath)) {
    Write-Host "Error: Collection file not found at $collectionPath" -ForegroundColor Red
    exit 1
}

# Check if environment file exists
if (-not (Test-Path $environmentPath)) {
    Write-Host "Error: Environment file not found at $environmentPath" -ForegroundColor Red
    exit 1
}

# Run tests with Newman
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ZaloUTE Login API - Test Execution" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Collection: $collectionPath" -ForegroundColor Gray
Write-Host "Environment: $environmentPath" -ForegroundColor Gray
Write-Host "Results will be saved to: $resultPath" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

newman run "$collectionPath" `
    --environment "$environmentPath" `
    --reporters cli `
    --reporter-json-export "$resultPath" `
    --reporter-json-showHeaders `
    --reporter-json-showBody

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test execution completed!" -ForegroundColor Green
Write-Host "Results saved to: $resultPath" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
