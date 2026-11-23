> **Attention — APK v1.2.2 :** les anciens APK assemblés manuellement échouent à l’installation. Utilisez une compilation Android officielle. Voir [CONSTRUIRE_APK_FR.md](CONSTRUIRE_APK_FR.md) ou le workflow GitHub Actions inclus. Ce ZIP est le code source, pas un APK testé.

# CraftCrousty Car — Android

**Application :** CraftCrousty Car  
**Développée par :** Crafti  
**Langue :** français  
**Plateforme :** Android 8.0 (API 26) et versions ultérieures  
**Version du projet :** 1.2.1 (prototype fonctionnel)

## Correctif APK 1.2.1

La version 1.2.1 corrige un défaut dans les tailles des blocs du manifeste binaire de l’APK distribué précédemment. L’APK fourni séparément a été réaligné, signé avec les schémas v1 et v2, et contrôlé statiquement (ZIP, manifest XML, DEX, digests et signatures). Cela ne garantit pas son installation sur tous les téléphones : aucun émulateur Android ou appareil réel n’était disponible pour exécuter l’APK dans cet environnement. L’APK garde le certificat des versions précédentes, et le numéro de version est augmenté pour permettre une mise à jour.

## Nouveauté 1.2 : galeries de photos réelles

Sur chaque fiche automobile, un nouvel onglet **Photos** recherche des photographies sur **Wikimedia Commons**, uniquement lorsque l'appareil est connecté. Une photographie est présentée sur la fiche principale lorsqu'un fichier compatible est trouvé. La galerie affiche jusqu'à 8 vues en les associant à un crédit et à la licence connue ainsi qu'à un lien vers la page de la photo originale. Les photos sont recherchées à la demande et **ne sont pas incluses dans l'APK**. Elles ne sont pas garanties pour chacune des 2 558 références, surtout pour les versions ou modèles peu documentés, et il peut rester des variantes différentes des années recherchées. Les photos ne sont pas produites par intelligence artificielle et l'application indique clairement l'indisponibilité de certaines images. La source de chaque fichier doit être vérifiée avant toute réutilisation commerciale.

## Rappel 1.1 : sélectionner chaque pièce du moteur

Dans **Atelier 3D > Moteur**, l’utilisateur ouvre une vue 3D pédagogique d’un moteur thermique quatre cylindres. Il peut toucher un composant sur la scène, ou le sélectionner dans une liste accessible au doigt. La pièce est mise en évidence et une fiche décrit son rôle, son fonctionnement et les points de contrôle/entretien. La vue assemblée ou éclatée facilite l’inspection. **16 types de pièces** sont décrits, y compris pistons, bielles, vilebrequin, culasse, bougies et injecteurs. Ces données sont pédagogiques et générales : elles ne sont pas des fiches techniques spécifiques aux 2 558 références, et les moteurs électriques ont une architecture différente.

## Ce qui est inclus

- **2 558 références automobiles intégrées**, correspondant à des noms de modèles **et de versions** issus de **81 marques** ; consultables hors ligne, sans compte ni API obligatoire.
- Recherche par marque ou modèle, filtre par marque et groupes de pays, chargement paginé et favoris locaux.
- Fiche de chaque référence, marque, modèle et série si connue.
- Onglet **Photos** avec galerie interactive de photographies authentiques Wikimedia Commons, attribution/licence/lien pour chaque œuvre et représentation par défaut dessinée si aucune photo vérifiable n'est trouvée. Les chiffres techniques non confirmés restent volontairement vides plutôt que fictifs.
- Histoire : environ 29 présentations historiques introductives embarquées ; recherche d'un résumé sur Wikipédia en français pour les autres lorsque le réseau est disponible et qu'une correspondance paraît suffisamment précise.
- **Vue 3D interactive** (projection en perspective + faces polygonales) : rotation au doigt, zoom, sélection des surfaces, zones mécaniques isolables, vue éclatée schématique.
- Zones : **carrosserie, moteur, roues/pneus, freinage, habitacle, transmission, suspension**.
- Catalogue externe additionnel **Car Makes & Models Data (2019)** de **116 marques et 2 157 modèles**, téléchargé et stocké en cache si Internet est disponible. Les références identiques sont dédoublonnées, sans retirer le catalogue local.

### Limites importantes

1. La 3D est un **modèle pédagogique de voiture générique**, différent d'un véritable scan 3D de chaque modèle et non conforme aux plans constructeurs. Un rendu 3D unique pour 1 250+ voitures exigerait l'acquisition ou la production de plus de 1 250 assets GLB/GLTF autorisés, ainsi qu'un référentiel des pièces propre à chaque motorisation et millésime.
2. Les 2 558 références hors ligne englobent **noms commerciaux, versions et déclinaisons**. Ce chiffre ne doit pas être interprété comme 2 558 véhicules 3D précis ou 2 558 fiches techniques exhaustives.
3. Les histoires ne sont pas toutes pré-rédigées. Wikipédia peut ne pas avoir de page correspondante ou ne pas être accessible ; l'application le signale honnêtement. Certaines fiches historiques sont seulement introductives.
4. Les données du catalogue de départ sont une sélection de noms et ne garantissent pas la couverture exhaustive de chaque marché, millésime et version.

## Ouvrir dans Android Studio

1. Installer **Android Studio** récent avec **Android SDK 35** et **JDK 17**.
2. Décompresser l'archive et ouvrir le dossier `CraftCroustyCar_AndroidStudio` dans Android Studio (option **Open**).
3. Autoriser la synchronisation Gradle et le téléchargement des dépendances (une connexion Internet est nécessaire la première fois).
4. Sélectionner un appareil Android ou un émulateur et choisir **Run ▶**.
5. Pour exporter un APK : **Build > Build Bundle(s) / APK(s) > Build APK(s)**. Le résultat se trouvera sous `app/build/outputs/apk/debug/`.

Alternativement, depuis le dossier du projet avec SDK/JDK disponibles :

```bash
./gradlew assembleDebug
```

> **Note sur le wrapper :** un petit bootstrap Java compilé et inspectable est inclus dans `gradle/wrapper/gradle-wrapper.jar`, avec sa source dans `tools/wrapper-src/`. Il télécharge et lance uniquement la distribution officielle Gradle 8.9. Il n'est **pas** le wrapper officiel fourni par Gradle. Vous pouvez le remplacer avec `gradle wrapper --gradle-version 8.9` si vous préférez l'implémentation standard.

## Démo sans Android Studio

Ouvrir `app/src/main/assets/index.html` dans un navigateur desktop ou mobile moderne pour consulter l'interface. Les fichiers `styles.css`, `catalogue-offline.js`, `app.js` et `three-d.js` doivent rester dans le même dossier. La vue 3D et la recherche fonctionnent sans serveur. Les requêtes Wikipédia et le catalogue externe peuvent dépendre des politiques CORS du navigateur ; la version Android utilise un pont Java/Kotlin dédié au téléchargement du catalogue.

## Architecture du projet

```text
app/src/main/java/com/crafti/craftcroustycar/MainActivity.kt
  └── Activity Android, WebView, navigateur externe et cache réseau
app/src/main/assets/index.html
  └── Interface et vues en français
app/src/main/assets/styles.css
  └── Design responsive Android / tablette
app/src/main/assets/catalogue-offline.js
  └── 2 558 références embarquées
app/src/main/assets/app.js
  └── Recherche, favoris, fiches, Wikipédia et catalogue externe
app/src/main/assets/three-d.js
  └── Moteur de projection 3D schématique, interactions et pièces
```

## Sources & crédits

- **CraftCrousty Car**, code, interface, rendu mécanique et contenus introductifs : réalisés pour le projet **Crafti**.
- Dataset externe facultatif : **Savage3D / Car Makes & Models Data** — [GitHub](https://github.com/Savage3D/car-makes-models-data) — MIT ; jeu de données arrêté au 30 novembre 2019, 2 157 modèles / 116 marques.
- Sources historiques en ligne lorsqu'elles sont trouvées : [Wikipédia, encyclopédie libre](https://fr.wikipedia.org/), voir les crédits et conditions de réutilisation correspondants sur les pages consultées.
- Les marques citées sont celles de leurs titulaires ; aucune affiliation, autorisation de marque ou image constructeur n'est sous-entendue.

## Pour une version commerciale plus avancée

Privilégier ensuite une base vérifiée par constructeur et millésime, un stockage local Room/SQLite, des GLB officiels ou sous licence explicite avec pièces séparées pour chaque voiture, des crédits détaillés de chaque source, une vérification des textes historiques et des tests sur appareils Android réels.

## Vérifications effectuées

- `python tools/validate_project.py` : contrôle des noms uniques, du minimum 1 250, des fichiers et de la syntaxe JavaScript.
- `node tools/validate_runtime.js` : amorçage JavaScript simulé et rendu géométrique des neuf modes de l'atelier.
- `python tools/test_photos.py` : tests navigateur de la galerie (avec réponses Wikimedia Commons simulées), changement de véhicule, absence d'image et vue 3D.
- Compilation de la source Kotlin avec un jeu de stubs Android : réussie. **Cela ne remplace pas une vraie compilation d'APK avec le SDK Android**, qui n'était pas disponible dans l'environnement de création.
