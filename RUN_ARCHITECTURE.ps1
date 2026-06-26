$prompt = Get-Content "C:\Users\Charles\Desktop\Projects\Prompt studio\prompt-studio\ARCHITECTURE_PROMPT.txt" -Raw
Set-Location "C:\Users\Charles\Desktop\Projects\Prompt studio\prompt-studio"
"STARTED AT $(Get-Date)" | Out-File BUILD_LOG.txt
openclaude -p $prompt --permission-mode bypassPermissions --output-format text 2>&1 | Out-File BUILD_LOG.txt -Append
"EXIT CODE: $LASTEXITCODE" | Out-File BUILD_LOG.txt -Append
"DONE AT $(Get-Date)" | Out-File DONE.txt
