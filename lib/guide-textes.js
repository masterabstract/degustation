// Guide public « organiser une dégustation de vin à l'aveugle » (français et anglais).
// C'est la page faite pour Google : un vrai contenu utile, sans tarifs.
// Chaque section : [id, titre, contenu] ; le contenu est une liste de blocs :
//   'texte'                      paragraphe
//   ['liste', [...]]             liste à puces
//   ['etapes', [[titre, texte]]] étapes numérotées (vraie séquence)
//   ['table', [entêtes], [[...]]] tableau
//   ['sous', titre]              intertitre

export const GUIDE = {
  fr: {
    path: '/degustation-vin-aveugle',
    autre: { href: '/en/blind-wine-tasting', lang: 'en', label: 'English version' },
    metaTitre: 'Dégustation de vin à l’aveugle entre amis : le guide complet',
    metaDesc: 'Organiser une dégustation de vin à l’aveugle entre amis : matériel, nombre de vins, cacher les bouteilles, ordre de service, méthode pour deviner et barème de points.',
    titre: 'Dégustation de vin à l’aveugle : le guide pour l’organiser entre amis',
    maj: 'Mis à jour en novembre 2026',
    chapo: 'Déguster à l’aveugle, c’est goûter un vin sans savoir ce qu’il y a dans la bouteille. Ni l’étiquette, ni le prix, ni la réputation ne peuvent influencer votre jugement. Entre amis, c’est aussi un jeu : chacun essaie de deviner le pays, la région, l’appellation, le cépage et le millésime. Voici comment organiser la vôtre, étape par étape.',
    sommaire: 'Au sommaire',
    sections: [
      ['materiel', 'Ce qu’il vous faut', [
        ['liste', [
          'Des bouteilles cachées : une chaussette, un sac en tissu, du papier aluminium ou une carafe.',
          'Un verre de dégustation par personne, à pied et à large calice (le verre normalisé ISO dit « INAO » est idéal), à rincer à l’eau entre deux vins.',
          'De l’eau plate, du pain blanc ou des gressins pour se rincer la bouche.',
          'Un crachoir (un seau ou une carafe opaque suffit).',
          'Un numéro bien visible sur chaque bouteille cachée.',
          'De quoi noter : une fiche de dégustation par vin, sur papier ou sur téléphone.',
        ]],
      ]],
      ['combien', 'Combien de vins et combien de bouteilles ?', [
        'Entre 4 et 6 vins, c’est l’idéal pour une soirée : assez pour comparer, pas trop pour garder le palais et l’attention en éveil. Au-delà de 8 vins, même les dégustateurs aguerris fatiguent.',
        'Une bouteille de 75 cl donne environ 15 verres de dégustation de 5 cl : une seule bouteille par vin suffit donc jusqu’à une douzaine de personnes. La formule la plus simple et la plus amusante : chaque invité apporte une bouteille, sans dire laquelle.',
      ]],
      ['theme', 'Choisir un thème', [
        'Un thème rend la dégustation plus intéressante, car on compare des vins qui se ressemblent. Quelques idées qui marchent bien :',
        ['liste', [
          'Un seul cépage, de plusieurs pays : la Syrah du Rhône face au Shiraz d’Australie, le Sauvignon de Loire face à celui de Nouvelle-Zélande.',
          'Une seule région, plusieurs appellations : Bourgogne, Bordeaux, Vallée du Rhône…',
          'Un budget : uniquement des vins à moins de 15 €, et l’on découvre souvent que le prix ne fait pas tout.',
          'France contre reste du monde.',
          'Le « vin pirate » : un vin très différent glissé au milieu des autres, pour piéger les plus sûrs d’eux.',
        ]],
      ]],
      ['cacher', 'Cacher les bouteilles', [
        'Le plus simple est une chaussette ou un sac en tissu, fermé autour du goulot. Pensez à retirer ou couvrir la capsule, qui porte souvent le nom du domaine. La forme de la bouteille trahit aussi la région : une bouteille à épaules évoque Bordeaux, une bouteille aux flancs évasés la Bourgogne ou le Rhône, une flûte élancée l’Alsace. Pour un aveugle parfait, servez depuis une carafe.',
        'Numérotez chaque bouteille, puis mélangez-les. L’idéal est que personne ne connaisse l’ordre, pas même l’organisateur : faites tirer les numéros au sort, ou confiez la préparation à une personne qui ne joue pas.',
      ]],
      ['ordre', 'Dans quel ordre servir ?', [
        'L’ordre compte : un vin puissant écrase le suivant s’il est plus délicat. La règle classique :',
        ['etapes', [
          ['Les effervescents', 'Champagne, crémants, pétillants.'],
          ['Les blancs secs', 'Des plus légers aux plus riches.'],
          ['Les rosés', ''],
          ['Les rouges', 'Des plus légers (Gamay, Pinot noir) aux plus charpentés.'],
          ['Les vins doux et liquoreux', 'Toujours à la fin.'],
        ]],
        'À style égal, servez les vins jeunes avant les vins plus âgés. Et surveillez la température, qui change tout :',
        ['table', ['Vin', 'Température de service'], [
          ['Effervescents', '6 à 8 °C'],
          ['Blancs secs', '8 à 12 °C'],
          ['Rouges légers', '13 à 15 °C'],
          ['Rouges charpentés', '16 à 18 °C'],
        ]],
      ]],
      ['deguster', 'Déguster : l’œil, le nez, la bouche', [
        ['sous', 'L’œil'],
        'Inclinez le verre devant un fond blanc. La couleur, ou robe, renseigne déjà beaucoup : un rouge très clair évoque le Pinot noir ou le Gamay, un rouge presque noir la Syrah ou le Malbec. Avec l’âge, les rouges tirent vers le tuilé et l’orangé, les blancs vers le doré.',
        ['sous', 'Le nez'],
        'Sentez une première fois sans remuer le verre, puis faites-le tourner pour aérer le vin. On distingue trois familles d’arômes : ceux du raisin (fruits, fleurs, végétal), ceux de la fermentation (brioche, beurre) et ceux de l’élevage et du vieillissement (vanille, boisé, cuir, sous-bois).',
        ['sous', 'La bouche'],
        'Prenez une petite gorgée et faites-la circuler. Notez l’acidité (le vin fait-il saliver ?), les tanins (assèchent-ils les gencives ?), le corps, l’équilibre, et la longueur : le nombre de secondes pendant lesquelles les arômes restent en bouche après avoir craché ou avalé.',
      ]],
      ['deviner', 'Deviner le vin : une méthode simple', [
        'Personne ne reconnaît un vin d’instinct à chaque fois. Les bons dégustateurs procèdent par déduction :',
        ['etapes', [
          ['La couleur', 'Elle oriente vers une famille de cépages.'],
          ['Le climat', 'Beaucoup d’acidité et peu d’alcool évoquent un climat frais (Loire, Bourgogne, Alsace) ; un vin chaleureux et très mûr, un climat chaud (Sud de la France, Espagne, Australie).'],
          ['Le cépage', 'Les arômes et les tanins donnent la signature.'],
          ['L’âge', 'Les arômes de vieillissement et la robe orientent le millésime.'],
        ]],
        'Quelques signatures à connaître :',
        ['table', ['Cépage', 'Ce qui le trahit souvent'], [
          ['Sauvignon blanc', 'Agrumes, buis, bourgeon de cassis, grande fraîcheur'],
          ['Chardonnay', 'Beurre, noisette, brioche quand il est élevé en fût'],
          ['Gewurztraminer', 'Litchi, rose, une sensation un peu grasse'],
          ['Pinot noir', 'Robe claire, cerise, fraise, tanins fins'],
          ['Gamay', 'Fruits rouges croquants, souplesse, parfois banane'],
          ['Nebbiolo', 'Robe claire mais tanins puissants, rose et goudron'],
          ['Syrah', 'Poivre, violette, fruits noirs'],
          ['Cabernet sauvignon', 'Cassis, cèdre, parfois poivron vert'],
        ]],
      ]],
      ['points', 'Compter les points', [
        'Pour que le jeu soit juste, fixez le barème avant de commencer et appliquez-le à tout le monde de la même façon. Voici celui que nous utilisons :',
        ['table', ['Question', 'Points'], [
          ['Le pays', '2 points (5 si le vin est étranger, plus difficile)'],
          ['La région', '3 points'],
          ['L’appellation', '2 points de plus'],
          ['Le ou les cépages', '10 points, au prorata pour un assemblage'],
          ['Le millésime', '3 points pour l’année exacte, moins à chaque année d’écart'],
        ]],
        'Un vin français vaut ainsi 20 points, un vin étranger 23. Personne ne joue sur sa propre bouteille : pour comparer équitablement, on ramène chaque total à une note sur 20.',
      ]],
      ['revelation', 'La révélation', [
        'C’est le meilleur moment. Révélez les vins un par un : l’auteur de la bouteille raconte pourquoi il l’a choisie, chacun découvre ses points, et le classement se dessine. À la fin, la note moyenne de chaque vin désigne le meilleur de la soirée, et le classement des points désigne le meilleur nez. Prévoyez quelques trophées amusants : le meilleur sur les cépages, sur les régions, sur les millésimes… et la lanterne rouge.',
      ]],
      ['pieges', 'Les pièges à éviter', [
        ['liste', [
          'Le parfum ou l’eau de toilette : ils brouillent le nez de toute la tablée.',
          'Trop de vins : au-delà de 6 à 8, on ne distingue plus grand-chose.',
          'Des bouteilles reconnaissables : capsule, forme, bouchon en verre…',
          'Commencer par le vin le plus puissant.',
          'Des verres trop petits ou trop remplis : un fond de verre suffit pour bien sentir.',
        ]],
      ]],
      ['moderation', 'Avec modération', [
        'Une dégustation n’est pas une beuverie : un crachoir sur la table, de l’eau à volonté, de quoi manger, et une solution pour rentrer (conducteur qui ne boit pas, taxi, transports). L’abus d’alcool est dangereux pour la santé, à consommer avec modération.',
      ]],
    ],
    app: {
      titre: 'Une appli pour tout gérer sur les téléphones',
      texte: 'Nous avons créé La Confrérie du Pif pour nos propres soirées : chacun enregistre sa bouteille en secret sur son téléphone, pronostique avec une carte des régions viticoles, et l’appli calcule les points avec ce barème, puis révèle les vins un par un avec le classement et les trophées. Les invités n’ont rien à installer.',
      bientot: 'L’appli s’ouvre bientôt à d’autres groupes. Les 10 premiers inscrits la testent gratuitement.',
    },
    faqTitre: 'Questions fréquentes',
    faq: [
      ['Comment cacher une bouteille de vin pour une dégustation à l’aveugle ?', 'Glissez-la dans une chaussette ou un sac en tissu fermé autour du goulot, et couvrez la capsule. Pour un aveugle parfait, servez depuis une carafe, car la forme de la bouteille peut trahir la région.'],
      ['Combien de vins prévoir pour une dégustation à l’aveugle ?', 'Entre 4 et 6 vins pour une soirée. Au-delà de 8, le palais et l’attention fatiguent.'],
      ['Combien de personnes pour une bouteille ?', 'Une bouteille de 75 cl donne environ 15 verres de dégustation de 5 cl : elle suffit jusqu’à une douzaine de dégustateurs.'],
      ['Dans quel ordre servir les vins ?', 'Effervescents, blancs secs, rosés, rouges des plus légers aux plus charpentés, puis vins doux. À style égal, les jeunes avant les plus âgés.'],
      ['Comment noter une dégustation à l’aveugle ?', 'Fixez un barème avant de commencer, par exemple des points pour le pays, la région, l’appellation, les cépages et le millésime, et appliquez-le à tous de la même façon. Ramenez chaque total sur 20 pour comparer équitablement.'],
    ],
    lienOffre: 'Rejoindre une soirée avec un code',
    sante: 'L’abus d’alcool est dangereux pour la santé, à consommer avec modération. Réservé aux personnes majeures.',
  },

  en: {
    path: '/en/blind-wine-tasting',
    autre: { href: '/degustation-vin-aveugle', lang: 'fr', label: 'Version française' },
    metaTitre: 'Blind wine tasting with friends: the complete guide',
    metaDesc: 'How to host a blind wine tasting with friends: what you need, how many wines, hiding the bottles, serving order, how to guess, a scoring system and the reveal.',
    titre: 'Blind wine tasting: how to host one with friends',
    maj: 'Updated November 2026',
    chapo: 'Tasting blind means tasting a wine without knowing what’s in the bottle. The label, the price and the reputation can’t sway your judgement. Among friends it’s also a game: everyone tries to guess the country, region, appellation, grape and vintage. Here’s how to host yours, step by step.',
    sommaire: 'Contents',
    sections: [
      ['materiel', 'What you need', [
        ['liste', [
          'Hidden bottles: a sock, a cloth bag, kitchen foil or a decanter.',
          'One tasting glass per person, stemmed with a wide bowl (the ISO tasting glass is ideal), rinsed with water between wines.',
          'Still water and plain bread or breadsticks to clean the palate.',
          'A spittoon (an opaque bucket or jug will do).',
          'A clearly visible number on each hidden bottle.',
          'Something to take notes on: one tasting sheet per wine, on paper or on a phone.',
        ]],
      ]],
      ['combien', 'How many wines and bottles?', [
        'Four to six wines is ideal for an evening: enough to compare, not so many that palates and attention fade. Beyond eight, even seasoned tasters tire.',
        'A 75 cl bottle gives about 15 tasting pours of 5 cl, so one bottle per wine is enough for up to a dozen people. The simplest and most fun format: each guest brings one bottle without saying which.',
      ]],
      ['theme', 'Pick a theme', [
        'A theme makes the tasting more interesting, because you compare wines that have something in common. A few ideas that work well:',
        ['liste', [
          'One grape, several countries: Rhône Syrah against Australian Shiraz, Loire Sauvignon against New Zealand.',
          'One region, several appellations: Burgundy, Bordeaux, the Rhône…',
          'A budget: only wines under €15, and price often turns out not to be everything.',
          'France against the rest of the world.',
          'The “pirate wine”: a very different wine slipped in among the others to trip up the overconfident.',
        ]],
      ]],
      ['cacher', 'Hide the bottles', [
        'A sock or cloth bag tied around the neck is the easiest. Remove or cover the capsule, which often shows the estate’s name. The bottle shape also gives the region away: high shoulders suggest Bordeaux, sloping shoulders Burgundy or the Rhône, a tall slim flute Alsace. For a truly blind tasting, serve from a decanter.',
        'Number each bottle and shuffle them. Ideally nobody knows the order, not even the host: draw the numbers at random, or ask someone who isn’t playing to prepare them.',
      ]],
      ['ordre', 'Serving order', [
        'Order matters: a powerful wine overwhelms a more delicate one that follows. The classic rule:',
        ['etapes', [
          ['Sparkling wines', 'Champagne, crémant, other sparkling wines.'],
          ['Dry whites', 'From the lightest to the richest.'],
          ['Rosés', ''],
          ['Reds', 'From the lightest (Gamay, Pinot Noir) to the most structured.'],
          ['Sweet wines', 'Always last.'],
        ]],
        'Within the same style, serve younger wines before older ones. And mind the temperature, it changes everything:',
        ['table', ['Wine', 'Serving temperature'], [
          ['Sparkling', '6 to 8 °C'],
          ['Dry whites', '8 to 12 °C'],
          ['Light reds', '13 to 15 °C'],
          ['Structured reds', '16 to 18 °C'],
        ]],
      ]],
      ['deguster', 'Tasting: eye, nose, palate', [
        ['sous', 'The eye'],
        'Tilt the glass against a white background. The colour already says a lot: a very pale red suggests Pinot Noir or Gamay, an almost black one Syrah or Malbec. With age, reds turn brick and orange, whites golden.',
        ['sous', 'The nose'],
        'Smell once without moving the glass, then swirl to let the wine breathe. Aromas come in three families: from the grape (fruit, flowers, green notes), from fermentation (brioche, butter) and from ageing (vanilla, oak, leather, forest floor).',
        ['sous', 'The palate'],
        'Take a small sip and move it around. Note the acidity (does it make you salivate?), the tannins (do they dry your gums?), the body, the balance, and the length: how many seconds the flavours linger after you spit or swallow.',
      ]],
      ['deviner', 'Guessing the wine: a simple method', [
        'Nobody recognises a wine by instinct every time. Good tasters work by deduction:',
        ['etapes', [
          ['Colour', 'It points to a family of grapes.'],
          ['Climate', 'High acidity and modest alcohol suggest a cool climate (Loire, Burgundy, Alsace); a warm, very ripe wine a hot one (southern France, Spain, Australia).'],
          ['Grape', 'Aromas and tannins give the signature.'],
          ['Age', 'Ageing aromas and colour point to the vintage.'],
        ]],
        'A few signatures worth knowing:',
        ['table', ['Grape', 'What often gives it away'], [
          ['Sauvignon Blanc', 'Citrus, boxwood, blackcurrant bud, great freshness'],
          ['Chardonnay', 'Butter, hazelnut, brioche when oak-aged'],
          ['Gewurztraminer', 'Lychee, rose, a slightly oily texture'],
          ['Pinot Noir', 'Pale colour, cherry, strawberry, fine tannins'],
          ['Gamay', 'Crunchy red fruit, softness, sometimes banana'],
          ['Nebbiolo', 'Pale colour but powerful tannins, rose and tar'],
          ['Syrah', 'Pepper, violet, black fruit'],
          ['Cabernet Sauvignon', 'Blackcurrant, cedar, sometimes green pepper'],
        ]],
      ]],
      ['points', 'Keeping score', [
        'To keep it fair, set the scoring before you start and apply it the same way to everyone. Here’s the one we use:',
        ['table', ['Question', 'Points'], [
          ['Country', '2 points (5 for a non-French wine, which is harder)'],
          ['Region', '3 points'],
          ['Appellation', '2 more points'],
          ['Grape(s)', '10 points, pro rata for a blend'],
          ['Vintage', '3 points for the exact year, fewer for each year off'],
        ]],
        'A French wine is worth 20 points, a non-French wine 23. Nobody plays on their own bottle, so to compare fairly each total is converted to a score out of 20.',
      ]],
      ['revelation', 'The reveal', [
        'The best part. Reveal the wines one at a time: whoever brought the bottle explains why they chose it, everyone sees their points, and the ranking takes shape. At the end, each wine’s average score names the wine of the evening, and the points ranking names the best nose. Add a few fun trophies: best on grapes, on regions, on vintages… and a wooden spoon.',
      ]],
      ['pieges', 'Mistakes to avoid', [
        ['liste', [
          'Perfume or aftershave: it clouds everyone’s nose.',
          'Too many wines: beyond six to eight, they all blur together.',
          'Recognisable bottles: capsule, shape, glass stopper…',
          'Starting with the most powerful wine.',
          'Glasses that are too small or too full: a small pour is enough to smell properly.',
        ]],
      ]],
      ['moderation', 'Drink responsibly', [
        'A tasting isn’t a drinking session: a spittoon on the table, plenty of water, food, and a way home (a sober driver, a taxi, public transport). Alcohol abuse is dangerous for your health.',
      ]],
    ],
    app: {
      titre: 'An app to run it all on your phones',
      texte: 'We built La Confrérie du Pif (pif is French slang for nose) for our own evenings: everyone enters their bottle secretly on their phone, guesses with a map of the wine regions, and the app scores with this system, then reveals the wines one by one with the ranking and trophies. Guests have nothing to install.',
      bientot: 'The app is opening to other groups soon. The first 10 people to sign up test it for free.',
    },
    faqTitre: 'Frequently asked questions',
    faq: [
      ['How do you hide a wine bottle for a blind tasting?', 'Slip it into a sock or cloth bag tied around the neck, and cover the capsule. For a truly blind tasting, serve from a decanter, since the bottle shape can give the region away.'],
      ['How many wines for a blind tasting?', 'Four to six wines for an evening. Beyond eight, palates and attention tire.'],
      ['How many people per bottle?', 'A 75 cl bottle gives about 15 tasting pours of 5 cl, enough for up to a dozen tasters.'],
      ['What order should wines be served in?', 'Sparkling, dry whites, rosés, reds from lightest to most structured, then sweet wines. Within a style, younger before older.'],
      ['How do you score a blind tasting?', 'Set the scoring before you start, for example points for country, region, appellation, grapes and vintage, and apply it the same way to everyone. Convert each total to a score out of 20 to compare fairly.'],
    ],
    lienOffre: 'Join an evening with a code',
    sante: 'Alcohol abuse is dangerous for your health; please drink responsibly. Adults only.',
  },
};
