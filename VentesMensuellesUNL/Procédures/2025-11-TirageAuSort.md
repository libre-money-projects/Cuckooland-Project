## Chronologie 

Inscription ouverte pendant les 11 premiers jours de novembre 2025 et réservée **uniquement** aux co-producteurs de la Ğ1.

Clôture des participations le mercredi 12 novembre 2025 à 00h00, heure de Paris (ou le mardi 11 à ~23h59)

Si 7 jours après le dépouillement, le montant demandé ne m'a pas été crédité, un nouveau gagnant sera désigné.

## Validation de l'inscription

Pour participer, il faut faire un virement d'une Ğ1 (je la restituerai ensuite) depuis son compte co-producteur vers mon compte : `9BSbTC2dmvzdJKMocN86zEUN3gq4c96oDxV4TqGrLRgB:C1D`

La participation ne sera validée que si le compte est, d'ici le jour du dépouillement, provisionnée du montant demandé (90 DU de Ğ1).

Eventuellement, chaque participant-e peut indiquer (en commentaire de la transaction) un "+1" pour signifier qu'il veut ajouter un incrément au tirage (usage détaillé plus bas).

## Comment est effectué le tirage au sort

A l'annonce de la vente, j'indique une empreinte SHA256, par exemple :  
`9a78e92fe1ca322976a9800d6c4c06079b51f9227d352818571728f4c98ec726`

À la clôture des participations, j'annonce la phrase correspondant à cette empreinte. Dans l'exemple, ce serait :  
```
J'aime ZY}`&%z9C\kT'a<. et le nombre 5673 !
```

Chacun peut alors entrer cette phrase dans un générateur d'empreinte pour vérifier la correspondance, par exemple sur ce site : [https://emn178.github.io/online-tools/sha256.html](https://emn178.github.io/online-tools/sha256.html)

Cette phrase contient une partie avec des caratères aléatoires (ce que l'on appelle un [sel](https://fr.wikipedia.org/wiki/Salage_(cryptographie)) en cryptographie) qu'il convient d'ignorer ; puis une partie contient un nombre D compris entre 1000 et 10000 _(dans l'exemple, D vaut donc 5673)_. Ce nombre est augmenté des éventuelles incréments indiqués par les participants. Pour désigner le gagnant du tirage au sort :

- chacun des P personnes participantes se voit attribuer un numéro d'arrivée, 0 pour la première arrivée, 1 pour la deuxième, ..., P-1 pour la P-ième ;

- on calcule T, le reste de la division entière de D par P (dit autrement T = D mod P) ;

- le gagnant est celui ayant le numéro T.

Pour poursuivre l'exemple : _si 10 personnes participent à la vente, dont 5 ont demandé un incrément, le reste de la division entière de (5673 + 5) par 10 est 8 (5678 = 10 * 567 + 8), le gagnant est donc le 9ᵉ participant._

## Modalité de paiement 

UNL en espèces remises en main propre ou par courrier postal (vers la France, DOM-TOM compris).

Autres possibilités à discuter en privé. 

Frais de port inclus.
