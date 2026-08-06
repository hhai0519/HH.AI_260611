$path = '<USER_HOME>\Desktop\HH.AI_260806\00_Master_Menu.ps1'
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
# [MED-05] 確保 UTF8 無 BOM 寫出
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
