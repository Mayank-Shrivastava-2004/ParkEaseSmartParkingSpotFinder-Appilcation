$newIp = "10.67.158.172"
$rootPath = "c:\Users\MAYANK\Downloads\ParkEaseSmartParkingSpotFinderApication-main (1)\ParkEaseSmartParkingSpotFinderApication-main"

# Directories to search
$searchPaths = @(
    "$rootPath\SmartParkingSpot_Frontend\SmartParkingSpot_Frontend-main",
    "$rootPath\smartParkingProjectFontendandBackend-main\frontend"
)

# Pattern for IP addresses
$ipPattern = "\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        Write-Host "Processing $path..."
        $files = Get-ChildItem -Path $path -Recurse -Include *.ts, *.tsx, *.js, *.json | Where-Object { $_.FullName -notmatch "node_modules" }
        
        foreach ($file in $files) {
            $content = [System.IO.File]::ReadAllText($file.FullName)
            if ($content -match $ipPattern) {
                # Only replace if it's NOT the correct IP already
                # actually it's safer to just replace everything that looks like an IP but exclude 127.0.0.1
                $modified = $false
                $newContent = [regex]::Replace($content, $ipPattern, {
                        param($m)
                        if ($m.Value -eq "127.0.0.1" -or $m.Value -eq "10.0.2.2") {
                            return $m.Value
                        }
                        if ($m.Value -ne $newIp) {
                            $script:modified = $true
                            return $newIp
                        }
                        return $m.Value
                    })
                
                if ($modified) {
                    [System.IO.File]::WriteAllText($file.FullName, $newContent)
                    Write-Host "Updated: $($file.FullName)"
                }
            }
        }
    }
}

Write-Host "IP update complete! Current IP: $newIp"
