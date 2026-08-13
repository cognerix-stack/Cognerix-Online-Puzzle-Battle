$nodeDir = Join-Path $PSScriptRoot ".node"
$zipPath = Join-Path $nodeDir "node.zip"
$nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip"
$extractedFolder = Join-Path $nodeDir "node-v20.11.1-win-x64"

if (-not (Test-Path $nodeDir)) {
    New-Item -ItemType Directory -Path $nodeDir -Force | Out-Null
}

if (-not (Test-Path (Join-Path $extractedFolder "node.exe"))) {
    if (-not (Test-Path $zipPath)) {
        Write-Host "Downloading portable Node.js v20.11.1..."
        Invoke-WebRequest -Uri $nodeUrl -OutFile $zipPath
    } else {
        Write-Host "Found existing node.zip, skipping download."
    }
    Write-Host "Extracting Node.js..."
    Expand-Archive -Path $zipPath -DestinationPath $nodeDir -Force
    Remove-Item $zipPath -Force
    Write-Host "Node.js successfully installed locally."
} else {
    Write-Host "Node.js is already installed locally."
}

# Add local Node.js to PATH for the current session
$env:PATH = "$extractedFolder;" + $env:PATH
Write-Host "Local Node.js path: $extractedFolder"
& node -v
& npm -v
