Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c ""%~dp0start.bat""", 0, False
