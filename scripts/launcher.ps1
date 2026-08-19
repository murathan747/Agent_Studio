$ErrorActionPreference = "SilentlyContinue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$workDir = Split-Path -Parent $scriptDir

# Load Dynamic Configuration
$configFile = Join-Path $workDir "app_config.json"
$appName = "AgentStudio"
$port = 8000
if (Test-Path $configFile) {
    try {
        $cfg = Get-Content $configFile -Raw | ConvertFrom-Json
        if ($cfg.appName) { $appName = $cfg.appName }
        if ($cfg.server.port) { $port = [int]$cfg.server.port }
    } catch {}
}

# 1. Clean up any stale port listeners
Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# 2. Launch browser app window in background worker once server is ready
$url = "http://127.0.0.1:$port"
$profileDir = Join-Path $env:LOCALAPPDATA "$appName\AppProfile"

$browserJob = {
    param($url, $profileDir)
    
    # Wait until port 8000 is ready
    for ($i = 0; $i -lt 50; $i++) {
        try {
            $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1
            if ($res.StatusCode -eq 200) { break }
        } catch {}
        Start-Sleep -Milliseconds 300
    }
    
    $edgeCandidates = @(
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    
    $appExe = ""
    foreach ($c in $edgeCandidates) {
        if (Test-Path $c) {
            $appExe = $c
            break
        }
    }
    
    if ($appExe) {
        Start-Process -FilePath $appExe -ArgumentList "--app=$url", "--start-maximized", "--user-data-dir=`"$profileDir`"" -WindowStyle Maximized
    } else {
        Start-Process $url
    }
}

Start-Job -ScriptBlock $browserJob -ArgumentList $url, $profileDir | Out-Null

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  🚀 $appName - Canli Terminal Konsolu & Log Ekrani" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Server http://127.0.0.1:$port adresinde baslatildi." -ForegroundColor Yellow
Write-Host "Model indirmeleri, AI motoru ve dugum loglari canli olarak akacaktir.`n" -ForegroundColor DarkGray

# 3. Run Python directly in the terminal with -u (unbuffered) so ALL logs stream live!
$pythonExe = Join-Path $workDir "python_embeded\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
}
$serverScript = Join-Path $workDir "server\api.py"

& $pythonExe -u $serverScript
