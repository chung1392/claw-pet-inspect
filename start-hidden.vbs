Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\a_shi\claw-pet"
WshShell.Run """C:\Users\a_shi\claw-pet\node_modules\electron\dist\electron.exe"" .", 0, False
