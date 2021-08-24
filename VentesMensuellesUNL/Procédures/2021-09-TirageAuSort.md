## Chronologie 

Inscription ouverte pendant les 7 derniers jours d'août 2021.

Clôture des participations le mercredi 1er septembre 2021 à 00h00, heure de Paris (le 31 à ~23h59)

Si 7 jours après le dépouillement, le montant demandé ne m'a pas été crédité, un nouveau gagnant sera désigné.

## Condition pour participer

Chaque acheteur doit indiquer (en commentaire de l'annonce ĞChange) la clé publique qu'il compte utiliser pour la transaction. A côté, il peut éventuellement ajouter "+1" pour signifier qu'il veut ajouter un incrément au tirage (usage détaillé plus bas).

La participation ne sera validée qu'à deux conditions :
- la clé publique fournie devra, d'ci le jour du dépouillement, être provisionnée du montant demandé (1001 Ğ1) ;
- le contrôle de la clé publique devra avoir été prouvé. 

Un participant a deux moyens pour prouver le contrôle de la clé qu'il fournit :
- m'avoir envoyé un mail via la messagerie Césium depuis le compte associé à cette clé ;
- avoir réalisé un virement de 1 Ğ1 (par exemple vers un autre de ses comptes).

## Comment est effectué le tirage au sort

Au début des 7 jours, j'annonce une empreinte SHA256, par exemple :  
`9a78e92fe1ca322976a9800d6c4c06079b51f9227d352818571728f4c98ec726`

À la clôture des participations, j'annonce la phrase correspondant à cette empreinte. Dans l'exemple, ce serait :  
```
J'aime ZY}`&%z9C\kT'a<. et le nombre 5673 !
```

Chacun peut alors entrer cette phrase dans un générateur d'empreinte pour vérifier la correspondance, par exemple sur ce site : [https://emn178.github.io/online-tools/sha256.html](https://emn178.github.io/online-tools/sha256.html)

Cette phrase contient une partie avec des caratères aléatoires (ce que l'on appelle un [sel](https://fr.wikipedia.org/wiki/Salage_(cryptographie)) en cryptographie) qu'il convient d'ignorer ; puis une partie référence un nombre D compris entre 1000 et 10000 _(dans l'exemple, D vaut donc 5673)_. Ce nombre est augmenté des incréments indiqués par les participants. Pour désigner le gagnant du tirage au sort :

- chacun des P participants se voit attribuer un numéro d'arrivée, 0 pour le premier arrivée, 1 pour le deuxième, ..., P-1 pour le P-ième ;

- on calcule T, le reste de la division entière de D par P (dit autrement T = D mod P) ;

- le gagnant est celui ayant le numéro T.

_Par exemple, si le nombre de participants est 10, que 5 d'entre eux ont demandé un incrément, le reste de la division entière de (5673 + 5) par 10 est 8 (5678 = 10 * 567 + 8), le gagnant est donc le 9ᵉ participant._

## Modalité de paiement 

UNL en espèces remises en main propre ou par courrier postal (vers la France, DOM-TOM compris).

Autres possibilités à discuter en privé. 

Frais de port inclus.

