# Fix encoding artifacts - uses explicit char codes to avoid terminal encoding issues
$oacute  = [char]0xF3  # ó
$aacute  = [char]0xE1  # á
$eacute  = [char]0xE9  # é
$uacute  = [char]0xFA  # ú
$iacute  = [char]0xED  # í
$ntilde  = [char]0xF1  # ñ
$copy    = [char]0xA9  # ©  (orphan from Ã©)
$sup3    = [char]0xB3  # ³  (orphan from Ã³)
$iexcl   = [char]0xA1  # ¡  (orphan from Ã¡)
$ordm    = [char]0xBA  # º  (orphan from Ãº)
$shy     = [char]0xAD  # soft hyphen (orphan from Ã­)
$plusmn  = [char]0xB1  # ±  (orphan from Ã±)
$endash  = [char]0x2013 # – en dash

foreach ($f in @(
    'c:\sistemakiosco\src\components\PosPage.jsx',
    'c:\sistemakiosco\src\components\CajaPage.jsx',
    'c:\sistemakiosco\src\components\StockPage.jsx',
    'c:\sistemakiosco\src\components\ProductosPage.jsx',
    'c:\sistemakiosco\src\components\HistorialPage.jsx',
    'c:\sistemakiosco\src\components\ReportesPage.jsx',
    'c:\sistemakiosco\src\components\LogsPage.jsx',
    'c:\sistemakiosco\src\components\UsuariosPage.jsx',
    'c:\sistemakiosco\src\components\ConfigPage.jsx',
    'c:\sistemakiosco\src\components\Topbar.jsx'
)) {
    if (-not (Test-Path $f)) { continue }
    $c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

    # Replace remaining orphaned-byte pairs (ó + orphan → correct char)
    $c = $c.Replace($oacute + $copy,   $eacute)   # ó© → é
    $c = $c.Replace($oacute + $iexcl,  $aacute)   # ó¡ → á
    $c = $c.Replace($oacute + $sup3,   $oacute)   # ó³ → ó  (strip orphan)
    $c = $c.Replace($oacute + $ordm,   $uacute)   # óº → ú
    $c = $c.Replace($oacute + $shy,    $iacute)   # ó­ → í
    $c = $c.Replace($oacute + $plusmn, $ntilde)   # ó± → ñ

    # Fix é + orphan pairs that arose if é came from a previous round
    $c = $c.Replace($eacute + $sup3,   $oacute)   # é³ → ó
    $c = $c.Replace($eacute + $shy,    $iacute)   # é­ → í
    $c = $c.Replace($eacute + $copy,   $eacute)   # é© → é (strip ©)
    $c = $c.Replace($eacute + $iexcl,  $aacute)   # é¡ → á  (from bad first-pass fix)
    $c = $c.Replace($eacute + $ordm,   $uacute)   # éº → ú
    $c = $c.Replace($eacute + $plusmn, $ntilde)   # é± → ñ

    # Fix remaining Â-prefixed chars
    $c = $c.Replace([char]0xC2 + [char]0xBF, '¿')
    $c = $c.Replace([char]0xC2 + [char]0xA1, '¡')
    $c = $c.Replace([char]0xC2 + [char]0xB7, '·')

    # En-dash artifacts: â€" (Windows-1252 for –), may appear as €" or â€" 
    $c = $c.Replace([string][char]0xE2 + [char]0x20AC + [char]0x201C, [string][char]0x2013)  # â€" → –
    $c = $c.Replace([string][char]0x20AC + [char]0x22, [string][char]0x2013)    # €" → –
    $c = $c.Replace([string][char]0x20AC + [char]0x201C, [string][char]0x2013)  # €" → –

    [System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
    Write-Host "Fixed: $(Split-Path $f -Leaf)"
}
Write-Host "All done."
