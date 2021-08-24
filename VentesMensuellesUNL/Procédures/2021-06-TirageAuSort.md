Inscription ouverte pendant les 7 derniers jours de mai 2021.
Clôture des participations le mardi 1er juin 2021 à 00h00, heure de Paris (le 31 à ~23h59)

Au début des 7 jours, j'annonce une empreinte SHA256, par exemple :  
`9a78e92fe1ca322976a9800d6c4c06079b51f9227d352818571728f4c98ec726`

À la clôture des participations, j'annonce la phrase correspondant à cette empreinte. Dans l'exemple, ce serait : 
``` 
J'aime ZY}`&%z9C\kT'a<. et le nombre 5673 !
```

Chacun peut alors entrer cette phrase dans un générateur d'empreinte pour vérifier la correspondance, par exemple sur ce site : [https://emn178.github.io/online-tools/sha256.html](https://emn178.github.io/online-tools/sha256.html)

Cette phrase référence un nombre D compris entre 1000 et 10000 (dans l'exemple, D vaut donc 5673) qui est augmenté des incréments indiqués par les participants. Pour désigner le gagnant du tirage au sort :
- chacun des P participants se voit attribuer un numéro d'arrivée, 0 pour le premier arrivée, 1 pour le deuxième, ..., P-1 pour le P-ième ;

- on calcule T, le reste de la division entière de D par P (dit autrement T = D mod P) ;

- le gagnant est celui ayant le numéro T.

Par exemple, si le nombre de participants est 10, que 5 d'entre eux ont demandé un incrément, le reste de la division entière de (5673 + 5) par 10 est 8 (5673 = 10 * 567 + 8), le gagnant est donc le 9ᵉ participant.

La clé publique fournie pour participer devra être provisionnée du montant demandé (1001 Ğ1) le jour du dépouillement, sans quoi elle ne pourra être validée. Si 7 jours après le dépouillement, le montant demandé ne m'a pas été crédité, un nouveau gagnant sera désigné.

Modalité de paiement : UNL en espèces remises en main propre ou par courrier postal.
Autres possibilités à discuter en privé. Frais de port inclus.
