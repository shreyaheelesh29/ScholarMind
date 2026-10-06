$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$candidates = @(
    (Join-Path $repoRoot ".venv-new\Scripts\python.exe"),
    (Join-Path $repoRoot ".venv\Scripts\python.exe"),
    (Join-Path $PSScriptRoot ".venv\Scripts\python.exe")
)

$python = $null
foreach ($candidate in $candidates) {
    if (-not (Test-Path $candidate)) { continue }
    try {
        & $candidate -c "import fastapi, uvicorn, pytesseract" 2>$null
        if ($LASTEXITCODE -eq 0) {
            $python = $candidate
            break
        }
    } catch {
        # Ignore incomplete or stale environments and try the next candidate.
    }
}

if (-not $python) {
    Write-Error "No working backend environment was found. Create one and install backend/requirements.txt."
    exit 1
}

Set-Location $PSScriptRoot
Write-Host "Starting ScholarMind backend with $python"
& $python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
