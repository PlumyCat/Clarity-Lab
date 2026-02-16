# StormMate - User Stories

## STORY-001 : Icone du bot dans la conversation Teams

**Priorite** : Haute
**Status** : TODO

### Description

En tant qu'organisateur de reunion, je veux que l'icone affichee dans la conversation Teams soit la nouvelle icone StormMate (robot brainstorming) et non l'icone par defaut, afin que le bot soit facilement identifiable et professionnel.

### Contexte

Les icones `color.png` (192x192) et `outline.png` (32x32) ont ete mises a jour dans le manifest (v1.0.3), mais l'icone affichee dans le fil de conversation Teams reste l'ancienne. Cela peut etre lie au cache Teams ou a la configuration de l'App Registration / Bot Service dans Azure.

### Criteres d'acceptation

- [ ] L'icone color.png du bot est visible dans la liste des conversations
- [ ] L'icone outline.png est visible dans les mentions @StormMate
- [ ] L'icone apparait correctement en chat 1:1 et en group chat
- [ ] L'icone persiste apres redemarrage de Teams

### Actions a investiguer

1. Verifier l'icone configuree sur le Bot Service Azure (portail > Bot Services > Settings > Icon)
2. Uploader la nouvelle icone directement sur le Bot Service Azure
3. Si cache Teams : desinstaller/reinstaller l'app dans Teams
4. Verifier que le manifest uploade contient bien les bons PNG

### Estimation : XS (< 1h)

---

## STORY-002 : Mode Transcript - Interaction vocale via copier-coller

**Priorite** : Moyenne
**Status** : TODO

### Description

En tant qu'organisateur de reunion, je veux pouvoir laisser les participants discuter librement a l'oral pendant un tour, puis soumettre le transcript de la conversation au bot, afin de reduire les interactions directes avec StormMate et rendre le brainstorming plus naturel.

### Contexte

Actuellement, chaque participant doit mentionner `@StormMate` pour soumettre ses idees en group chat. C'est contraignant et casse le flux creatif. Teams permet d'activer le transcript en direct pendant une reunion. L'organisateur peut le copier-coller comme input au bot.

### User Flow

1. **Start** : L'organisateur lance `@StormMate start` en reunion
   - StormMate affiche un rappel : "Pensez a activer le transcript de la reunion (... > Record and transcribe)"
2. **Debut de tour** : StormMate affiche la consigne du tour avec un bouton **"Go"**
   - L'organisateur clique **Go** → StormMate affiche : "Les participants peuvent discuter. Cliquez sur **Soumettre le transcript** quand le tour est termine."
3. **Discussion libre** : Les participants parlent normalement (pas besoin de taper ou mentionner le bot)
4. **Fin de tour** : L'organisateur clique **"Soumettre le transcript"**
   - Une card s'ouvre avec un champ texte large (multiline)
   - L'organisateur copie-colle le transcript depuis Teams
   - Clique **Envoyer**
5. **Traitement** : StormMate analyse le transcript comme s'il avait recu les idees individuellement
   - Extraction des idees, attribution aux participants si possible
   - Synthese et passage au tour suivant

### Criteres d'acceptation

- [ ] Rappel d'activation du transcript affiche au `start` en contexte reunion
- [ ] Bouton "Go" pour lancer la phase de discussion libre
- [ ] Timer ou indicateur visuel pendant la discussion (optionnel)
- [ ] Bouton "Soumettre le transcript" avec champ texte multiline
- [ ] Le bot parse correctement un transcript Teams (format horodatage + nom + texte)
- [ ] Les idees extraites du transcript sont integrees dans la session comme des contributions normales
- [ ] Fallback : le mode actuel (mention @StormMate) reste disponible

### Dependances

- Comprendre le format exact du transcript Teams (live captions vs downloaded transcript)
- Tester la longueur maximale d'un champ texte dans une Adaptive Card (limite ~28KB)

### Estimation : M (2-4h)

---
