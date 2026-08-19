@echo off
title NodeAgent Studio - Portable Launcher
cd /d "%~dp0"

echo ================================================================
echo           NodeAgent Studio - Portable AI Pipeline
echo ================================================================
echo.

if exist "python_embeded\python.exe" goto START_SERVER

echo [*] Ilk kurulum tespit edildi. Izole Python ortami hazirlaniyor...
echo [*] Bilgisayarinizdaki ortam asla degistirilmeyecektir.
echo.

echo [1/4] Gomulu Python 3.10 indiriliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://www.python.org/ftp/python/3.10.11/python-3.10.11-embed-amd64.zip', 'python_embed.zip')"
if not exist "python_embed.zip" (
    echo [HATA] Python paketi indirilemedi. Lutfen internet baglantinizi kontrol edin.
    goto ON_ERROR
)

echo [2/4] Arsiv aciliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Force -Path 'python_embed.zip' -DestinationPath 'python_embeded'"
del /f /q python_embed.zip >nul 2>&1

echo [*] Python site-packages yapilandiriliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$pth = Get-Content 'python_embeded\python310._pth'; $pth = $pth -replace '#import site', 'import site'; Set-Content 'python_embeded\python310._pth' $pth"

echo [3/4] Pip paket yoneticisi kuruluyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://bootstrap.pypa.io/get-pip.py', 'get-pip.py')"
python_embeded\python.exe get-pip.py --no-warn-script-location
del /f /q get-pip.py >nul 2>&1

echo [4/4] PyTorch CUDA ve AI kutuphaneleri kuruluyor...
echo (Bu islem internet baglanti hizina bagli olarak birkac dakika surebilir...)
python_embeded\python.exe -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121 --no-warn-script-location
python_embeded\python.exe -m pip install -r requirements.txt --no-warn-script-location

echo.
echo [BASARILI] Tum kurulumlar tamamlandi!
echo ================================================================
echo.

:START_SERVER
echo [*] Onceki calisan oturumlar kontrol ediliyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000"') do (
    echo [*] Eski oturum sonlandiriliyor [PID: %%a]
    taskkill /F /PID %%a >nul 2>&1
)

echo [*] Masaustu kisayolu kontrol ediliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$wshell = New-Object -ComObject WScript.Shell; $shortcutPath = [Environment]::GetFolderPath('Desktop') + '\NodeAgent Studio.lnk'; $dir = '%~dp0'.TrimEnd('\'); $shortcut = $wshell.CreateShortcut($shortcutPath); $shortcut.TargetPath = $dir + '\run.bat'; $shortcut.WorkingDirectory = $dir; $shortcut.Description = 'NodeAgent Studio - Portable AI Pipeline'; if (Test-Path ($dir + '\icon.ico')) { $shortcut.IconLocation = $dir + '\icon.ico' }; $shortcut.WindowStyle = 7; $shortcut.Save();"

echo [*] NodeAgent Studio masaustu uygulamasi baslatiliyor...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\launcher.ps1"

if %ERRORLEVEL% NEQ 0 (
    goto ON_ERROR
)
goto END

:ON_ERROR
echo.
echo ================================================================
echo [HATA] Bir sorun olustu. Pencereyi kapatmak icin bir tusa basin.
echo ================================================================
pause

:END


