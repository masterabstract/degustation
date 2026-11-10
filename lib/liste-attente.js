// Liste d'attente de la page de vente : réglages partagés entre le serveur et la page.
export const PLACES_ESSAI = 10; // les 10 premiers inscrits peuvent essayer gratuitement
export const GROUPES = ['2 à 5 personnes', '6 à 10 personnes', '11 à 15 personnes', 'Plus de 15'];
export const TARIFS = { soiree: 1.99, mensuel: 2.99, annuel: 29.99 };
export const prix = (n) => `${n.toFixed(2).replace('.', ',')} €`;
