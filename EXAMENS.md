# Examens (jury)

**Candidat** : Accueil › Examens → compose dans le temps imparti → envoie sa copie. La feuille contient
1) Références du candidat, 2) Réponses, 3) Résultats (réservé au jury). Le chronomètre est tenu par le serveur.
Si le réseau coupe, la copie reste sur le téléphone (bouton « Renvoyer », ou secours WhatsApp).

**Président du jury** : Plus › Admin › saisir le jeton administrateur (ADMIN_TOKEN) › « Ouvrir le jury ».
Créer un examen (questions séparées par une ligne vide ; `[10]` en début = 10 points) › l'ouvrir › recevoir les copies
› noter question par question › « Publier les résultats » (les candidats voient alors note, mention, rang, appréciation).

Règles : une copie par candidat ; sujet figé dès la 1re copie ; copie hors délai acceptée mais signalée ;
mentions sur 20 : <10 Ajourné, 10 Passable, 12 Assez bien, 14 Bien, 16 Très bien.
Serveur : le backend Node (backend/) doit être en ligne et ACCOUNT_URL renseignée.
