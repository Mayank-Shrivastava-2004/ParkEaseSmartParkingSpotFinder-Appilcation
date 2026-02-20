$currentIp = "10.38.124.81"
$files = Get-ChildItem -Path "c:\Users\MAYANK\Downloads\ParkEaseSmartParkingSpotFinderApication-main (1)\ParkEaseSmartParkingSpotFinderApication-main\SmartParkingSpot_Frontend\SmartParkingSpot_Frontend-main" -Recurse -Include *.ts, *.tsx | Where-Object { $_.FullName -notmatch "node_modules" }
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ($content -match "10\.\d+\.\d+\.\d+") {
        $newContent = $content -replace "10\.\d+\.\d+\.\d+", $currentIp
        [System.IO.File]::WriteAllText($file.FullName, $newContent)
        Write-Host "Updated $($file.FullName) to $currentIp"
    }
}
