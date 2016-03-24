#!/usr/bin/env bash

set -e

replace() {
  case $(uname) in
    Darwin*) sedi=('-i' '') ;;
    *) sedi='-i' ;;
  esac

  LC_ALL=C sed "${sedi[@]}" "s/$(echo $1 | sed -e 's/\([[\/.*]\|\]\)/\\&/g')/$(echo $2 | sed -e 's/[\/&]/\\&/g')/g" $3
}

declare file="$1"
declare destination="${2:-./tmp}"

[[ -z "$file" ]] && echo 'no such file' && exit 1

cp "$file" "$destination"
replace 'export declare ' 'export ' "$destination"

# wrap in declaration:
echo 'declare module' "'aurelia-cycle'" {$'\n'"$(< "$destination")"$'\n'} > "$destination"

# echo 'declare module' "'aurelia-cycle'" '{' > "$destination"
# echo "$(< "$file")" >> "$destination"
# echo '}' >> "$destination"

