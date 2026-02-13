#!/usr/bin/env bash
set -euo pipefail

# Package le app manifest Teams en ZIP pour upload dans Teams Admin Center.
# Remplace les placeholders ${{VAR}} par les variables d'environnement.
#
# Usage:
#   export MICROSOFT_APP_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
#   export BOT_DOMAIN="myapp.azurewebsites.net"
#   ./scripts/package-app.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE_DIR="$PROJECT_ROOT/appPackage"
BUILD_DIR="$PROJECT_ROOT/build/appPackage"
OUTPUT_ZIP="$PROJECT_ROOT/build/appPackage.zip"

# Vérification des variables requises
: "${MICROSOFT_APP_ID:?Variable MICROSOFT_APP_ID non définie}"
: "${BOT_DOMAIN:?Variable BOT_DOMAIN non définie}"

echo "==> Packaging BMAD Brainstorm Teams app..."
echo "    MICROSOFT_APP_ID=$MICROSOFT_APP_ID"
echo "    BOT_DOMAIN=$BOT_DOMAIN"

# Nettoyage et préparation
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copie et substitution des placeholders dans manifest.json
sed \
  -e "s/\\\${{MICROSOFT_APP_ID}}/$MICROSOFT_APP_ID/g" \
  -e "s/\\\${{BOT_DOMAIN}}/$BOT_DOMAIN/g" \
  "$SOURCE_DIR/manifest.json" > "$BUILD_DIR/manifest.json"

# Copie des icônes
cp "$SOURCE_DIR/color.png" "$BUILD_DIR/color.png"
cp "$SOURCE_DIR/outline.png" "$BUILD_DIR/outline.png"

# Création du ZIP
(cd "$BUILD_DIR" && zip -q "$OUTPUT_ZIP" manifest.json color.png outline.png)

echo "==> Package créé : $OUTPUT_ZIP"
echo "    Uploadez ce fichier dans Teams Admin Center > Manage apps > Upload"
