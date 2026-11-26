# API de réservation de salles

Utilisez Node.js 22 à partir de la version 22.13, avec npm.

Pour lancer le projet, il vous faut aussi Docker avec Compose et un terminal.

Sur Windows, les commandes ci-dessous sont prévues pour Git Bash ou WSL.

## Tout lancer avec Docker

```bash
docker compose up --build -d --wait db api
docker compose logs api
curl -i http://localhost:3000/health
```

Avec `--wait`, Compose attend que PostgreSQL et l’API soient prêts.

Le résultat attendu est un statut 200 avec `{"status":"ok"}`.

Si le port 5432 ou 3000 est déjà occupé, arrêtez le service qui l’utilise ou changez le premier port de la ligne correspondante dans `compose.yaml`.

Si vous changez le port de l’API côté poste, mettez-le aussi dans l’URL que vous appelez.

Si vous lancez l’API depuis le code avec un autre port PostgreSQL, ajustez `DATABASE_URL` dans `.env`.

## Relancer l’API depuis le code

Si vous modifiez le code, vous pouvez lancer l’API depuis le terminal et garder PostgreSQL dans Docker.

```bash
docker compose stop api
docker compose up -d --wait db
test -f .env || cp .env.example .env
npm ci
npm run build
npm start
```

`DATABASE_URL` indique où joindre PostgreSQL.

`PORT` indique où l’API écoute.

## Essayer les routes

```bash
curl -i http://localhost:3000/salles \
  -H 'Content-Type: application/json' \
  -d '{"nom":"Salle 204"}'
```

Reprenez l’identifiant renvoyé dans la réponse.

L’exemple utilise la salle 1.

```bash
curl -i http://localhost:3000/reservations \
  -H 'Content-Type: application/json' \
  -d '{"salleId":1,"debut":"2030-10-15T09:00:00Z","fin":"2030-10-15T10:00:00Z"}'
```

Rejouez cette commande pour obtenir un conflit.

Essayez ensuite avec un début à 10 h et une fin à 11 h.

| Méthode et route | Requête | Succès | Erreurs attendues |
| --- | --- | --- | --- |
| GET /health | | 200 | 503 si PostgreSQL est indisponible |
| GET /salles | | 200 | |
| POST /salles | nom | 201 | 400 pour un nom vide ou trop long |
| DELETE /salles/:id | identifiant dans l’URL | 204 | 400 si identifiant invalide, 404 si absente, 409 si réservations |
| GET /reservations | | 200 | |
| POST /reservations | salleId, debut, fin | 201 | 400 pour une entrée invalide, 404 si salle absente, 409 si conflit |
| DELETE /reservations/:id | identifiant dans l’URL | 204 | 400 si identifiant invalide, 404 si absente |
| GET /salles/disponibles | debut, fin en query | 200 | 400 si date absente, invalide ou fin ≤ début |

Les dates sont en UTC, avec un `Z` final.

La fin est exclue du créneau.

Une réservation de 9 h à 10 h peut donc être suivie d’une autre à 10 h.

## Fichiers à lire

- `src/main.ts` démarre NestJS.
- `src/app.ts` reçoit les requêtes et enregistre les réservations.
- `src/regles.ts` contient la validation des dates et le calcul du chevauchement.
- `src/database.ts` ouvre la connexion à PostgreSQL et crée les tables au démarrage.

## Vérifications de départ

```bash
npm ci
npm run lint
npm run test:starter
npm run build
```

Le test fourni sert à vérifier que Jest démarre.

La suite de tests complète fait partie du TP du mercredi.

Le fichier [openapi.yaml](openapi.yaml) décrit les requêtes et les réponses.

Vous pouvez l’ouvrir dans un éditeur OpenAPI pour parcourir les routes.


## Déployer sur Render

Le fichier [render.yaml](render.yaml) crée un service web Docker et une base PostgreSQL 16, tous les deux en Free à Francfort.

Render fournit la connexion interne à PostgreSQL dans `DATABASE_URL`.

Pour le TP, lancez ce Blueprint depuis l’espace Hobby de votre binôme et choisissez la branche `main`.

[Déployer un Blueprint sur Render](https://render.com/docs/infrastructure-as-code#setup)
