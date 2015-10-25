Penser à vérifier : 
- Chercher « font-size » et supprimer
- il ne reste pas des « flowRoot » non renommés
- le timing des diapo a bien été mis à jour
- le titre des diapo a bien été mis à jour



Procédure pour produire un svg jouable

Dans inkscape :
- ouvrir la version de travail
- enregistrer sous un autre nom "webVersion.svg"
- Convertir en Path le groupe « ToHide »
- Cacher le groupe « ToHide »
- Convertir en Path les « CurvedText » (Ctrl + F => ID:CurvedText => 26 objets trouvés)
- Convertir en Text les « Flow » (Ctrl + F => ID:Flow => 214 objets trouvés, dont 202 FlowText qui seront effectivement convertis)
- Lancer « Vaccum Defs »
- enregistrer

Puis dans un éditeur de texte :
- ouvrir « webVersion.svg »
- Chercher les attributs « style » ayant un « font-size » et supprimer (car sont définis via le CSS)
- Supprimer « @font-face » pour « poetsenone-regular », « komika_text_tightitalic » et « linux_biolinum_capitsmallcaps » (devenus inutiles car objets Text concernés ont été convertis en Path)
- Supprimer dans CSS ce qui concerne « font » pour « poetsenone-regular », « komika_text_tightitalic » et « linux_biolinum_capitsmallcaps » (devenus inutiles car objets Text concernés ont été convertis en Path) => reste seulement « fill » et « stroke »
- Remplacer dans CSS « 'Komika Text';/*'komika';*/ » par « 'komika »
- enregistrer

Puis tester (après avoir vérifié que les fonts ne sont pas préinstallées) :
- Windows XP/Firefox
- Windows XP/Chrome
- Windows XP/Opera
- Windows XP/IE
- Windows 7/Firefox
- Windows 7/Chrome
- Windows 7/IE
- Windows 8/Firefox
- Windows 8/Chrome
- Windows 8/IE
- Linux/Firefox
- Linux/Chrome
- Android/Chrome
- Android/Firefox

Procédure pour produire un pdf

Dans inkscape :
- ouvrir la version de travail
- enregistrer sous un autre nom "for-1-and-98.svg"
- Cacher le groupe « ToHide »
- Convertir en Path les « CurvedTextRunner »
- enregistrer

- exécuter : python sozi2pdf_custum.py --include=1,98 for-1-and-98.svg
- mettre de coté les deux fichiers pdf générés dans "tmp"

Dans inkscape :
- ouvrir la version de travail
- enregistrer sous un autre nom "for2to97.svg"
- Cacher le groupe « ToHide »
- Convertir en Path les « CurvedTextRunner » 
- Convertir en Text les « Flow » (Ctrl + F => ID:Flow => 214 objets trouvés, dont 202 FlowText qui seront effectivement convertis)
- Lancer « Vaccum Defs »
- enregistrer

- exécuter : python sozi2pdf_custum.py for2to97.svg
- copier dans "tmp" les deux fichiers pdf précédemment mis de coté (écraser les éxistants)
- exécuter : python sozi2pdf_custum2.py for2to97.svg

Notes :
- dans "sozi2pdf_custum.py", la ligne « subprocess.call(["phantomjs"... » n'est pas commentée
- alors que dans "sozi2pdf_custum2.py", la ligne « subprocess.call(["phantomjs"... » est commentée


