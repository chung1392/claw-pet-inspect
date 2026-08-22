# claw-pet hook for PowerShell
# Add to your $PROFILE (or dot-source this file from it).

$global:ClawPetUrl = 'http://127.0.0.1:4848/event'

function global:Send-ClawPetEvent {
    param([string]$Status)
    try {
        $body = @{ status = $Status } | ConvertTo-Json -Compress
        Invoke-RestMethod -Uri $global:ClawPetUrl -Method Post `
            -ContentType 'application/json' -Body $body -TimeoutSec 1 | Out-Null
    } catch {
        # pet not running: stay silent
    }
}

function global:prompt {
    $ok = $?
    $exitCode = $global:LASTEXITCODE

    if ($null -ne $exitCode -and $exitCode -ne 0) {
        Send-ClawPetEvent 'fail'
    } elseif (-not $ok) {
        Send-ClawPetEvent 'fail'
    } else {
        Send-ClawPetEvent 'success'
    }

    $global:LASTEXITCODE = $exitCode
    "PS $($executionContext.SessionState.Path.CurrentLocation)$('>' * ($nestedPromptLevel + 1)) "
}
