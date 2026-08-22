# claw-pet hook for Git Bash / bash
# Add to ~/.bashrc:  source /c/Users/user/claw-pet-inspect/hooks/bashrc-snippet.sh

CLAW_PET_URL="http://127.0.0.1:4848/event"
_claw_pet_armed=1

_claw_pet_send() {
  curl -s -m 1 -X POST "$CLAW_PET_URL" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"$1\"}" >/dev/null 2>&1 &
}

# fires just before each command actually runs
_claw_pet_preexec() {
  [ -n "$COMP_LINE" ] && return
  [ "$BASH_COMMAND" = "$PROMPT_COMMAND" ] && return
  if [ "$_claw_pet_armed" = 1 ]; then
    _claw_pet_armed=0
    _claw_pet_send "start"
  fi
}
trap '_claw_pet_preexec' DEBUG

# fires right before the next prompt is drawn, i.e. after the command finished
_claw_pet_notify() {
  local code=$?
  local status="success"
  [ "$code" -ne 0 ] && status="fail"
  _claw_pet_send "$status"
  _claw_pet_armed=1
  return $code
}

case "$PROMPT_COMMAND" in
  *_claw_pet_notify*) ;;
  "") PROMPT_COMMAND="_claw_pet_notify" ;;
  *) PROMPT_COMMAND="_claw_pet_notify; $PROMPT_COMMAND" ;;
esac
