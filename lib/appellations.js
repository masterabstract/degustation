// Base d'appellations pour la saisie assistée.
// Format de chaque ligne : Appellation | Région | Pays | Couleurs | Cépages principaux
// Couleurs : R = rouge, B = blanc, O = rosé, E = effervescent, D = doux / liquoreux.
// La couleur n'est remplie automatiquement que si l'appellation n'en a qu'une.
// Les cépages indiqués sont les cépages principaux ou habituels (modifiables à la saisie).

const PN = 'Pinot Noir';
const CH = 'Chardonnay';
const GAM = 'Gamay';
const BX_R = 'Merlot, Cabernet Sauvignon, Cabernet Franc';
const MED = 'Cabernet Sauvignon, Merlot';
const LIB = 'Merlot, Cabernet Franc';
const RHS = 'Grenache, Syrah, Mourvèdre';
const LGD = 'Syrah, Grenache, Mourvèdre, Carignan';
const PROV = 'Grenache, Cinsault, Syrah';

const DATA = `
# Bourgogne
Chablis|Bourgogne|France|B|${CH}
Chablis Premier Cru|Bourgogne|France|B|${CH}
Chablis Grand Cru|Bourgogne|France|B|${CH}
Petit Chablis|Bourgogne|France|B|${CH}
Irancy|Bourgogne|France|R|${PN}
Saint-Bris|Bourgogne|France|B|Sauvignon Blanc
Bourgogne|Bourgogne|France|RBO|${PN}, ${CH}
Bourgogne Aligoté|Bourgogne|France|B|Aligoté
Bouzeron|Bourgogne|France|B|Aligoté
Bourgogne Passe-Tout-Grains|Bourgogne|France|R|${PN}, ${GAM}
Coteaux Bourguignons|Bourgogne|France|RB|${PN}, ${GAM}
Bourgogne Hautes-Côtes de Nuits|Bourgogne|France|RB|${PN}, ${CH}
Bourgogne Hautes-Côtes de Beaune|Bourgogne|France|RB|${PN}, ${CH}
Bourgogne Côte d'Or|Bourgogne|France|RB|${PN}, ${CH}
Crémant de Bourgogne|Bourgogne|France|E|${CH}, ${PN}
Marsannay|Bourgogne|France|RBO|${PN}
Fixin|Bourgogne|France|R|${PN}
Gevrey-Chambertin|Bourgogne|France|R|${PN}
Chambertin|Bourgogne|France|R|${PN}
Chambertin-Clos de Bèze|Bourgogne|France|R|${PN}
Charmes-Chambertin|Bourgogne|France|R|${PN}
Mazoyères-Chambertin|Bourgogne|France|R|${PN}
Mazis-Chambertin|Bourgogne|France|R|${PN}
Latricières-Chambertin|Bourgogne|France|R|${PN}
Griotte-Chambertin|Bourgogne|France|R|${PN}
Chapelle-Chambertin|Bourgogne|France|R|${PN}
Ruchottes-Chambertin|Bourgogne|France|R|${PN}
Morey-Saint-Denis|Bourgogne|France|R|${PN}
Clos de la Roche|Bourgogne|France|R|${PN}
Clos Saint-Denis|Bourgogne|France|R|${PN}
Clos de Tart|Bourgogne|France|R|${PN}
Clos des Lambrays|Bourgogne|France|R|${PN}
Bonnes-Mares|Bourgogne|France|R|${PN}
Chambolle-Musigny|Bourgogne|France|R|${PN}
Musigny|Bourgogne|France|R|${PN}
Vougeot|Bourgogne|France|R|${PN}
Clos de Vougeot|Bourgogne|France|R|${PN}
Vosne-Romanée|Bourgogne|France|R|${PN}
Romanée-Conti|Bourgogne|France|R|${PN}
La Tâche|Bourgogne|France|R|${PN}
Richebourg|Bourgogne|France|R|${PN}
Romanée-Saint-Vivant|Bourgogne|France|R|${PN}
La Romanée|Bourgogne|France|R|${PN}
La Grande Rue|Bourgogne|France|R|${PN}
Échezeaux|Bourgogne|France|R|${PN}
Grands-Échezeaux|Bourgogne|France|R|${PN}
Nuits-Saint-Georges|Bourgogne|France|R|${PN}
Côte de Nuits-Villages|Bourgogne|France|R|${PN}
Ladoix|Bourgogne|France|RB|${PN}, ${CH}
Aloxe-Corton|Bourgogne|France|R|${PN}
Corton|Bourgogne|France|R|${PN}
Corton-Charlemagne|Bourgogne|France|B|${CH}
Pernand-Vergelesses|Bourgogne|France|RB|${PN}, ${CH}
Savigny-lès-Beaune|Bourgogne|France|RB|${PN}, ${CH}
Chorey-lès-Beaune|Bourgogne|France|R|${PN}
Beaune|Bourgogne|France|RB|${PN}, ${CH}
Côte de Beaune|Bourgogne|France|RB|${PN}, ${CH}
Côte de Beaune-Villages|Bourgogne|France|R|${PN}
Pommard|Bourgogne|France|R|${PN}
Volnay|Bourgogne|France|R|${PN}
Monthélie|Bourgogne|France|RB|${PN}, ${CH}
Auxey-Duresses|Bourgogne|France|RB|${PN}, ${CH}
Saint-Romain|Bourgogne|France|RB|${CH}, ${PN}
Meursault|Bourgogne|France|B|${CH}
Blagny|Bourgogne|France|R|${PN}
Puligny-Montrachet|Bourgogne|France|B|${CH}
Chassagne-Montrachet|Bourgogne|France|BR|${CH}, ${PN}
Montrachet|Bourgogne|France|B|${CH}
Chevalier-Montrachet|Bourgogne|France|B|${CH}
Bâtard-Montrachet|Bourgogne|France|B|${CH}
Bienvenues-Bâtard-Montrachet|Bourgogne|France|B|${CH}
Criots-Bâtard-Montrachet|Bourgogne|France|B|${CH}
Saint-Aubin|Bourgogne|France|BR|${CH}, ${PN}
Santenay|Bourgogne|France|RB|${PN}, ${CH}
Maranges|Bourgogne|France|R|${PN}
Rully|Bourgogne|France|BR|${CH}, ${PN}
Mercurey|Bourgogne|France|RB|${PN}, ${CH}
Givry|Bourgogne|France|RB|${PN}, ${CH}
Montagny|Bourgogne|France|B|${CH}
Mâcon|Bourgogne|France|BRO|${CH}, ${GAM}
Mâcon-Villages|Bourgogne|France|B|${CH}
Viré-Clessé|Bourgogne|France|B|${CH}
Saint-Véran|Bourgogne|France|B|${CH}
Pouilly-Fuissé|Bourgogne|France|B|${CH}
Pouilly-Loché|Bourgogne|France|B|${CH}
Pouilly-Vinzelles|Bourgogne|France|B|${CH}
# Beaujolais
Beaujolais|Beaujolais|France|ROB|${GAM}
Beaujolais-Villages|Beaujolais|France|R|${GAM}
Beaujolais Nouveau|Beaujolais|France|R|${GAM}
Brouilly|Beaujolais|France|R|${GAM}
Côte de Brouilly|Beaujolais|France|R|${GAM}
Chénas|Beaujolais|France|R|${GAM}
Chiroubles|Beaujolais|France|R|${GAM}
Fleurie|Beaujolais|France|R|${GAM}
Juliénas|Beaujolais|France|R|${GAM}
Morgon|Beaujolais|France|R|${GAM}
Moulin-à-Vent|Beaujolais|France|R|${GAM}
Régnié|Beaujolais|France|R|${GAM}
Saint-Amour|Beaujolais|France|R|${GAM}
# Champagne
Champagne|Champagne|France|E|${CH}, ${PN}, Pinot Meunier
Coteaux Champenois|Champagne|France|RB|${PN}, ${CH}
Rosé des Riceys|Champagne|France|O|${PN}
# Alsace
Alsace|Alsace|France|B|Riesling, Gewurztraminer, Pinot Gris
Alsace Grand Cru|Alsace|France|B|Riesling, Gewurztraminer, Pinot Gris
Crémant d'Alsace|Alsace|France|E|Pinot Blanc, Pinot Noir, ${CH}
# Jura et Savoie
Arbois|Jura|France|RB|Savagnin, ${CH}, Poulsard, Trousseau
Côtes du Jura|Jura|France|BR|${CH}, Savagnin, Poulsard
L'Étoile|Jura|France|B|${CH}, Savagnin
Château-Chalon|Jura|France|B|Savagnin
Macvin du Jura|Jura|France|D|Savagnin, ${CH}
Crémant du Jura|Jura|France|E|${CH}, ${PN}
Savoie|Savoie|France|BR|Jacquère, Mondeuse
Roussette de Savoie|Savoie|France|B|Altesse
Seyssel|Savoie|France|BE|Altesse
Crémant de Savoie|Savoie|France|E|Jacquère, Altesse
Bugey|Savoie|France|RBE|${CH}, ${GAM}, Mondeuse
# Loire
Muscadet|Loire|France|B|Melon de Bourgogne
Muscadet Sèvre et Maine|Loire|France|B|Melon de Bourgogne
Anjou|Loire|France|RB|Cabernet Franc, Chenin
Anjou-Villages|Loire|France|R|Cabernet Franc, Cabernet Sauvignon
Rosé d'Anjou|Loire|France|O|Grolleau, Cabernet Franc
Cabernet d'Anjou|Loire|France|O|Cabernet Franc, Cabernet Sauvignon
Savennières|Loire|France|B|Chenin
Coteaux du Layon|Loire|France|D|Chenin
Bonnezeaux|Loire|France|D|Chenin
Quarts de Chaume|Loire|France|D|Chenin
Saumur|Loire|France|RBE|Cabernet Franc, Chenin
Saumur-Champigny|Loire|France|R|Cabernet Franc
Crémant de Loire|Loire|France|E|Chenin, ${CH}, Cabernet Franc
Chinon|Loire|France|R|Cabernet Franc
Bourgueil|Loire|France|R|Cabernet Franc
Saint-Nicolas-de-Bourgueil|Loire|France|R|Cabernet Franc
Vouvray|Loire|France|B|Chenin
Montlouis-sur-Loire|Loire|France|B|Chenin
Jasnières|Loire|France|B|Chenin
Touraine|Loire|France|RBO|Sauvignon Blanc, ${GAM}, Cabernet Franc
Cheverny|Loire|France|BR|Sauvignon Blanc, ${PN}
Cour-Cheverny|Loire|France|B|Romorantin
Sancerre|Loire|France|BRO|Sauvignon Blanc, ${PN}
Pouilly-Fumé|Loire|France|B|Sauvignon Blanc
Menetou-Salon|Loire|France|BR|Sauvignon Blanc, ${PN}
Quincy|Loire|France|B|Sauvignon Blanc
Reuilly|Loire|France|BRO|Sauvignon Blanc, ${PN}
# Vallée du Rhône
Côte-Rôtie|Vallée du Rhône|France|R|Syrah, Viognier
Condrieu|Vallée du Rhône|France|B|Viognier
Château-Grillet|Vallée du Rhône|France|B|Viognier
Saint-Joseph|Vallée du Rhône|France|RB|Syrah, Marsanne, Roussanne
Hermitage|Vallée du Rhône|France|RB|Syrah, Marsanne, Roussanne
Crozes-Hermitage|Vallée du Rhône|France|RB|Syrah, Marsanne, Roussanne
Cornas|Vallée du Rhône|France|R|Syrah
Saint-Péray|Vallée du Rhône|France|BE|Marsanne, Roussanne
Côtes du Rhône|Vallée du Rhône|France|RBO|${RHS}
Côtes du Rhône Villages|Vallée du Rhône|France|RBO|${RHS}
Châteauneuf-du-Pape|Vallée du Rhône|France|RB|${RHS}
Gigondas|Vallée du Rhône|France|R|Grenache, Syrah, Mourvèdre
Vacqueyras|Vallée du Rhône|France|RBO|Grenache, Syrah, Mourvèdre
Rasteau|Vallée du Rhône|France|RD|Grenache, Syrah, Mourvèdre
Cairanne|Vallée du Rhône|France|RB|Grenache, Syrah, Mourvèdre
Vinsobres|Vallée du Rhône|France|R|Grenache, Syrah
Lirac|Vallée du Rhône|France|RBO|${RHS}
Tavel|Vallée du Rhône|France|O|Grenache, Cinsault
Beaumes-de-Venise|Vallée du Rhône|France|R|Grenache, Syrah
Muscat de Beaumes-de-Venise|Vallée du Rhône|France|D|Muscat
Ventoux|Vallée du Rhône|France|RBO|Grenache, Syrah, Cinsault
Luberon|Vallée du Rhône|France|RBO|Grenache, Syrah
Costières de Nîmes|Vallée du Rhône|France|RBO|Grenache, Syrah, Mourvèdre
Grignan-les-Adhémar|Vallée du Rhône|France|RBO|Grenache, Syrah
Clairette de Die|Vallée du Rhône|France|E|Muscat, Clairette
# Provence et Corse
Côtes de Provence|Provence|France|ORB|${PROV}
Coteaux d'Aix-en-Provence|Provence|France|ORB|${PROV}
Coteaux Varois en Provence|Provence|France|ORB|${PROV}
Bandol|Provence|France|ROB|Mourvèdre, Grenache, Cinsault
Cassis|Provence|France|BO|Marsanne, Clairette
Bellet|Provence|France|RBO|Rolle, Braquet
Palette|Provence|France|RBO|Mourvèdre, Grenache, Clairette
Les Baux-de-Provence|Provence|France|RO|Grenache, Syrah, Cabernet Sauvignon
Corse|Corse|France|ROB|Nielluccio, Sciaccarellu, Vermentino
Ajaccio|Corse|France|ROB|Sciaccarellu
Patrimonio|Corse|France|RBO|Nielluccio, Vermentino
Muscat du Cap Corse|Corse|France|D|Muscat
# Languedoc
Languedoc|Languedoc|France|RBO|${LGD}
Pic Saint-Loup|Languedoc|France|RO|Syrah, Grenache, Mourvèdre
Faugères|Languedoc|France|RBO|Syrah, Grenache, Mourvèdre, Carignan
Saint-Chinian|Languedoc|France|RBO|Syrah, Grenache, Mourvèdre, Carignan
Minervois|Languedoc|France|RBO|Syrah, Grenache, Carignan
Minervois-La Livinière|Languedoc|France|R|Syrah, Grenache, Mourvèdre
Corbières|Languedoc|France|RBO|Carignan, Grenache, Syrah
Corbières-Boutenac|Languedoc|France|R|Carignan, Grenache, Syrah
Fitou|Languedoc|France|R|Carignan, Grenache, Syrah
Terrasses du Larzac|Languedoc|France|R|Syrah, Grenache, Mourvèdre
La Clape|Languedoc|France|RB|Syrah, Grenache, Bourboulenc
Picpoul de Pinet|Languedoc|France|B|Piquepoul
Limoux|Languedoc|France|BR|${CH}, Chenin, Mauzac
Blanquette de Limoux|Languedoc|France|E|Mauzac
Crémant de Limoux|Languedoc|France|E|${CH}, Chenin
Muscat de Frontignan|Languedoc|France|D|Muscat
Muscat de Mireval|Languedoc|France|D|Muscat
Muscat de Lunel|Languedoc|France|D|Muscat
Cabardès|Languedoc|France|RO|Merlot, Syrah, Grenache
Malepère|Languedoc|France|RO|Merlot, Cabernet Franc
Clairette du Languedoc|Languedoc|France|B|Clairette
# Roussillon
Côtes du Roussillon|Roussillon|France|RBO|Grenache, Syrah, Carignan
Côtes du Roussillon Villages|Roussillon|France|R|Grenache, Syrah, Carignan
Collioure|Roussillon|France|RBO|Grenache, Syrah, Mourvèdre
Banyuls|Roussillon|France|D|Grenache
Banyuls Grand Cru|Roussillon|France|D|Grenache
Maury|Roussillon|France|DR|Grenache
Rivesaltes|Roussillon|France|D|Grenache
Muscat de Rivesaltes|Roussillon|France|D|Muscat
# Sud-Ouest
Cahors|Sud-Ouest|France|R|Malbec
Madiran|Sud-Ouest|France|R|Tannat
Pacherenc du Vic-Bilh|Sud-Ouest|France|BD|Petit Manseng, Gros Manseng
Jurançon|Sud-Ouest|France|BD|Petit Manseng, Gros Manseng
Irouléguy|Sud-Ouest|France|RBO|Tannat, Cabernet Franc
Béarn|Sud-Ouest|France|RBO|Tannat, Cabernet Franc
Gaillac|Sud-Ouest|France|RBEO|Braucol, Duras, Mauzac, Loin de l'Œil
Fronton|Sud-Ouest|France|RO|Négrette
Marcillac|Sud-Ouest|France|R|Fer Servadou
Bergerac|Sud-Ouest|France|RBO|${BX_R}
Pécharmant|Sud-Ouest|France|R|Merlot, Cabernet Sauvignon, Cabernet Franc
Monbazillac|Sud-Ouest|France|D|Sémillon, Muscadelle, Sauvignon Blanc
Saussignac|Sud-Ouest|France|D|Sémillon, Sauvignon Blanc
Buzet|Sud-Ouest|France|RBO|${BX_R}
Côtes de Duras|Sud-Ouest|France|RBO|${BX_R}
Côtes de Gascogne|Sud-Ouest|France|BRO|Colombard, Ugni Blanc, Gros Manseng
# Bordeaux
Bordeaux|Bordeaux|France|RBO|${BX_R}
Bordeaux Supérieur|Bordeaux|France|R|${BX_R}
Crémant de Bordeaux|Bordeaux|France|E|Sémillon, Cabernet Franc, Merlot
Médoc|Bordeaux|France|R|${MED}
Haut-Médoc|Bordeaux|France|R|${MED}
Margaux|Bordeaux|France|R|${MED}
Pauillac|Bordeaux|France|R|${MED}
Saint-Julien|Bordeaux|France|R|${MED}
Saint-Estèphe|Bordeaux|France|R|${MED}
Listrac-Médoc|Bordeaux|France|R|${MED}
Moulis-en-Médoc|Bordeaux|France|R|${MED}
Pessac-Léognan|Bordeaux|France|RB|${MED}, Sauvignon Blanc, Sémillon
Graves|Bordeaux|France|RB|${MED}, Sauvignon Blanc, Sémillon
Sauternes|Bordeaux|France|D|Sémillon, Sauvignon Blanc
Barsac|Bordeaux|France|D|Sémillon, Sauvignon Blanc
Loupiac|Bordeaux|France|D|Sémillon, Sauvignon Blanc
Cadillac|Bordeaux|France|D|Sémillon, Sauvignon Blanc
Sainte-Croix-du-Mont|Bordeaux|France|D|Sémillon, Sauvignon Blanc
Entre-deux-Mers|Bordeaux|France|B|Sauvignon Blanc, Sémillon
Saint-Émilion|Bordeaux|France|R|${LIB}
Saint-Émilion Grand Cru|Bordeaux|France|R|${LIB}
Montagne-Saint-Émilion|Bordeaux|France|R|${LIB}
Lussac-Saint-Émilion|Bordeaux|France|R|${LIB}
Puisseguin-Saint-Émilion|Bordeaux|France|R|${LIB}
Saint-Georges-Saint-Émilion|Bordeaux|France|R|${LIB}
Pomerol|Bordeaux|France|R|${LIB}
Lalande-de-Pomerol|Bordeaux|France|R|${LIB}
Fronsac|Bordeaux|France|R|${LIB}
Canon-Fronsac|Bordeaux|France|R|${LIB}
Castillon Côtes de Bordeaux|Bordeaux|France|R|${LIB}
Blaye Côtes de Bordeaux|Bordeaux|France|RB|Merlot, Cabernet Sauvignon
Côtes de Bourg|Bordeaux|France|R|Merlot, Cabernet Sauvignon
Francs Côtes de Bordeaux|Bordeaux|France|RB|Merlot, Cabernet Franc
# Italie
Barolo|Piémont|Italie|R|Nebbiolo
Barbaresco|Piémont|Italie|R|Nebbiolo
Langhe|Piémont|Italie|RB|Nebbiolo, Barbera, Dolcetto
Barbera d'Asti|Piémont|Italie|R|Barbera
Barbera d'Alba|Piémont|Italie|R|Barbera
Dolcetto d'Alba|Piémont|Italie|R|Dolcetto
Gavi|Piémont|Italie|B|Cortese
Moscato d'Asti|Piémont|Italie|D|Moscato
Asti|Piémont|Italie|E|Moscato
Chianti|Toscane|Italie|R|Sangiovese
Chianti Classico|Toscane|Italie|R|Sangiovese
Brunello di Montalcino|Toscane|Italie|R|Sangiovese
Rosso di Montalcino|Toscane|Italie|R|Sangiovese
Vino Nobile di Montepulciano|Toscane|Italie|R|Sangiovese
Bolgheri|Toscane|Italie|R|Cabernet Sauvignon, Merlot, Cabernet Franc
Amarone della Valpolicella|Vénétie|Italie|R|Corvina, Rondinella
Valpolicella|Vénétie|Italie|R|Corvina, Rondinella
Soave|Vénétie|Italie|B|Garganega
Prosecco|Vénétie|Italie|E|Glera
Franciacorta|Lombardie|Italie|E|${CH}, ${PN}
Etna|Sicile|Italie|RB|Nerello Mascalese, Carricante
Montepulciano d'Abruzzo|Abruzzes|Italie|R|Montepulciano
Primitivo di Manduria|Pouilles|Italie|R|Primitivo
# Espagne
Rioja|Rioja|Espagne|RB|Tempranillo, Grenache
Ribera del Duero|Ribera del Duero|Espagne|R|Tempranillo
Toro|Castille-et-León|Espagne|R|Tempranillo
Rueda|Castille-et-León|Espagne|B|Verdejo
Bierzo|Castille-et-León|Espagne|R|Mencía
Priorat|Catalogne|Espagne|R|Grenache, Carignan
Cava|Catalogne|Espagne|E|Macabeo, Xarel-lo, Parellada
Rías Baixas|Galice|Espagne|B|Albariño
Jerez|Andalousie|Espagne|BD|Palomino
# Portugal
Douro|Douro|Portugal|RB|Touriga Nacional, Touriga Franca
Porto|Douro|Portugal|D|Touriga Nacional, Touriga Franca
Vinho Verde|Vinho Verde|Portugal|B|Alvarinho, Loureiro
Dão|Dão|Portugal|RB|Touriga Nacional
Alentejo|Alentejo|Portugal|RB|Aragonez, Trincadeira
# Autres pays
Mosel|Moselle|Allemagne|B|Riesling
Rheingau|Rheingau|Allemagne|B|Riesling
Pfalz|Palatinat|Allemagne|BR|Riesling, Pinot Noir
Wachau|Basse-Autriche|Autriche|B|Grüner Veltliner, Riesling
Kamptal|Basse-Autriche|Autriche|B|Grüner Veltliner, Riesling
Valais|Valais|Suisse|BR|Chasselas, Pinot Noir
Tokaji|Tokaj|Hongrie|DB|Furmint
Santorin|Cyclades|Grèce|B|Assyrtiko
Bekaa|Bekaa|Liban|R|Cabernet Sauvignon, Cinsault, Syrah
Napa Valley|Californie|États-Unis|RB|Cabernet Sauvignon, ${CH}
Sonoma|Californie|États-Unis|RB|${PN}, ${CH}, Zinfandel
Mendoza|Mendoza|Argentine|R|Malbec
Maipo|Vallée Centrale|Chili|R|Cabernet Sauvignon, Carménère
Stellenbosch|Western Cape|Afrique du Sud|RB|Cabernet Sauvignon, Pinotage, Chenin
Barossa Valley|Australie-Méridionale|Australie|R|Shiraz
Marlborough|Marlborough|Nouvelle-Zélande|B|Sauvignon Blanc
`;

const COLOR_CODES = { R: 'Rouge', B: 'Blanc', O: 'Rosé', E: 'Effervescent', D: 'Doux / liquoreux' };

export const APPELLATIONS = DATA.split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const [name, region, country, colors, grapes] = l.split('|');
    const colorList = colors.split('').map((c) => COLOR_CODES[c]);
    return { name, region, country, colors: colorList, grapes };
  });

const BY_NAME = new Map(APPELLATIONS.map((a) => [a.name.toLowerCase(), a]));

export function appellationInfo(name) {
  return BY_NAME.get(String(name || '').toLowerCase()) || null;
}

// Pays de chaque région connue (pour remplir le pays quand on choisit une région).
export const REGION_COUNTRY = Object.fromEntries(APPELLATIONS.map((a) => [a.region, a.country]));
