param([string]$Time = "09:00")

$root = Split-Path -Parent $PSScriptRoot
$node = (Get-Command node).Source
$action = New-ScheduledTaskAction -Execute $node -Argument "`"$root\scripts\monitor.js`"" -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10) -WakeToRun
Register-ScheduledTask -TaskName "Thai PDPA Guard Monitor" -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "ติดตั้งแล้ว: รันทุกวัน $Time  (ดู/แก้ได้ใน Task Scheduler → 'Thai PDPA Guard Monitor')"
