$newIp = "10.143.95.172"
$rootDirs = @(
    "c:\Users\MAYANK\Downloads\ParkEaseSmartParkingSpotFinderApication-main (1)\ParkEaseSmartParkingSpotFinderApication-main\SmartParkingSpot_Frontend\SmartParkingSpot_Frontend-main",
    "c:\Users\MAYANK\Downloads\ParkEaseSmartParkingSpotFinderApication-main (1)\ParkEaseSmartParkingSpotFinderApication-main\smartParkingProjectFontendandBackend-main\frontend"
)

foreach ($rootDir in $rootDirs) {
    Write-Host "Processing $rootDir"
    $files = Get-ChildItem -Path $rootDir -Recurse -Include *.ts, *.tsx, *.js, *.json, *.md | Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch ".git" }

    foreach ($file in $files) {
        try {
            $content = [System.IO.File]::ReadAllText($file.FullName)
            
            $newContent = $content -replace 'http://10\.\d+\.\d+\.\d+', "http://$newIp"
            $newContent = $newContent -replace '10\.96\.210\.172', $newIp
            $newContent = $newContent -replace '10\.38\.124\.172', $newIp
            $newContent = $newContent -replace '10\.38\.124\.81', $newIp
            $newContent = $newContent -replace '10\.67\.158\.86', $newIp
            
            if ($content -ne $newContent) {
                [System.IO.File]::WriteAllText($file.FullName, $newContent)
                Write-Host "Updated: $($file.FullName)"
            }
        }
        catch { }
    }
}
