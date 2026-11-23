# CraftCrousty Car — obtenir un APK réellement compilé

**Important :** les APK v1.2 et v1.2.1 fournis auparavant avaient été assemblés manuellement sans les outils officiels d'Android. Ils ont échoué à l'installation. Ne les réutilisez pas. Ce ZIP contient le **projet source** de la v1.2.2 et un workflow de compilation standard, **pas un APK déjà testé**.

## Méthode la plus simple : Android Studio sur ordinateur

1. Décompresser l’archive.
2. Installer Android Studio (version récente), Android SDK 35 et Java 17.
3. Faire **Open**, puis sélectionner le dossier `CraftCroustyCar_AndroidStudio`.
4. Attendre la synchronisation Gradle, accepter les téléchargements nécessaires.
5. Menu **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
6. Récupérer `app/build/outputs/apk/debug/app-debug.apk` et l’envoyer sur le téléphone.

## Méthode sans installation Android Studio : GitHub Actions

Le dossier `.github/workflows/build-apk.yml` contient un job de compilation dans le cloud. Dans un dépôt GitHub contenant **le contenu du dossier du projet à la racine**, ouvrir **Actions → Fabriquer APK CraftCrousty Car → Run workflow**. Après succès, télécharger l'artifact `CraftCroustyCar-v1.2.2-APK`, le décompresser et transférer `app-debug.apk` vers Android.

Si le workflow se lance sur push `main`, l’APK est également produit automatiquement à chaque publication de mise à jour.

## Si Android affiche encore une erreur

- S’assurer que l’APK provient de la compilation Gradle officielle, et non de l’ancienne archive de 51 Ko.
- Supprimer l’ancienne version CraftCrousty Car (signature différente) avant d'installer le nouvel APK. **Cela peut effacer les favoris enregistrés localement.**
- Autoriser l'installation d'applications depuis le gestionnaire de fichiers utilisé.
- Utiliser Android 8.0 (API 26) minimum.
- Sur ordinateur avec `adb`, exécuter `adb install -r app-debug.apk` et conserver le code d'erreur précis si l'installation échoue.

## Remarque

Ce projet inclut la galerie de photos, le catalogue local de 2 558 références et la 3D pédagogique des pièces. La compilation sur GitHub ou Android Studio **reste à exécuter**. Les tests précédents concernaient le code et les pages, pas une installation sur un appareil réel.
