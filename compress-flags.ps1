# compress-flags.ps1
# Run from V:\HotTag\hottag\
# Requires PowerShell 7+ or install System.Drawing

Add-Type -AssemblyName System.Drawing

$flagDir = "V:\HotTag\hottag\public\flags"
$outDir = "V:\HotTag\hottag\public\flags"

# JPEG quality (0-100). 80 gives great quality at ~200-300KB
$quality = 80L

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $quality)

$maxWidth = 1920
$maxHeight = 1080

Get-ChildItem "$flagDir\*.png" | ForEach-Object {
    $name = $_.BaseName
    $outPath = Join-Path $outDir "$name.jpg"
    
    Write-Host "Processing $($_.Name) ($([math]::Round($_.Length / 1MB, 1))MB)..."
    
    $img = [System.Drawing.Image]::FromFile($_.FullName)
    
    # Calculate resize dimensions
    $ratioW = $maxWidth / $img.Width
    $ratioH = $maxHeight / $img.Height
    $ratio = [Math]::Min($ratioW, $ratioH)
    
    if ($ratio -lt 1) {
        $newW = [int]($img.Width * $ratio)
        $newH = [int]($img.Height * $ratio)
    } else {
        $newW = $img.Width
        $newH = $img.Height
    }
    
    $resized = New-Object System.Drawing.Bitmap($newW, $newH)
    $graphics = [System.Drawing.Graphics]::FromImage($resized)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, $newW, $newH)
    
    $resized.Save($outPath, $encoder, $encoderParams)
    
    $newSize = (Get-Item $outPath).Length
    Write-Host "  -> $name.jpg ($([math]::Round($newSize / 1KB))KB)" -ForegroundColor Green
    
    $graphics.Dispose()
    $resized.Dispose()
    $img.Dispose()
}

Write-Host "`nDone! Now delete the old PNGs:"
Write-Host "  Remove-Item $flagDir\*.png -Exclude README.md"
Write-Host "Then commit and push."
